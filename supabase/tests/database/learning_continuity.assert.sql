begin;
do $$
declare
  uid uuid := 'cc000000-0000-4000-8000-000000000001';
  item text;
  answer text;
  answers jsonb;
  result jsonb;
begin
  assert not has_function_privilege('anon','public.mpk_submit_practice_mode(text,text,text,integer,jsonb,text)','execute');
  insert into auth.users(id,email,raw_user_meta_data) values(uid,'continuity@example.test','{"exam":"TEF Canada","first_name":"Continuity","last_name":"Test"}');
  insert into public.entitlements(user_id,plan_id,status,starts_at) values(uid,'complete','active',now()-interval '1 day');
  perform set_config('request.jwt.claim.sub',uid::text,true);
  select id,correct_answer into item,answer from private.question_bank where purpose='practice' and exam='TEF' and skill='reading' and kind='mcq' order by id limit 1;
  answers := jsonb_build_array(jsonb_build_object('question_id',item,'answer',answer,'sequence',0,'submission_id','continuity-review'));
  result := public.mpk_submit_practice_mode('TEF Canada','reading','',30,answers,'review');
  assert (select mode='review' and status='completed' from public.practice_sessions where id=(result->>'id')::uuid);
  assert public.mpk_submit_practice_mode('TEF Canada','reading','',30,answers,'review')=result;
  begin perform public.mpk_submit_practice_mode('TEF Canada','reading','',30,answers,'practice'); raise exception 'Retry reclassified review';
  exception when invalid_parameter_value then null; end;
  assert (select count(*) from public.practice_sessions where user_id=uid)=1;
  answers := jsonb_set(answers,'{0,submission_id}','"continuity-practice"');
  result := public.mpk_submit_practice_mode('TEF Canada','reading','',30,answers,'practice');
  assert (select mode='practice' and score=100 from public.practice_sessions where id=(result->>'id')::uuid), 'Authoritative scoring is preserved';
end;
$$;
rollback;
