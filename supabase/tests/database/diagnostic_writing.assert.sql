-- Synthetic fixtures only; never run against a hosted project.
begin;
do $$
declare
  uid uuid := 'e1000000-0000-4000-8000-000000000001';
  other_uid uuid := 'e1000000-0000-4000-8000-000000000002';
  answers jsonb;
  intake jsonb := jsonb_build_object('goal','TEF Canada','target','NCLC 7','frenchExperience','I know some French',
    'writingSample', jsonb_build_object('version','mpk-diagnostic-writing-v1','text',repeat('mot ',90)));
  result jsonb;
  v_assessment_id uuid;
  second_assessment uuid;
  third_assessment uuid;
  v_submission_id uuid;
  original_result jsonb;
begin
  assert not has_function_privilege('anon','public.mpk_submit_diagnostic(text,text,text,jsonb,jsonb)','execute');
  assert not has_function_privilege('anon','public.mpk_submit_diagnostic_writing(uuid,text,boolean)','execute');
  assert not has_table_privilege('authenticated','public.writing_submissions','insert');
  assert not has_table_privilege('authenticated','public.writing_submissions','update');
  insert into auth.users(id,email,raw_user_meta_data) values
    (uid,'diagnostic-writing@example.test','{"first_name":"Writing","last_name":"Test","exam":"TEF Canada"}'),
    (other_uid,'diagnostic-other@example.test','{"first_name":"Other","last_name":"Test","exam":"TEF Canada"}');
  perform set_config('request.jwt.claim.sub',uid::text,true);
  select jsonb_agg(jsonb_build_object('question_id',id,'sequence',sequence,'answer',correct_answer)) into answers
    from (select id,correct_answer,row_number() over(order by id)-1 as sequence from private.question_bank where is_diagnostic) q;
  begin
    perform public.mpk_submit_diagnostic('missing','diagnostic','TEF Canada','{}',answers);
    raise exception 'Missing writing accepted';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.mpk_submit_diagnostic('short','diagnostic','TEF Canada',jsonb_set(intake,'{writingSample,text}',to_jsonb(repeat('mot ',79))),answers);
    raise exception 'Short writing accepted';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.mpk_submit_diagnostic('long','diagnostic','TEF Canada',jsonb_set(intake,'{writingSample,text}',to_jsonb(repeat('mot ',121))),answers);
    raise exception 'Long writing accepted';
  exception when sqlstate '22023' then null;
  end;
  assert private.valid_diagnostic_writing(jsonb_build_object('version','mpk-diagnostic-writing-v1','text',repeat('mot ',80)));
  assert private.valid_diagnostic_writing(jsonb_build_object('version','mpk-diagnostic-writing-v1','text',repeat('mot ',120)));
  assert not private.valid_diagnostic_writing(jsonb_build_object('version','old','text',repeat('mot ',90)));
  result := public.mpk_submit_diagnostic('writing-valid','diagnostic','TEF Canada',intake,answers);
  v_assessment_id := (result->>'id')::uuid;
  assert (result->>'score')::int = 100, 'Writing must not change the quiz score';
  assert (result->>'assessedItemCount')::int = (select count(*) from private.question_bank where is_diagnostic);
  assert (select a.intake->'writingSample'->>'text' from public.assessments a where id=v_assessment_id)=repeat('mot ',90);
  select to_jsonb(r) into original_result from public.assessment_results r where r.assessment_id=v_assessment_id;
  -- Existing guest sessions remain claimable without a writing sample.
  assert public.mpk_submit_assessment('historical-guest','diagnostic','TEF Canada',intake-'writingSample',answers)->>'score'='100';
  begin
    perform public.mpk_submit_diagnostic_writing(v_assessment_id,'en');
    raise exception 'Review without consent accepted';
  exception when sqlstate '42501' then null;
  end;
  perform public.mpk_set_ai_feedback_consent('2026-10-21');
  begin
    perform public.mpk_submit_diagnostic_writing(v_assessment_id,'en');
    raise exception 'Outdated consent accepted';
  exception when sqlstate '42501' then null;
  end;
  perform public.mpk_set_ai_feedback_consent('2026-10-22');
  result := public.mpk_submit_diagnostic_writing(v_assessment_id,'fr');
  v_submission_id := (result->>'id')::uuid;
  assert not private.has_ai_feedback_plan(uid), 'Fixture has no paid AI entitlement';
  assert result->>'status'='queued', 'Diagnostic feedback is available after sign-in';
  assert (select body=repeat('mot ',90) and word_count=90 and task_id='mpk-diagnostic-writing-v1' from public.writing_submissions where id=v_submission_id);
  assert public.mpk_submit_diagnostic_writing(v_assessment_id,'fr')->>'id'=v_submission_id::text, 'Idempotent request';
  perform set_config('request.jwt.claim.sub',other_uid::text,true);
  begin
    perform public.mpk_submit_diagnostic_writing(v_assessment_id,'en');
    raise exception 'Another learner accessed the sample';
  exception when sqlstate 'P0002' then null;
  end;
  perform set_config('request.jwt.claim.sub',uid::text,true);
  update public.writing_submissions set status='failed',attempts=3,error_code='test' where id=v_submission_id;
  assert public.mpk_submit_diagnostic_writing(v_assessment_id,'fr',true)->>'id'=v_submission_id::text;
  assert (select status='queued' and attempts=0 and error_code is null from public.writing_submissions where id=v_submission_id), 'Retry reuses the saved sample';
  second_assessment := (public.mpk_submit_diagnostic('writing-second','diagnostic','TEF Canada',intake,answers)->>'id')::uuid;
  third_assessment := (public.mpk_submit_diagnostic('writing-third','diagnostic','TEF Canada',intake,answers)->>'id')::uuid;
  perform public.mpk_submit_diagnostic_writing(second_assessment,'fr');
  begin
    perform public.mpk_submit_diagnostic_writing(third_assessment,'fr');
    raise exception 'Daily cap bypassed';
  exception when sqlstate '54000' then null;
  end;
  update private.ai_settings set writing_daily_limit=0;
  assert (select count(*) from public.mpk_claim_writing_jobs(1))=0, 'Global budget still applies';
  assert (select to_jsonb(r) from public.assessment_results r where r.assessment_id=v_assessment_id)=original_result, 'Feedback does not mutate quiz results';
end;
$$;
rollback;
