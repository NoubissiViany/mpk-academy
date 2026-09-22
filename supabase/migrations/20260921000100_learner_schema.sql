create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.question_bank (
  id text primary key,
  correct_answer text not null,
  diagnostic_skill text not null,
  competencies text[] not null default '{}',
  explanation text not null,
  mistake_category text not null,
  is_diagnostic boolean not null default false
);

create table private.lesson_catalog (
  id text primary key,
  module_id text not null,
  is_free boolean not null default false
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 100),
  last_name text not null check (char_length(last_name) between 1 and 100),
  locale text not null default 'en' check (locale in ('en', 'fr')),
  assistance text not null default 'full' check (assistance in ('full', 'on_request', 'minimal')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exam_goals (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  exam text not null check (exam in ('TEF Canada', 'TCF Canada', 'Not sure yet')),
  target text not null check (target in ('NCLC 5', 'NCLC 7', 'NCLC 9+', 'I''m not sure')),
  target_date date,
  updated_at timestamptz not null default now()
);

create table public.assessments (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  guest_session_id text,
  kind text not null check (kind in ('diagnostic', 'mock_exam')),
  exam text not null check (exam in ('TEF Canada', 'TCF Canada')),
  status text not null default 'completed' check (status in ('in_progress', 'completed', 'abandoned')),
  intake jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, guest_session_id)
);

create table public.assessment_answers (
  id bigint generated always as identity primary key,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null,
  sequence integer not null check (sequence >= 0),
  answer text not null,
  is_correct boolean,
  answered_at timestamptz not null default now(),
  unique (assessment_id, sequence)
);

create table public.assessment_results (
  assessment_id uuid primary key references public.assessments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  level text check (level is null or level in ('A2', 'B1', 'B2', 'C1')),
  competency_scores jsonb not null default '{}'::jsonb,
  skill_scores jsonb not null default '{}'::jsonb,
  strength text,
  priority text,
  recommended_module_id text,
  algorithm_version text not null default 'v1',
  created_at timestamptz not null default now()
);

create table public.practice_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam text not null check (exam in ('TEF Canada', 'TCF Canada')),
  skill text not null check (skill in ('reading', 'listening', 'writing', 'speaking')),
  focus_competency text,
  status text not null default 'completed' check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  question_count integer not null default 0 check (question_count >= 0),
  correct_count integer not null default 0 check (correct_count >= 0 and correct_count <= question_count),
  score integer not null default 0 check (score between 0 and 100),
  created_at timestamptz not null default now()
);

create table public.practice_answers (
  id bigint generated always as identity primary key,
  practice_session_id uuid not null references public.practice_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null,
  sequence integer not null check (sequence >= 0),
  answer text not null,
  is_correct boolean,
  answered_at timestamptz not null default now(),
  unique (practice_session_id, sequence)
);

create table public.mistakes (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  practice_session_id uuid references public.practice_sessions(id) on delete cascade,
  question_id text not null,
  competency_id text not null,
  category text not null,
  learner_answer text not null,
  correct_answer text not null,
  explanation text not null,
  review_status text not null default 'new' check (review_status in ('new', 'reviewing', 'resolved')),
  exam text check (exam is null or exam in ('TEF Canada', 'TCF Canada')),
  exam_skill text check (exam_skill is null or exam_skill in ('reading', 'listening', 'writing', 'speaking')),
  pattern text,
  occurrence_count integer not null default 1 check (occurrence_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skill_scores (
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam text not null check (exam in ('TEF Canada', 'TCF Canada')),
  skill text not null check (skill in ('reading', 'listening', 'writing', 'speaking')),
  baseline_30_days integer check (baseline_30_days between 0 and 100),
  current_score integer check (current_score between 0 and 100),
  attempts integer not null default 0 check (attempts >= 0),
  last_practiced_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, exam, skill)
);

create table public.learner_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam text not null check (exam in ('TEF Canada', 'TCF Canada')),
  completed_lessons integer not null default 0 check (completed_lessons >= 0),
  course_completion integer not null default 0 check (course_completion between 0 and 100),
  quiz_average integer not null default 0 check (quiz_average between 0 and 100),
  practice_answered integer not null default 0 check (practice_answered >= 0),
  practice_accuracy integer not null default 0 check (practice_accuracy between 0 and 100),
  simulations_completed integer not null default 0 check (simulations_completed >= 0),
  simulation_average integer not null default 0 check (simulation_average between 0 and 100),
  diagnostic_score integer check (diagnostic_score between 0 and 100),
  readiness_source text check (readiness_source is null or readiness_source in ('diagnostic')),
  readiness_baseline_30_days integer check (readiness_baseline_30_days between 0 and 100),
  readiness integer check (readiness between 0 and 100),
  mock_average integer check (mock_average between 0 and 100),
  mock_attempts integer not null default 0 check (mock_attempts >= 0),
  competency_scores jsonb not null default '{}'::jsonb,
  week_started_at date not null default date_trunc('week', now() at time zone 'utc')::date,
  weekly_practice_sessions integer not null default 0,
  weekly_minutes_studied integer not null default 0,
  weekly_questions_reviewed integer not null default 0,
  weekly_readiness_change integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, exam)
);

create table public.progress_history (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam text check (exam is null or exam in ('TEF Canada', 'TCF Canada')),
  event_type text not null check (event_type in ('assessment', 'practice', 'lesson', 'profile')),
  source_id uuid,
  label text not null,
  detail text not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null,
  module_id text not null,
  status text not null default 'completed' check (status in ('in_progress', 'completed')),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.purchases (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  external_purchase_id text not null unique,
  plan_id text not null check (plan_id in ('essential', 'complete', 'intensive')),
  status text not null check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  amount_minor integer not null check (amount_minor >= 0),
  currency text not null default 'CAD' check (currency = upper(currency) and char_length(currency) = 3),
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entitlements (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  purchase_id uuid references public.purchases(id) on delete set null,
  plan_id text not null check (plan_id in ('essential', 'complete', 'intensive')),
  status text not null check (status in ('active', 'expired', 'revoked')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index assessments_user_completed_idx on public.assessments(user_id, completed_at desc);
create index assessment_answers_user_idx on public.assessment_answers(user_id, assessment_id);
create index practice_sessions_user_completed_idx on public.practice_sessions(user_id, completed_at desc);
create index practice_answers_user_idx on public.practice_answers(user_id, practice_session_id);
create index mistakes_user_status_idx on public.mistakes(user_id, review_status, created_at desc);
create index progress_history_user_created_idx on public.progress_history(user_id, created_at desc);
create index entitlements_user_active_idx on public.entitlements(user_id, status, ends_at);

insert into private.question_bank (id, correct_answer, diagnostic_skill, competencies, explanation, mistake_category, is_diagnostic) values
  ('d1', 'a', 'grammar', array['time-expressions','grammar-prepositions'], 'Depuis describes a situation that began in the past and continues now.', 'Time expression', true),
  ('d2', 'b', 'reading', array['reading-detail'], 'Exceptionnellement signals a change from the usual schedule.', 'Missed detail', true),
  ('d3', 'b', 'sentence-structure', array['connectors'], 'Pourtant introduces a contrast between two ideas.', 'Vocabulary confusion', true),
  ('d4', 'b', 'listening', array['listening-detail'], 'The key detail is the cancelled train, not the later meeting.', 'Missed detail', true),
  ('d5', 'lirais', 'grammar', array['grammar-tense'], 'An imperfect si-clause is followed by the conditional present.', 'Verb tense', true),
  ('d6', 'b', 'reading', array['reading-inference'], 'The author acknowledges benefits but repeatedly qualifies them.', 'Incorrect inference', true),
  ('d7', 'b', 'vocabulary', array['vocabulary-context'], 'In administrative French, démarche means a process or required step.', 'Vocabulary confusion', true),
  ('d8', 'b', 'reading', array['reading-main-idea'], 'The passage centers on adaptation, not disappearance or refusal.', 'Question misunderstanding', true),
  ('d9', 'b', 'grammar', array['grammar-prepositions'], 'S''inscrire à + les becomes aux.', 'Preposition', true),
  ('d10', 'b', 'listening', array['listening-main-idea'], 'The speaker''s main recommendation is to verify today.', 'Missed detail', true),
  ('d11', 'a', 'vocabulary', array['vocabulary-context'], 'In this context, joindre means to attach or include a document.', 'Vocabulary confusion', true),
  ('d12', 'b', 'sentence-structure', array['connectors'], 'Comme introduces the cause, followed by the result in a complete main clause.', 'Grammar rule', true),
  ('d13', 'b', 'exam-strategy', array['reading-detail'], 'Scanning for keywords and checking context is efficient and evidence-based.', 'Question misunderstanding', true),
  ('d14', 'b', 'exam-strategy', array['listening-main-idea'], 'Continuing to listen protects your understanding of the main idea and surrounding clues.', 'Missed detail', true),
  ('d15', 'c', 'exam-strategy', array['reading-main-idea'], 'Moving on protects time for other questions while preserving a chance to review.', 'Question misunderstanding', true),
  ('tef-listening-1', 'b', 'listening', array['listening-detail'], 'The delayed parcel is the specific reason for the call.', 'Missed detail', false),
  ('tef-listening-2', 'a', 'listening', array['listening-detail'], 'The message asks listeners to confirm attendance before Friday.', 'Missed detail', false);

insert into private.lesson_catalog (id, module_id, is_free) values
  ('grammar-1','grammar',true), ('connectors','grammar',true), ('grammar-3','grammar',true),
  ('vocabulary-1','vocabulary',true), ('vocabulary-2','vocabulary',false), ('vocabulary-3','vocabulary',false),
  ('pronunciation-1','pronunciation',false), ('pronunciation-2','pronunciation',false), ('pronunciation-3','pronunciation',false),
  ('reading-strategies-1','reading-strategies',false), ('reading-strategies-2','reading-strategies',false), ('reading-strategies-3','reading-strategies',false),
  ('listening-strategies-1','listening-strategies',false), ('listening-strategies-2','listening-strategies',false), ('listening-strategies-3','listening-strategies',false),
  ('writing-techniques-1','writing-techniques',false), ('writing-techniques-2','writing-techniques',false), ('writing-techniques-3','writing-techniques',false),
  ('speaking-techniques-1','speaking-techniques',false), ('speaking-techniques-2','speaking-techniques',false), ('speaking-techniques-3','speaking-techniques',false),
  ('exam-strategies-1','exam-strategies',false), ('exam-strategies-2','exam-strategies',false), ('exam-strategies-3','exam-strategies',false);
