-- Run against a disposable migrated database with psql -v ON_ERROR_STOP=1.
-- All fixtures are rolled back.
begin;
do $$
declare
  first_uid uuid := '50000000-0000-0000-0000-000000000005';
  second_uid uuid := '60000000-0000-0000-0000-000000000006';
  third_uid uuid := '70000000-0000-0000-0000-000000000007';
  r jsonb;
  overview jsonb;
begin
  assert has_function_privilege('anon', 'public.mpk_check_beta_invite(text)', 'execute'), 'anon can pre-check codes';
  assert not has_function_privilege('anon', 'public.mpk_redeem_beta_invite(text)', 'execute'), 'anon cannot redeem';
  assert has_function_privilege('authenticated', 'public.mpk_redeem_beta_invite(text)', 'execute'), 'learners can redeem';
  assert not has_function_privilege('authenticated', 'public.mpk_admin_beta_overview()', 'execute'), 'learners cannot read beta admin data';
  assert not has_function_privilege('authenticated', 'public.mpk_admin_create_beta_invite(text,text,integer,timestamptz)', 'execute'), 'learners cannot create invites';
  assert not has_function_privilege('anon', 'public.mpk_log_app_error(uuid,text,text,integer,text,jsonb)', 'execute'), 'anon cannot write error logs';
  assert has_function_privilege('service_role', 'public.mpk_admin_beta_overview()', 'execute'), 'service role administers beta';

  insert into auth.users (id, email, raw_user_meta_data) values
    (first_uid, 'beta-first@example.test', '{"first_name":"Beta","last_name":"First"}'),
    (second_uid, 'beta-second@example.test', '{"first_name":"Beta","last_name":"Second"}'),
    (third_uid, 'beta-third@example.test', '{"first_name":"Beta","last_name":"Third"}');

  perform public.mpk_admin_create_beta_invite('solo-code1', 'Single use', 1, null);
  perform public.mpk_admin_create_beta_invite('TEAM-CODE2', 'Cohort', 10, null);
  perform public.mpk_admin_create_beta_invite('OLD-CODE03', 'Expired', 5, now() - interval '1 day');
  perform public.mpk_admin_create_beta_invite('GONE-CODE4', 'Revoked', 5, null);
  perform public.mpk_admin_revoke_beta_invite('gone-code4');

  assert public.mpk_check_beta_invite(' solo-code1 ') = 'valid', 'codes are normalized';
  assert public.mpk_check_beta_invite('NOPE-NOPE1') = 'invalid', 'unknown code';
  assert public.mpk_check_beta_invite('OLD-CODE03') = 'expired', 'expired code';
  assert public.mpk_check_beta_invite('GONE-CODE4') = 'invalid', 'revoked code';

  perform set_config('request.jwt.claim.sub', first_uid::text, true);
  r := public.mpk_redeem_beta_invite('solo-code1');
  assert r->>'status' = 'redeemed', 'first redemption succeeds';
  assert exists (
    select 1 from public.entitlements
    where user_id = first_uid and source = 'beta' and plan_id = 'complete'
      and status = 'active' and ends_at between now() + interval '89 days' and now() + interval '91 days'
  ), 'beta grants Complete for the configured window';
  assert private.has_paid_entitlement(first_uid), 'beta access passes existing entitlement checks';
  assert public.mpk_redeem_beta_invite('TEAM-CODE2')->>'status' = 'already_active', 'active learners do not consume a second seat';

  perform set_config('request.jwt.claim.sub', second_uid::text, true);
  assert public.mpk_redeem_beta_invite('SOLO-CODE1')->>'status' = 'exhausted', 'single-use code cannot be reused';
  assert public.mpk_redeem_beta_invite('OLD-CODE03')->>'status' = 'expired', 'expired code cannot be redeemed';

  perform public.mpk_admin_update_beta_settings(1, 90);
  assert public.mpk_check_beta_invite('TEAM-CODE2') = 'beta_full', 'seat limit reported before sign-up';
  assert public.mpk_redeem_beta_invite('TEAM-CODE2')->>'status' = 'beta_full', 'seat limit enforced on redemption';
  assert not private.has_paid_entitlement(second_uid), 'refused redemption grants nothing';

  perform public.mpk_admin_update_beta_settings(40, 30);
  assert public.mpk_redeem_beta_invite('TEAM-CODE2')->>'status' = 'redeemed', 'freed seats can be used';
  perform set_config('request.jwt.claim.sub', third_uid::text, true);
  assert public.mpk_redeem_beta_invite('team-code2')->>'status' = 'redeemed', 'multi-use code serves several testers';

  overview := public.mpk_admin_beta_overview();
  assert (overview->>'seatsUsed')::integer = 3, 'overview counts active seats';
  assert (overview->>'accessDays')::integer = 30, 'overview reflects settings';
  assert jsonb_array_length(overview->'testers') = 3, 'overview lists testers';
  assert (select use_count from private.beta_invites where code = 'TEAM-CODE2') = 2, 'use count tracked';

  perform public.mpk_log_app_error(gen_random_uuid(), 'Test event', 'E1', 500, 'Error', '{"operation":"test"}');
  insert into private.app_errors (reference, event, created_at)
  values (gen_random_uuid(), 'Old event', now() - interval '31 days');
  perform public.mpk_log_app_error(gen_random_uuid(), 'Second event', null, null, null, null);
  assert not exists (select 1 from private.app_errors where event = 'Old event'), 'old errors expire';
  assert jsonb_array_length(public.mpk_admin_recent_errors(10)) = 2, 'recent errors listed';
end;
$$;
select 'Beta access database assertions passed' as result;
rollback;
