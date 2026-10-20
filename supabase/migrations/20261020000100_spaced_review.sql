-- Spaced review of practice mistakes. A missed reading or listening item comes
-- back 1 day later; each correct answer once it is due pushes it to 3, then 7
-- days; a correct answer at the 7-day review retires it. A miss at any point
-- restarts the cycle. Answering early (before it is due) changes nothing.
--
-- A trigger on practice_answers keeps the queue in step, so every practice
-- submission path updates it without touching mpk_submit_practice.

create table public.review_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null,
  exam text not null check (exam in ('TEF Canada', 'TCF Canada')),
  skill text not null check (skill in ('reading', 'listening')),
  step smallint not null default 0 check (step between 0 and 2),
  due_at timestamptz not null,
  lapses integer not null default 1 check (lapses >= 1),
  last_answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index review_items_user_due on public.review_items (user_id, due_at);

alter table public.review_items enable row level security;
revoke all on table public.review_items from anon, authenticated;
grant select on table public.review_items to authenticated;
create policy review_items_select_own on public.review_items
  for select to authenticated using ((select auth.uid()) = user_id);

create or replace function private.schedule_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_exam text;
  session_skill text;
  queued public.review_items;
begin
  if new.is_correct is null then
    return new;
  end if;
  select ps.exam, ps.skill into session_exam, session_skill
  from public.practice_sessions ps
  where ps.id = new.practice_session_id;
  if session_skill is null or session_skill not in ('reading', 'listening') then
    return new;
  end if;

  select * into queued
  from public.review_items ri
  where ri.user_id = new.user_id and ri.question_id = new.question_id
  for update;

  if not new.is_correct then
    insert into public.review_items (user_id, question_id, exam, skill, step, due_at, lapses, last_answered_at)
    values (new.user_id, new.question_id, session_exam, session_skill, 0, now() + interval '1 day', 1, now())
    on conflict (user_id, question_id) do update
      set step = 0,
          due_at = now() + interval '1 day',
          lapses = public.review_items.lapses + 1,
          last_answered_at = now();
    update public.mistakes
    set review_status = 'reviewing', updated_at = now()
    where user_id = new.user_id and question_id = new.question_id and review_status = 'resolved';
  elsif queued.user_id is not null and queued.due_at <= now() then
    if queued.step >= 2 then
      delete from public.review_items
      where user_id = new.user_id and question_id = new.question_id;
      update public.mistakes
      set review_status = 'resolved', updated_at = now()
      where user_id = new.user_id and question_id = new.question_id and review_status <> 'resolved';
    else
      update public.review_items
      set step = queued.step + 1,
          due_at = now() + case queued.step when 0 then interval '3 days' else interval '7 days' end,
          last_answered_at = now()
      where user_id = new.user_id and question_id = new.question_id;
      update public.mistakes
      set review_status = 'reviewing', updated_at = now()
      where user_id = new.user_id and question_id = new.question_id and review_status = 'new';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.schedule_review() from public, anon, authenticated;

create trigger practice_answers_schedule_review
after insert on public.practice_answers
for each row execute function private.schedule_review();

-- Existing unresolved reading and listening mistakes join the queue at the
-- first step, due one day after the latest miss (or now, if that has passed).
insert into public.review_items (user_id, question_id, exam, skill, step, due_at, lapses, last_answered_at, created_at)
select m.user_id, m.question_id, (array_agg(m.exam order by m.created_at desc))[1],
  (array_agg(m.exam_skill order by m.created_at desc))[1], 0,
  greatest(max(m.created_at) + interval '1 day', now()), count(*)::integer, max(m.created_at), min(m.created_at)
from public.mistakes m
where m.review_status <> 'resolved'
  and m.exam in ('TEF Canada', 'TCF Canada')
  and m.exam_skill in ('reading', 'listening')
group by m.user_id, m.question_id
on conflict (user_id, question_id) do nothing;
