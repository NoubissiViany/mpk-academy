-- Run against a disposable migrated database with psql -v ON_ERROR_STOP=1.
-- All fixtures are rolled back.
begin;
do $$
declare
  uid uuid := 'b0000000-0000-0000-0000-00000000000b';
  item text;
  right_answer text;
  wrong_answer text;
  writing_item text;
  queued public.review_items;
  attempt integer := 0;
begin
  assert has_table_privilege('authenticated', 'public.review_items', 'select'), 'learners read their queue';
  assert not has_table_privilege('authenticated', 'public.review_items', 'insert'), 'learners cannot write the queue';
  assert not has_table_privilege('anon', 'public.review_items', 'select'), 'visitors cannot read queues';
  assert not has_function_privilege('authenticated', 'private.schedule_review()', 'execute'), 'scheduling stays private';
  assert exists (select 1 from pg_policies where tablename = 'review_items' and policyname = 'review_items_select_own'), 'rows are owner-only';

  insert into auth.users (id, email, raw_user_meta_data)
  values (uid, 'review-test@example.test', '{"first_name":"Review","last_name":"Test","exam":"TEF Canada"}');
  insert into public.entitlements (user_id, plan_id, status, starts_at)
  values (uid, 'complete', 'active', now() - interval '1 day');
  perform set_config('request.jwt.claim.sub', uid::text, true);

  select id, correct_answer, option_ids[case when correct_answer = 'a' then 2 else 1 end]
  into item, right_answer, wrong_answer
  from private.question_bank
  where purpose = 'practice' and exam = 'TEF' and skill = 'reading' and kind = 'mcq'
  order by id limit 1;

  -- A miss is due one day later and records a new mistake.
  attempt := attempt + 1;
  perform public.mpk_submit_practice('TEF Canada', 'reading', '', 30, jsonb_build_array(jsonb_build_object(
    'question_id', item, 'sequence', 0, 'answer', wrong_answer, 'submission_id', 'review-' || attempt)));
  select * into queued from public.review_items where user_id = uid and question_id = item;
  assert queued.step = 0 and queued.exam = 'TEF Canada' and queued.skill = 'reading', 'a miss enters the queue';
  assert queued.due_at between now() + interval '23 hours' and now() + interval '25 hours', 'a miss is due tomorrow';
  assert (select review_status from public.mistakes where user_id = uid and question_id = item) = 'new', 'the mistake is recorded';

  -- Answering before the item is due does not move it.
  attempt := attempt + 1;
  perform public.mpk_submit_practice('TEF Canada', 'reading', '', 30, jsonb_build_array(jsonb_build_object(
    'question_id', item, 'sequence', 0, 'answer', right_answer, 'submission_id', 'review-' || attempt)));
  assert (select step from public.review_items where user_id = uid and question_id = item) = 0, 'early answers do not count';

  -- Correct when due: 3 days, then 7 days, then retired.
  update public.review_items set due_at = now() - interval '1 minute' where user_id = uid and question_id = item;
  attempt := attempt + 1;
  perform public.mpk_submit_practice('TEF Canada', 'reading', '', 30, jsonb_build_array(jsonb_build_object(
    'question_id', item, 'sequence', 0, 'answer', right_answer, 'submission_id', 'review-' || attempt)));
  select * into queued from public.review_items where user_id = uid and question_id = item;
  assert queued.step = 1 and queued.due_at between now() + interval '71 hours' and now() + interval '73 hours', 'first review waits 3 days';
  assert (select review_status from public.mistakes where user_id = uid and question_id = item) = 'reviewing', 'the mistake is under review';

  update public.review_items set due_at = now() - interval '1 minute' where user_id = uid and question_id = item;
  attempt := attempt + 1;
  perform public.mpk_submit_practice('TEF Canada', 'reading', '', 30, jsonb_build_array(jsonb_build_object(
    'question_id', item, 'sequence', 0, 'answer', right_answer, 'submission_id', 'review-' || attempt)));
  select * into queued from public.review_items where user_id = uid and question_id = item;
  assert queued.step = 2 and queued.due_at between now() + interval '167 hours' and now() + interval '169 hours', 'second review waits 7 days';

  update public.review_items set due_at = now() - interval '1 minute' where user_id = uid and question_id = item;
  attempt := attempt + 1;
  perform public.mpk_submit_practice('TEF Canada', 'reading', '', 30, jsonb_build_array(jsonb_build_object(
    'question_id', item, 'sequence', 0, 'answer', right_answer, 'submission_id', 'review-' || attempt)));
  assert not exists (select 1 from public.review_items where user_id = uid and question_id = item), 'the 7-day review retires the item';
  assert not exists (select 1 from public.mistakes where user_id = uid and question_id = item and review_status <> 'resolved'), 'the mistake is resolved';

  -- A later miss brings it back and reopens the resolved mistake.
  attempt := attempt + 1;
  perform public.mpk_submit_practice('TEF Canada', 'reading', '', 30, jsonb_build_array(jsonb_build_object(
    'question_id', item, 'sequence', 0, 'answer', wrong_answer, 'submission_id', 'review-' || attempt)));
  assert (select step from public.review_items where user_id = uid and question_id = item) = 0, 'a new miss restarts the cycle';
  assert not exists (select 1 from public.mistakes where user_id = uid and question_id = item and review_status = 'resolved'), 'resolved mistakes reopen';

  -- A miss during review resets the step and counts a lapse.
  update public.review_items set step = 1, due_at = now() - interval '1 minute' where user_id = uid and question_id = item;
  attempt := attempt + 1;
  perform public.mpk_submit_practice('TEF Canada', 'reading', '', 30, jsonb_build_array(jsonb_build_object(
    'question_id', item, 'sequence', 0, 'answer', wrong_answer, 'submission_id', 'review-' || attempt)));
  select * into queued from public.review_items where user_id = uid and question_id = item;
  assert queued.step = 0 and queued.lapses = 2 and queued.due_at > now(), 'a missed review starts again';

  -- Writing self-practice is never scheduled.
  select id into writing_item from private.question_bank
  where purpose = 'practice' and exam = 'TEF' and skill = 'writing' order by id limit 1;
  perform public.mpk_submit_practice('TEF Canada', 'writing', '', 300, jsonb_build_array(jsonb_build_object(
    'question_id', writing_item, 'sequence', 0, 'answer', 'Mon texte.', 'submission_id', 'review-writing')));
  assert not exists (select 1 from public.review_items where user_id = uid and question_id = writing_item), 'writing is not scheduled';
end;
$$;
select 'Spaced review database assertions passed' as result;
rollback;
