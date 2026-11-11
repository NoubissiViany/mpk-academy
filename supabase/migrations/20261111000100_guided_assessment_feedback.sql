-- Guided diagnostics retain the first checked answer while the learner reviews
-- corrections. This is additive: schemaVersion 1 drafts without markers remain
-- valid and can acquire markers without losing their existing answers/writing.
create or replace function private.valid_diagnostic_draft(d jsonb) returns boolean
language plpgsql stable set search_path = '' as $$
declare item jsonb; pair record;
begin
  if d is null or jsonb_typeof(d) <> 'object' or octet_length(d::text) > 65536
    or d->'schemaVersion' is distinct from '1'::jsonb
    or coalesce(d->>'stage', '') not in ('intro','questions','writing')
    or jsonb_typeof(d->'contentVersion') is distinct from 'string'
    or jsonb_typeof(d->'id') is distinct from 'string'
    or coalesce(length(d->>'contentVersion'), 0) not between 1 and 100
    or jsonb_typeof(d->'questionOrder') is distinct from 'array'
    or jsonb_typeof(d->'optionOrder') is distinct from 'object'
    or jsonb_typeof(d->'answers') is distinct from 'object'
    or jsonb_typeof(d->'intake') is distinct from 'object'
    or jsonb_typeof(d->'index') is distinct from 'number'
    or coalesce(d->>'index', '') !~ '^[0-9]+$' then return false; end if;
  perform (d->>'id')::uuid;
  if d->>'id' is null or jsonb_array_length(d->'questionOrder') not between 1 and 100
    or (d->>'index')::integer < 0 or (d->>'index')::integer >= jsonb_array_length(d->'questionOrder') then return false; end if;
  if (select count(distinct x) from jsonb_array_elements_text(d->'questionOrder') x)
    <> jsonb_array_length(d->'questionOrder') then return false; end if;
  for item in select value from jsonb_array_elements(d->'questionOrder') loop
    if jsonb_typeof(item) <> 'string' or length(item #>> '{}') not between 1 and 120 then return false; end if;
  end loop;
  if (select count(*) from jsonb_object_keys(d->'optionOrder')) <> jsonb_array_length(d->'questionOrder') then return false; end if;
  for pair in select * from jsonb_each(d->'optionOrder') loop
    if not (d->'questionOrder' ? pair.key) or jsonb_typeof(pair.value) <> 'array'
      or jsonb_array_length(pair.value) > 100 then return false; end if;
    if (select count(distinct x) from jsonb_array_elements_text(pair.value) x) <> jsonb_array_length(pair.value) then return false; end if;
    for item in select value from jsonb_array_elements(pair.value) loop
      if jsonb_typeof(item) <> 'string' or length(item #>> '{}') not between 1 and 120 then return false; end if;
    end loop;
  end loop;
  for pair in select * from jsonb_each(d->'answers') loop
    if not (d->'questionOrder' ? pair.key) or jsonb_typeof(pair.value) <> 'string'
      or length(pair.value #>> '{}') > 4000 then return false; end if;
  end loop;
  if d->'intake' ? 'goal' and coalesce(d->'intake'->>'goal', '') not in ('TEF Canada','TCF Canada','Not sure yet') then return false; end if;
  if d->'intake' ? 'target' and coalesce(d->'intake'->>'target', '') not in ('NCLC 5','NCLC 7','NCLC 9+','I''m not sure') then return false; end if;
  if d->'intake' ? 'frenchExperience' and coalesce(d->'intake'->>'frenchExperience', '') not in ('I''m just starting','I know some French','I can communicate in French','I''m already comfortable in French','I''m not sure') then return false; end if;
  if d->'intake' ? 'writingSample' and (
    d->'intake'->'writingSample'->>'version' is distinct from 'mpk-diagnostic-writing-v1'
    or jsonb_typeof(d->'intake'->'writingSample'->'text') is distinct from 'string'
    or length(d->'intake'->'writingSample'->>'text') > 4000
  ) then return false; end if;
  -- Older drafts have no checkedAnswers. Newly checked values must be a
  -- submitted choice from the diagnostic bank, never a practice/mock item.
  if d->'intake' ? 'feedbackMode' and d->'intake'->'feedbackMode' is distinct from '"guided"'::jsonb then
    return false; end if;
  if d ? 'checkedAnswers' then
    if jsonb_typeof(d->'checkedAnswers') is distinct from 'object' then return false; end if;
    if d->'checkedAnswers' <> '{}'::jsonb and d->'intake'->'feedbackMode' is distinct from '"guided"'::jsonb then
      return false; end if;
    for pair in select * from jsonb_each(d->'checkedAnswers') loop
      if jsonb_typeof(pair.value) is distinct from 'string'
        or d->'answers'->pair.key is distinct from pair.value
        or not (d->'questionOrder' ? pair.key)
        or not coalesce(d->'optionOrder'->pair.key ? (pair.value #>> '{}'), false)
        or not exists(select 1 from private.question_bank q
          where q.id = pair.key and q.is_diagnostic and q.purpose = 'diagnostic'
            and q.kind = 'mcq' and (pair.value #>> '{}') = any(q.option_ids)) then
        return false;
      end if;
    end loop;
  end if;
  return true;
exception when invalid_text_representation or numeric_value_out_of_range then return false;
end;
$$;
revoke all on function private.valid_diagnostic_draft(jsonb) from public, anon, authenticated;


-- Ordinary autosaves may add checks but cannot erase them or alter the content
-- they refer to. A user-confirmed replacement uses a separate atomic RPC.
create function private.preserve_diagnostic_checks(p_existing jsonb, p_next jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select case when p_existing->'intake'->'feedbackMode' = '"guided"'::jsonb
      and p_next->'intake'->'feedbackMode' is distinct from '"guided"'::jsonb then false
    when coalesce(p_existing->'checkedAnswers', '{}'::jsonb) = '{}'::jsonb then true
    else p_existing->'contentVersion' = p_next->'contentVersion'
      and p_existing->'questionOrder' = p_next->'questionOrder'
      and p_existing->'optionOrder' = p_next->'optionOrder'
      and p_next->'intake'->'feedbackMode' = '"guided"'::jsonb
      and not exists(select 1 from jsonb_each(p_existing->'checkedAnswers') c
        where p_next->'checkedAnswers'->c.key is distinct from c.value
          or p_next->'answers'->c.key is distinct from c.value)
    end;
$$;
revoke all on function private.preserve_diagnostic_checks(jsonb,jsonb) from public, anon, authenticated;

create or replace function public.mpk_save_diagnostic_draft(p_draft jsonb, p_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_user(); existing public.diagnostic_drafts; saved public.diagnostic_drafts;
begin
  if not private.valid_diagnostic_draft(p_draft) or p_revision is null or p_revision < 0 then
    raise exception 'Invalid assessment draft' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('mpk-draft:' || uid::text, 0));
  if exists (select 1 from public.assessments where user_id = uid and guest_session_id = p_draft->>'id' and status = 'completed') then
    raise exception 'Assessment already submitted' using errcode = '40001'; end if;
  delete from public.diagnostic_drafts where user_id = uid and expires_at <= now();
  select * into existing from public.diagnostic_drafts where user_id = uid;
  if (existing.user_id is null and p_revision <> 0) or (existing.user_id is not null and
      (existing.revision <> p_revision or existing.attempt_id::text <> p_draft->>'id')) then
    raise exception 'Assessment changed on another device' using errcode = '40001'; end if;
  if existing.user_id is not null and not coalesce(private.preserve_diagnostic_checks(existing.payload, p_draft), false) then
    raise exception 'Checked assessment answers cannot change' using errcode = '22023'; end if;
  insert into public.diagnostic_drafts(user_id, attempt_id, payload, revision, updated_at, expires_at)
  values(uid, (p_draft->>'id')::uuid, p_draft - 'revision' - 'updatedAt' - 'expiresAt', p_revision + 1, now(), now() + interval '7 days')
  on conflict(user_id) do update set payload = excluded.payload, revision = excluded.revision,
    updated_at = excluded.updated_at, expires_at = excluded.expires_at
  returning * into saved;
  return saved.payload || jsonb_build_object('revision', saved.revision, 'updatedAt', saved.updated_at, 'expiresAt', saved.expires_at);
end;
$$;

create function public.mpk_replace_diagnostic_draft(p_draft jsonb, p_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_user(); existing public.diagnostic_drafts; saved public.diagnostic_drafts;
begin
  if not private.valid_diagnostic_draft(p_draft) or p_revision is null or p_revision < 0 then
    raise exception 'Invalid assessment draft' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('mpk-draft:' || uid::text, 0));
  if exists(select 1 from public.assessments where user_id = uid and guest_session_id = p_draft->>'id' and status = 'completed') then
    raise exception 'Assessment already submitted' using errcode = '40001'; end if;
  select * into existing from public.diagnostic_drafts where user_id = uid and expires_at > now();
  if (existing.user_id is null and p_revision <> 0) or (existing.user_id is not null and existing.revision <> p_revision) then
    raise exception 'Assessment changed on another device' using errcode = '40001'; end if;
  insert into public.diagnostic_drafts(user_id, attempt_id, payload, revision, updated_at, expires_at)
  values(uid, (p_draft->>'id')::uuid, p_draft - 'revision' - 'updatedAt' - 'expiresAt', p_revision + 1, now(), now() + interval '7 days')
  on conflict(user_id) do update set attempt_id = excluded.attempt_id, payload = excluded.payload,
    revision = excluded.revision, updated_at = excluded.updated_at, expires_at = excluded.expires_at
  returning * into saved;
  return saved.payload || jsonb_build_object('revision', saved.revision, 'updatedAt', saved.updated_at, 'expiresAt', saved.expires_at);
end;
$$;
revoke all on function public.mpk_replace_diagnostic_draft(jsonb,integer) from public, anon;
grant execute on function public.mpk_replace_diagnostic_draft(jsonb,integer) to authenticated;

-- Also protect the historical submission RPC, which remains available for old
-- completed guest claims. Calling it cannot bypass a matching draft's locks.
create function private.assert_diagnostic_checked_submission(p_attempt text, p_intake jsonb, p_answers jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_user(); existing public.diagnostic_drafts; checked record;
begin
  if p_intake ? 'feedbackMode' and p_intake->'feedbackMode' is distinct from '"guided"'::jsonb then
    raise exception 'Invalid assessment feedback mode' using errcode = '22023'; end if;
  select * into existing from public.diagnostic_drafts where user_id = uid and attempt_id::text = p_attempt;
  if existing.user_id is null then return; end if;
  if not private.valid_diagnostic_writing(p_intake->'writingSample') then
    raise exception 'A diagnostic writing sample of 80 to 120 words is required' using errcode = '22023'; end if;
  if existing.payload->'intake'->'feedbackMode' = '"guided"'::jsonb and p_intake->'feedbackMode' is distinct from '"guided"'::jsonb then
    raise exception 'Assessment feedback mode cannot change' using errcode = '22023'; end if;
  if coalesce(existing.payload->'checkedAnswers', '{}'::jsonb) = '{}'::jsonb then return; end if;
  if p_intake->'feedbackMode' is distinct from '"guided"'::jsonb
    or jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'Checked assessment answers cannot change' using errcode = '22023'; end if;
  for checked in select * from jsonb_each(existing.payload->'checkedAnswers') loop
    if (select count(*) from jsonb_array_elements(p_answers) a
        where a->>'question_id' = checked.key and a->'answer' = checked.value) <> 1 then
      raise exception 'Checked assessment answers cannot change' using errcode = '22023'; end if;
  end loop;
end;
$$;
revoke all on function private.assert_diagnostic_checked_submission(text,jsonb,jsonb) from public, anon, authenticated;

create or replace function public.mpk_submit_assessment(
  p_guest_session_id text, p_kind text, p_exam text, p_intake jsonb, p_answers jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := private.require_user(); submitted_result jsonb;
begin
  if p_kind = 'mock_exam' then
    raise exception 'Use the timed mock session to submit' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('mpk-draft:' || current_user_id::text, 0));
  -- Already completed attempts keep their stored score/intake on every retry.
  if p_kind = 'diagnostic' and not exists(select 1 from public.assessments
      where user_id = current_user_id and guest_session_id = p_guest_session_id and status = 'completed') then
    perform private.assert_diagnostic_checked_submission(p_guest_session_id, p_intake, p_answers);
  end if;
  submitted_result := private.submit_assessment_impl_20260924(p_guest_session_id, p_kind, p_exam, p_intake, p_answers);
  if p_kind = 'diagnostic' then
    select jsonb_build_object(
      'id', a.id, 'score', r.score, 'algorithmVersion', r.algorithm_version,
      'assessedItemCount', r.assessed_item_count, 'languageFoundation', r.language_foundation,
      'level', r.level, 'competencyScores', r.competency_scores, 'skillScores', r.skill_scores,
      'strength', r.strength, 'priority', r.priority, 'recommendedModuleId', r.recommended_module_id
    ) into submitted_result
    from public.assessments a join public.assessment_results r on r.assessment_id = a.id
    where a.id = (submitted_result->>'id')::uuid and a.user_id = current_user_id;
  end if;
  if submitted_result is null then
    raise exception 'Assessment result is unavailable' using errcode = 'P0002'; end if;
  if p_kind = 'diagnostic' then
    delete from public.diagnostic_drafts where user_id = current_user_id and attempt_id::text = p_guest_session_id;
  end if;
  return submitted_result;
end;
$$;

-- mpk_submit_diagnostic retains its writing requirement and delegates to the
-- guarded mpk_submit_assessment above. mpk_complete_diagnostic_draft retains its
-- revision check and delegates to that same path. Both preserve idempotency,
-- authoritative server scoring and transactional cleanup without new keys.
notify pgrst, 'reload schema';
