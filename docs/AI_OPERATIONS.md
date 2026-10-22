# AI feedback operations (writing and speaking)

Learners on the Complete plan (everyone in the closed beta) can send a writing-practice text for AI feedback. The text waits in `public.writing_submissions` and is reviewed on the server by Groq (`openai/gpt-oss-120b`, low reasoning effort, strict JSON output). The server then keeps only what the essay supports: quoted errors must appear in the text, corrections must be small edits, and the rewritten passage must come from the text. Learners see a level per criterion against their target, the main corrections, one passage rewritten, rule-based checks (length, paragraphs, tu/vous, connecting words), and a "This correction is wrong" button.

Nothing is sent before the learner agrees (`profiles.ai_feedback_consent_version` must equal `aiFeedbackNoticeVersion` in `src/config/privacy.ts`). The feature is hidden on any deployment without `GROQ_API_KEY`.

## Speaking feedback

Learners on the Complete plan can record a spoken answer to a speaking task. The browser records at about 24 kbps (0.18 MB a minute) and stops itself before 4 MB, because Vercel rejects request bodies over 4.5 MB. `/api/speaking/submit` then works in this order:

1. It checks sign-in, plan, configuration, AI consent at the current notice version, and `mpk_speaking_allowance`, before any audio is transcribed.
2. It sends the recording to Groq Whisper (`whisper-large-v3-turbo`, French, word and segment timestamps). The audio exists only in that request's memory and is never written anywhere.
3. It drops segments Whisper marks as probable silence or repetition, then computes pace (words a minute), pauses of 2 seconds or more, and the delay before the first word.
4. It stores only the transcript, those numbers, and later the feedback, through the service-role `mpk_submit_speaking`. Browsers cannot submit a transcript of their own.

Feedback is queued like writing and reviewed by `qwen/qwen3.8-27b`. It was chosen by testing on learner-like transcripts: it caught the real errors without "correcting" normal spoken French ("c'est pas", "le monde il change"), which both gpt-oss models did. It is a Groq **preview** model; if Groq withdraws or changes it, set `GROQ_SPEAKING_MODEL=openai/gpt-oss-120b` in Vercel (writing uses that model too, so they would then share its daily tokens). Verification matches quotes without case or punctuation (the transcriber's, not the learner's) and drops spelling and punctuation "fixes". A failed review can be asked for again from the kept transcript, without recording.

The page always shows the transcript ("This is what we heard"), pace and pauses, and "Pronunciation is not assessed."

**Browsers:** recording needs `MediaRecorder` (current Chrome, Edge, Firefox, Safari). Safari records AAC in MP4 and may ignore the requested bitrate; long answers then stop at the size limit and can still be sent. Learners who refuse the microphone or use an older browser get timed self-practice instead.

**Not yet:** the TEF section B interlocutor's objections played at set times, and a spoken model answer for each task. Both need generated audio (Phase 4).

## Limits and free-plan budget

| Limit                                 | Default                              | Where                                             |
| ------------------------------------- | ------------------------------------ | ------------------------------------------------- |
| Essays started per day (all learners) | 60                                   | `private.ai_settings.writing_daily_limit`         |
| Essays per learner per day            | 2 (failed reviews do not count)      | `private.ai_settings.writing_user_daily_limit`    |
| Tokens per essay                      | about 2,500–3,000                    | Shown per model in `/admin`                       |
| Groq free tier (per model)            | check your Limits page               | console.groq.com/settings/limits                  |
| Recordings per day (all learners)     | 55                                   | `private.ai_settings.speaking_daily_limit`        |
| Recordings per learner per day        | 1 (failed reviews do not count)      | `private.ai_settings.speaking_user_daily_limit`   |
| Audio transcribed per day             | 25,000 s (Whisper allows 28,800 s)   | `private.ai_settings.transcription_daily_seconds` |
| Tokens per spoken answer              | about 2,300 (Qwen, own daily budget) | Shown per model in `/admin`                       |

Days follow America/Toronto. Past the daily cap, essays stay queued and learners see "Saved — feedback tomorrow morning". On a Groq 429, the job waits for `retry-after`; a job is retried at most three times, then marked failed.

Change the caps without a deploy:

```sql
update private.ai_settings set writing_daily_limit = 60, writing_user_daily_limit = 2, updated_at = now();
update private.ai_settings set speaking_daily_limit = 55, speaking_user_daily_limit = 1, transcription_daily_seconds = 25000, updated_at = now();
```

## One-time setup per environment

### 1. Groq

1. Create a Groq account and an API key per environment (for example `mpk-production`, `mpk-staging`).
2. In **Settings → Data controls**, turn on **Zero Data Retention**. The privacy notice says it is on; do not launch AI feedback without it.
3. Check **Settings → Limits** for `openai/gpt-oss-120b`. If the daily token limit is below 200,000, lower `writing_daily_limit` so that limit ÷ 3,000 is not exceeded.

### 2. Vercel (server-only variables)

| Variable              | Value                                                             |
| --------------------- | ----------------------------------------------------------------- |
| `GROQ_API_KEY`        | The Groq key for this environment                                 |
| `JOBS_SECRET`         | At least 32 random characters, for example `openssl rand -hex 32` |
| `GROQ_WRITING_MODEL`  | Optional; defaults to `openai/gpt-oss-120b`                       |
| `GROQ_SPEAKING_MODEL` | Optional; defaults to `qwen/qwen3.8-27b` (preview)                |
| `GROQ_SPEECH_MODEL`   | Optional; defaults to `whisper-large-v3-turbo`                    |

Redeploy after setting them. `SUPABASE_SERVICE_ROLE_KEY` must also be the key of the same Supabase project.

### 3. Supabase

Push the migration (`20261021000100_writing_feedback.sql`) with `npx supabase db push` as usual. On hosted Supabase it enables `pg_cron` and `pg_net` and schedules `mpk-writing-feedback` every minute. The scheduled function calls the app only while an essay is waiting.

Then store the job URL and the same `JOBS_SECRET` in Vault, once per project (SQL editor):

```sql
-- Production project
select vault.create_secret('https://mpk-academy.vercel.app/api/jobs/run', 'mpk_jobs_url');
select vault.create_secret('<the JOBS_SECRET value>', 'mpk_jobs_secret');
```

Use `https://mpk-academy-sandbox.vercel.app/api/jobs/run` on the staging project. Without these secrets the scheduler does nothing. Essays are still reviewed right after they are sent, and again while the learner keeps the feedback page open; only essays left waiting rely on the scheduler.

To rotate the secret, change it in Vercel and then in Vault:

```sql
select vault.update_secret(id, '<new secret>') from vault.secrets where name = 'mpk_jobs_secret';
```

Check that the scheduler runs:

```sql
select jobname, schedule, active from cron.job where jobname = 'mpk-writing-feedback';
select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
select status_code, created from net._http_response order by created desc limit 5;
```

## Monitoring

`/admin` → **AI writing feedback** shows essays started today against the cap, the queue, tokens today against 200,000, failures, and corrections flagged as wrong in the last 30 days. Failures and provider errors are also in **Recent server errors** (no essay text is logged).

Read flagged corrections before each weekly review:

```sql
select f.created_at, s.task_id, f.fix_index, s.feedback->'fixes'->f.fix_index as fix, f.note
from public.writing_feedback_flags f join public.writing_submissions s on s.id = f.submission_id
order by f.created_at desc limit 50;
```

## Calibration (before trusting the levels)

1. With learners' agreement, pick 40 reviewed essays across both exams and all targets.
2. A qualified French teacher grades each criterion (task, coherence, vocabulary, grammar) on the same A2–C1 scale, without seeing the AI levels.
3. For each criterion, report exact agreement and agreement within one level. Aim for at least 60% exact and 90% within one before showing levels as anything more than rough guidance.
4. Keep the results in the repository (`docs/calibration/`) and adjust the prompt or the target bars if a criterion is consistently off.

## Privacy duties

- Changing the provider, the data sent, or retention means updating the AI section of the privacy notice and bumping `aiFeedbackNoticeVersion`; learners are then asked again.
- Learners can withdraw agreement in Settings. Deletion requests: `delete from public.writing_submissions where user_id = '<uuid>'; delete from public.speaking_submissions where user_id = '<uuid>';` (flags are removed with them). No audio is ever stored, so there is none to delete.
