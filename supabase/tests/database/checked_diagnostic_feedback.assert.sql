-- Synthetic fixtures only. All data, including completed assessments, rolls back.
begin;
do $$
declare
  uid uuid := 'cf000000-0000-4000-8000-000000000001';
  other_uid uuid := 'cf000000-0000-4000-8000-000000000002';
  attempt uuid := 'cf000000-0000-4000-8000-000000000003';
  replacement_id uuid := 'cf000000-0000-4000-8000-000000000004';
  first_id text;
  second_id text;
  first_correct text;
  first_wrong text;
  practice_id text;
  practice_option text;
  draft jsonb;
  saved jsonb;
  replacement jsonb;
  candidate jsonb;
  all_answers jsonb;
  locked_answers jsonb;
  result jsonb;
  v_assessment_id uuid;
  intake jsonb := jsonb_build_object('goal','TEF Canada','target','NCLC 7','frenchExperience','I know some French',
    'writingSample',jsonb_build_object('version','mpk-diagnostic-writing-v1','text',repeat('mot ',90)));
begin
  assert not has_function_privilege('anon','public.mpk_replace_diagnostic_draft(jsonb,integer)','execute');
  assert has_function_privilege('authenticated','public.mpk_replace_diagnostic_draft(jsonb,integer)','execute');
  assert not has_function_privilege('authenticated','private.valid_diagnostic_draft(jsonb)','execute');
  assert not has_function_privilege('authenticated','private.preserve_diagnostic_checks(jsonb,jsonb)','execute');
  assert not has_function_privilege('authenticated','private.assert_diagnostic_checked_submission(text,jsonb,jsonb)','execute');
  assert not has_table_privilege('authenticated','public.diagnostic_drafts','update');
  insert into auth.users(id,email,raw_user_meta_data) values
    (uid,'checked-draft@example.test','{"first_name":"Checked","last_name":"Test","exam":"TEF Canada"}'),
    (other_uid,'other-checked-draft@example.test','{"first_name":"Other","last_name":"Test","exam":"TEF Canada"}');
  select id,correct_answer into first_id,first_correct from private.question_bank
    where is_diagnostic and skill='grammar' order by id limit 1;
  select o into first_wrong from private.question_bank q cross join lateral unnest(q.option_ids) o
    where q.id=first_id and o<>q.correct_answer limit 1;
  select id into second_id from private.question_bank where is_diagnostic and id<>first_id order by id limit 1;
  select id,option_ids[1] into practice_id,practice_option from private.question_bank where purpose='practice' and kind='mcq' limit 1;
  select jsonb_build_object('schemaVersion',1,'id',attempt,'contentVersion','test-guided-content','stage','questions','index',0,
    'questionOrder',jsonb_agg(id order by id),'optionOrder',jsonb_object_agg(id,to_jsonb(option_ids)),
    'answers','{}'::jsonb,'intake',intake) into draft from private.question_bank where is_diagnostic;
  select jsonb_agg(jsonb_build_object('question_id',id,'sequence',sequence,'answer',correct_answer) order by sequence) into all_answers
    from (select id,correct_answer,row_number() over(order by id)-1 as sequence from private.question_bank where is_diagnostic) q;
  perform set_config('request.jwt.claim.sub',uid::text,true);
  saved := public.mpk_save_diagnostic_draft(draft,0);
  assert saved->>'revision'='1', 'Legacy draft without markers is accepted';
  draft := jsonb_set(draft,'{answers}',jsonb_build_object(first_id,first_wrong))
    || jsonb_build_object('checkedAnswers',jsonb_build_object(first_id,first_wrong));
  draft := jsonb_set(draft,'{intake,feedbackMode}','"guided"');
  saved := public.mpk_save_diagnostic_draft(draft,1);
  assert saved->>'revision'='2';
  assert saved->'checkedAnswers'->>first_id=first_wrong, 'The first submitted wrong answer is retained';
  -- An unchecked answer, writing and navigation still save normally.
  draft := jsonb_set(draft,array['answers',second_id],to_jsonb((draft->'optionOrder'->second_id)->>0));
  draft := jsonb_set(draft,'{intake,writingSample,text}',to_jsonb(repeat('texte ',90)));
  draft := jsonb_set(draft,'{index}','1');
  saved := public.mpk_save_diagnostic_draft(draft,2);
  assert saved->>'revision'='3';
  assert public.mpk_get_diagnostic_draft()=saved, 'Checked state and writing recover together';

  for candidate in select value from jsonb_array_elements(jsonb_build_array(
    draft-'checkedAnswers',
    jsonb_set(draft,'{checkedAnswers}','{}'),
    jsonb_set(draft,'{checkedAnswers}','null'),
    jsonb_set(draft,'{checkedAnswers}','[]'),
    jsonb_set(draft,'{checkedAnswers}',jsonb_build_object(first_id,4)),
    jsonb_set(draft,array['answers',first_id],to_jsonb(first_correct)),
    jsonb_set(jsonb_set(draft,array['checkedAnswers',first_id],to_jsonb(first_correct)),array['answers',first_id],to_jsonb(first_correct)),
    jsonb_set(draft,'{intake}',(draft->'intake')-'feedbackMode'),
    jsonb_set(draft,'{intake,feedbackMode}','null'),
    jsonb_set(draft,'{intake,feedbackMode}','"independent"'),
    jsonb_set(draft,'{intake,feedbackMode}','1'),
    jsonb_set(draft,'{contentVersion}','"changed-content"'),
    jsonb_set(draft,'{questionOrder}',(select jsonb_agg(value order by ord desc) from jsonb_array_elements(draft->'questionOrder') with ordinality q(value,ord))),
    jsonb_set(draft,array['optionOrder',first_id],(select jsonb_agg(value order by ord desc) from jsonb_array_elements(draft->'optionOrder'->first_id) with ordinality q(value,ord))),
    jsonb_set(draft,'{checkedAnswers}',jsonb_build_object('nonexistent-question','a'))
  )) loop
    begin
      perform public.mpk_save_diagnostic_draft(candidate,3);
      raise exception 'Invalid or mutable checked draft accepted: %',candidate;
    exception when invalid_parameter_value then null;
    end;
  end loop;
  assert public.mpk_get_diagnostic_draft()=saved, 'Rejected edits preserve every saved field';

  -- A marker must match an actual diagnostic option even when it appears in
  -- client-supplied order and answer maps. Replacement validates this too.
  candidate := jsonb_set(jsonb_set(jsonb_set(draft,array['answers',first_id],'"not-an-option"'),
    array['checkedAnswers',first_id],'"not-an-option"'),array['optionOrder',first_id],'["not-an-option"]');
  assert not private.valid_diagnostic_draft(candidate), 'Fabricated diagnostic option rejected';
  candidate := draft || jsonb_build_object('questionOrder',jsonb_build_array(practice_id),
    'optionOrder',jsonb_build_object(practice_id,jsonb_build_array(practice_option)),
    'answers',jsonb_build_object(practice_id,practice_option),
    'checkedAnswers',jsonb_build_object(practice_id,practice_option),'index',0);
  begin perform public.mpk_replace_diagnostic_draft(candidate,3); raise exception 'Practice item accepted as diagnostic check';
  exception when invalid_parameter_value then null; end;
  assert public.mpk_get_diagnostic_draft()=saved, 'Invalid replacement does not discard account work';
  begin perform public.mpk_save_diagnostic_draft(draft,2); raise exception 'Stale save accepted';
  exception when serialization_failure then null; end;
  begin perform public.mpk_replace_diagnostic_draft(draft,2); raise exception 'Stale replacement accepted';
  exception when serialization_failure then null; end;
  replacement := jsonb_set(draft,'{id}',to_jsonb(replacement_id));
  begin perform public.mpk_save_diagnostic_draft(replacement,3); raise exception 'Ordinary save replaced an attempt';
  exception when serialization_failure then null; end;

  perform set_config('request.jwt.claim.sub',other_uid::text,true);
  assert public.mpk_get_diagnostic_draft() is null, 'Other account cannot read checked work';
  set local role authenticated;
  assert (select count(*) from public.diagnostic_drafts)=0, 'RLS protects checked drafts';
  reset role;
  begin perform public.mpk_replace_diagnostic_draft(replacement,3); raise exception 'Other account used owner revision';
  exception when serialization_failure then null; end;
  assert public.mpk_replace_diagnostic_draft(replacement,0)->>'revision'='1', 'Replacement with no account draft starts at revision one';
  set local role authenticated;
  assert (select count(*) from public.diagnostic_drafts)=1;
  reset role;
  perform set_config('request.jwt.claim.sub',uid::text,true);
  assert public.mpk_get_diagnostic_draft()=saved, 'Other account replacement does not touch owner';
  saved := public.mpk_replace_diagnostic_draft(replacement,3);
  assert saved->>'id'=replacement_id::text and saved->>'revision'='4';
  assert saved->'checkedAnswers'=replacement->'checkedAnswers', 'Imported browser checks survive explicit replacement';
  assert not exists(select 1 from public.diagnostic_drafts where user_id=uid and attempt_id=attempt);

  select jsonb_agg(case when a->>'question_id'=first_id then jsonb_set(a,'{answer}',to_jsonb(first_wrong)) else a end order by a->>'sequence')
    into locked_answers from jsonb_array_elements(all_answers) a;
  begin perform public.mpk_complete_diagnostic_draft(replacement_id,3,'TEF Canada',replacement->'intake',locked_answers); raise exception 'Stale completion accepted';
  exception when serialization_failure then null; end;
  begin perform public.mpk_complete_diagnostic_draft(replacement_id,4,'TEF Canada',intake,locked_answers); raise exception 'Guided metadata erased';
  exception when invalid_parameter_value then null; end;
  begin perform public.mpk_complete_diagnostic_draft(replacement_id,4,'TEF Canada',replacement->'intake',all_answers); raise exception 'Final answer was changed after checking';
  exception when invalid_parameter_value then null; end;
  begin perform public.mpk_submit_diagnostic(replacement_id::text,'diagnostic','TEF Canada',replacement->'intake',all_answers); raise exception 'Diagnostic RPC bypassed first answer';
  exception when invalid_parameter_value then null; end;
  begin perform public.mpk_submit_assessment(replacement_id::text,'diagnostic','TEF Canada',replacement->'intake',all_answers); raise exception 'Legacy RPC bypassed first answer';
  exception when invalid_parameter_value then null; end;
  begin perform public.mpk_submit_assessment(replacement_id::text,'diagnostic','TEF Canada',intake,locked_answers); raise exception 'Legacy RPC erased guided mode';
  exception when invalid_parameter_value then null; end;
  begin perform public.mpk_submit_assessment(replacement_id::text,'diagnostic','TEF Canada',(replacement->'intake')-'writingSample',locked_answers); raise exception 'Legacy RPC bypassed writing for an active draft';
  exception when invalid_parameter_value then null; end;
  begin perform public.mpk_complete_diagnostic_draft(replacement_id,4,'TEF Canada',(replacement->'intake')-'writingSample',locked_answers); raise exception 'Writing requirement bypassed';
  exception when invalid_parameter_value then null; end;
  begin perform public.mpk_complete_diagnostic_draft(replacement_id,4,'TEF Canada',replacement->'intake',locked_answers-0); raise exception 'Incomplete submission accepted';
  exception when invalid_parameter_value then null; end;
  assert public.mpk_get_diagnostic_draft()=saved, 'All failed submissions retain the exact draft';
  result := public.mpk_complete_diagnostic_draft(replacement_id,4,'TEF Canada',replacement->'intake',locked_answers);
  v_assessment_id := (result->>'id')::uuid;
  assert (result->>'score')::integer=round(100.0*(jsonb_array_length(all_answers)-1)/jsonb_array_length(all_answers));
  assert (select answer=first_wrong and not is_correct from public.assessment_answers where public.assessment_answers.assessment_id=v_assessment_id and question_id=first_id), 'Server scores original wrong choice';
  assert (select a.intake->>'feedbackMode'='guided' from public.assessments a where a.id=v_assessment_id);
  assert public.mpk_get_diagnostic_draft() is null, 'Completion clears its own draft atomically';
  -- A lost response may retry with a stale revision or changed answer payload;
  -- the already committed score and intake remain authoritative.
  assert public.mpk_complete_diagnostic_draft(replacement_id,0,'TEF Canada',intake,all_answers)->>'id'=result->>'id';
  assert public.mpk_submit_diagnostic(replacement_id::text,'diagnostic','TEF Canada',intake,all_answers)->>'score'=result->>'score';
  assert (select count(*) from public.assessments where user_id=uid)=1, 'Retries never create another assessment';
  assert (select a.intake->>'feedbackMode'='guided' from public.assessments a where a.id=v_assessment_id), 'Retry cannot erase guided metadata';
  begin perform public.mpk_save_diagnostic_draft(replacement,0); raise exception 'Autosave revived completed attempt';
  exception when serialization_failure then null; end;
  begin perform public.mpk_replace_diagnostic_draft(replacement,0); raise exception 'Replacement revived completed attempt';
  exception when serialization_failure then null; end;

  -- Old completed guest claims still work without writing or guided metadata.
  assert public.mpk_submit_assessment('legacy-checked-test','diagnostic','TEF Canada',intake-'writingSample',all_answers)->>'score'='100';
  candidate := jsonb_set(draft,'{id}',to_jsonb(gen_random_uuid()));
  perform public.mpk_save_diagnostic_draft(candidate,0);
  update public.diagnostic_drafts set expires_at=now()-interval '1 second' where user_id=uid;
  assert public.mpk_get_diagnostic_draft() is null;
  begin perform public.mpk_replace_diagnostic_draft(candidate,1); raise exception 'Expired revision accepted';
  exception when serialization_failure then null; end;
  saved := public.mpk_replace_diagnostic_draft(candidate,0);
  assert saved->>'revision'='1' and (saved->>'expiresAt')::timestamptz=now()+interval '7 days';
  -- Explicit replacement can select older unchecked browser work. Ordinary
  -- autosave cannot remove guided metadata even if no markers remain yet.
  candidate := jsonb_set(saved-'checkedAnswers','{id}',to_jsonb(gen_random_uuid()));
  saved := public.mpk_replace_diagnostic_draft(candidate,1);
  assert saved->>'revision'='2' and not (saved ? 'checkedAnswers');
  candidate := jsonb_set(candidate,'{intake}',(candidate->'intake')-'feedbackMode');
  begin perform public.mpk_save_diagnostic_draft(candidate,2); raise exception 'Empty checked map erased guided mode';
  exception when invalid_parameter_value then null; end;
  assert public.mpk_get_diagnostic_draft()=saved;
  saved := public.mpk_replace_diagnostic_draft(candidate,2);
  assert saved->>'revision'='3' and not (saved->'intake' ? 'feedbackMode'), 'Confirmed replacement can select a non-guided draft';
  assert public.mpk_complete_diagnostic_draft(replacement_id,0,'TEF Canada',intake,all_answers)->>'id'=result->>'id';
  assert public.mpk_get_diagnostic_draft()=saved, 'Retrying a completed attempt preserves a newer draft';
  perform set_config('request.jwt.claim.sub',other_uid::text,true);
  assert public.mpk_get_diagnostic_draft()->>'id'=replacement_id::text, 'Completion never clears another account draft';
end;
$$;
rollback;
