-- Unfinished assessments. Browser clients can read their own live draft;
-- all changes use restricted functions deriving identity from auth.uid().
create table public.diagnostic_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  attempt_id uuid not null,
  payload jsonb not null,
  revision integer not null check (revision > 0),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);
alter table public.diagnostic_drafts enable row level security;
revoke all on public.diagnostic_drafts from public, anon, authenticated;
grant select on public.diagnostic_drafts to authenticated;
create policy diagnostic_drafts_owner on public.diagnostic_drafts for select to authenticated
  using (user_id = auth.uid() and expires_at > now());

create function private.valid_diagnostic_draft(d jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare item jsonb; pair record;
begin
  if d is null or jsonb_typeof(d) <> 'object' or octet_length(d::text) > 65536
    or d->'schemaVersion' is distinct from '1'::jsonb
    or coalesce(d->>'stage', '') not in ('intro','questions','writing')
    or jsonb_typeof(d->'contentVersion') is distinct from 'string'
    or jsonb_typeof(d->'id') is distinct from 'string'
    or coalesce(length(d->>'contentVersion'), 0) not between 1 and 100
    or jsonb_typeof(d->'questionOrder') is distinct from 'array'
    or jsonb_typeof(d->'optionOrder') is distinct from 'object'
    or jsonb_typeof(d->'answers') is distinct from 'object'
    or jsonb_typeof(d->'intake') is distinct from 'object'
    or jsonb_typeof(d->'index') is distinct from 'number'
    or coalesce(d->>'index', '') !~ '^[0-9]+$' then return false; end if;
  perform (d->>'id')::uuid;
  if d->>'id' is null or jsonb_array_length(d->'questionOrder') not between 1 and 100
    or (d->>'index')::integer < 0 or (d->>'index')::integer >= jsonb_array_length(d->'questionOrder') then return false; end if;
  if (select count(distinct x) from jsonb_array_elements_text(d->'questionOrder') x)
    <> jsonb_array_length(d->'questionOrder') then return false; end if;
  for item in select value from jsonb_array_elements(d->'questionOrder') loop
    if jsonb_typeof(item) <> 'string' or length(item #>> '{}') not between 1 and 120 then return false; end if;
  end loop;
  if (select count(*) from jsonb_object_keys(d->'optionOrder')) <> jsonb_array_length(d->'questionOrder') then return false; end if;
  for pair in select * from jsonb_each(d->'optionOrder') loop
    if not (d->'questionOrder' ? pair.key) or jsonb_typeof(pair.value) <> 'array'
      or jsonb_array_length(pair.value) > 100 then return false; end if;
    if (select count(distinct x) from jsonb_array_elements_text(pair.value) x) <> jsonb_array_length(pair.value) then return false; end if;
    for item in select value from jsonb_array_elements(pair.value) loop
      if jsonb_typeof(item) <> 'string' or length(item #>> '{}') not between 1 and 120 then return false; end if;
    end loop;
  end loop;
  for pair in select * from jsonb_each(d->'answers') loop
    if not (d->'questionOrder' ? pair.key) or jsonb_typeof(pair.value) <> 'string'
      or length(pair.value #>> '{}') > 4000 then return false; end if;
  end loop;
  if d->'intake' ? 'goal' and coalesce(d->'intake'->>'goal', '') not in ('TEF Canada','TCF Canada','Not sure yet') then return false; end if;
  if d->'intake' ? 'target' and coalesce(d->'intake'->>'target', '') not in ('NCLC 5','NCLC 7','NCLC 9+','I''m not sure') then return false; end if;
  if d->'intake' ? 'frenchExperience' and coalesce(d->'intake'->>'frenchExperience', '') not in ('I''m just starting','I know some French','I can communicate in French','I''m already comfortable in French','I''m not sure') then return false; end if;
  if d->'intake' ? 'writingSample' and (
    d->'intake'->'writingSample'->>'version' is distinct from 'mpk-diagnostic-writing-v1'
    or jsonb_typeof(d->'intake'->'writingSample'->'text') is distinct from 'string'
    or length(d->'intake'->'writingSample'->>'text') > 4000
  ) then return false; end if;
  return true;
exception when invalid_text_representation or numeric_value_out_of_range then return false;
end;
$$;
revoke all on function private.valid_diagnostic_draft(jsonb) from public, anon, authenticated;

create function public.mpk_get_diagnostic_draft() returns jsonb
language sql stable security definer set search_path = '' as $$
  select d.payload || jsonb_build_object('revision', d.revision, 'updatedAt', d.updated_at, 'expiresAt', d.expires_at)
  from public.diagnostic_drafts d where d.user_id = private.require_user() and d.expires_at > now();
$$;

create function public.mpk_save_diagnostic_draft(p_draft jsonb, p_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_user(); existing public.diagnostic_drafts; saved public.diagnostic_drafts;
begin
  if not private.valid_diagnostic_draft(p_draft) or p_revision is null or p_revision < 0 then
    raise exception 'Invalid assessment draft' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('mpk-draft:' || uid::text, 0));
  if exists (select 1 from public.assessments where user_id = uid and guest_session_id = p_draft->>'id' and status = 'completed') then
    raise exception 'Assessment already submitted' using errcode = '40001'; end if;
  delete from public.diagnostic_drafts where user_id = uid and expires_at <= now();
  select * into existing from public.diagnostic_drafts where user_id = uid;
  if (existing.user_id is null and p_revision <> 0) or (existing.user_id is not null and
      (existing.revision <> p_revision or existing.attempt_id::text <> p_draft->>'id')) then
    raise exception 'Assessment changed on another device' using errcode = '40001'; end if;
  insert into public.diagnostic_drafts(user_id, attempt_id, payload, revision, updated_at, expires_at)
  values(uid, (p_draft->>'id')::uuid, p_draft - 'revision' - 'updatedAt' - 'expiresAt', p_revision + 1, now(), now() + interval '7 days')
  on conflict(user_id) do update set payload = excluded.payload, revision = excluded.revision,
    updated_at = excluded.updated_at, expires_at = excluded.expires_at
  returning * into saved;
  return saved.payload || jsonb_build_object('revision', saved.revision, 'updatedAt', saved.updated_at, 'expiresAt', saved.expires_at);
end;
$$;

create function public.mpk_discard_diagnostic_draft(p_id uuid, p_revision integer) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_user(); existing public.diagnostic_drafts;
begin
  perform pg_advisory_xact_lock(hashtextextended('mpk-draft:' || uid::text, 0));
  select * into existing from public.diagnostic_drafts where user_id = uid and expires_at > now();
  if existing.user_id is not null and (existing.attempt_id is distinct from p_id or existing.revision is distinct from p_revision) then
    raise exception 'Assessment changed on another device' using errcode = '40001'; end if;
  delete from public.diagnostic_drafts where user_id = uid;
end;
$$;

revoke all on function public.mpk_get_diagnostic_draft() from public, anon;
revoke all on function public.mpk_save_diagnostic_draft(jsonb,integer) from public, anon;
revoke all on function public.mpk_discard_diagnostic_draft(uuid,integer) from public, anon;
grant execute on function public.mpk_get_diagnostic_draft() to authenticated;
grant execute on function public.mpk_save_diagnostic_draft(jsonb,integer) to authenticated;
grant execute on function public.mpk_discard_diagnostic_draft(uuid,integer) to authenticated;

-- Final scoring and draft cleanup are one transaction. Old clients still work.
create or replace function public.mpk_submit_diagnostic(
  p_guest_session_id text, p_kind text, p_exam text, p_intake jsonb, p_answers jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_user(); result jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('mpk-draft:' || uid::text, 0));
  if p_kind is distinct from 'diagnostic' or not private.valid_diagnostic_writing(p_intake->'writingSample') then
    raise exception 'A diagnostic writing sample of 80 to 120 words is required' using errcode='22023'; end if;
  result := public.mpk_submit_assessment(p_guest_session_id,p_kind,p_exam,p_intake,p_answers);
  delete from public.diagnostic_drafts where user_id = uid and attempt_id::text = p_guest_session_id;
  return result;
end;
$$;

create function public.mpk_complete_diagnostic_draft(p_id uuid, p_revision integer, p_exam text, p_intake jsonb, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_user(); existing public.diagnostic_drafts;
begin
  perform pg_advisory_xact_lock(hashtextextended('mpk-draft:' || uid::text, 0));
  -- A retry after a lost response returns the original authoritative result.
  if not exists(select 1 from public.assessments where user_id = uid and guest_session_id = p_id::text and status = 'completed') then
    select * into existing from public.diagnostic_drafts where user_id = uid and expires_at > now();
    if existing.user_id is null or existing.attempt_id is distinct from p_id or existing.revision is distinct from p_revision then
      raise exception 'Assessment changed on another device' using errcode = '40001'; end if;
  end if;
  return public.mpk_submit_diagnostic(p_id::text, 'diagnostic', p_exam, p_intake, p_answers);
end;
$$;
revoke all on function public.mpk_complete_diagnostic_draft(uuid,integer,text,jsonb,jsonb) from public, anon;
grant execute on function public.mpk_complete_diagnostic_draft(uuid,integer,text,jsonb,jsonb) to authenticated;

create function private.purge_diagnostic_drafts() returns void
language sql security definer set search_path = '' as $$
  delete from public.diagnostic_drafts where expires_at <= now();
$$;
revoke all on function private.purge_diagnostic_drafts() from public, anon, authenticated;
do $$ begin
  if to_regnamespace('cron') is not null then
    perform cron.schedule('mpk-expired-diagnostic-drafts', '20 3 * * *', 'select private.purge_diagnostic_drafts()');
  end if;
end $$;
