-- Content stays authored in TypeScript. These private tables contain derived grading data.
alter table private.question_bank alter column correct_answer drop not null;
alter table private.question_bank add column exam text not null default 'legacy';
alter table private.question_bank add column skill text not null default 'legacy';
alter table private.question_bank add column kind text not null default 'mcq';
alter table private.question_bank add column purpose text not null default 'archived';
alter table private.question_bank add column option_ids text[] not null default '{}';
alter table private.question_bank add column audio_status text;
alter table private.question_bank add column content_version text not null default 'legacy';
alter table private.lesson_catalog add column exam text not null default 'legacy';
alter table private.lesson_catalog add column active boolean not null default false;
create table private.content_manifests (id text primary key, exam text not null, version text not null, manifest jsonb not null);
create table private.mock_sessions (
 id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 manifest_id text not null references private.content_manifests(id), state jsonb not null,
 assessment_id uuid references public.assessments(id) on delete cascade, updated_at timestamptz not null default now()
);
revoke all on private.content_manifests, private.mock_sessions from public, anon, authenticated;
alter table public.assessments add column content_version text not null default 'legacy';
alter table public.assessment_results add column assessed_item_count integer;
alter table public.assessment_results add column language_foundation integer;
alter table public.assessment_answers add column evidence_mode text not null default 'legacy';
alter table public.practice_answers add column evidence_mode text not null default 'legacy';
alter table public.practice_sessions add column evidence_mode text not null default 'legacy';
alter table public.practice_sessions add column submission_key text;
create unique index practice_submission_key on public.practice_sessions(user_id,submission_key) where submission_key is not null;
alter table public.practice_sessions alter column score drop not null;
alter table public.practice_sessions alter column score drop default;
alter table public.mistakes add column evidence_mode text not null default 'legacy';
alter table private.question_bank add column duration_seconds integer;
alter table private.question_bank add column preparation_seconds integer not null default 0;
alter table private.question_bank add column audio_duration integer;
