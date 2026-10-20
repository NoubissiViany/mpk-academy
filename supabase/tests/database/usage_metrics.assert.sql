-- Run against a disposable migrated database with psql -v ON_ERROR_STOP=1.
-- All fixtures are rolled back.
begin;
do $$
declare
  returning_uid uuid := '80000000-0000-0000-0000-000000000008';
  quiet_uid uuid := '90000000-0000-0000-0000-000000000009';
  recent_uid uuid := 'a0000000-0000-0000-0000-00000000000a';
  ent uuid;
  m jsonb;
  t jsonb;
begin
  assert not has_function_privilege('anon', 'public.mpk_record_funnel_step(text,text)', 'execute'), 'anon cannot write funnel counts directly';
  assert not has_function_privilege('authenticated', 'public.mpk_record_funnel_step(text,text)', 'execute'), 'learners cannot write funnel counts directly';
  assert not has_function_privilege('authenticated', 'public.mpk_admin_beta_metrics()', 'execute'), 'learners cannot read metrics';
  assert has_function_privilege('service_role', 'public.mpk_record_funnel_step(text,text)', 'execute'), 'server records funnel steps';
  assert has_function_privilege('service_role', 'public.mpk_admin_beta_metrics()', 'execute'), 'server reads metrics';

  -- Counting: one row per day, step, and language; repeated steps increment.
  perform public.mpk_record_funnel_step('landing_view', 'en');
  perform public.mpk_record_funnel_step('landing_view', 'en');
  perform public.mpk_record_funnel_step('landing_view', 'fr');
  assert (select count from private.funnel_daily where step = 'landing_view' and locale = 'en') = 2, 'repeated steps increment';
  assert (select count(*) from private.funnel_daily) = 2, 'one row per step and language';
  begin
    perform public.mpk_record_funnel_step('page_scroll', 'en');
    raise exception 'unknown step accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.mpk_record_funnel_step('landing_view', 'de');
    raise exception 'unknown language accepted';
  exception when check_violation then null;
  end;
  insert into private.funnel_daily (day, step, locale, count)
  values ((now() at time zone 'America/Toronto')::date - 10, 'landing_view', 'en', 5),
         ((now() at time zone 'America/Toronto')::date - 40, 'landing_view', 'en', 99);

  -- Testers: one returns after week one, one goes quiet, one joined recently.
  insert into auth.users (id, email, raw_user_meta_data) values
    (returning_uid, 'returning@example.test', '{"first_name":"Returning","last_name":"Tester","locale":"fr"}'),
    (quiet_uid, 'quiet@example.test', '{"first_name":"Quiet","last_name":"Tester"}'),
    (recent_uid, 'recent@example.test', '{"first_name":"Recent","last_name":"Tester"}');
  insert into private.beta_invites (code, max_uses, use_count) values ('METRICS-01', 3, 3);
  insert into public.entitlements (user_id, plan_id, status, starts_at, ends_at, source)
  values (returning_uid, 'complete', 'active', now() - interval '20 days', now() + interval '70 days', 'beta')
  returning id into ent;
  insert into private.beta_redemptions (user_id, code, entitlement_id, redeemed_at)
  values (returning_uid, 'METRICS-01', ent, now() - interval '20 days');
  insert into public.entitlements (user_id, plan_id, status, starts_at, ends_at, source)
  values (quiet_uid, 'complete', 'active', now() - interval '15 days', now() + interval '75 days', 'beta')
  returning id into ent;
  insert into private.beta_redemptions (user_id, code, entitlement_id, redeemed_at)
  values (quiet_uid, 'METRICS-01', ent, now() - interval '15 days');
  insert into public.entitlements (user_id, plan_id, status, starts_at, ends_at, source)
  values (recent_uid, 'complete', 'active', now() - interval '2 days', now() + interval '88 days', 'beta')
  returning id into ent;
  insert into private.beta_redemptions (user_id, code, entitlement_id, redeemed_at)
  values (recent_uid, 'METRICS-01', ent, now() - interval '2 days');

  insert into public.practice_sessions (user_id, exam, skill, status, completed_at, question_count, correct_count, score) values
    (returning_uid, 'TEF Canada', 'reading', 'completed', now() - interval '19 days', 5, 3, 60),
    (returning_uid, 'TEF Canada', 'listening', 'completed', now() - interval '2 days', 5, 4, 80),
    (returning_uid, 'TEF Canada', 'writing', 'completed', now() - interval '1 day', 1, 0, null),
    (quiet_uid, 'TEF Canada', 'reading', 'completed', now() - interval '14 days', 5, 2, 40),
    (quiet_uid, 'TEF Canada', 'reading', 'in_progress', null, 0, 0, null),
    (recent_uid, 'TCF Canada', 'speaking', 'completed', now() - interval '1 day', 1, 0, null);
  insert into public.lesson_progress (user_id, lesson_id, module_id, status, completed_at)
  values (returning_uid, 'shared-lesson-001', 'grammar', 'completed', now() - interval '3 days');

  m := public.mpk_admin_beta_metrics();
  assert (m->'summary'->>'activated')::integer = 3, 'three testers activated';
  assert (m->'summary'->>'active7')::integer = 2, 'two testers active in the last 7 days';
  assert (m->'summary'->>'weekEligible')::integer = 2, 'two testers joined at least a week ago';
  assert (m->'summary'->>'weekReturned')::integer = 1, 'one eligible tester returned after week one';

  select x into t from jsonb_array_elements(m->'testers') x where x->>'email' = 'returning@example.test';
  assert (t->>'activeDays7')::integer = 3, 'distinct active days counted';
  assert (t->>'practiceSessions')::integer = 2 and (t->>'writingTasks')::integer = 1, 'sessions split by skill';
  assert (t->>'lessons')::integer = 1, 'lessons counted';
  assert (t->>'returnedAfterWeek')::boolean, 'return after week one detected';
  assert t->>'locale' = 'fr', 'tester language reported';
  select x into t from jsonb_array_elements(m->'testers') x where x->>'email' = 'quiet@example.test';
  assert not (t->>'returnedAfterWeek')::boolean and (t->>'practiceSessions')::integer = 1, 'unfinished sessions ignored';
  select x into t from jsonb_array_elements(m->'testers') x where x->>'email' = 'recent@example.test';
  assert not (t->>'weekEligible')::boolean and (t->>'speakingTasks')::integer = 1, 'recent tester not yet eligible';

  select x into t from jsonb_array_elements(m->'funnel') x
    where x->>'step' = 'landing_view' and x->>'locale' = 'en';
  assert (t->>'last7')::integer = 2 and (t->>'last30')::integer = 7, 'funnel windows exclude older days';
  select x into t from jsonb_array_elements(m->'funnel') x
    where x->>'step' = 'beta_activated' and x->>'locale' = 'en';
  assert (t->>'last7')::integer = 1 and (t->>'last30')::integer = 2, 'activations come from redemptions';
  select x into t from jsonb_array_elements(m->'funnel') x
    where x->>'step' = 'account_created' and x->>'locale' = 'fr';
  assert (t->>'last30')::integer >= 1, 'accounts come from profiles';
end;
$$;
select 'Usage metrics database assertions passed' as result;
rollback;
