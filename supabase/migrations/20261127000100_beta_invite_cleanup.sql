-- Deploy the admin reader that accepts null tester codes BEFORE this migration.
-- Erase inactive invitation text, retaining activation history and entitlements.
-- Take the shared lock before DDL locks the redemption table during rollout.
do $$ begin
  perform 1 from private.beta_settings where id for update;
end $$;

alter table private.beta_redemptions
  alter column code drop not null,
  drop constraint beta_redemptions_code_fkey,
  add constraint beta_redemptions_code_fkey foreign key (code)
    references private.beta_invites(code) on delete set null;

create or replace function private.purge_beta_invites()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer;
begin
  -- Every invitation writer takes settings first, before invites or metadata.
  perform 1 from private.beta_settings where id for update;

  delete from private.beta_invites
  where use_count >= max_uses or revoked_at is not null or expires_at <= now();
  get diagnostics removed = row_count;

  -- Also clear orphan references left by older deletions or delayed sign-ups.
  -- JSONB subtraction preserves every unrelated account metadata field.
  update auth.users u
  set raw_user_meta_data = u.raw_user_meta_data - 'beta_invite_code'
  where u.raw_user_meta_data ? 'beta_invite_code'
    and not exists (
      select 1 from private.beta_invites i
      where i.code = private.normalize_invite_code(u.raw_user_meta_data->>'beta_invite_code')
    );
  return removed;
end;
$$;
revoke all on function private.purge_beta_invites() from public, anon, authenticated, service_role;

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
  delete from private.beta_invites where code = normalized_code and use_count >= max_uses;
  if found then
    update auth.users
    set raw_user_meta_data = raw_user_meta_data - 'beta_invite_code'
    where raw_user_meta_data ? 'beta_invite_code'
      and private.normalize_invite_code(raw_user_meta_data->>'beta_invite_code') = normalized_code;
  end if;

  return jsonb_build_object('status', 'redeemed', 'accessUntil', access_ends_at);
end;
$$;

create or replace function public.mpk_admin_revoke_beta_invite(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_code text := private.normalize_invite_code(p_code);
begin
  perform 1 from private.beta_settings where id for update;
  delete from private.beta_invites where code = normalized_code;
  update auth.users
  set raw_user_meta_data = raw_user_meta_data - 'beta_invite_code'
  where raw_user_meta_data ? 'beta_invite_code'
    and private.normalize_invite_code(raw_user_meta_data->>'beta_invite_code') = normalized_code;
end;
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
  -- Serialize creation too, so the orphan sweep observes a consistent code set.
  perform 1 from private.beta_settings where id for update;
  insert into private.beta_invites (code, label, max_uses, expires_at)
  values (normalized_code, nullif(trim(p_label), ''), p_max_uses, p_expires_at);
  return jsonb_build_object('code', normalized_code);
end;
$$;

-- CREATE OR REPLACE preserves the existing public RPC signatures and grants.
-- Purge existing inactive codes immediately, with no retention period.
select private.purge_beta_invites();

do $$
begin
  -- Disposable PostgreSQL tests do not install the hosted Cron extension.
  if to_regnamespace('cron') is not null then
    perform cron.schedule(
      'mpk-cleanup-beta-invites',
      '*/15 * * * *',
      'select private.purge_beta_invites()'
    );
  end if;
end;
$$;
