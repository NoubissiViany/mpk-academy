-- AI writing feedback (Phase 2). Essays wait in a queue that the server works
-- through with Groq: right away when budget allows, otherwise when pg_cron
-- calls the app's protected job route. Caps live in the database so a learner
-- calling the RPC directly cannot exceed them. Days follow America/Toronto.

create table private.ai_settings (
  id boolean primary key default true check (id),
  writing_daily_limit integer not null default 60 check (writing_daily_limit between 0 and 10000),
  writing_user_daily_limit integer not null default 2 check (writing_user_daily_limit between 0 and 100),
  updated_at timestamptz not null default now()
);
insert into private.ai_settings default values;

create table private.ai_usage_daily (
  day date not null,
  feature text not null check (feature in ('writing')),
  model text not null check (char_length(model) between 1 and 100),
  requests integer not null default 0 check (requests >= 0),
  failures integer not null default 0 check (failures >= 0),
  tokens integer not null default 0 check (tokens >= 0),
  primary key (day, feature, model)
);

-- Consent to send writing to the AI provider, separate from the sign-up notice.
alter table public.profiles
  add column ai_feedback_consent_at timestamptz,
  add column ai_feedback_consent_version text
    check (ai_feedback_consent_version is null or char_length(ai_feedback_consent_version) between 1 and 40);

create table public.writing_submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam text not null check (exam in ('TEF Canada', 'TCF Canada')),
  task_id text not null check (char_length(task_id) between 1 and 100),
  parent_id uuid references public.writing_submissions(id) on delete set null,
  client_key text not null check (char_length(client_key) between 1 and 100),
  locale text not null check (locale in ('en', 'fr')),
  body text not null check (char_length(body) between 1 and 8000),
  word_count integer not null check (word_count >= 0),
  checks jsonb not null default '{}'::jsonb check (pg_column_size(checks) <= 4096),
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

create index writing_submissions_queue on public.writing_submissions (created_at, id)
  where status in ('queued', 'processing');
create index writing_submissions_user on public.writing_submissions (user_id, created_at desc);

create table public.writing_feedback_flags (
  submission_id uuid not null references public.writing_submissions(id) on delete cascade,
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
  foreach table_name in array array['writing_submissions', 'writing_feedback_flags'] loop
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

create or replace function private.toronto_day_start()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select date_trunc('day', now() at time zone 'America/Toronto') at time zone 'America/Toronto';
$$;

create or replace function private.has_ai_feedback_plan(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.entitlements e
    where e.user_id = p_user_id
      and e.plan_id in ('complete', 'intensive')
      and e.status = 'active'
      and e.starts_at <= now()
      and (e.ends_at is null or e.ends_at > now())
  );
$$;

-- Learner: give (p_version) or withdraw (null) consent to AI feedback.
create or replace function public.mpk_set_ai_feedback_consent(p_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := private.require_user();
begin
  if p_version is not null and p_version !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'Invalid notice version' using errcode = '22023';
  end if;
  update public.profiles
  set ai_feedback_consent_at = case when p_version is null then null else now() end,
      ai_feedback_consent_version = p_version,
      updated_at = now()
  where id = current_user_id;
end;
$$;

-- Learner: queue an essay. Returns the submission and how many essays are ahead.
create or replace function public.mpk_submit_writing(
  p_exam text,
  p_task_id text,
  p_body text,
  p_locale text,
  p_checks jsonb,
  p_client_key text,
  p_parent_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := private.require_user();
  settings private.ai_settings;
  existing public.writing_submissions;
  submission_id uuid;
  words integer;
  created_today integer;
begin
  if p_exam not in ('TEF Canada', 'TCF Canada') or p_locale not in ('en', 'fr')
     or p_body is null or char_length(p_body) not between 1 and 8000
     or p_client_key is null or char_length(p_client_key) not between 1 and 100
     or p_checks is null or jsonb_typeof(p_checks) <> 'object' then
    raise exception 'Invalid writing submission' using errcode = '22023';
  end if;
  if not private.has_ai_feedback_plan(current_user_id) then
    raise exception 'AI feedback is not included in this plan' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = current_user_id and ai_feedback_consent_at is not null
  ) then
    raise exception 'AI feedback consent is required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from private.question_bank
    where id = p_task_id and kind = 'writing' and purpose = 'practice'
      and exam = split_part(p_exam, ' ', 1) and content_version = 'mpk-content-v2'
  ) then
    raise exception 'Unknown writing task' using errcode = '22023';
  end if;
  if p_parent_id is not null and not exists (
    select 1 from public.writing_submissions
    where id = p_parent_id and user_id = current_user_id and task_id = p_task_id
  ) then
    raise exception 'Unknown original essay' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('mpk-writing:' || current_user_id::text, 0));
  select * into existing from public.writing_submissions
  where user_id = current_user_id and client_key = p_client_key;
  if existing.id is not null then
    return jsonb_build_object('id', existing.id, 'status', existing.status);
  end if;

  words := coalesce(array_length(regexp_split_to_array(btrim(p_body), '\s+'), 1), 0);
  if btrim(p_body) = '' or words < 20 then
    raise exception 'Write at least 20 words' using errcode = '22023';
  end if;

  select * into settings from private.ai_settings;
  select count(*) into created_today from public.writing_submissions
  where user_id = current_user_id and created_at >= private.toronto_day_start() and status <> 'failed';
  if created_today >= settings.writing_user_daily_limit then
    raise exception 'Daily writing feedback limit reached' using errcode = '54000';
  end if;

  insert into public.writing_submissions (user_id, exam, task_id, parent_id, client_key, locale, body, word_count, checks)
  values (current_user_id, p_exam, p_task_id, p_parent_id, p_client_key, p_locale, p_body, words, p_checks)
  returning id into submission_id;
  return jsonb_build_object('id', submission_id, 'status', 'queued');
end;
$$;

-- Learner: where an essay stands in the queue.
create or replace function public.mpk_writing_status(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := private.require_user();
  submission public.writing_submissions;
  settings private.ai_settings;
  ahead integer := 0;
  started_today integer;
begin
  select * into submission from public.writing_submissions
  where id = p_id and user_id = current_user_id;
  if submission.id is null then
    raise exception 'Unknown submission' using errcode = 'P0002';
  end if;
  select * into settings from private.ai_settings;
  if submission.status = 'queued' then
    select count(*) into ahead from public.writing_submissions
    where status in ('queued', 'processing')
      and (created_at, id) < (submission.created_at, submission.id);
  end if;
  select count(*) into started_today from public.writing_submissions
  where started_at >= private.toronto_day_start();
  return jsonb_build_object(
    'status', submission.status,
    'ahead', ahead,
    'capReached', submission.status = 'queued' and started_today >= settings.writing_daily_limit,
    'notBefore', submission.not_before
  );
end;
$$;

-- Learner: report a correction as wrong.
create or replace function public.mpk_flag_writing_fix(p_submission_id uuid, p_fix_index integer, p_note text)
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
    select 1 from public.writing_submissions
    where id = p_submission_id and user_id = current_user_id and status = 'done'
  ) then
    raise exception 'Unknown submission' using errcode = 'P0002';
  end if;
  insert into public.writing_feedback_flags (submission_id, user_id, fix_index, note)
  values (p_submission_id, current_user_id, p_fix_index, nullif(btrim(p_note), ''))
  on conflict (submission_id, fix_index) do update set note = excluded.note, created_at = now();
end;
$$;

-- Server: claim queued essays within today's budget. Jobs stuck in processing
-- for five minutes (a function that died) go back to the queue first.
create or replace function public.mpk_claim_writing_jobs(p_limit integer)
returns table (
  id uuid,
  user_id uuid,
  exam text,
  task_id text,
  locale text,
  body text,
  target text,
  attempts integer
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  settings private.ai_settings;
  available integer;
begin
  update public.writing_submissions w
  set status = 'queued'
  where w.status = 'processing' and w.started_at < now() - interval '5 minutes';

  select * into settings from private.ai_settings;
  select least(greatest(coalesce(p_limit, 0), 0), 10,
    settings.writing_daily_limit - count(*)::integer)
  into available
  from public.writing_submissions w
  where w.started_at >= private.toronto_day_start();
  if available <= 0 then
    return;
  end if;

  return query
  with picked as (
    select w.id from public.writing_submissions w
    where w.status = 'queued' and w.not_before <= now()
    order by w.created_at, w.id
    limit available
    for update skip locked
  )
  update public.writing_submissions w
  set status = 'processing', started_at = now(), attempts = w.attempts + 1
  from picked
  where w.id = picked.id
  returning w.id, w.user_id, w.exam, w.task_id, w.locale, w.body,
    coalesce((select g.target from public.exam_goals g where g.user_id = w.user_id), 'I''m not sure'),
    w.attempts;
end;
$$;

create or replace function private.record_ai_usage(p_model text, p_tokens integer, p_failed boolean)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into private.ai_usage_daily (day, feature, model, requests, failures, tokens)
  values ((now() at time zone 'America/Toronto')::date, 'writing', coalesce(nullif(p_model, ''), 'unknown'),
    1, case when p_failed then 1 else 0 end, greatest(coalesce(p_tokens, 0), 0))
  on conflict (day, feature, model) do update
  set requests = private.ai_usage_daily.requests + 1,
      failures = private.ai_usage_daily.failures + excluded.failures,
      tokens = private.ai_usage_daily.tokens + excluded.tokens;
$$;

create or replace function public.mpk_complete_writing_job(p_id uuid, p_feedback jsonb, p_model text, p_tokens integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_feedback is null or jsonb_typeof(p_feedback) <> 'object' then
    raise exception 'Invalid feedback' using errcode = '22023';
  end if;
  update public.writing_submissions
  set status = 'done', feedback = p_feedback, model = p_model, tokens = p_tokens,
      error_code = null, completed_at = now()
  where id = p_id and status = 'processing';
  if found then
    perform private.record_ai_usage(p_model, p_tokens, false);
  end if;
end;
$$;

-- Server: put a job back with a delay, or fail it after three attempts.
create or replace function public.mpk_retry_writing_job(
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
  update public.writing_submissions
  set status = case when p_final or attempts >= 3 then 'failed' else 'queued' end,
      not_before = now() + make_interval(secs => least(greatest(coalesce(p_delay_seconds, 60), 0), 86400)),
      error_code = left(p_error, 100),
      completed_at = case when p_final or attempts >= 3 then now() else null end
  where id = p_id and status = 'processing'
  returning status into outcome;
  if outcome is not null and coalesce(p_tokens, 0) > 0 then
    perform private.record_ai_usage(p_model, p_tokens, true);
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
        'requests', u.requests, 'failures', u.failures, 'tokens', u.tokens) order by u.model)
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
    'limits', (select jsonb_build_object('daily', s.writing_daily_limit, 'perLearner', s.writing_user_daily_limit)
      from private.ai_settings s),
    'flags30', (select count(*) from public.writing_feedback_flags
      where created_at > now() - interval '30 days')
  );
$$;

revoke all on function private.toronto_day_start() from public, anon, authenticated;
revoke all on function private.has_ai_feedback_plan(uuid) from public, anon, authenticated;
revoke all on function private.record_ai_usage(text, integer, boolean) from public, anon, authenticated;
revoke all on function public.mpk_set_ai_feedback_consent(text) from public, anon;
revoke all on function public.mpk_submit_writing(text, text, text, text, jsonb, text, uuid) from public, anon;
revoke all on function public.mpk_writing_status(uuid) from public, anon;
revoke all on function public.mpk_flag_writing_fix(uuid, integer, text) from public, anon;
grant execute on function public.mpk_set_ai_feedback_consent(text) to authenticated;
grant execute on function public.mpk_submit_writing(text, text, text, text, jsonb, text, uuid) to authenticated;
grant execute on function public.mpk_writing_status(uuid) to authenticated;
grant execute on function public.mpk_flag_writing_fix(uuid, integer, text) to authenticated;
revoke all on function public.mpk_claim_writing_jobs(integer) from public, anon, authenticated;
revoke all on function public.mpk_complete_writing_job(uuid, jsonb, text, integer) from public, anon, authenticated;
revoke all on function public.mpk_retry_writing_job(uuid, integer, text, text, integer, boolean) from public, anon, authenticated;
revoke all on function public.mpk_admin_ai_usage() from public, anon, authenticated;
grant execute on function public.mpk_claim_writing_jobs(integer) to service_role;
grant execute on function public.mpk_complete_writing_job(uuid, jsonb, text, integer) to service_role;
grant execute on function public.mpk_retry_writing_job(uuid, integer, text, text, integer, boolean) to service_role;
grant execute on function public.mpk_admin_ai_usage() to service_role;

-- Every minute, pg_cron asks the app to work the queue, but only when an essay
-- is waiting. The app URL and shared secret live in Supabase Vault per project
-- (see docs/AI_OPERATIONS.md); without them this does nothing.
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

revoke all on function private.kick_writing_jobs() from public, anon, authenticated;

-- Hosted Supabase ships pg_cron and pg_net; plain Postgres (CI) skips this.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron')
     and exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net with schema extensions;
    create extension if not exists pg_cron with schema pg_catalog;
    perform cron.schedule('mpk-writing-feedback', '* * * * *', 'select private.kick_writing_jobs()');
  end if;
end;
$$;
