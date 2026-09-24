-- Keep browser table access read-only while repairing the hosted RPC grant.
-- The wrapper also guarantees that an idempotent retry returns the same full,
-- authoritative result as the first submission.
alter function public.mpk_submit_assessment(text, text, text, jsonb, jsonb)
  set schema private;
alter function private.mpk_submit_assessment(text, text, text, jsonb, jsonb)
  rename to submit_assessment_impl_20260924;

revoke all on function private.submit_assessment_impl_20260924(text, text, text, jsonb, jsonb)
  from public, anon, authenticated;

create function public.mpk_submit_assessment(
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
