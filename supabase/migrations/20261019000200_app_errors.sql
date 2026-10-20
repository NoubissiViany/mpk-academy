-- Durable server error log. Vercel Hobby keeps runtime logs for one hour, so
-- references shown to learners would otherwise be untraceable the next day.

create table private.app_errors (
  id bigint generated always as identity primary key,
  reference uuid not null,
  event text not null check (char_length(event) between 1 and 200),
  code text check (code is null or char_length(code) <= 100),
  status integer,
  source text check (source is null or char_length(source) <= 100),
  context jsonb not null default '{}'::jsonb check (pg_column_size(context) <= 4096),
  created_at timestamptz not null default now()
);

create index app_errors_created_idx on private.app_errors (created_at desc);
create index app_errors_reference_idx on private.app_errors (reference);

create or replace function public.mpk_log_app_error(
  p_reference uuid,
  p_event text,
  p_code text,
  p_status integer,
  p_source text,
  p_context jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- An error storm must not exhaust the free database: cap the write rate.
  if (select count(*) from private.app_errors where created_at > now() - interval '1 minute') >= 120 then
    return;
  end if;

  insert into private.app_errors (reference, event, code, status, source, context)
  values (
    p_reference,
    left(p_event, 200),
    left(p_code, 100),
    p_status,
    left(p_source, 100),
    case when pg_column_size(coalesce(p_context, '{}'::jsonb)) <= 4096
      then coalesce(p_context, '{}'::jsonb)
      else jsonb_build_object('truncated', true)
    end
  );

  delete from private.app_errors where created_at < now() - interval '30 days';
end;
$$;

create or replace function public.mpk_admin_recent_errors(p_limit integer default 50)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'reference', e.reference,
    'event', e.event,
    'code', e.code,
    'status', e.status,
    'source', e.source,
    'context', e.context,
    'createdAt', e.created_at
  ) order by e.created_at desc), '[]'::jsonb)
  from (
    select * from private.app_errors
    order by created_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200)
  ) e;
$$;

revoke all on function public.mpk_log_app_error(uuid, text, text, integer, text, jsonb) from public, anon, authenticated;
revoke all on function public.mpk_admin_recent_errors(integer) from public, anon, authenticated;
grant execute on function public.mpk_log_app_error(uuid, text, text, integer, text, jsonb) to service_role;
grant execute on function public.mpk_admin_recent_errors(integer) to service_role;
