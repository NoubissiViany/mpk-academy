-- Closed beta: invite codes grant time-limited Complete access without payment.
-- Beta access is an ordinary entitlement, so every existing access check applies.

alter table public.entitlements
  add column source text not null default 'purchase'
  check (source in ('purchase', 'beta'));

create index entitlements_beta_active_idx
  on public.entitlements (status, ends_at)
  where source = 'beta';

create table private.beta_settings (
  id boolean primary key default true check (id),
  seat_limit integer not null default 40 check (seat_limit between 0 and 10000),
  access_days integer not null default 90 check (access_days between 1 and 365),
  updated_at timestamptz not null default now()
);
insert into private.beta_settings default values;

create table private.beta_invites (
  code text primary key check (code ~ '^[A-Z0-9-]{6,32}$'),
  label text check (label is null or char_length(label) <= 120),
  max_uses integer not null default 1 check (max_uses between 1 and 1000),
  use_count integer not null default 0 check (use_count >= 0),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (use_count <= max_uses)
);

create table private.beta_redemptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  code text not null references private.beta_invites(code),
  entitlement_id uuid not null references public.entitlements(id) on delete cascade,
  redeemed_at timestamptz not null default now()
);

create or replace function private.normalize_invite_code(p_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
$$;

create or replace function private.beta_seats_used()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct e.user_id)::integer
  from public.entitlements e
  where e.source = 'beta'
    and e.status = 'active'
    and e.starts_at <= now()
    and (e.ends_at is null or e.ends_at > now());
$$;

-- Shared by the pre-sign-up check and redemption so both report the same status.
create or replace function private.beta_invite_status(p_code text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  invite private.beta_invites;
  settings private.beta_settings;
begin
  select * into invite from private.beta_invites
  where code = private.normalize_invite_code(p_code);
  if not found or invite.revoked_at is not null then return 'invalid'; end if;
  if invite.expires_at is not null and invite.expires_at <= now() then return 'expired'; end if;
  if invite.use_count >= invite.max_uses then return 'exhausted'; end if;
  select * into settings from private.beta_settings where id;
  if private.beta_seats_used() >= settings.seat_limit then return 'beta_full'; end if;
  return 'valid';
end;
$$;

revoke all on function private.normalize_invite_code(text) from public, anon, authenticated;
revoke all on function private.beta_seats_used() from public, anon, authenticated;
revoke all on function private.beta_invite_status(text) from public, anon, authenticated;

-- Lets the sign-up form reject a bad code before an account is created.
-- Codes carry enough entropy that this status oracle does not enable enumeration.
create or replace function public.mpk_check_beta_invite(p_code text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select private.beta_invite_status(p_code);
$$;

create or replace function public.mpk_redeem_beta_invite(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := private.require_user();
  normalized_code text := private.normalize_invite_code(p_code);
  settings private.beta_settings;
  invite_status text;
  access_ends_at timestamptz;
  new_entitlement_id uuid;
begin
  -- Serialize redemptions so the seat limit holds under concurrent sign-ups.
  select * into settings from private.beta_settings where id for update;

  if private.has_paid_entitlement(current_user_id) then
    return jsonb_build_object('status', 'already_active');
  end if;

  perform 1 from private.beta_invites where code = normalized_code for update;
  invite_status := private.beta_invite_status(normalized_code);
  if invite_status <> 'valid' then
    return jsonb_build_object('status', invite_status);
  end if;

  access_ends_at := now() + make_interval(days => settings.access_days);
  insert into public.entitlements (user_id, plan_id, status, starts_at, ends_at, source)
  values (current_user_id, 'complete', 'active', now(), access_ends_at, 'beta')
  returning id into new_entitlement_id;

  insert into private.beta_redemptions (user_id, code, entitlement_id)
  values (current_user_id, normalized_code, new_entitlement_id)
  on conflict (user_id) do update
    set code = excluded.code,
        entitlement_id = excluded.entitlement_id,
        redeemed_at = now();

  update private.beta_invites set use_count = use_count + 1 where code = normalized_code;

  return jsonb_build_object('status', 'redeemed', 'accessUntil', access_ends_at);
end;
$$;

revoke all on function public.mpk_check_beta_invite(text) from public;
grant execute on function public.mpk_check_beta_invite(text) to anon, authenticated;
revoke all on function public.mpk_redeem_beta_invite(text) from public, anon;
grant execute on function public.mpk_redeem_beta_invite(text) to authenticated;

-- Administration runs only through the server-side service role.
create or replace function public.mpk_admin_beta_overview()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'seatLimit', s.seat_limit,
    'accessDays', s.access_days,
    'seatsUsed', private.beta_seats_used(),
    'invites', coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', i.code,
        'label', i.label,
        'maxUses', i.max_uses,
        'useCount', i.use_count,
        'expiresAt', i.expires_at,
        'revokedAt', i.revoked_at,
        'createdAt', i.created_at
      ) order by i.created_at desc)
      from private.beta_invites i
    ), '[]'::jsonb),
    'testers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'email', u.email,
        'firstName', p.first_name,
        'code', r.code,
        'redeemedAt', r.redeemed_at,
        'accessUntil', e.ends_at,
        'active', e.status = 'active' and (e.ends_at is null or e.ends_at > now())
      ) order by r.redeemed_at desc)
      from private.beta_redemptions r
      join public.entitlements e on e.id = r.entitlement_id
      join public.profiles p on p.id = r.user_id
      join auth.users u on u.id = r.user_id
    ), '[]'::jsonb)
  )
  from private.beta_settings s
  where s.id;
$$;

create or replace function public.mpk_admin_create_beta_invite(
  p_code text,
  p_label text,
  p_max_uses integer,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_code text := private.normalize_invite_code(p_code);
begin
  insert into private.beta_invites (code, label, max_uses, expires_at)
  values (normalized_code, nullif(trim(p_label), ''), p_max_uses, p_expires_at);
  return jsonb_build_object('code', normalized_code);
end;
$$;

create or replace function public.mpk_admin_revoke_beta_invite(p_code text)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.beta_invites
  set revoked_at = coalesce(revoked_at, now())
  where code = private.normalize_invite_code(p_code);
$$;

create or replace function public.mpk_admin_update_beta_settings(
  p_seat_limit integer,
  p_access_days integer
)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.beta_settings
  set seat_limit = p_seat_limit, access_days = p_access_days, updated_at = now()
  where id;
$$;

revoke all on function public.mpk_admin_beta_overview() from public, anon, authenticated;
revoke all on function public.mpk_admin_create_beta_invite(text, text, integer, timestamptz) from public, anon, authenticated;
revoke all on function public.mpk_admin_revoke_beta_invite(text) from public, anon, authenticated;
revoke all on function public.mpk_admin_update_beta_settings(integer, integer) from public, anon, authenticated;
grant execute on function public.mpk_admin_beta_overview() to service_role;
grant execute on function public.mpk_admin_create_beta_invite(text, text, integer, timestamptz) to service_role;
grant execute on function public.mpk_admin_revoke_beta_invite(text) to service_role;
grant execute on function public.mpk_admin_update_beta_settings(integer, integer) to service_role;
