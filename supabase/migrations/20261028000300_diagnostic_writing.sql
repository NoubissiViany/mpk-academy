-- Required writing sample for the new diagnostic. Historical guest sessions
-- still use mpk_submit_assessment; their existing scores remain unchanged.
create function private.valid_diagnostic_writing(p_sample jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(
    jsonb_typeof(p_sample) = 'object'
    and p_sample->>'version' = 'mpk-diagnostic-writing-v1'
    and jsonb_typeof(p_sample->'text') = 'string'
    and char_length(p_sample->>'text') <= 4000
    and cardinality(regexp_split_to_array(btrim(regexp_replace(p_sample->>'text', '[[:space:]  ]+', ' ', 'g')), ' ')) between 80 and 120,
    false
  );
$$;
revoke all on function private.valid_diagnostic_writing(jsonb) from public, anon, authenticated;

create function public.mpk_submit_diagnostic(
  p_guest_session_id text, p_kind text, p_exam text, p_intake jsonb, p_answers jsonb
)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_user();
  if p_kind is distinct from 'diagnostic'
     or not private.valid_diagnostic_writing(p_intake->'writingSample') then
    raise exception 'A diagnostic writing sample of 80 to 120 words is required' using errcode='22023';
  end if;
  return public.mpk_submit_assessment(p_guest_session_id,p_kind,p_exam,p_intake,p_answers);
end;
$$;
revoke all on function public.mpk_submit_diagnostic(text,text,text,jsonb,jsonb) from public, anon;
grant execute on function public.mpk_submit_diagnostic(text,text,text,jsonb,jsonb) to authenticated;

-- A diagnostic review is available after sign-in, independently of a practice
-- subscription. It uses the same consent, per-user cap and global worker budget.
-- The body comes only from the learner's saved assessment, never RPC input.
create function public.mpk_submit_diagnostic_writing(
  p_assessment_id uuid, p_locale text, p_retry boolean default false
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := private.require_user();
  assessment public.assessments;
  existing public.writing_submissions;
  settings private.ai_settings;
  body text;
  words integer;
  created_today integer;
  submission_id uuid;
begin
  if p_locale is null or p_locale not in ('en','fr') then
    raise exception 'Invalid locale' using errcode='22023';
  end if;
  select * into assessment from public.assessments
    where id=p_assessment_id and user_id=uid and kind='diagnostic' and status='completed';
  if assessment.id is null then
    raise exception 'Unknown assessment' using errcode='P0002';
  end if;
  if not private.valid_diagnostic_writing(assessment.intake->'writingSample') then
    raise exception 'No valid diagnostic writing sample' using errcode='22023';
  end if;
  if not exists(select 1 from public.profiles where id=uid
    and ai_feedback_consent_at is not null and ai_feedback_consent_version='2026-10-22') then
    raise exception 'Current AI feedback consent is required' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('mpk-writing:' || uid::text,0));
  select * into existing from public.writing_submissions
    where user_id=uid and client_key='diagnostic:' || p_assessment_id::text;
  if existing.id is not null and (existing.status <> 'failed' or not coalesce(p_retry,false)) then
    return jsonb_build_object('id',existing.id,'status',existing.status);
  end if;
  select * into settings from private.ai_settings;
  select count(*) into created_today from public.writing_submissions
    where user_id=uid and created_at >= private.toronto_day_start() and status <> 'failed';
  if created_today >= settings.writing_user_daily_limit then
    raise exception 'Daily writing feedback limit reached' using errcode='54000';
  end if;
  if existing.id is not null then
    update public.writing_submissions set status='queued', attempts=0,
      not_before=now(), started_at=null, completed_at=null, error_code=null,
      created_at=clock_timestamp(), locale=p_locale
      where id=existing.id;
    return jsonb_build_object('id',existing.id,'status','queued');
  end if;
  body := assessment.intake->'writingSample'->>'text';
  words := cardinality(regexp_split_to_array(btrim(regexp_replace(body,'[[:space:]  ]+',' ','g')),' '));
  insert into public.writing_submissions(user_id,exam,task_id,client_key,locale,body,word_count)
    values(uid,assessment.exam,'mpk-diagnostic-writing-v1','diagnostic:' || p_assessment_id::text,p_locale,body,words)
    returning id into submission_id;
  return jsonb_build_object('id',submission_id,'status','queued');
end;
$$;
revoke all on function public.mpk_submit_diagnostic_writing(uuid,text,boolean) from public, anon;
grant execute on function public.mpk_submit_diagnostic_writing(uuid,text,boolean) to authenticated;
