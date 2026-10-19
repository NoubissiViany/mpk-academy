-- Strict set validation shared by scoring RPCs. Private historical content is retained.
create or replace function private.validate_content_answers(p_answers jsonb,p_exam text,p_skill text,p_purpose text)
returns void language plpgsql set search_path='' as $$
declare total integer; expected integer;
begin
 if p_answers is null or jsonb_typeof(p_answers)<>'array' then raise exception 'Answers must be an array' using errcode='22023'; end if;
 total:=jsonb_array_length(p_answers);
 if total<1 or total>100 then raise exception 'Invalid answer count' using errcode='22023'; end if;
 if (select count(distinct x->>'question_id') from jsonb_array_elements(p_answers) x)<>total or
    (select count(distinct x->>'sequence') from jsonb_array_elements(p_answers) x)<>total then raise exception 'Duplicate answers' using errcode='22023'; end if;
 if exists(select 1 from jsonb_to_recordset(p_answers) as x(question_id text,sequence integer,answer text)
    left join private.question_bank q on q.id=x.question_id
    where q.id is null or q.purpose<>p_purpose or q.content_version<>'mpk-content-v2'
      or (q.exam<>'shared' and q.exam<>split_part(p_exam,' ',1))
      or (p_skill is not null and q.skill<>p_skill) or x.sequence is null or x.sequence<0 or x.sequence>=total
      or x.answer is null or length(x.answer)>30000
      or (q.kind='mcq' and x.answer<>'' and not(x.answer=any(q.option_ids)))
      or (p_purpose<>'mock' and x.answer='')) then raise exception 'Invalid content answers' using errcode='22023'; end if;
 if p_purpose in ('diagnostic','mock') then
   select count(*) into expected from private.question_bank where purpose=p_purpose and (p_purpose='diagnostic' or exam=split_part(p_exam,' ',1));
   if total<>expected then raise exception 'Incomplete content set' using errcode='22023'; end if;
 end if;
 if p_purpose='mock' and exists(select 1 from private.question_bank where purpose='mock' and exam=split_part(p_exam,' ',1) and skill='listening' and audio_status is distinct from 'ready') then
   raise exception 'Audio pending: full mock unavailable' using errcode='55000';
 end if;
end; $$;
revoke all on function private.validate_content_answers(jsonb,text,text,text) from public,anon,authenticated;
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

  if (p_kind = 'diagnostic' and matched_count <> 20) or (p_kind = 'mock_exam' and matched_count < 1) then
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


create or replace function public.mpk_submit_practice(
  p_exam text,
  p_skill text,
  p_focus_competency text,
  p_duration_seconds integer,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := private.require_user();
  v_session_id uuid;
  matched_count integer;
  correct_count integer;
  result_score integer;
  evidence text;
  submission_key_value text;
  existing_result jsonb;
  week_start date := date_trunc('week', now() at time zone 'utc')::date;
begin
  if p_exam not in ('TEF Canada', 'TCF Canada')
     or p_skill not in ('reading', 'listening', 'writing', 'speaking')
     or coalesce(p_duration_seconds, 0) < 0
     or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Invalid practice input' using errcode = '22023';
  end if;
  if not private.has_paid_entitlement(current_user_id) then
    raise exception 'An active entitlement is required' using errcode = '42501';
  end if;

  perform private.validate_content_answers(p_answers,p_exam,p_skill,'practice');
  submission_key_value := p_answers->0->>'submission_id';
  if submission_key_value is null or length(submission_key_value)>100 then raise exception 'Submission ID required' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text || submission_key_value,0));
  select jsonb_build_object('id',ps.id,'score',ps.score,'questionCount',ps.question_count,'correctCount',ps.correct_count) into existing_result from public.practice_sessions ps where ps.user_id=current_user_id and ps.submission_key=submission_key_value;
  if existing_result is not null then return existing_result; end if;
  evidence := case when p_skill in ('writing','speaking') then 'self_practice'
    when exists(select 1 from private.question_bank q join jsonb_to_recordset(p_answers) as x(question_id text) on x.question_id=q.id where q.skill='listening' and q.audio_status<>'ready') then 'transcript' else 'objective' end;
  with supplied as (
    select x.question_id, x.sequence, coalesce(x.answer, '') as answer
    from jsonb_to_recordset(p_answers) as x(question_id text, sequence integer, answer text)
  )
  select count(*), count(*) filter (where lower(trim(s.answer)) = lower(trim(q.correct_answer)))
  into matched_count, correct_count
  from supplied s join private.question_bank q on q.id = s.question_id;

  if matched_count < 1 then
    raise exception 'Practice question set is invalid' using errcode = '22023';
  end if;
  result_score := case when evidence='objective' then round(100.0 * correct_count / matched_count) else null end;

  insert into public.practice_sessions (
    user_id, exam, skill, focus_competency, status, completed_at, duration_seconds,
    question_count, correct_count, score
  ) values (
    current_user_id, p_exam, p_skill, nullif(p_focus_competency, ''), 'completed', now(),
    p_duration_seconds, matched_count, correct_count, result_score
  ) returning id into v_session_id;

  update public.practice_sessions set evidence_mode=evidence,submission_key=submission_key_value where id=v_session_id;
  insert into public.practice_answers (practice_session_id, user_id, question_id, sequence, answer, is_correct)
  select v_session_id, current_user_id, x.question_id, x.sequence, coalesce(x.answer, ''),
    lower(trim(coalesce(x.answer, ''))) = lower(trim(q.correct_answer))
  from jsonb_to_recordset(p_answers) as x(question_id text, sequence integer, answer text)
  join private.question_bank q on q.id = x.question_id;

  update public.practice_answers set evidence_mode=evidence where practice_session_id=v_session_id;
  insert into public.mistakes (
    user_id, practice_session_id, question_id, competency_id, category, learner_answer,
    correct_answer, explanation, exam, exam_skill, pattern
  )
  select current_user_id, v_session_id, pa.question_id, q.competencies[1], q.mistake_category,
    pa.answer, q.correct_answer, q.explanation, p_exam, p_skill, case when evidence='transcript' then 'Transcript exercise · ' || q.competencies[1] else q.competencies[1] end
  from public.practice_answers pa
  join private.question_bank q on q.id = pa.question_id
  where pa.practice_session_id = v_session_id and not pa.is_correct;

  insert into public.learner_progress (user_id, exam)
  values (current_user_id, p_exam)
  on conflict (user_id, exam) do nothing;

  update public.mistakes set evidence_mode=evidence where practice_session_id=v_session_id;
  if evidence='objective' then
  update public.learner_progress
  set practice_accuracy = round((practice_accuracy * practice_answered + correct_count * 100)::numeric / (practice_answered + matched_count)),
      practice_answered = practice_answered + matched_count,
      week_started_at = week_start,
      weekly_practice_sessions = case when week_started_at = week_start then weekly_practice_sessions + 1 else 1 end,
      weekly_minutes_studied = case when week_started_at = week_start then weekly_minutes_studied + round(p_duration_seconds / 60.0) else round(p_duration_seconds / 60.0) end,
      weekly_questions_reviewed = case when week_started_at = week_start then weekly_questions_reviewed + matched_count else matched_count end,
      weekly_readiness_change = case when week_started_at = week_start then weekly_readiness_change else 0 end
  where user_id = current_user_id and exam = p_exam;

  insert into public.skill_scores (user_id, exam, skill, baseline_30_days, current_score, attempts, last_practiced_at)
  values (current_user_id, p_exam, p_skill, result_score, result_score, 1, now())
  on conflict (user_id, exam, skill) do update
  set baseline_30_days = coalesce(public.skill_scores.baseline_30_days, public.skill_scores.current_score, excluded.current_score),
      current_score = case when public.skill_scores.current_score is null then excluded.current_score
        else round(public.skill_scores.current_score * 0.75 + excluded.current_score * 0.25) end,
      attempts = public.skill_scores.attempts + 1,
      last_practiced_at = now();

  else
    update public.learner_progress set week_started_at=week_start,
      weekly_practice_sessions=case when week_started_at=week_start then weekly_practice_sessions+1 else 1 end,
      weekly_minutes_studied=case when week_started_at=week_start then weekly_minutes_studied+round(p_duration_seconds/60.0) else round(p_duration_seconds/60.0) end
    where user_id=current_user_id and exam=p_exam;
  end if;
  insert into public.progress_history (user_id, exam, event_type, source_id, label, detail, snapshot)
  values (
    current_user_id, p_exam, 'practice', v_session_id, p_exam || ' ' || initcap(p_skill) || ' practice',
    case when result_score is null then evidence || ' completed — not scored' else result_score || '% practice accuracy' end, jsonb_build_object('score', result_score, 'questions', matched_count, 'correct', correct_count)
  );

  return jsonb_build_object('id', v_session_id, 'score', result_score, 'questionCount', matched_count, 'correctCount', correct_count);
end;
$$;
create or replace function public.mpk_submit_assessment(
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
  submitted_result jsonb;
begin
  if p_kind='mock_exam' then
    raise exception 'Use the timed mock session to submit' using errcode='22023';
  end if;
  submitted_result := private.submit_assessment_impl_20260924(
    p_guest_session_id,
    p_kind,
    p_exam,
    p_intake,
    p_answers
  );

  if p_kind = 'diagnostic' then
    select jsonb_build_object(
      'id', a.id,
      'score', r.score,
      'algorithmVersion', r.algorithm_version,
      'assessedItemCount', r.assessed_item_count,
      'languageFoundation', r.language_foundation,
      'level', r.level,
      'competencyScores', r.competency_scores,
      'skillScores', r.skill_scores,
      'strength', r.strength,
      'priority', r.priority,
      'recommendedModuleId', r.recommended_module_id
    )
    into submitted_result
    from public.assessments a
    join public.assessment_results r on r.assessment_id = a.id
    where a.id = (submitted_result ->> 'id')::uuid
      and a.user_id = current_user_id;
  end if;

  if submitted_result is null then
    raise exception 'Assessment result is unavailable' using errcode = 'P0002';
  end if;
  return submitted_result;
end;
$$;

revoke all on function public.mpk_submit_assessment(text, text, text, jsonb, jsonb)
  from public, anon;
grant execute on function public.mpk_submit_assessment(text, text, text, jsonb, jsonb)
  to authenticated;

create or replace function public.mpk_complete_lesson(p_lesson_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := private.require_user();
  lesson_record private.lesson_catalog%rowtype;
  selected_exam text;
  completed_count integer;
  completion integer;
begin
  select * into lesson_record from private.lesson_catalog where id = p_lesson_id and active;
  if lesson_record.id is null then
    raise exception 'Unknown lesson' using errcode = '22023';
  end if;
  if not private.has_paid_entitlement(current_user_id) or (lesson_record.module_id='exam-strategies' and not exists(select 1 from public.entitlements where user_id=current_user_id and plan_id in ('complete','intensive') and status='active' and starts_at<=now() and (ends_at is null or ends_at>now()))) then
    raise exception 'An active entitlement is required' using errcode = '42501';
  end if;

  insert into public.lesson_progress (user_id, lesson_id, module_id, status, completed_at)
  values (current_user_id, lesson_record.id, lesson_record.module_id, 'completed', now())
  on conflict (user_id, lesson_id) do update set status = 'completed', completed_at = coalesce(public.lesson_progress.completed_at, now());

  select exam into selected_exam from public.exam_goals where user_id=current_user_id;
  if lesson_record.exam not in ('shared',split_part(selected_exam,' ',1)) then raise exception 'Wrong exam lesson' using errcode='22023'; end if;
  select count(*) into completed_count from public.lesson_progress lp join private.lesson_catalog lc on lc.id=lp.lesson_id where lp.user_id=current_user_id and lp.status='completed' and lc.active and lc.exam in ('shared',split_part(selected_exam,' ',1));
  completion:=round(100.0*completed_count/greatest((select count(*) from private.lesson_catalog where active and exam in ('shared',split_part(selected_exam,' ',1))),1));

  if selected_exam in ('TEF Canada', 'TCF Canada') then
    insert into public.learner_progress (user_id, exam, completed_lessons, course_completion)
    values (current_user_id, selected_exam, completed_count, completion)
    on conflict (user_id, exam) do update set completed_lessons = excluded.completed_lessons, course_completion = excluded.course_completion;
  end if;

  insert into public.progress_history (user_id, exam, event_type, label, detail, snapshot)
  values (current_user_id, selected_exam, 'lesson', 'Lesson completed', lesson_record.id, jsonb_build_object('lessonId', lesson_record.id, 'courseCompletion', completion));

  return jsonb_build_object('lessonId', lesson_record.id, 'courseCompletion', completion);
end;
$$;

