-- Rollback-only assertions against the disposable migration database.
begin;
do $$
declare
  first_uid uuid := 'b1000000-0000-0000-0000-000000000001';
  second_uid uuid := 'b1000000-0000-0000-0000-000000000002';
  pending_uid uuid := 'b1000000-0000-0000-0000-000000000003';
  orphan_uid uuid := 'b1000000-0000-0000-0000-000000000004';
  seats integer;
  metrics jsonb;
  history jsonb;
  entitlements jsonb;
  unrelated_metadata jsonb;
  removed integer;
begin
  assert not has_function_privilege('anon', 'private.purge_beta_invites()', 'execute'), 'anon cannot invoke maintenance';
  assert not has_function_privilege('authenticated', 'private.purge_beta_invites()', 'execute'), 'learners cannot invoke maintenance';
  assert not has_function_privilege('service_role', 'private.purge_beta_invites()', 'execute'), 'maintenance is database-only';
  assert has_function_privilege('service_role', 'public.mpk_admin_revoke_beta_invite(text)', 'execute'), 'authorized revocation still works';
  assert not has_function_privilege('authenticated', 'public.mpk_admin_revoke_beta_invite(text)', 'execute'), 'learners cannot revoke';

  insert into auth.users (id, email, raw_user_meta_data) values
    (first_uid, 'cleanup-first@example.test', '{"first_name":"First","last_name":"Tester","locale":"fr","beta_invite_code":" clean-team ","nested":{"keep":true}}'),
    (second_uid, 'cleanup-second@example.test', '{"first_name":"Second","last_name":"Tester","beta_invite_code":"CLEAN-TEAM"}'),
    (pending_uid, 'cleanup-pending@example.test', '{"first_name":"Pending","last_name":"Tester","beta_invite_code":"CLEAN-TEAM"}'),
    (orphan_uid, 'cleanup-orphan@example.test', '{"first_name":"Orphan","last_name":"Tester","beta_invite_code":"MISSING-CODE"}');
  select jsonb_object_agg(id, raw_user_meta_data - 'beta_invite_code') into unrelated_metadata from auth.users;
  perform public.mpk_admin_create_beta_invite('CLEAN-TEAM', 'Two uses', 2, null);
  perform set_config('request.jwt.claim.sub', first_uid::text, true);
  assert public.mpk_redeem_beta_invite('CLEAN-TEAM')->>'status' = 'redeemed', 'first use succeeds';
  assert (select use_count = 1 and expires_at is null from private.beta_invites where code = 'CLEAN-TEAM'), 'partially used non-expiring code remains';
  assert (select code from private.beta_redemptions where user_id = first_uid) = 'CLEAN-TEAM', 'live invitation still appears in history';
  assert private.purge_beta_invites() = 0, 'partial use without expiration survives sweep';
  assert (select raw_user_meta_data ? 'beta_invite_code' from auth.users where id = pending_uid), 'valid pending metadata survives sweep';
  assert not (select raw_user_meta_data ? 'beta_invite_code' from auth.users where id = orphan_uid), 'orphan metadata is cleared even without deletions';

  perform set_config('request.jwt.claim.sub', second_uid::text, true);
  assert public.mpk_redeem_beta_invite('clean-team')->>'status' = 'redeemed', 'final use grants access';
  assert not exists (select 1 from private.beta_invites where code = 'CLEAN-TEAM'), 'final redemption deletes the invitation immediately';
  assert (select count(*) = 2 and bool_and(code is null) from private.beta_redemptions), 'both historical code copies are erased';
  assert private.has_paid_entitlement(first_uid) and private.has_paid_entitlement(second_uid), 'both learners retain access';
  assert not exists (select 1 from auth.users where raw_user_meta_data ? 'beta_invite_code'), 'all matching pending codes are erased immediately';
  assert (select jsonb_object_agg(id, raw_user_meta_data) from auth.users) = unrelated_metadata, 'nested metadata and language remain untouched';
  assert public.mpk_redeem_beta_invite('CLEAN-TEAM')->>'status' = 'already_active', 'active learner behavior survives deletion';
  assert public.mpk_check_beta_invite('CLEAN-TEAM') = 'invalid', 'deleted code has existing invalid response';

  -- Give the tester real activity so preservation covers engagement, not only seats.
  insert into public.practice_sessions (user_id, exam, skill, status, completed_at, question_count, correct_count, score)
  values (first_uid, 'TEF Canada', 'reading', 'completed', now(), 5, 4, 80);

  -- Revocation of a partially redeemed code erases only the code and metadata.
  perform public.mpk_admin_create_beta_invite('CLEAN-REVOKE', 'Revocation', 5, null);
  perform set_config('request.jwt.claim.sub', pending_uid::text, true);
  assert public.mpk_redeem_beta_invite('CLEAN-REVOKE')->>'status' = 'redeemed', 'revocation fixture has an existing learner';
  update auth.users set raw_user_meta_data = raw_user_meta_data || '{"beta_invite_code":" clean-revoke "}' where id = orphan_uid;
  select jsonb_agg(to_jsonb(r) - 'code' order by user_id) into history from private.beta_redemptions r;
  select jsonb_agg(to_jsonb(e) order by id) into entitlements from public.entitlements e;
  metrics := public.mpk_admin_beta_metrics();
  seats := private.beta_seats_used();
  perform public.mpk_admin_revoke_beta_invite('clean-revoke');
  assert not exists (select 1 from private.beta_invites where code = 'CLEAN-REVOKE'), 'revocation deletes immediately';
  assert not (select raw_user_meta_data ? 'beta_invite_code' from auth.users where id = orphan_uid), 'revocation clears normalized pending metadata';
  assert (select code is null from private.beta_redemptions where user_id = pending_uid), 'revocation erases the stored history code';
  assert (select jsonb_agg(to_jsonb(r) - 'code' order by user_id) from private.beta_redemptions r) = history, 'revocation preserves entitlement links and activation dates';
  assert (select jsonb_agg(to_jsonb(e) order by id) from public.entitlements e) = entitlements, 'revocation preserves every entitlement field';
  assert public.mpk_admin_beta_metrics() = metrics and private.beta_seats_used() = seats, 'revocation preserves metrics and seats';
  perform public.mpk_admin_revoke_beta_invite('CLEAN-REVOKE');

  -- Legacy inactive rows, including an expiration exactly at database now().
  insert into private.beta_invites (code, max_uses, use_count, expires_at, revoked_at) values
    ('CLEAN-EXHAUSTED', 2, 2, null, null),
    ('CLEAN-REVOKED', 2, 1, null, now()),
    ('CLEAN-PAST', 2, 1, now() - interval '1 microsecond', null),
    ('CLEAN-BOUNDARY', 2, 0, now(), null),
    ('CLEAN-FUTURE', 2, 0, now() + interval '1 microsecond', null),
    ('CLEAN-NO-EXPIRY', 2, 0, null, null);
  -- Attach historic activations to legacy invitations to exercise ON DELETE SET NULL.
  update private.beta_redemptions set code = 'CLEAN-EXHAUSTED' where user_id = first_uid;
  update private.beta_redemptions set code = 'CLEAN-REVOKED' where user_id = second_uid;
  update private.beta_redemptions set code = 'CLEAN-PAST' where user_id = pending_uid;
  update auth.users set raw_user_meta_data = raw_user_meta_data || '{"beta_invite_code":"CLEAN-BOUNDARY"}' where id = first_uid;
  update auth.users set raw_user_meta_data = raw_user_meta_data || '{"beta_invite_code":"CLEAN-NO-EXPIRY"}' where id = second_uid;
  update auth.users set raw_user_meta_data = raw_user_meta_data || '{"beta_invite_code":"CLEAN-REVOKED"}' where id = pending_uid;
  update auth.users set raw_user_meta_data = raw_user_meta_data || '{"beta_invite_code":"MISSING-AGAIN"}' where id = orphan_uid;
  removed := private.purge_beta_invites();
  assert removed = 4, 'sweep deletes exhausted, revoked, past, and exact-boundary codes';
  assert (select count(*) from private.beta_invites) = 2, 'only future and non-expiring invitations remain';
  assert exists (select 1 from private.beta_invites where code = 'CLEAN-FUTURE'), 'future expiry is not deleted early';
  assert exists (select 1 from private.beta_invites where code = 'CLEAN-NO-EXPIRY'), 'null expiry remains valid';
  assert not exists (select 1 from auth.users where id <> second_uid and raw_user_meta_data ? 'beta_invite_code'), 'expired, revoked, and orphan pending codes are removed';
  assert (select raw_user_meta_data->>'beta_invite_code' from auth.users where id = second_uid) = 'CLEAN-NO-EXPIRY', 'valid pending reference is retained';
  assert (select jsonb_object_agg(id, raw_user_meta_data - 'beta_invite_code') from auth.users) = unrelated_metadata, 'sweep preserves unrelated metadata';
  assert (select bool_and(code is null) from private.beta_redemptions), 'all legacy inactive history codes are erased';
  assert (select jsonb_agg(to_jsonb(r) - 'code' order by user_id) from private.beta_redemptions r) = history, 'sweep preserves redemption history';
  assert (select jsonb_agg(to_jsonb(e) order by id) from public.entitlements e) = entitlements, 'sweep preserves access windows and status';
  assert public.mpk_admin_beta_metrics() = metrics and private.beta_seats_used() = seats, 'sweep preserves engagement metrics and seats';
  assert jsonb_array_length(public.mpk_admin_beta_overview()->'testers') = 3, 'admin still lists all activated testers';
  assert not exists (select 1 from jsonb_array_elements(public.mpk_admin_beta_overview()->'testers') t where t->'code' <> 'null'::jsonb), 'overview serializes removed codes as JSON null';
  assert jsonb_array_length(public.mpk_admin_beta_overview()->'invites') = 2, 'deleted invitations disappear from the overview';
  assert private.purge_beta_invites() = 0, 'repeated cleanup is harmless';

  perform set_config('request.jwt.claim.sub', orphan_uid::text, true);
  assert public.mpk_redeem_beta_invite('CLEAN-BOUNDARY')->>'status' = 'invalid', 'deleted expired invitation cannot grant access';
  assert not private.has_paid_entitlement(orphan_uid), 'cleanup never grants new access';
end;
$$;

-- Exercise permissions under the actual unprivileged roles too.
set local role authenticated;
do $$ begin
  perform private.purge_beta_invites();
  raise exception 'learner invoked maintenance';
exception when insufficient_privilege then null;
end $$;
reset role;
set local role anon;
do $$ begin
  perform private.purge_beta_invites();
  raise exception 'anonymous caller invoked maintenance';
exception when insufficient_privilege then null;
end $$;
reset role;
select 'Beta invitation cleanup assertions passed' as result;
rollback;
