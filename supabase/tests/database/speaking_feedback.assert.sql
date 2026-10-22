-- Run against a disposable migrated database with psql -v ON_ERROR_STOP=1.
-- All fixtures are rolled back.
begin;
do $$
declare
  uid uuid := 'e0000000-0000-0000-0000-00000000000e';
  other uuid := 'f0000000-0000-0000-0000-00000000000f';
  third uuid := 'a1000000-0000-0000-0000-0000000000a1';
  transcript text := 'alors je voudrais vous parler de mon quartier parce que il y a beaucoup de choses à faire le week-end';
  task text;
  r jsonb;
  first_id uuid;
  usage jsonb;
begin
  assert not has_function_privilege('authenticated', 'public.mpk_submit_speaking(uuid,text,text,text,text,jsonb,integer,text)', 'execute'), 'browsers cannot submit transcripts';
  assert not has_function_privilege('authenticated', 'public.mpk_speaking_allowance(uuid,integer)', 'execute'), 'allowance is server-only';
  assert not has_function_privilege('authenticated', 'public.mpk_record_transcription(text,integer,boolean)', 'execute'), 'usage is server-only';
  assert not has_function_privilege('authenticated', 'public.mpk_claim_speaking_jobs(integer)', 'execute'), 'learners cannot claim jobs';
  assert has_function_privilege('authenticated', 'public.mpk_speaking_status(uuid)', 'execute'), 'learners read their status';
  assert has_function_privilege('authenticated', 'public.mpk_requeue_speaking(uuid)', 'execute'), 'learners can retry a failed review';
  assert has_function_privilege('service_role', 'public.mpk_submit_speaking(uuid,text,text,text,text,jsonb,integer,text)', 'execute'), 'the server submits';
  assert not has_table_privilege('authenticated', 'public.speaking_submissions', 'insert'), 'no direct inserts';

  insert into auth.users (id, email, raw_user_meta_data) values
    (uid, 'speaking-test@example.test', '{"first_name":"Speaking","last_name":"Test","exam":"TEF Canada","target":"NCLC 7"}'),
    (other, 'speaking-other@example.test', '{"first_name":"Other","last_name":"Test","exam":"TEF Canada"}'),
    (third, 'speaking-third@example.test', '{"first_name":"Third","last_name":"Test","exam":"TEF Canada"}');
  insert into public.entitlements (user_id, plan_id, status, starts_at) values
    (uid, 'complete', 'active', now() - interval '1 day'),
    (other, 'essential', 'active', now() - interval '1 day'),
    (third, 'complete', 'active', now() - interval '1 day');
  select id into task from private.question_bank
  where kind = 'speaking' and purpose = 'practice' and exam = 'TEF' order by id limit 1;

  -- The allowance explains every refusal before any audio is transcribed.
  assert public.mpk_speaking_allowance(uid, 120) = 'consent_required', 'consent first';
  assert public.mpk_speaking_allowance(other, 120) = 'not_included', 'Complete plan only';
  update public.profiles set ai_feedback_consent_at = now(), ai_feedback_consent_version = '2026-10-22'
  where id in (uid, third);
  assert public.mpk_speaking_allowance(uid, 120) = 'allowed', 'allowed after consent';

  begin
    perform public.mpk_submit_speaking(uid, 'TEF Canada', 'tef-writing-section-a-001', transcript, 'en', '{}', 120, 'k0');
    raise exception 'writing task accepted';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.mpk_submit_speaking(uid, 'TEF Canada', task, 'euh bonjour', 'en', '{}', 120, 'k0');
    raise exception 'near-silent recording accepted';
  exception when sqlstate '22023' then null;
  end;

  r := public.mpk_submit_speaking(uid, 'TEF Canada', task, transcript, 'fr', '{"wpm":95}', 120, 'k1');
  first_id := (r->>'id')::uuid;
  assert r->>'status' = 'queued', 'queued';
  assert public.mpk_submit_speaking(uid, 'TEF Canada', task, transcript, 'fr', '{}', 120, 'k1')->>'id' = first_id::text, 'idempotent';
  assert (select word_count from public.speaking_submissions where id = first_id) = 20, 'words counted';
  begin
    perform public.mpk_submit_speaking(uid, 'TEF Canada', task, transcript, 'fr', '{}', 120, 'k2');
    raise exception 'second recording accepted';
  exception when sqlstate '54000' then null;
  end;
  assert public.mpk_speaking_allowance(uid, 60) = 'daily_limit', 'one recording a day';

  -- Learners see only their own status.
  perform set_config('request.jwt.claim.sub', uid::text, true);
  r := public.mpk_speaking_status(first_id);
  assert r->>'status' = 'queued' and (r->>'ahead')::integer = 0, 'status for the owner';
  perform set_config('request.jwt.claim.sub', other::text, true);
  begin
    perform public.mpk_speaking_status(first_id);
    raise exception 'read another learner''s status';
  exception when sqlstate 'P0002' then null;
  end;

  -- The transcription budget is shared by all learners.
  perform public.mpk_record_transcription('whisper-large-v3-turbo', 24950, false);
  assert public.mpk_speaking_allowance(third, 30) = 'allowed', 'within the audio budget';
  assert public.mpk_speaking_allowance(third, 60) = 'busy_today', 'past the audio budget';
  update private.ai_settings set speaking_daily_limit = 1;
  assert public.mpk_speaking_allowance(third, 1) = 'busy_today', 'past the daily recording cap';
  update private.ai_settings set speaking_daily_limit = 55;

  -- Claim, retry, complete.
  assert exists (select 1 from public.mpk_claim_speaking_jobs(1) c
    where c.id = first_id and c.target = 'NCLC 7' and c.metrics->>'wpm' = '95'), 'claimed with metrics and target';
  assert public.mpk_retry_speaking_job(first_id, 30, 'rate_limited', 'openai/gpt-oss-20b', 0, false) = 'queued', 'retry queued';
  assert not exists (select 1 from public.mpk_claim_speaking_jobs(1)), 'waits for its retry time';
  update public.speaking_submissions set not_before = now() - interval '1 minute' where id = first_id;
  perform public.mpk_claim_speaking_jobs(1);
  perform public.mpk_complete_speaking_job(first_id, '{"summary":"ok"}', 'openai/gpt-oss-20b', 1800);
  assert (select status from public.speaking_submissions where id = first_id) = 'done', 'completed';

  perform set_config('request.jwt.claim.sub', uid::text, true);
  begin
    perform public.mpk_requeue_speaking(first_id);
    raise exception 'requeued a finished review';
  exception when sqlstate 'P0002' then null;
  end;
  update public.speaking_submissions set status = 'failed', error_code = 'invalid_output', attempts = 3 where id = first_id;
  assert public.mpk_requeue_speaking(first_id) = 'queued', 'a failed review can be asked again';
  assert (select attempts from public.speaking_submissions where id = first_id) = 0, 'attempts reset';
  update public.speaking_submissions set status = 'done' where id = first_id;
  perform public.mpk_flag_speaking_fix(first_id, 2, null);
  assert exists (select 1 from public.speaking_feedback_flags where submission_id = first_id and fix_index = 2), 'flag stored';

  usage := public.mpk_admin_ai_usage();
  assert (usage->'speaking'->>'transcribedSecondsToday')::integer = 24950, 'audio seconds counted';
  assert (usage->'speaking'->>'createdToday')::integer = 1, 'recordings counted';
  assert (usage->>'flags30')::integer = 1, 'flags counted across skills';
  assert exists (select 1 from jsonb_array_elements(usage->'today') u
    where u->>'feature' = 'speaking' and (u->>'tokens')::integer = 1800), 'speaking tokens counted';
end;
$$;
select 'Speaking feedback database assertions passed' as result;
rollback;
