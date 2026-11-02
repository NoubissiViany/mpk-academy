begin;
do $$
declare uid uuid:='50000000-0000-4000-8000-000000000005'; task record; r jsonb; again jsonb; n integer; key uuid; saved_progress jsonb;
begin
 assert private.writing_word_count(E' \t\n  ﻿')=0,'empty whitespace';
 assert private.writing_word_count(E' un\tdeux trois quatre﻿cinq ')=5,'French whitespace';
 assert not exists(select 1 from private.question_bank where kind='writing' and content_version='mpk-content-v2' and minimum_words is null),'all writing minimums authored';
 assert not exists(select 1 from private.question_bank where content_version='mpk-content-v2' and difficulty is null),'all difficulty authored';
 assert not has_function_privilege('anon','public.mpk_save_incomplete_writing_practice(text,text,text,uuid,integer)','execute'),'anonymous incomplete forbidden';
 assert not has_function_privilege('authenticated','private.submit_practice_before_word_limits(text,text,text,integer,jsonb)','execute'),'no bypass';
 insert into auth.users(id,email,raw_user_meta_data) values(uid,'word-ranges@example.test','{"first_name":"Range","last_name":"Test","exam":"TEF Canada"}');
 perform set_config('request.jwt.claim.sub',uid::text,true);
 insert into public.entitlements(user_id,plan_id,status,starts_at) values(uid,'complete','active',now()-interval '1 day');
 perform public.mpk_set_ai_feedback_consent('2026-10-21');
 update private.ai_settings set writing_user_daily_limit=100;
 for task in select distinct on(minimum_words) * from private.question_bank where kind='writing' and purpose='practice' order by minimum_words,id loop
   begin perform public.mpk_submit_practice(task.exam||' Canada','writing','',20,jsonb_build_array(jsonb_build_object('question_id',task.id,'answer',repeat('mot ',task.minimum_words-1),'sequence',0,'submission_id',gen_random_uuid()::text)));raise exception 'short practice accepted';exception when sqlstate '22023' then null;end;
   begin perform public.mpk_submit_writing(task.exam||' Canada',task.id,repeat('mot ',task.minimum_words-1),'en','{}',gen_random_uuid()::text);raise exception 'short feedback accepted';exception when sqlstate '22023' then null;end;
   for n in task.minimum_words..task.minimum_words+1 loop
     r:=public.mpk_submit_practice(task.exam||' Canada','writing','',20,jsonb_build_array(jsonb_build_object('question_id',task.id,'answer',repeat('mot ',n),'sequence',0,'submission_id',gen_random_uuid()::text)));
     assert exists(select 1 from public.practice_sessions where id=(r->>'id')::uuid and status='completed'),'minimum accepted';
     r:=public.mpk_submit_writing(task.exam||' Canada',task.id,repeat('mot ',n),'en','{}',gen_random_uuid()::text);
     assert r->>'status'='queued','minimum feedback accepted';
   end loop;
   begin perform public.mpk_submit_writing(task.exam||' Canada',task.id,'court','en','{}',gen_random_uuid()::text,(r->>'id')::uuid);raise exception 'short rewrite accepted';exception when sqlstate '22023' then null;end;
   begin perform public.mpk_submit_writing(task.exam||' Canada',task.id,repeat('mot ',2100),'en','{}',gen_random_uuid()::text);raise exception 'AI character maximum removed';exception when sqlstate '22023' then null;end;
   r:=public.mpk_submit_practice(task.exam||' Canada','writing','',20,jsonb_build_array(jsonb_build_object('question_id',task.id,'answer',repeat(repeat('x',50)||' ',task.minimum_words),'sequence',0,'submission_id',gen_random_uuid()::text)));
   assert r->>'id' is not null,'practice retains its original character allowance';
   select to_jsonb(p) into saved_progress from public.learner_progress p where user_id=uid and exam=task.exam||' Canada';
   key:=gen_random_uuid();
   r:=public.mpk_save_incomplete_writing_practice(task.exam||' Canada',task.id,'Mon brouillon',key,task.duration_seconds);
   again:=public.mpk_save_incomplete_writing_practice(task.exam||' Canada',task.id,'Mon brouillon',key,task.duration_seconds);
   assert r=again,'incomplete save idempotent';
   assert exists(select 1 from public.practice_sessions where id=(r->>'id')::uuid and status='abandoned' and completed_at is null and score is null),'incomplete not scored or completed';
   assert exists(select 1 from public.practice_answers where practice_session_id=(r->>'id')::uuid and answer='Mon brouillon' and is_correct is null),'short text preserved';
   assert (select to_jsonb(p) from public.learner_progress p where user_id=uid and exam=task.exam||' Canada') is not distinct from saved_progress,'incomplete earns no progress';
   begin perform public.mpk_save_incomplete_writing_practice(task.exam||' Canada',task.id,'court',gen_random_uuid(),task.duration_seconds-1);raise exception 'early timeout accepted';exception when sqlstate '22023' then null;end;
 end loop;
end $$;
rollback;
