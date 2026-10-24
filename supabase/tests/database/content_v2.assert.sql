-- Run against a disposable migrated database with psql -v ON_ERROR_STOP=1.
-- All fixtures, including ready-audio metadata, are rolled back.
begin;
do $$
declare uid uuid:='30000000-0000-0000-0000-000000000003'; other_uid uuid:='40000000-0000-0000-0000-000000000004';
 answers jsonb; r jsonb; retry jsonb; session jsonb; session_id uuid; first_id text; second_id text; deadline numeric; n integer;
begin
 assert (select count(*) from private.question_bank where content_version='mpk-content-v2')>=248,'content count';
 assert (select count(*) from private.lesson_catalog where active)>=24,'lesson count';
 -- Pending audio is a fixture here, so these checks hold once real clips exist.
 update private.question_bank set audio_status='pending' where skill='listening';
 assert (select correct_answer from private.question_bank where id='d1')='a','historical answer preserved';
 assert not has_function_privilege('anon','public.mpk_submit_assessment(text,text,text,jsonb,jsonb)','execute'),'anon scoring forbidden';
 assert not has_function_privilege('authenticated','private.submit_assessment_impl_20260924(text,text,text,jsonb,jsonb)','execute'),'private grading forbidden';
 insert into auth.users(id,email,raw_user_meta_data) values(uid,'content-test@example.test','{"first_name":"Content","last_name":"Test","exam":"TEF Canada"}'),(other_uid,'content-other@example.test','{"first_name":"Other","last_name":"Test","exam":"TCF Canada"}');
 perform set_config('request.jwt.claim.sub',uid::text,true);
 insert into public.entitlements(user_id,plan_id,status,starts_at) values(uid,'complete','active',now()-interval '1 day');
 select jsonb_agg(jsonb_build_object('question_id',id,'sequence',seq-1,'answer',correct_answer) order by seq) into answers
 from (select *,row_number() over(order by id) seq from private.question_bank where is_diagnostic) q;
 r:=public.mpk_submit_assessment('content-v2-test','diagnostic','TEF Canada','{}',answers);
 assert (r->>'score')::integer=100 and (r->>'assessedItemCount')::integer=(select count(*) from private.question_bank where is_diagnostic and skill<>'listening'),'diagnostic score denominator';
 assert r->'skillScores'->'listening'='null'::jsonb,'pending listening unassessed';
 assert (r->>'languageFoundation')::integer=100,'foundation score';
 retry:=public.mpk_submit_assessment('content-v2-test','diagnostic','TEF Canada','{}',answers);
 assert r=retry,'diagnostic retry idempotent';
 assert (select current_score from public.skill_scores where user_id=uid and exam='TEF Canada' and skill='listening') is null,'no fabricated listening trend';
 begin perform public.mpk_submit_assessment('bad-duplicate','diagnostic','TEF Canada','{}',answers||jsonb_build_array(answers->0));raise exception 'duplicate accepted';exception when sqlstate '22023' then null;end;
 begin perform public.mpk_submit_assessment('bad-missing','diagnostic','TEF Canada','{}',answers-0);raise exception 'missing accepted';exception when sqlstate '22023' then null;end;
 begin perform public.mpk_submit_assessment('bad-option','diagnostic','TEF Canada','{}',jsonb_set(answers,'{0,answer}','"z"'));raise exception 'option accepted';exception when sqlstate '22023' then null;end;
 begin perform public.mpk_submit_assessment('bad-unknown','diagnostic','TEF Canada','{}',jsonb_set(answers,'{0,question_id}','"unknown"'));raise exception 'unknown accepted';exception when sqlstate '22023' then null;end;
 select id into first_id from private.question_bank where purpose='practice' and exam='TEF' and skill='listening' order by id limit 1;
 answers:=jsonb_build_array(jsonb_build_object('question_id',first_id,'sequence',0,'answer',(select option_ids[case when correct_answer='a' then 2 else 1 end] from private.question_bank where id=first_id),'submission_id','transcript-test'));
 r:=public.mpk_submit_practice('TEF Canada','listening','',30,answers);
 assert r->'score'='null'::jsonb,'transcript not scored';
 retry:=public.mpk_submit_practice('TEF Canada','listening','',30,answers);assert r=retry,'practice retry idempotent';
 assert (select count(*) from public.mistakes where user_id=uid and evidence_mode='transcript')=1,'transcript mistakes labelled';
 begin perform public.mpk_submit_practice('TCF Canada','listening','',30,answers);raise exception 'wrong exam accepted';exception when sqlstate '22023' then null;end;
 select id into first_id from private.question_bank where purpose='practice' and exam='TEF' and skill='writing' order by id limit 1;
 r:=public.mpk_submit_practice('TEF Canada','writing','',100,jsonb_build_array(jsonb_build_object('question_id',first_id,'sequence',0,'answer','Mon texte original.','submission_id','writing-test')));
 assert r->'score'='null'::jsonb,'writing not scored';
 assert exists(select 1 from public.practice_answers where practice_session_id=(r->>'id')::uuid and answer='Mon texte original.' and is_correct is null),'writing saved without correctness';
 perform public.mpk_complete_lesson('shared-lesson-001');
 assert (select course_completion from public.learner_progress where user_id=uid and exam='TEF Canada')=round(100.0/(select count(*) from private.lesson_catalog where active and exam in ('shared','TEF'))),'one of the applicable lessons';
 begin perform public.mpk_mock_event(null,'tef-mock-01','{"type":"start"}');raise exception 'pending mock launched';exception when sqlstate '55000' then null;end;
 begin perform public.mpk_submit_assessment('bypass','mock_exam','TEF Canada','{}','[]');raise exception 'direct mock accepted';exception when sqlstate '22023' then null;end;
 update public.entitlements set plan_id='essential' where user_id=uid;
 begin perform public.mpk_mock_event(null,'tef-mock-01','{"type":"start"}');raise exception 'essential mock access accepted';exception when sqlstate '42501' then null;end;
 begin perform public.mpk_complete_lesson('tef-lesson-005');raise exception 'essential strategy access accepted';exception when sqlstate '42501' then null;end;
 update public.entitlements set plan_id='complete' where user_id=uid;
 -- Ready metadata is a test fixture only. No production file is implied or created.
 update private.question_bank set audio_status='ready' where purpose='mock';
 session:=public.mpk_mock_event(null,'tef-mock-01','{"type":"start"}');session_id:=(session->>'id')::uuid;deadline:=(session->'state'->>'deadline')::numeric;
 select manifest->'sections'->0->'itemIds'->>0,manifest->'sections'->0->'itemIds'->>1 into first_id,second_id from private.content_manifests where id='tef-mock-01';
 session:=public.mpk_mock_event(session_id,'tef-mock-01',jsonb_build_object('type','answer','itemId',first_id,'answer','a'));
 session:=public.mpk_mock_event(session_id,'tef-mock-01',jsonb_build_object('type','next','itemId',first_id));
 session:=public.mpk_mock_event(session_id,'tef-mock-01',jsonb_build_object('type','previous','itemId',second_id));
 assert (session->'state'->>'itemIndex')::integer=0,'reading back navigation';
 session:=public.mpk_mock_event(session_id,'tef-mock-01','{"type":"resume"}');
 assert (session->'state'->>'deadline')::numeric=deadline,'refresh preserves deadline';
 assert session->'state'->'answers'->>first_id='a','refresh preserves answers';
 perform set_config('request.jwt.claim.sub',other_uid::text,true);
 insert into public.entitlements(user_id,plan_id,status,starts_at) values(other_uid,'complete','active',now()-interval '1 day');
 begin perform public.mpk_mock_event(session_id,'tef-mock-01','{"type":"resume"}');raise exception 'cross-user access accepted';exception when sqlstate '42501' then null;end;
 perform set_config('request.jwt.claim.sub',uid::text,true);
 update private.mock_sessions set state=jsonb_set(state,'{deadline}',to_jsonb(floor(extract(epoch from clock_timestamp())*1000)-100)) where id=session_id;
 session:=public.mpk_mock_event(session_id,'tef-mock-01','{"type":"tick"}');
 assert (session->'state'->>'sectionIndex')::integer=1,'reading expiry advances';
 select manifest->'sections'->1->'itemIds'->>0 into first_id from private.content_manifests where id='tef-mock-01';
 session:=public.mpk_mock_event(session_id,'tef-mock-01',jsonb_build_object('type','play','itemId',first_id));
 assert (session->>'audioGranted')::boolean,'first play allowed';
 begin perform public.mpk_mock_event(session_id,'tef-mock-01',jsonb_build_object('type','play','itemId',first_id));raise exception 'replay allowed';exception when sqlstate '22023' then null;end;
 begin perform public.mpk_mock_event(session_id,'tef-mock-01',jsonb_build_object('type','answer','itemId',first_id,'answer','a'));raise exception 'early listening answer allowed';exception when sqlstate '22023' then null;end;
 update private.mock_sessions set state=jsonb_set(state,'{audioUntil}','0') where id=session_id;
 session:=public.mpk_mock_event(session_id,'tef-mock-01',jsonb_build_object('type','next','itemId',first_id));
 select manifest->'sections'->1->'itemIds'->>1 into second_id from private.content_manifests where id='tef-mock-01';
 begin perform public.mpk_mock_event(session_id,'tef-mock-01',jsonb_build_object('type','previous','itemId',second_id));raise exception 'listening back allowed';exception when sqlstate '22023' then null;end;
 -- Expired browser time must not grant a new full section after a long absence.
 update private.mock_sessions set state=jsonb_set(jsonb_set(state,'{deadline}',to_jsonb(floor(extract(epoch from clock_timestamp())*1000)-20000000)),'{taskDeadline}','null') where id=session_id;
 session:=public.mpk_mock_event(session_id,'tef-mock-01','{"type":"tick"}');
 assert session->'state'->>'status'='completed','offline expiry completes';
 assert session->>'assessmentId' is not null,'mock result persisted';
 retry:=public.mpk_mock_event(session_id,'tef-mock-01','{"type":"resume"}');assert retry->>'assessmentId'=session->>'assessmentId','mock retry idempotent';
 assert (select count(*) from public.assessment_answers where assessment_id=(session->>'assessmentId')::uuid)=84,'full mock answer set';
 assert (select count(*) from public.assessment_answers where assessment_id=(session->>'assessmentId')::uuid and is_correct is null)=4,'productive mock tasks unscored';
 -- TCF preparation is included in 330 seconds, not added to it.
 select manifest into r from private.content_manifests where id='tcf-mock-01';
 retry:=private.mock_position(jsonb_build_object('sectionIndex',3,'itemIndex',1,'deadline',720000,'answers','{}','consumedAudio','[]'),r,0,false);
 assert (retry->>'taskDeadline')::integer=330000,'TCF interaction total timing';
 perform set_config('request.jwt.claim.sub','',true);
 begin perform public.mpk_submit_practice('TEF Canada','reading','',10,'[]');raise exception 'anonymous submission accepted';exception when sqlstate '42501' then null;end;
end $$;
set local request.jwt.claim.sub='30000000-0000-0000-0000-000000000003';
set local role authenticated;
do $$ begin
 assert (select count(*) from public.profiles)=1,'RLS exposes only own profile';
 assert (select count(*) from public.assessments)>0,'RLS retains own results';
 begin update public.practice_sessions set score=100;raise exception 'direct scoring write accepted';exception when sqlstate '42501' then null;end;
 begin perform * from private.question_bank;raise exception 'private answer bank exposed';exception when sqlstate '42501' then null;end;
end $$;
reset role;
delete from auth.users where id='30000000-0000-0000-0000-000000000003';
do $$ begin
 assert not exists(select 1 from private.mock_sessions where user_id='30000000-0000-0000-0000-000000000003'),'account deletion cascades to mock sessions';
end $$;
select 'Content v2 database assertions passed' as result;
rollback;
