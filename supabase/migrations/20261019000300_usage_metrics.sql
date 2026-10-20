-- First-party beta metrics.
-- 1. Anonymous funnel: daily totals per step and interface language. No user
--    id, IP address, device, or cookie is stored — only a number.
-- 2. Tester engagement: derived from learning records that already exist.
-- Days are bucketed in America/Toronto time, matching the /admin display.

create table private.funnel_daily (
  day date not null,
  step text not null check (step in (
    'landing_view',
    'sample_answered',
    'diagnostic_started',
    'diagnostic_completed',
    'register_view'
  )),
  locale text not null check (locale in ('en', 'fr')),
  count integer not null default 0 check (count >= 0),
  primary key (day, step, locale)
);

create or replace function public.mpk_record_funnel_step(p_step text, p_locale text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into private.funnel_daily (day, step, locale, count)
  values ((now() at time zone 'America/Toronto')::date, p_step, p_locale, 1)
  on conflict (day, step, locale)
  do update set count = private.funnel_daily.count + 1;
$$;

-- A learning activity is a completed diagnostic, mock exam, practice session,
-- or lesson. Signing in alone is not activity.
create or replace function private.learning_activity()
returns table (user_id uuid, at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.user_id, a.completed_at from public.assessments a
  where a.status = 'completed' and a.completed_at is not null
  union all
  select s.user_id, s.completed_at from public.practice_sessions s
  where s.status = 'completed' and s.completed_at is not null
  union all
  select l.user_id, l.completed_at from public.lesson_progress l
  where l.status = 'completed' and l.completed_at is not null;
$$;

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

revoke all on function private.learning_activity() from public, anon, authenticated;
revoke all on function public.mpk_record_funnel_step(text, text) from public, anon, authenticated;
revoke all on function public.mpk_admin_beta_metrics() from public, anon, authenticated;
grant execute on function public.mpk_record_funnel_step(text, text) to service_role;
grant execute on function public.mpk_admin_beta_metrics() to service_role;
