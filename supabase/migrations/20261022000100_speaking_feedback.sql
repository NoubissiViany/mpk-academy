-- AI speaking feedback (Phase 3). The app transcribes a recording while the
-- upload request is open and never stores the audio: only the transcript,
-- timing metrics, and feedback are kept. Feedback is then queued like writing.
-- Submitting is server-only (service role), so every transcript comes from
-- the app's own transcription call rather than from the browser.

alter table private.ai_settings
  add column speaking_daily_limit integer not null default 55
    check (speaking_daily_limit between 0 and 10000),
  add column speaking_user_daily_limit integer not null default 1
    check (speaking_user_daily_limit between 0 and 100),
  add column transcription_daily_seconds integer not null default 25000
    check (transcription_daily_seconds between 0 and 1000000);

alter table private.ai_usage_daily drop constraint ai_usage_daily_feature_check;
alter table private.ai_usage_daily add constraint ai_usage_daily_feature_check
  check (feature in ('writing', 'speaking', 'transcription'));
alter table private.ai_usage_daily
  add column audio_seconds integer not null default 0 check (audio_seconds >= 0);

create table public.speaking_submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam text not null check (exam in ('TEF Canada', 'TCF Canada')),
  task_id text not null check (char_length(task_id) between 1 and 100),
  client_key text not null check (char_length(client_key) between 1 and 100),
  locale text not null check (locale in ('en', 'fr')),
  transcript text not null check (char_length(transcript) between 1 and 20000),
  word_count integer not null check (word_count >= 0),
  audio_seconds integer not null check (audio_seconds between 1 and 900),
  metrics jsonb not null default '{}'::jsonb check (pg_column_size(metrics) <= 4096),
  status text not null default 'queued' check (status in ('queued', 'processing', 'done', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  not_before timestamptz not null default now(),
  feedback jsonb check (feedback is null or pg_column_size(feedback) <= 32768),
  model text,
  tokens integer check (tokens is null or tokens >= 0),
  error_code text check (error_code is null or char_length(error_code) <= 100),
  -- Wall-clock time, so queue order holds even within one transaction.
  created_at timestamptz not null default clock_timestamp(),
  started_at timestamptz,
  completed_at timestamptz,
  unique (user_id, client_key)
);

create index speaking_submissions_queue on public.speaking_submissions (created_at, id)
  where status in ('queued', 'processing');
create index speaking_submissions_user on public.speaking_submissions (user_id, created_at desc);

create table public.speaking_feedback_flags (
  submission_id uuid not null references public.speaking_submissions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  fix_index integer not null check (fix_index between 0 and 49),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  primary key (submission_id, fix_index)
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['speaking_submissions', 'speaking_feedback_flags'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select on table public.%I to authenticated', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      table_name || '_select_own', table_name
    );
  end loop;
end;
$$;

create or replace function private.record_ai_usage_for(
  p_feature text,
  p_model text,
  p_tokens integer,
  p_failed boolean,
  p_audio_seconds integer default 0
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into private.ai_usage_daily (day, feature, model, requests, failures, tokens, audio_seconds)
  values ((now() at time zone 'America/Toronto')::date, p_feature, coalesce(nullif(p_model, ''), 'unknown'),
    1, case when p_failed then 1 else 0 end, greatest(coalesce(p_tokens, 0), 0),
    greatest(coalesce(p_audio_seconds, 0), 0))
  on conflict (day, feature, model) do update
  set requests = private.ai_usage_daily.requests + 1,
      failures = private.ai_usage_daily.failures + excluded.failures,
      tokens = private.ai_usage_daily.tokens + excluded.tokens,
      audio_seconds = private.ai_usage_daily.audio_seconds + excluded.audio_seconds;
$$;

-- Server: may this learner send a recording of this length now? Checked
-- before transcription so capped learners never spend the audio budget.
create or replace function public.mpk_speaking_allowance(p_user_id uuid, p_audio_seconds integer)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  settings private.ai_settings;
  created_today integer;
  learner_today integer;
  transcribed_today integer;
begin
  if not private.has_ai_feedback_plan(p_user_id) then
    return 'not_included';
  end if;
  if not exists (
    select 1 from public.profiles where id = p_user_id and ai_feedback_consent_at is not null
  ) then
    return 'consent_required';
  end if;
  select * into settings from private.ai_settings;
  select count(*) into learner_today from public.speaking_submissions
  where user_id = p_user_id and created_at >= private.toronto_day_start() and status <> 'failed';
  if learner_today >= settings.speaking_user_daily_limit then
    return 'daily_limit';
  end if;
  select count(*) into created_today from public.speaking_submissions
  where created_at >= private.toronto_day_start();
  select coalesce(sum(audio_seconds), 0) into transcribed_today from private.ai_usage_daily
  where day = (now() at time zone 'America/Toronto')::date and feature = 'transcription';
  if created_today >= settings.speaking_daily_limit
     or transcribed_today + greatest(coalesce(p_audio_seconds, 0), 0) > settings.transcription_daily_seconds then
    return 'busy_today';
  end if;
  return 'allowed';
end;
$$;

create or replace function public.mpk_record_transcription(p_model text, p_audio_seconds integer, p_failed boolean)
returns void
language sql
security definer
set search_path = ''
as $$
  select private.record_ai_usage_for('transcription', p_model, 0, p_failed, p_audio_seconds);
$$;

-- Server: store a transcript for feedback, on behalf of an authenticated learner.
create or replace function public.mpk_submit_speaking(
  p_user_id uuid,
  p_exam text,
  p_task_id text,
  p_transcript text,
  p_locale text,
  p_metrics jsonb,
  p_audio_seconds integer,
  p_client_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings private.ai_settings;
  existing public.speaking_submissions;
  submission_id uuid;
  words integer;
  learner_today integer;
begin
  if p_user_id is null or p_exam not in ('TEF Canada', 'TCF Canada') or p_locale not in ('en', 'fr')
     or p_transcript is null or char_length(p_transcript) not between 1 and 20000
     or p_metrics is null or jsonb_typeof(p_metrics) <> 'object'
     or p_audio_seconds is null or p_audio_seconds not between 1 and 900
     or p_client_key is null or char_length(p_client_key) not between 1 and 100 then
    raise exception 'Invalid speaking submission' using errcode = '22023';
  end if;
  if not private.has_ai_feedback_plan(p_user_id) then
    raise exception 'AI feedback is not included in this plan' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.profiles where id = p_user_id and ai_feedback_consent_at is not null
  ) then
    raise exception 'AI feedback consent is required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from private.question_bank
    where id = p_task_id and kind = 'speaking' and purpose = 'practice'
      and exam = split_part(p_exam, ' ', 1) and content_version = 'mpk-content-v2'
  ) then
    raise exception 'Unknown speaking task' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('mpk-speaking:' || p_user_id::text, 0));
  select * into existing from public.speaking_submissions
  where user_id = p_user_id and client_key = p_client_key;
  if existing.id is not null then
    return jsonb_build_object('id', existing.id, 'status', existing.status);
  end if;

  words := coalesce(array_length(regexp_split_to_array(btrim(p_transcript), '\s+'), 1), 0);
  if btrim(p_transcript) = '' or words < 10 then
    raise exception 'Not enough speech to review' using errcode = '22023';
  end if;

  select * into settings from private.ai_settings;
  select count(*) into learner_today from public.speaking_submissions
  where user_id = p_user_id and created_at >= private.toronto_day_start() and status <> 'failed';
  if learner_today >= settings.speaking_user_daily_limit then
    raise exception 'Daily speaking feedback limit reached' using errcode = '54000';
  end if;

  insert into public.speaking_submissions (user_id, exam, task_id, client_key, locale, transcript, word_count, audio_seconds, metrics)
  values (p_user_id, p_exam, p_task_id, p_client_key, p_locale, p_transcript, words, p_audio_seconds, p_metrics)
  returning id into submission_id;
  return jsonb_build_object('id', submission_id, 'status', 'queued');
end;
$$;

-- Learner: where a recording's feedback stands.
create or replace function public.mpk_speaking_status(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := private.require_user();
  submission public.speaking_submissions;
  ahead integer := 0;
begin
  select * into submission from public.speaking_submissions
  where id = p_id and user_id = current_user_id;
  if submission.id is null then
    raise exception 'Unknown submission' using errcode = 'P0002';
  end if;
  if submission.status = 'queued' then
    select count(*) into ahead from public.speaking_submissions
    where status in ('queued', 'processing')
      and (created_at, id) < (submission.created_at, submission.id);
  end if;
  return jsonb_build_object(
    'status', submission.status,
    'ahead', ahead,
    'capReached', false,
    'notBefore', submission.not_before
  );
end;
$$;

-- Learner: report a correction as wrong.
create or replace function public.mpk_flag_speaking_fix(p_submission_id uuid, p_fix_index integer, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := private.require_user();
begin
  if p_fix_index is null or p_fix_index not between 0 and 49
     or (p_note is not null and char_length(p_note) > 500) then
    raise exception 'Invalid flag' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.speaking_submissions
    where id = p_submission_id and user_id = current_user_id and status = 'done'
  ) then
    raise exception 'Unknown submission' using errcode = 'P0002';
  end if;
  insert into public.speaking_feedback_flags (submission_id, user_id, fix_index, note)
  values (p_submission_id, current_user_id, p_fix_index, nullif(btrim(p_note), ''))
  on conflict (submission_id, fix_index) do update set note = excluded.note, created_at = now();
end;
$$;

-- Learner: the audio is gone, but the transcript is kept, so a review that
-- failed can be asked for again from it (own submissions from the last week).
create or replace function public.mpk_requeue_speaking(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := private.require_user();
  outcome text;
begin
  update public.speaking_submissions
  set status = 'queued', attempts = 0, not_before = now(), error_code = null,
      started_at = null, completed_at = null
  where id = p_id and user_id = current_user_id and status = 'failed'
    and created_at > now() - interval '7 days'
  returning status into outcome;
  if outcome is null then
    raise exception 'Nothing to retry' using errcode = 'P0002';
  end if;
  return outcome;
end;
$$;

-- Server: claim queued transcripts for feedback, oldest first. Submissions are
-- capped when they are created, so claiming needs no daily cap of its own.
create or replace function public.mpk_claim_speaking_jobs(p_limit integer)
returns table (
  id uuid,
  user_id uuid,
  exam text,
  task_id text,
  locale text,
  transcript text,
  metrics jsonb,
  target text,
  attempts integer
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  update public.speaking_submissions s
  set status = 'queued'
  where s.status = 'processing' and s.started_at < now() - interval '5 minutes';

  return query
  with picked as (
    select s.id from public.speaking_submissions s
    where s.status = 'queued' and s.not_before <= now()
    order by s.created_at, s.id
    limit least(greatest(coalesce(p_limit, 0), 0), 10)
    for update skip locked
  )
  update public.speaking_submissions s
  set status = 'processing', started_at = now(), attempts = s.attempts + 1
  from picked
  where s.id = picked.id
  returning s.id, s.user_id, s.exam, s.task_id, s.locale, s.transcript, s.metrics,
    coalesce((select g.target from public.exam_goals g where g.user_id = s.user_id), 'I''m not sure'),
    s.attempts;
end;
$$;

create or replace function public.mpk_complete_speaking_job(p_id uuid, p_feedback jsonb, p_model text, p_tokens integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_feedback is null or jsonb_typeof(p_feedback) <> 'object' then
    raise exception 'Invalid feedback' using errcode = '22023';
  end if;
  update public.speaking_submissions
  set status = 'done', feedback = p_feedback, model = p_model, tokens = p_tokens,
      error_code = null, completed_at = now()
  where id = p_id and status = 'processing';
  if found then
    perform private.record_ai_usage_for('speaking', p_model, p_tokens, false);
  end if;
end;
$$;

create or replace function public.mpk_retry_speaking_job(
  p_id uuid,
  p_delay_seconds integer,
  p_error text,
  p_model text,
  p_tokens integer,
  p_final boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  outcome text;
begin
  update public.speaking_submissions
  set status = case when p_final or attempts >= 3 then 'failed' else 'queued' end,
      not_before = now() + make_interval(secs => least(greatest(coalesce(p_delay_seconds, 60), 0), 86400)),
      error_code = left(p_error, 100),
      completed_at = case when p_final or attempts >= 3 then now() else null end
  where id = p_id and status = 'processing'
  returning status into outcome;
  if outcome is not null and coalesce(p_tokens, 0) > 0 then
    perform private.record_ai_usage_for('speaking', p_model, p_tokens, true);
  end if;
  return outcome;
end;
$$;

create or replace function public.mpk_admin_ai_usage()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'today', coalesce((
      select jsonb_agg(jsonb_build_object('feature', u.feature, 'model', u.model,
        'requests', u.requests, 'failures', u.failures, 'tokens', u.tokens,
        'audioSeconds', u.audio_seconds) order by u.feature, u.model)
      from private.ai_usage_daily u
      where u.day = (now() at time zone 'America/Toronto')::date
    ), '[]'::jsonb),
    'last7Tokens', coalesce((
      select sum(u.tokens) from private.ai_usage_daily u
      where u.day > (now() at time zone 'America/Toronto')::date - 7
    ), 0),
    'queue', jsonb_build_object(
      'queued', (select count(*) from public.writing_submissions where status = 'queued'),
      'processing', (select count(*) from public.writing_submissions where status = 'processing'),
      'failedToday', (select count(*) from public.writing_submissions
        where status = 'failed' and completed_at >= private.toronto_day_start()),
      'startedToday', (select count(*) from public.writing_submissions
        where started_at >= private.toronto_day_start())
    ),
    'speaking', jsonb_build_object(
      'queued', (select count(*) from public.speaking_submissions where status = 'queued'),
      'processing', (select count(*) from public.speaking_submissions where status = 'processing'),
      'failedToday', (select count(*) from public.speaking_submissions
        where status = 'failed' and completed_at >= private.toronto_day_start()),
      'createdToday', (select count(*) from public.speaking_submissions
        where created_at >= private.toronto_day_start()),
      'transcribedSecondsToday', (select coalesce(sum(u.audio_seconds), 0) from private.ai_usage_daily u
        where u.day = (now() at time zone 'America/Toronto')::date and u.feature = 'transcription')
    ),
    'limits', (select jsonb_build_object(
        'daily', s.writing_daily_limit, 'perLearner', s.writing_user_daily_limit,
        'speakingDaily', s.speaking_daily_limit, 'speakingPerLearner', s.speaking_user_daily_limit,
        'transcriptionSeconds', s.transcription_daily_seconds)
      from private.ai_settings s),
    'flags30', (select count(*) from public.writing_feedback_flags
      where created_at > now() - interval '30 days')
      + (select count(*) from public.speaking_feedback_flags
      where created_at > now() - interval '30 days')
  );
$$;

-- pg_cron already calls this every minute; it now also wakes the app for
-- queued speaking feedback.
create or replace function private.kick_writing_jobs()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  jobs_url text;
  jobs_secret text;
begin
  if not exists (
    select 1 from public.writing_submissions
    where (status = 'queued' and not_before <= now())
       or (status = 'processing' and started_at < now() - interval '5 minutes')
  ) and not exists (
    select 1 from public.speaking_submissions
    where (status = 'queued' and not_before <= now())
       or (status = 'processing' and started_at < now() - interval '5 minutes')
  ) then
    return;
  end if;
  select decrypted_secret into jobs_url from vault.decrypted_secrets where name = 'mpk_jobs_url';
  select decrypted_secret into jobs_secret from vault.decrypted_secrets where name = 'mpk_jobs_secret';
  if jobs_url is null or jobs_secret is null then
    return;
  end if;
  perform net.http_post(
    url := jobs_url,
    headers := jsonb_build_object('Authorization', 'Bearer ' || jobs_secret, 'Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  );
end;
$$;

revoke all on function private.record_ai_usage_for(text, text, integer, boolean, integer) from public, anon, authenticated;
revoke all on function private.kick_writing_jobs() from public, anon, authenticated;
revoke all on function public.mpk_speaking_status(uuid) from public, anon;
revoke all on function public.mpk_flag_speaking_fix(uuid, integer, text) from public, anon;
revoke all on function public.mpk_requeue_speaking(uuid) from public, anon;
grant execute on function public.mpk_speaking_status(uuid) to authenticated;
grant execute on function public.mpk_flag_speaking_fix(uuid, integer, text) to authenticated;
grant execute on function public.mpk_requeue_speaking(uuid) to authenticated;
revoke all on function public.mpk_speaking_allowance(uuid, integer) from public, anon, authenticated;
revoke all on function public.mpk_record_transcription(text, integer, boolean) from public, anon, authenticated;
revoke all on function public.mpk_submit_speaking(uuid, text, text, text, text, jsonb, integer, text) from public, anon, authenticated;
revoke all on function public.mpk_claim_speaking_jobs(integer) from public, anon, authenticated;
revoke all on function public.mpk_complete_speaking_job(uuid, jsonb, text, integer) from public, anon, authenticated;
revoke all on function public.mpk_retry_speaking_job(uuid, integer, text, text, integer, boolean) from public, anon, authenticated;
revoke all on function public.mpk_admin_ai_usage() from public, anon, authenticated;
grant execute on function public.mpk_speaking_allowance(uuid, integer) to service_role;
grant execute on function public.mpk_record_transcription(text, integer, boolean) to service_role;
grant execute on function public.mpk_submit_speaking(uuid, text, text, text, text, jsonb, integer, text) to service_role;
grant execute on function public.mpk_claim_speaking_jobs(integer) to service_role;
grant execute on function public.mpk_complete_speaking_job(uuid, jsonb, text, integer) to service_role;
grant execute on function public.mpk_retry_speaking_job(uuid, integer, text, text, integer, boolean) to service_role;
grant execute on function public.mpk_admin_ai_usage() to service_role;
