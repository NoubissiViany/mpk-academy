begin;
do $$
declare uid uuid:='60000000-0000-4000-8000-000000000006'; m jsonb; r jsonb; again jsonb; saved_presentation jsonb; sec jsonb; original_sec jsonb; sid uuid; old_id uuid; item record; first_id text; last_id text; middle_id text; deadline numeric; total integer; correct integer;
begin
 insert into auth.users(id,email,raw_user_meta_data) values(uid,'mock-order@example.test','{"first_name":"Mock","last_name":"Test","exam":"TCF Canada"}');
 perform set_config('request.jwt.claim.sub',uid::text,true);
 insert into public.entitlements(user_id,plan_id,status,starts_at) values(uid,'complete','active',now()-interval '1 day');
 update private.question_bank set audio_status='ready' where purpose='mock';
 select manifest into m from private.content_manifests where id='tcf-mock-01';
 -- A legacy session without a presentation snapshot must keep its original order.
 insert into private.mock_sessions(user_id,manifest_id,state) values(uid,'tcf-mock-01',private.mock_position(jsonb_build_object('status','in_progress','sectionIndex',0,'itemIndex',0,'deadline',extract(epoch from now())*1000+60000,'answers','{}','consumedAudio','[]'),m,extract(epoch from now())*1000,false)) returning id into old_id;
 r:=public.mpk_mock_event(old_id,'tcf-mock-01','{"type":"resume"}');
 assert r->'manifest'=m and r->'optionOrder'='{}'::jsonb,'legacy order preserved';
 update private.mock_sessions set state=state||'{"status":"completed"}' where id=old_id;
 r:=public.mpk_mock_event(null,'tcf-mock-01','{"type":"start"}'); sid:=(r->>'id')::uuid; saved_presentation:=r; deadline:=(r->'state'->>'deadline')::numeric;
 for sec in select value from jsonb_array_elements(r->'manifest'->'sections') loop
   select value into original_sec from jsonb_array_elements(m->'sections') where value->>'skill'=sec->>'skill';
   assert sec-'itemIds'=original_sec-'itemIds','section timing/navigation preserved';
   assert (select jsonb_agg(id order by id) from jsonb_array_elements_text(sec->'itemIds') id)=(select jsonb_agg(id order by id) from jsonb_array_elements_text(original_sec->'itemIds') id),'question membership preserved';
   if sec->>'skill' in ('writing','speaking') then assert sec=original_sec,'productive sequence preserved';
   else
     assert not exists(select 1 from (select difficulty,lag(difficulty) over(order by pos) previous from jsonb_array_elements_text(sec->'itemIds') with ordinality a(id,pos) join private.question_bank q on q.id=a.id) x where difficulty<previous),'difficulty sequence preserved';
   end if;
 end loop;
 for item in select key,value from jsonb_each(r->'optionOrder') loop
   assert (select array_agg(v order by v) from jsonb_array_elements_text(item.value) v)=(select array_agg(v order by v) from private.question_bank q,unnest(q.option_ids) v where q.id=item.key),'option membership preserved';
 end loop;
 first_id:=r->'manifest'->'sections'->0->'itemIds'->>0;
 r:=public.mpk_mock_event(sid,'tcf-mock-01',jsonb_build_object('type','answer','itemId',first_id,'answer',(select correct_answer from private.question_bank where id=first_id)));
 again:=public.mpk_mock_event(sid,'tcf-mock-01','{"type":"resume"}');
 assert again->'manifest'=saved_presentation->'manifest' and again->'optionOrder'=saved_presentation->'optionOrder','answer/save/resume preserve presentation';
 assert (again->'state'->>'deadline')::numeric=deadline,'resume never extends deadline';
 -- Move to editable writing; short drafts are saveable and navigation remains free.
 update private.mock_sessions set state=private.mock_position(state||'{"sectionIndex":2,"itemIndex":0}',saved_presentation->'manifest',extract(epoch from now())*1000,false) where id=sid;
 first_id:=m->'sections'->2->'itemIds'->>0;middle_id:=m->'sections'->2->'itemIds'->>1;last_id:=m->'sections'->2->'itemIds'->>2;
 r:=public.mpk_mock_event(sid,'tcf-mock-01',jsonb_build_object('type','answer','itemId',first_id,'answer','Brouillon court.'));
 r:=public.mpk_mock_event(sid,'tcf-mock-01',jsonb_build_object('type','next','itemId',first_id));
 r:=public.mpk_mock_event(sid,'tcf-mock-01',jsonb_build_object('type','answer','itemId',middle_id,'answer',repeat('mot ',120)));
 r:=public.mpk_mock_event(sid,'tcf-mock-01',jsonb_build_object('type','next','itemId',middle_id));
 r:=public.mpk_mock_event(sid,'tcf-mock-01',jsonb_build_object('type','answer','itemId',last_id,'answer',repeat('mot ',200)));
 begin perform public.mpk_mock_event(sid,'tcf-mock-01',jsonb_build_object('type','next','itemId',last_id));raise exception 'short section finalized';exception when sqlstate '22023' then null;end;
 -- Timeout must end the attempt even if writing is short and preserve comprehension grading.
 update private.mock_sessions set state=state||jsonb_build_object('deadline',extract(epoch from now())*1000-20000000,'taskDeadline',null) where id=sid;
 r:=public.mpk_mock_event(sid,'tcf-mock-01','{"type":"tick"}');
 assert r->'state'->>'status'='completed','timeout ends attempt';
 assert r->'state'->'incompleteWritingIds'=jsonb_build_array(first_id),'only short writing incomplete';
 assert exists(select 1 from public.assessment_answers where assessment_id=(r->>'assessmentId')::uuid and question_id=first_id and answer='Brouillon court.' and is_correct is null),'short draft retained without correctness credit';
 select count(*),count(*) filter(where is_correct) into total,correct from public.assessment_answers where assessment_id=(r->>'assessmentId')::uuid and is_correct is not null;
 assert total=78 and correct=1,'comprehension denominator and ID grading preserved';
 assert not exists(select 1 from public.writing_submissions where user_id=uid),'no automatic AI feedback';
 again:=public.mpk_mock_event(null,'tcf-mock-01','{"type":"start"}');
 assert again->>'id'<>sid::text,'new attempt available';
end $$;
rollback;
