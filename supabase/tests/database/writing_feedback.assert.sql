-- Run against a disposable migrated database with psql -v ON_ERROR_STOP=1.
-- All fixtures are rolled back.
begin;
do $$
declare
  uid uuid := 'c0000000-0000-0000-0000-00000000000c';
  other uuid := 'd0000000-0000-0000-0000-00000000000d';
  essay text := repeat('Je vous écris pour vous parler du projet. ', 6);
  task text;
  r jsonb;
  first_id uuid;
  second_id uuid;
  claimed integer;
  usage jsonb;
begin
  assert not has_function_privilege('anon', 'public.mpk_submit_writing(text,text,text,text,jsonb,text,uuid)', 'execute'), 'visitors cannot submit';
  assert has_function_privilege('authenticated', 'public.mpk_submit_writing(text,text,text,text,jsonb,text,uuid)', 'execute'), 'learners submit';
  assert not has_function_privilege('authenticated', 'public.mpk_claim_writing_jobs(integer)', 'execute'), 'learners cannot claim jobs';
  assert not has_function_privilege('authenticated', 'public.mpk_complete_writing_job(uuid,jsonb,text,integer)', 'execute'), 'learners cannot write feedback';
  assert not has_function_privilege('authenticated', 'public.mpk_admin_ai_usage()', 'execute'), 'learners cannot read usage';
  assert has_function_privilege('service_role', 'public.mpk_claim_writing_jobs(integer)', 'execute'), 'the server claims jobs';
  assert not has_table_privilege('authenticated', 'public.writing_submissions', 'insert'), 'no direct inserts';

  insert into auth.users (id, email, raw_user_meta_data) values
    (uid, 'writing-test@example.test', '{"first_name":"Writing","last_name":"Test","exam":"TEF Canada","target":"NCLC 7"}'),
    (other, 'writing-other@example.test', '{"first_name":"Other","last_name":"Test","exam":"TEF Canada"}');
  insert into public.entitlements (user_id, plan_id, status, starts_at) values
    (uid, 'complete', 'active', now() - interval '1 day'),
    (other, 'essential', 'active', now() - interval '1 day');
  select id into task from private.question_bank
  where kind = 'writing' and purpose = 'practice' and exam = 'TEF' order by id limit 1;

  -- Consent comes first, and only the Complete plan includes AI feedback.
  perform set_config('request.jwt.claim.sub', uid::text, true);
  begin
    perform public.mpk_submit_writing('TEF Canada', task, essay, 'en', '{}', 'k0');
    raise exception 'submitted without consent';
  exception when sqlstate '42501' then null;
  end;
  perform public.mpk_set_ai_feedback_consent('2026-10-21');
  assert (select ai_feedback_consent_version from public.profiles where id = uid) = '2026-10-21', 'consent recorded';
  perform set_config('request.jwt.claim.sub', other::text, true);
  perform public.mpk_set_ai_feedback_consent('2026-10-21');
  begin
    perform public.mpk_submit_writing('TEF Canada', task, essay, 'en', '{}', 'k0');
    raise exception 'essential plan accepted';
  exception when sqlstate '42501' then null;
  end;

  -- Validation.
  perform set_config('request.jwt.claim.sub', uid::text, true);
  begin
    perform public.mpk_submit_writing('TEF Canada', 'tcf-writing-task-1-001', essay, 'en', '{}', 'k1');
    raise exception 'other exam task accepted';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.mpk_submit_writing('TEF Canada', task, 'Trop court.', 'en', '{}', 'k1');
    raise exception 'short essay accepted';
  exception when sqlstate '22023' then null;
  end;

  -- Two essays a day; retries with the same key are the same submission.
  r := public.mpk_submit_writing('TEF Canada', task, essay, 'fr', '{"words":36}', 'k1');
  first_id := (r->>'id')::uuid;
  assert r->>'status' = 'queued', 'queued';
  assert public.mpk_submit_writing('TEF Canada', task, essay, 'fr', '{}', 'k1')->>'id' = first_id::text, 'idempotent';
  assert (select word_count from public.writing_submissions where id = first_id) = 48, 'words counted in the database';
  r := public.mpk_submit_writing('TEF Canada', task, essay || ' Merci.', 'fr', '{}', 'k2', first_id);
  second_id := (r->>'id')::uuid;
  assert (select parent_id from public.writing_submissions where id = second_id) = first_id, 'rewrite linked to original';
  begin
    perform public.mpk_submit_writing('TEF Canada', task, essay, 'fr', '{}', 'k3');
    raise exception 'third essay accepted';
  exception when sqlstate '54000' then null;
  end;

  r := public.mpk_writing_status(second_id);
  assert (r->>'ahead')::integer = 1 and r->>'status' = 'queued' and not (r->>'capReached')::boolean, 'position in queue';
  perform set_config('request.jwt.claim.sub', other::text, true);
  begin
    perform public.mpk_writing_status(first_id);
    raise exception 'read another learner''s status';
  exception when sqlstate 'P0002' then null;
  end;

  -- The server claims oldest first, completes, and retries.
  select count(*) into claimed from public.mpk_claim_writing_jobs(1) c where c.id = first_id and c.target = 'NCLC 7' and c.attempts = 1;
  assert claimed = 1, 'oldest job claimed with the learner target';
  assert (select status from public.writing_submissions where id = second_id) = 'queued', 'one at a time';
  perform public.mpk_complete_writing_job(first_id, '{"summary":"ok"}', 'openai/gpt-oss-120b', 2700);
  assert (select status from public.writing_submissions where id = first_id) = 'done', 'completed';

  perform public.mpk_claim_writing_jobs(5);
  assert public.mpk_retry_writing_job(second_id, 30, 'rate_limited', 'openai/gpt-oss-120b', 0, false) = 'queued', 'retry queued';
  assert (select not_before from public.writing_submissions where id = second_id) > now() + interval '25 seconds', 'retry waits';
  assert not exists (select 1 from public.mpk_claim_writing_jobs(5)), 'not before its time';

  -- A job stuck in processing returns to the queue; the third failure is final.
  update public.writing_submissions set not_before = now() - interval '1 minute' where id = second_id;
  perform public.mpk_claim_writing_jobs(5);
  update public.writing_submissions set started_at = now() - interval '10 minutes' where id = second_id;
  assert exists (select 1 from public.mpk_claim_writing_jobs(5) c where c.id = second_id and c.attempts = 3), 'stale job reclaimed';
  assert public.mpk_retry_writing_job(second_id, 30, 'invalid_output', 'openai/gpt-oss-120b', 1200, false) = 'failed', 'three attempts at most';

  -- Today's global budget.
  update private.ai_settings set writing_daily_limit = 2;
  perform set_config('request.jwt.claim.sub', uid::text, true);
  r := public.mpk_submit_writing('TEF Canada', task, essay, 'en', '{}', 'k4');
  assert (public.mpk_writing_status((r->>'id')::uuid)->>'capReached')::boolean, 'cap reached is reported';
  assert not exists (select 1 from public.mpk_claim_writing_jobs(5)), 'nothing claimed past the cap';

  -- Flags only on finished feedback, one per correction.
  begin
    perform public.mpk_flag_writing_fix(second_id, 0, null);
    raise exception 'flagged unfinished feedback';
  exception when sqlstate 'P0002' then null;
  end;
  perform public.mpk_flag_writing_fix(first_id, 1, 'Mon texte était correct.');
  perform public.mpk_flag_writing_fix(first_id, 1, 'Encore faux.');
  assert (select note from public.writing_feedback_flags where submission_id = first_id and fix_index = 1) = 'Encore faux.', 'one flag per correction';

  usage := public.mpk_admin_ai_usage();
  assert (usage->'today'->0->>'requests')::integer = 2 and (usage->'today'->0->>'tokens')::integer = 3900, 'usage counted';
  assert (usage->'queue'->>'queued')::integer = 1 and (usage->>'flags30')::integer = 1, 'queue and flags reported';

  perform public.mpk_set_ai_feedback_consent(null);
  assert (select ai_feedback_consent_at from public.profiles where id = uid) is null, 'consent withdrawn';
end;
$$;
select 'Writing feedback database assertions passed' as result;
rollback;
