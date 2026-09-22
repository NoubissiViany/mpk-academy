create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger exam_goals_set_updated_at before update on public.exam_goals
for each row execute function private.set_updated_at();
create trigger mistakes_set_updated_at before update on public.mistakes
for each row execute function private.set_updated_at();
create trigger skill_scores_set_updated_at before update on public.skill_scores
for each row execute function private.set_updated_at();
create trigger learner_progress_set_updated_at before update on public.learner_progress
for each row execute function private.set_updated_at();
create trigger lesson_progress_set_updated_at before update on public.lesson_progress
for each row execute function private.set_updated_at();
create trigger purchases_set_updated_at before update on public.purchases
for each row execute function private.set_updated_at();
create trigger entitlements_set_updated_at before update on public.entitlements
for each row execute function private.set_updated_at();

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
  );

  insert into public.exam_goals (user_id, exam, target)
  values (new.id, selected_exam, selected_target);

  insert into public.learner_progress (user_id, exam)
  values (new.id, selected_exam);

  foreach skill_name in array array['reading', 'listening', 'writing', 'speaking'] loop
    insert into public.skill_scores (user_id, exam, skill)
    values (new.id, selected_exam, skill_name);
  end loop;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'exam_goals', 'assessments', 'assessment_answers', 'assessment_results',
    'practice_sessions', 'practice_answers', 'mistakes', 'skill_scores', 'learner_progress',
    'progress_history', 'lesson_progress', 'purchases', 'entitlements'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select on table public.%I to authenticated', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = %I)',
      table_name || '_select_own',
      table_name,
      case when table_name in ('profiles') then 'id' else 'user_id' end
    );
  end loop;
end;
$$;

revoke all on all sequences in schema public from anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
