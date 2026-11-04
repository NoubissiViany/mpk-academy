-- Synthetic, rollback-only account isolation, validation and concurrency checks.
begin;
do $$
declare
  uid uuid := 'dd000000-0000-4000-8000-000000000001';
  other_uid uuid := 'dd000000-0000-4000-8000-000000000002';
  attempt uuid := 'dd000000-0000-4000-8000-000000000003';
  draft jsonb;
  saved jsonb;
  result jsonb;
  answers jsonb;
  intake jsonb := jsonb_build_object('goal','TEF Canada','target','NCLC 7','frenchExperience','I know some French',
    'writingSample',jsonb_build_object('version','mpk-diagnostic-writing-v1','text',repeat('mot ',90)));
begin
  assert not has_table_privilege('authenticated','public.diagnostic_drafts','insert');
  assert not has_table_privilege('authenticated','public.diagnostic_drafts','update');
  assert not has_table_privilege('authenticated','public.diagnostic_drafts','delete');
  assert not has_function_privilege('anon','public.mpk_save_diagnostic_draft(jsonb,integer)','execute');
  assert not has_function_privilege('authenticated','private.purge_diagnostic_drafts()','execute');
  insert into auth.users(id,email,raw_user_meta_data) values
    (uid,'draft@example.test','{"first_name":"Draft","last_name":"Test","exam":"TEF Canada"}'),
    (other_uid,'other-draft@example.test','{"first_name":"Other","last_name":"Test","exam":"TEF Canada"}');
  draft := jsonb_build_object('schemaVersion',1,'id',attempt,'contentVersion','test','stage','questions','index',0,
    'questionOrder',jsonb_build_array('q1'),'optionOrder','{"q1":["a","b"]}'::jsonb,'answers','{}'::jsonb,'intake',intake);
  perform set_config('request.jwt.claim.sub',uid::text,true);
  saved := public.mpk_save_diagnostic_draft(draft,0);
  assert saved->>'revision'='1';
  assert (saved->>'expiresAt')::timestamptz = now() + interval '7 days';
  assert public.mpk_get_diagnostic_draft() = saved, 'Reload preserves the draft';
  perform set_config('request.jwt.claim.sub',other_uid::text,true);
  assert public.mpk_get_diagnostic_draft() is null, 'RPC isolates accounts';
  set local role authenticated;
  assert (select count(*) from public.diagnostic_drafts)=0, 'RLS isolates direct reads';
  reset role;
  perform set_config('request.jwt.claim.sub',uid::text,true);
  set local role authenticated;
  assert (select count(*) from public.diagnostic_drafts)=1;
  reset role;
  begin perform public.mpk_save_diagnostic_draft(draft,0); raise exception 'Stale edit accepted';
  exception when serialization_failure then null; end;
  begin perform public.mpk_discard_diagnostic_draft(attempt,0); raise exception 'Stale discard accepted';
  exception when serialization_failure then null; end;
  begin perform public.mpk_save_diagnostic_draft(jsonb_set(draft,'{intake,goal}','null'),1); raise exception 'Null goal accepted';
  exception when invalid_parameter_value then null; end;
  begin perform public.mpk_save_diagnostic_draft(jsonb_set(draft,'{index}','0.5'),1); raise exception 'Fractional step accepted';
  exception when invalid_parameter_value then null; end;
  begin perform public.mpk_save_diagnostic_draft(jsonb_set(draft,'{answers}','{"unrelated":"a"}'),1); raise exception 'Unrelated answer accepted';
  exception when invalid_parameter_value then null; end;
  begin perform public.mpk_save_diagnostic_draft(jsonb_set(draft,'{optionOrder,q1}','["a","a"]'),1); raise exception 'Duplicate option accepted';
  exception when invalid_parameter_value then null; end;
  begin perform public.mpk_save_diagnostic_draft(jsonb_set(draft,'{intake,writingSample,text}',to_jsonb(repeat('x',4001))),1); raise exception 'Oversized writing accepted';
  exception when invalid_parameter_value then null; end;
  begin perform public.mpk_save_diagnostic_draft(jsonb_set(draft,'{contentVersion}','123'),1); raise exception 'Numeric content version accepted';
  exception when invalid_parameter_value then null; end;
  assert public.mpk_get_diagnostic_draft()=saved, 'Invalid edits preserve saved work';
  select jsonb_agg(jsonb_build_object('question_id',id,'sequence',sequence,'answer',correct_answer)) into answers
    from (select id,correct_answer,row_number() over(order by id)-1 as sequence from private.question_bank where is_diagnostic) q;
  begin perform public.mpk_complete_diagnostic_draft(attempt,0,'TEF Canada',intake,answers); raise exception 'Stale completion accepted';
  exception when serialization_failure then null; end;
  begin perform public.mpk_complete_diagnostic_draft(attempt,1,'TEF Canada','{}',answers); raise exception 'Missing writing accepted';
  exception when invalid_parameter_value then null; end;
  assert public.mpk_get_diagnostic_draft()=saved, 'Failed submission retains draft';
  result := public.mpk_complete_diagnostic_draft(attempt,1,'TEF Canada',intake,answers);
  assert public.mpk_get_diagnostic_draft() is null, 'Successful completion cleans up atomically';
  assert public.mpk_complete_diagnostic_draft(attempt,1,'TEF Canada',intake,answers)->>'id'=result->>'id', 'Lost response retry is idempotent';
  begin perform public.mpk_save_diagnostic_draft(draft,0); raise exception 'Late autosave revived a submitted attempt';
  exception when serialization_failure then null; end;
  draft := jsonb_set(draft,'{id}',to_jsonb(gen_random_uuid()));
  perform public.mpk_save_diagnostic_draft(draft,0);
  update public.diagnostic_drafts set expires_at=now()-interval '1 second' where user_id=uid;
  assert public.mpk_get_diagnostic_draft() is null;
  perform private.purge_diagnostic_drafts();
  assert not exists(select 1 from public.diagnostic_drafts where user_id=uid);
end;
$$;
rollback;
