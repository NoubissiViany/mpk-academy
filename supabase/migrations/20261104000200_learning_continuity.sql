-- Distinguish review sessions from the daily practice task.
alter table public.practice_sessions add column mode text not null default 'practice' check (mode in ('practice','review'));
create function public.mpk_submit_practice_mode(p_exam text, p_skill text, p_focus_competency text, p_duration_seconds integer, p_answers jsonb, p_mode text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_user(); result jsonb; existing_mode text; submission_key_value text;
begin
  if p_mode is null or p_mode not in ('practice','review') or (p_mode = 'review' and p_skill not in ('reading','listening')) then
    raise exception 'Invalid practice mode' using errcode = '22023'; end if;
  submission_key_value := p_answers->0->>'submission_id';
  perform pg_advisory_xact_lock(hashtextextended(uid::text || submission_key_value, 0));
  select mode into existing_mode from public.practice_sessions where user_id=uid and submission_key=submission_key_value;
  if existing_mode is not null and existing_mode <> p_mode then
    raise exception 'Submission mode cannot change on retry' using errcode='22023'; end if;
  result := public.mpk_submit_practice(p_exam, p_skill, p_focus_competency, p_duration_seconds, p_answers);
  update public.practice_sessions set mode = p_mode where id = (result->>'id')::uuid and user_id = uid;
  return result;
end;
$$;
revoke all on function public.mpk_submit_practice_mode(text,text,text,integer,jsonb,text) from public, anon;
grant execute on function public.mpk_submit_practice_mode(text,text,text,integer,jsonb,text) to authenticated;

create or replace function public.mpk_admin_beta_metrics()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with
  bounds as (
    select (now() at time zone 'America/Toronto')::date as today
  ),
  activity as (
    select * from private.learning_activity()
  ),
  funnel as (
    select f.step, f.locale,
      coalesce(sum(f.count) filter (where f.day > b.today - 7), 0)::integer as last7,
      coalesce(sum(f.count), 0)::integer as last30
    from private.funnel_daily f, bounds b
    where f.day > b.today - 30
    group by f.step, f.locale
  ),
  accounts as (
    select 'account_created' as step, p.locale,
      count(*) filter (where (p.created_at at time zone 'America/Toronto')::date > b.today - 7)::integer as last7,
      count(*)::integer as last30
    from public.profiles p, bounds b
    where (p.created_at at time zone 'America/Toronto')::date > b.today - 30
    group by p.locale
  ),
  activations as (
    select 'beta_activated' as step, p.locale,
      count(*) filter (where (r.redeemed_at at time zone 'America/Toronto')::date > b.today - 7)::integer as last7,
      count(*)::integer as last30
    from private.beta_redemptions r
    join public.profiles p on p.id = r.user_id, bounds b
    where (r.redeemed_at at time zone 'America/Toronto')::date > b.today - 30
    group by p.locale
  ),
  testers as (
    select
      r.user_id,
      r.redeemed_at,
      (exists(select 1 from public.practice_sessions s where s.user_id = r.user_id and s.status = 'completed' and s.completed_at >= r.redeemed_at)
       or exists(select 1 from public.lesson_progress l where l.user_id = r.user_id and l.status = 'completed' and l.completed_at >= r.redeemed_at)) as first_learning_completed,
      u.email,
      p.first_name,
      p.locale,
      r.redeemed_at <= now() - interval '7 days' as week_eligible,
      (select max(a.at) from activity a where a.user_id = r.user_id) as last_active_at,
      (select count(distinct (a.at at time zone 'America/Toronto')::date)
         from activity a
         where a.user_id = r.user_id and a.at > now() - interval '7 days')::integer as active_days_7,
      exists (
        select 1 from activity a
        where a.user_id = r.user_id and a.at >= r.redeemed_at + interval '7 days'
      ) as returned_after_week,
      (select count(*) from public.assessments x
         where x.user_id = r.user_id and x.status = 'completed' and x.kind = 'diagnostic')::integer as diagnostics,
      (select count(*) from public.assessments x
         where x.user_id = r.user_id and x.status = 'completed' and x.kind = 'mock_exam')::integer as mock_exams,
      (select count(*) from public.practice_sessions s
         where s.user_id = r.user_id and s.status = 'completed' and s.skill in ('reading', 'listening'))::integer as practice_sessions,
      (select count(*) from public.practice_sessions s
         where s.user_id = r.user_id and s.status = 'completed' and s.skill = 'writing')::integer as writing_tasks,
      (select count(*) from public.practice_sessions s
         where s.user_id = r.user_id and s.status = 'completed' and s.skill = 'speaking')::integer as speaking_tasks,
      (select count(*) from public.lesson_progress l
         where l.user_id = r.user_id and l.status = 'completed')::integer as lessons
    from private.beta_redemptions r
    join public.profiles p on p.id = r.user_id
    join auth.users u on u.id = r.user_id
  )
  select jsonb_build_object(
    'funnel', coalesce((
      select jsonb_agg(jsonb_build_object(
        'step', rows.step, 'locale', rows.locale, 'last7', rows.last7, 'last30', rows.last30
      ))
      from (
        select step, locale, last7, last30 from funnel
        union all select step, locale, last7, last30 from accounts
        union all select step, locale, last7, last30 from activations
      ) rows
    ), '[]'::jsonb),
    'summary', jsonb_build_object(
      'activated', (select count(*) from testers),
      'firstLearningCompleted', (select count(*) from testers where first_learning_completed),
      'active7', (select count(*) from testers where active_days_7 > 0),
      'weekEligible', (select count(*) from testers where week_eligible),
      'weekReturned', (select count(*) from testers where week_eligible and returned_after_week)
    ),
    'testers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'email', t.email,
        'firstName', t.first_name,
        'locale', t.locale,
        'joinedAt', t.redeemed_at,
        'lastActiveAt', t.last_active_at,
        'activeDays7', t.active_days_7,
        'weekEligible', t.week_eligible,
        'returnedAfterWeek', t.returned_after_week,
        'diagnostics', t.diagnostics,
        'mockExams', t.mock_exams,
        'practiceSessions', t.practice_sessions,
        'writingTasks', t.writing_tasks,
        'speakingTasks', t.speaking_tasks,
        'lessons', t.lessons
      ) order by t.last_active_at desc nulls last, t.redeemed_at desc)
      from testers t
    ), '[]'::jsonb)
  );
$$;
