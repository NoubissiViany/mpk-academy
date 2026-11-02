-- Match JavaScript whitespace token counting, including French non-breaking spaces.
create or replace function private.writing_word_count(body text)
returns integer language sql immutable set search_path='' as $$
  select count(*)::integer from regexp_split_to_table(coalesce(body,''), '[[:space:]\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+') token where token <> '';
$$;
revoke all on function private.writing_word_count(text) from public,anon,authenticated;

create or replace function private.require_writing_minimum(task_id text, body text)
returns void language plpgsql set search_path='' as $$
declare minimum integer;
begin
  select minimum_words into minimum from private.question_bank where id=task_id and kind='writing';
  if minimum is null then raise exception 'Writing requirements unavailable' using errcode='22023'; end if;
  if private.writing_word_count(body)<minimum then
    raise exception 'Writing minimum not reached' using errcode='22023', detail=minimum::text;
  end if;
end; $$;
revoke all on function private.require_writing_minimum(text,text) from public,anon,authenticated;

-- Preserve existing authorization, scoring, and idempotency behind a stricter entry point.
alter function public.mpk_submit_practice(text,text,text,integer,jsonb) rename to submit_practice_before_word_limits;
alter function public.submit_practice_before_word_limits(text,text,text,integer,jsonb) set schema private;
revoke all on function private.submit_practice_before_word_limits(text,text,text,integer,jsonb) from public,anon,authenticated;
create or replace function public.mpk_submit_practice(p_exam text,p_skill text,p_focus_competency text,p_duration_seconds integer,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare entry jsonb;
begin
  perform private.require_user();
  if p_skill='writing' then
    for entry in select value from jsonb_array_elements(p_answers) loop
      perform private.require_writing_minimum(entry->>'question_id',entry->>'answer');
    end loop;
  end if;
  return private.submit_practice_before_word_limits(p_exam,p_skill,p_focus_competency,p_duration_seconds,p_answers);
end; $$;
revoke all on function public.mpk_submit_practice(text,text,text,integer,jsonb) from public,anon;
grant execute on function public.mpk_submit_practice(text,text,text,integer,jsonb) to authenticated;

-- Short timed practice is retained without calling completion/scoring routines.
create or replace function public.mpk_save_incomplete_writing_practice(p_exam text,p_task_id text,p_body text,p_submission_id uuid,p_duration_seconds integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=private.require_user(); task private.question_bank; session_id uuid; existing_status text;
begin
  if not private.has_paid_entitlement(uid) then raise exception 'An active entitlement is required' using errcode='42501'; end if;
  select * into task from private.question_bank where id=p_task_id and kind='writing' and purpose='practice' and exam=split_part(p_exam,' ',1);
  if task.id is null or task.minimum_words is null or p_exam not in ('TEF Canada','TCF Canada')
    or p_body is null or length(p_body)>30000 or p_submission_id is null or p_duration_seconds is null
    or p_duration_seconds<task.duration_seconds or p_duration_seconds>36000
    or private.writing_word_count(p_body)>=task.minimum_words then
    raise exception 'Invalid incomplete writing attempt' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text||p_submission_id::text,0));
  select id,status into session_id,existing_status from public.practice_sessions where user_id=uid and submission_key=p_submission_id::text;
  if session_id is not null then
    if existing_status<>'abandoned' then raise exception 'Attempt already completed' using errcode='22023'; end if;
    return jsonb_build_object('id',session_id,'status','abandoned');
  end if;
  insert into public.practice_sessions(user_id,exam,skill,status,duration_seconds,question_count,correct_count,score,evidence_mode,submission_key)
  values(uid,p_exam,'writing','abandoned',p_duration_seconds,1,0,null,'self_practice',p_submission_id::text) returning id into session_id;
  insert into public.practice_answers(practice_session_id,user_id,question_id,sequence,answer,is_correct,evidence_mode)
  values(session_id,uid,p_task_id,0,p_body,null,'self_practice');
  return jsonb_build_object('id',session_id,'status','abandoned');
end; $$;
revoke all on function public.mpk_save_incomplete_writing_practice(text,text,text,uuid,integer) from public,anon;
grant execute on function public.mpk_save_incomplete_writing_practice(text,text,text,uuid,integer) to authenticated;

create or replace function public.mpk_submit_writing(
  p_exam text,
  p_task_id text,
  p_body text,
  p_locale text,
  p_checks jsonb,
  p_client_key text,
  p_parent_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := private.require_user();
  settings private.ai_settings;
  existing public.writing_submissions;
  submission_id uuid;
  words integer;
  created_today integer;
begin
  if p_exam not in ('TEF Canada', 'TCF Canada') or p_locale not in ('en', 'fr')
     or p_body is null or char_length(p_body) not between 1 and 8000
     or p_client_key is null or char_length(p_client_key) not between 1 and 100
     or p_checks is null or jsonb_typeof(p_checks) <> 'object' then
    raise exception 'Invalid writing submission' using errcode = '22023';
  end if;
  if not private.has_ai_feedback_plan(current_user_id) then
    raise exception 'AI feedback is not included in this plan' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = current_user_id and ai_feedback_consent_at is not null
  ) then
    raise exception 'AI feedback consent is required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from private.question_bank
    where id = p_task_id and kind = 'writing' and purpose = 'practice'
      and exam = split_part(p_exam, ' ', 1) and content_version = 'mpk-content-v2'
  ) then
    raise exception 'Unknown writing task' using errcode = '22023';
  end if;
  if p_parent_id is not null and not exists (
    select 1 from public.writing_submissions
    where id = p_parent_id and user_id = current_user_id and task_id = p_task_id
  ) then
    raise exception 'Unknown original essay' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('mpk-writing:' || current_user_id::text, 0));
  select * into existing from public.writing_submissions
  where user_id = current_user_id and client_key = p_client_key;
  if existing.id is not null then
    return jsonb_build_object('id', existing.id, 'status', existing.status);
  end if;

  perform private.require_writing_minimum(p_task_id,p_body);
  words := private.writing_word_count(p_body);

  select * into settings from private.ai_settings;
  select count(*) into created_today from public.writing_submissions
  where user_id = current_user_id and created_at >= private.toronto_day_start() and status <> 'failed';
  if created_today >= settings.writing_user_daily_limit then
    raise exception 'Daily writing feedback limit reached' using errcode = '54000';
  end if;

  insert into public.writing_submissions (user_id, exam, task_id, parent_id, client_key, locale, body, word_count, checks)
  values (current_user_id, p_exam, p_task_id, p_parent_id, p_client_key, p_locale, p_body, words, p_checks)
  returning id into submission_id;
  return jsonb_build_object('id', submission_id, 'status', 'queued');
end;
$$;
