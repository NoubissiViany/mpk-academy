-- The diagnostic's size now comes from the content (26 questions in v3)
-- instead of a fixed 20. validate_content_answers already requires every
-- current diagnostic question to be answered; this check follows it.
-- The rest of the function is unchanged from 20261002000300.
create or replace function private.submit_assessment_impl_20260924(
  p_guest_session_id text,
  p_kind text,
  p_exam text,
  p_intake jsonb,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := private.require_user();
  v_assessment_id uuid;
  matched_count integer;
  correct_count integer;
  result_score integer;
  result_level text;
  competency_result jsonb := '{}'::jsonb;
  skill_result jsonb := '{}'::jsonb;
  strongest_skill text;
  priority_skill text;
  recommended_module text;
  existing_result jsonb;
  skill_name text;
  skill_value integer;
begin
  if p_kind not in ('diagnostic', 'mock_exam') or p_exam not in ('TEF Canada', 'TCF Canada') then
    raise exception 'Invalid assessment input' using errcode = '22023';
  end if;
  if jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Answers must be an array' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text || coalesce(p_guest_session_id,''),0));
  if p_guest_session_id is not null then
    select jsonb_build_object(
      'id', a.id,
      'score', r.score,
      'level', r.level,
      'competencyScores', r.competency_scores,
      'skillScores', r.skill_scores,
      'strength', r.strength,
      'priority', r.priority,
      'recommendedModuleId', r.recommended_module_id
    )
    into existing_result
    from public.assessments a
    join public.assessment_results r on r.assessment_id = a.id
    where a.user_id = current_user_id and a.guest_session_id = p_guest_session_id;
    if existing_result is not null then
      return existing_result;
    end if;
  end if;

  perform private.validate_content_answers(p_answers, p_exam, null, case when p_kind='diagnostic' then 'diagnostic' else 'mock' end);
  with supplied as (
    select distinct x.question_id
    from jsonb_to_recordset(p_answers) as x(question_id text, sequence integer, answer text)
  )
  select count(*) into matched_count
  from supplied s
  join private.question_bank q on q.id = s.question_id
  where p_kind <> 'diagnostic' or q.is_diagnostic;

  if (p_kind = 'diagnostic' and matched_count <> (select count(*) from private.question_bank where is_diagnostic))
     or (p_kind = 'mock_exam' and matched_count < 1) then
    raise exception 'Assessment question set is incomplete or invalid' using errcode = '22023';
  end if;

  insert into public.assessments (user_id, guest_session_id, kind, exam, status, intake, completed_at)
  values (current_user_id, nullif(p_guest_session_id, ''), p_kind, p_exam, 'completed', coalesce(p_intake, '{}'::jsonb), now())
  returning id into v_assessment_id;

  insert into public.assessment_answers (assessment_id, user_id, question_id, sequence, answer, is_correct)
  select v_assessment_id, current_user_id, x.question_id, x.sequence, coalesce(x.answer, ''),
    case when q.kind <> 'mcq' or (q.skill='listening' and q.audio_status <> 'ready') then null else lower(trim(coalesce(x.answer, ''))) = lower(trim(q.correct_answer)) end
  from jsonb_to_recordset(p_answers) as x(question_id text, sequence integer, answer text)
  left join private.question_bank q on q.id = x.question_id;

  select count(*) filter (where aa.is_correct), count(*) filter (where aa.is_correct is not null)
  into correct_count, matched_count
  from public.assessment_answers aa
  where aa.assessment_id = v_assessment_id;

  result_score := round(100.0 * correct_count / greatest(matched_count, 1));
  result_level := case
    when p_kind <> 'diagnostic' then null
    when result_score >= 85 then 'C1'
    when result_score >= 70 then 'B2'
    when result_score >= 45 then 'B1'
    else 'A2'
  end;

  if p_kind = 'diagnostic' then
    with competency_totals as (
      select competency, count(*) as total, count(*) filter (where aa.is_correct) as correct
      from private.question_bank q
      cross join lateral unnest(q.competencies) competency
      left join public.assessment_answers aa on aa.assessment_id = v_assessment_id and aa.question_id = q.id
      where q.is_diagnostic and (q.skill<>'listening' or q.audio_status='ready')
      group by competency
    )
    select coalesce(jsonb_object_agg(competency, round(100.0 * correct / greatest(total, 1))), '{}'::jsonb)
    into competency_result from competency_totals;

    with skill_order(skill, ordering) as (
      values ('grammar', 1), ('vocabulary', 2), ('reading', 3), ('listening', 4), ('sentence-structure', 5), ('exam-strategy', 6)
    ), skill_totals as (
      select so.skill, so.ordering, count(q.id) as total, count(q.id) filter (where aa.is_correct) as correct
      from skill_order so
      left join private.question_bank q on q.is_diagnostic and q.diagnostic_skill = so.skill and (q.skill<>'listening' or q.audio_status='ready')
      left join public.assessment_answers aa on aa.assessment_id = v_assessment_id and aa.question_id = q.id
      group by so.skill, so.ordering
    ), scored as (
      select skill, ordering, case when total>0 then round(100.0 * correct / total)::integer else null end as score from skill_totals
    )
    select jsonb_object_agg(skill, score),
      (select skill from scored where score is not null order by score desc, ordering limit 1),
      (select skill from scored where score is not null order by score asc, ordering limit 1)
    into skill_result, strongest_skill, priority_skill
    from scored;

    recommended_module := case priority_skill
      when 'grammar' then 'grammar'
      when 'vocabulary' then 'vocabulary'
      when 'reading' then 'reading-strategies'
      when 'listening' then 'listening-strategies'
      when 'sentence-structure' then 'grammar'
      else 'exam-strategies'
    end;
  end if;

  insert into public.assessment_results (
    assessment_id, user_id, score, level, competency_scores, skill_scores,
    strength, priority, recommended_module_id, algorithm_version
  ) values (
    v_assessment_id, current_user_id, result_score, result_level, competency_result, skill_result,
    strongest_skill, priority_skill, recommended_module, case when p_kind='diagnostic' then 'mpk-diagnostic-v2' else 'mpk-mock-v2' end
  );

  update public.assessments set content_version='mpk-content-v2' where id=v_assessment_id;
  update public.assessment_answers aa set evidence_mode=case when q.kind<>'mcq' then 'self_practice' when q.skill='listening' and q.audio_status<>'ready' then 'transcript' else 'objective' end from private.question_bank q where aa.assessment_id=v_assessment_id and q.id=aa.question_id;
  update public.assessment_results set assessed_item_count=matched_count,
    language_foundation=(select round(100.0*count(*) filter(where aa.is_correct)/nullif(count(*),0)) from public.assessment_answers aa join private.question_bank q on q.id=aa.question_id where aa.assessment_id=v_assessment_id and q.skill in ('grammar','vocabulary'))
  where assessment_id=v_assessment_id;
  insert into public.learner_progress (user_id, exam)
  values (current_user_id, p_exam)
  on conflict (user_id, exam) do nothing;

  if p_kind = 'diagnostic' then
    update public.learner_progress
    set diagnostic_score = result_score,
        readiness_source = 'diagnostic',
        readiness_baseline_30_days = coalesce(readiness_baseline_30_days, result_score),
        readiness = result_score,
        competency_scores = competency_result
    where user_id = current_user_id and exam = p_exam;

    foreach skill_name in array array['reading', 'listening'] loop
      skill_value := (skill_result ->> skill_name)::integer;
      if skill_value is null then continue; end if;
      insert into public.skill_scores (user_id, exam, skill, baseline_30_days, current_score, attempts, last_practiced_at)
      values (current_user_id, p_exam, skill_name, skill_value, skill_value, 1, now())
      on conflict (user_id, exam, skill) do update
      set baseline_30_days = coalesce(public.skill_scores.baseline_30_days, excluded.current_score),
          current_score = excluded.current_score,
          attempts = public.skill_scores.attempts + 1,
          last_practiced_at = now();
    end loop;
  else
    foreach skill_name in array array['reading','listening'] loop
      select round(100.0*count(*) filter(where aa.is_correct)/nullif(count(*),0)) into skill_value
      from public.assessment_answers aa join private.question_bank q on q.id=aa.question_id
      where aa.assessment_id=v_assessment_id and q.skill=skill_name and aa.is_correct is not null;
      skill_result:=skill_result||jsonb_build_object(skill_name,skill_value);
      if skill_value is not null then
        insert into public.skill_scores(user_id,exam,skill,baseline_30_days,current_score,attempts,last_practiced_at)
        values(current_user_id,p_exam,skill_name,skill_value,skill_value,1,now())
        on conflict(user_id,exam,skill) do update set current_score=case when public.skill_scores.current_score is null then excluded.current_score else round(public.skill_scores.current_score*0.75+excluded.current_score*0.25) end,attempts=public.skill_scores.attempts+1,last_practiced_at=now();
      end if;
    end loop;
    update public.assessment_results set skill_scores=skill_result where assessment_id=v_assessment_id;
    update public.learner_progress
    set simulations_completed = simulations_completed + 1,
        simulation_average = round((simulation_average * simulations_completed + result_score)::numeric / (simulations_completed + 1)),
        mock_average = round((coalesce(mock_average, 0) * mock_attempts + result_score)::numeric / (mock_attempts + 1)),
        mock_attempts = mock_attempts + 1
    where user_id = current_user_id and exam = p_exam;
  end if;

  insert into public.progress_history (user_id, exam, event_type, source_id, label, detail, snapshot)
  values (
    current_user_id, p_exam, 'assessment', v_assessment_id,
    case when p_kind = 'diagnostic' then 'Assessment completed' else p_exam || ' mock exam' end,
    result_score || '%',
    jsonb_build_object('score', result_score, 'level', result_level, 'kind', p_kind)
  );

  return jsonb_build_object(
    'id', v_assessment_id, 'score', result_score, 'level', result_level,
    'competencyScores', competency_result, 'skillScores', skill_result,
    'strength', strongest_skill, 'priority', priority_skill,
    'recommendedModuleId', recommended_module
  );
end;
$$;

