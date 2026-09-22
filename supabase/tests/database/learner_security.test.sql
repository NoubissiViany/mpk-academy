begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'assessments', 'assessments table exists');
select has_table('public', 'entitlements', 'entitlements table exists');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
(
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'alpha@example.test', '', now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Alpha","last_name":"Learner","exam":"TEF Canada","target":"NCLC 7","locale":"en"}',
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '20000000-0000-0000-0000-000000000002',
  'authenticated', 'authenticated', 'beta@example.test', '', now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Beta","last_name":"Learner","exam":"TCF Canada","target":"NCLC 5","locale":"fr"}',
  now(), now(), '', '', '', ''
);

select is(
  (select count(*)::integer from public.profiles where id in (
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002'
  )),
  2,
  'signup trigger creates both profiles'
);

select is(
  (select count(*)::integer from public.skill_scores where user_id = '10000000-0000-0000-0000-000000000001'),
  4,
  'signup trigger creates four initial skill rows'
);

set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
set local role authenticated;

select is((select count(*)::integer from public.profiles), 1, 'RLS exposes only the current profile');
select is((select first_name from public.profiles), 'Alpha', 'RLS does not expose the second learner');

select throws_ok(
  $$insert into public.entitlements (user_id, plan_id, status, starts_at)
    values ('10000000-0000-0000-0000-000000000001', 'complete', 'active', now())$$,
  '42501',
  'permission denied for table entitlements',
  'browser role cannot grant an entitlement'
);

select throws_ok(
  $$insert into public.purchases (user_id, provider, external_purchase_id, plan_id, status, amount_minor)
    values ('10000000-0000-0000-0000-000000000001', 'browser', 'forged', 'complete', 'paid', 0)$$,
  '42501',
  'permission denied for table purchases',
  'browser role cannot create a purchase'
);

select throws_ok(
  $$update public.progress_history set detail = 'tampered'$$,
  '42501',
  'permission denied for table progress_history',
  'progress history is append-only to the browser role'
);

select lives_ok(
  $$select public.mpk_submit_assessment(
    '30000000-0000-0000-0000-000000000003', 'diagnostic', 'TEF Canada',
    '{"goal":"TEF Canada","target":"NCLC 7","frenchExperience":"I know some French"}'::jsonb,
    '[
      {"question_id":"d1","sequence":0,"answer":"a"},
      {"question_id":"d2","sequence":1,"answer":"b"},
      {"question_id":"d3","sequence":2,"answer":"b"},
      {"question_id":"d4","sequence":3,"answer":"b"},
      {"question_id":"d5","sequence":4,"answer":"lirais"},
      {"question_id":"d6","sequence":5,"answer":"b"},
      {"question_id":"d7","sequence":6,"answer":"b"},
      {"question_id":"d8","sequence":7,"answer":"b"},
      {"question_id":"d9","sequence":8,"answer":"b"},
      {"question_id":"d10","sequence":9,"answer":"b"},
      {"question_id":"d11","sequence":10,"answer":"a"},
      {"question_id":"d12","sequence":11,"answer":"b"},
      {"question_id":"d13","sequence":12,"answer":"b"},
      {"question_id":"d14","sequence":13,"answer":"b"},
      {"question_id":"d15","sequence":14,"answer":"c"}
    ]'::jsonb
  )$$,
  'a diagnostic is saved atomically through the restricted function'
);

select is((select count(*)::integer from public.assessments), 1, 'the current learner sees the saved assessment');

select lives_ok(
  $$select public.mpk_submit_assessment(
    '30000000-0000-0000-0000-000000000003', 'diagnostic', 'TEF Canada', '{}'::jsonb,
    '[
      {"question_id":"d1","sequence":0,"answer":"wrong"},
      {"question_id":"d2","sequence":1,"answer":"wrong"},
      {"question_id":"d3","sequence":2,"answer":"wrong"},
      {"question_id":"d4","sequence":3,"answer":"wrong"},
      {"question_id":"d5","sequence":4,"answer":"wrong"},
      {"question_id":"d6","sequence":5,"answer":"wrong"},
      {"question_id":"d7","sequence":6,"answer":"wrong"},
      {"question_id":"d8","sequence":7,"answer":"wrong"},
      {"question_id":"d9","sequence":8,"answer":"wrong"},
      {"question_id":"d10","sequence":9,"answer":"wrong"},
      {"question_id":"d11","sequence":10,"answer":"wrong"},
      {"question_id":"d12","sequence":11,"answer":"wrong"},
      {"question_id":"d13","sequence":12,"answer":"wrong"},
      {"question_id":"d14","sequence":13,"answer":"wrong"},
      {"question_id":"d15","sequence":14,"answer":"wrong"}
    ]'::jsonb
  )$$,
  'claiming the same guest assessment is idempotent'
);

select is((select count(*)::integer from public.assessments), 1, 'idempotent claim does not duplicate the assessment');

select throws_ok(
  $$select public.mpk_submit_assessment('', 'diagnostic', 'TEF Canada', '{}'::jsonb,
    '[{"question_id":"d1","sequence":0,"answer":"a"}]'::jsonb)$$,
  '22023',
  'Assessment question set is incomplete or invalid',
  'invalid submissions roll back instead of partially saving'
);

select is((select count(*)::integer from public.assessments), 1, 'failed submission leaves no partial assessment');

reset role;
reset request.jwt.claim.sub;
set local role anon;

select throws_ok(
  $$select * from public.profiles$$,
  '42501',
  'permission denied for table profiles',
  'unauthenticated clients cannot read learner profiles'
);

select throws_ok(
  $$select public.mpk_update_profile('Visitor', '', 'en', 'full')$$,
  '42501',
  'permission denied for function mpk_update_profile',
  'unauthenticated clients cannot call learner mutation functions'
);

select * from finish();
rollback;
