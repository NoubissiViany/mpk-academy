create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_exam text;
  selected_target text;
  selected_locale text;
  selected_assistance text;
  skill_name text;
begin
  selected_exam := case when new.raw_user_meta_data ->> 'exam' in ('TEF Canada', 'TCF Canada')
    then new.raw_user_meta_data ->> 'exam' else 'TEF Canada' end;
  selected_target := case when new.raw_user_meta_data ->> 'target' in ('NCLC 5', 'NCLC 7', 'NCLC 9+', 'I''m not sure')
    then new.raw_user_meta_data ->> 'target' else 'I''m not sure' end;
  selected_locale := case when new.raw_user_meta_data ->> 'locale' in ('en', 'fr')
    then new.raw_user_meta_data ->> 'locale' else 'en' end;
  selected_assistance := case when new.raw_user_meta_data ->> 'assistance' in ('full', 'on_request', 'minimal')
    then new.raw_user_meta_data ->> 'assistance' else 'full' end;

  insert into public.profiles (id, first_name, last_name, locale, assistance)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), 'Learner'), 100),
    left(coalesce(trim(new.raw_user_meta_data ->> 'last_name'), ''), 100),
    selected_locale,
    selected_assistance
  )
  on conflict (id) do nothing;

  insert into public.exam_goals (user_id, exam, target)
  values (new.id, selected_exam, selected_target)
  on conflict (user_id) do nothing;

  insert into public.learner_progress (user_id, exam)
  values (new.id, selected_exam)
  on conflict (user_id, exam) do nothing;

  foreach skill_name in array array['reading', 'listening', 'writing', 'speaking'] loop
    insert into public.skill_scores (user_id, exam, skill)
    values (new.id, selected_exam, skill_name)
    on conflict (user_id, exam, skill) do nothing;
  end loop;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

insert into public.profiles (id, first_name, last_name, locale, assistance)
select
  users.id,
  left(coalesce(nullif(trim(users.raw_user_meta_data ->> 'first_name'), ''), 'Learner'), 100),
  left(coalesce(trim(users.raw_user_meta_data ->> 'last_name'), ''), 100),
  case when users.raw_user_meta_data ->> 'locale' in ('en', 'fr')
    then users.raw_user_meta_data ->> 'locale' else 'en' end,
  case when users.raw_user_meta_data ->> 'assistance' in ('full', 'on_request', 'minimal')
    then users.raw_user_meta_data ->> 'assistance' else 'full' end
from auth.users as users
on conflict (id) do nothing;

insert into public.exam_goals (user_id, exam, target)
select
  users.id,
  case when users.raw_user_meta_data ->> 'exam' in ('TEF Canada', 'TCF Canada')
    then users.raw_user_meta_data ->> 'exam' else 'TEF Canada' end,
  case when users.raw_user_meta_data ->> 'target' in ('NCLC 5', 'NCLC 7', 'NCLC 9+', 'I''m not sure')
    then users.raw_user_meta_data ->> 'target' else 'I''m not sure' end
from auth.users as users
join public.profiles as profiles on profiles.id = users.id
on conflict (user_id) do nothing;

insert into public.learner_progress (user_id, exam)
select goals.user_id, goals.exam
from public.exam_goals as goals
on conflict (user_id, exam) do nothing;

insert into public.skill_scores (user_id, exam, skill)
select goals.user_id, goals.exam, skills.skill
from public.exam_goals as goals
cross join (values ('reading'), ('listening'), ('writing'), ('speaking')) as skills(skill)
on conflict (user_id, exam, skill) do nothing;
