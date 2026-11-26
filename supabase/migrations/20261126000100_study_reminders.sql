-- Reminders use a separate Resend sending key; authentication SMTP is unchanged.
-- All email addresses, activity timestamps and delivery payloads remain private.
create table private.study_reminder_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  enabled boolean not null default true,
  time_zone text not null default 'America/Toronto',
  time_zone_source text not null default 'auto' check (time_zone_source in ('auto','manual')),
  version uuid not null default extensions.gen_random_uuid(),
  unsubscribe_version uuid not null default extensions.gen_random_uuid(),
  last_seen_at timestamptz,
  last_attempt_at timestamptz,
  goal_version uuid not null default extensions.gen_random_uuid(),
  past_exam_notified text
);
create table private.study_reminder_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  kind text not null check (kind in ('exam_update','countdown','behind','inactive')),
  local_date date not null,
  version uuid not null,
  goal_revision text,
  payload jsonb not null,
  eligibility jsonb not null,
  attempted_at timestamptz not null default now(),
  status text not null default 'sending' check (status in ('sending','retry','sent','delivered','bounced','complained','failed','cancelled','expired')),
  lease uuid not null default extensions.gen_random_uuid(),
  lease_until timestamptz not null default now() + interval '3 minutes',
  retry_at timestamptz,
  attempts integer not null default 1,
  provider_id text unique,
  error_code text,
  unique(user_id, local_date)
);
create index study_reminder_delivery_time on private.study_reminder_deliveries(attempted_at);
create table private.study_reminder_suppressions (
  email text primary key,
  reason text not null,
  created_at timestamptz not null default now()
);
create table private.study_reminder_events (
  id text primary key,
  created_at timestamptz not null default now()
);
-- This row also serializes quota reservations across overlapping workers.
create table private.study_reminder_usage (
  bucket text primary key,
  reserved integer not null default 0
);
create table private.study_reminder_control (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  pause_until timestamptz,
  pause_reason text,
  daily_budget integer not null default 50 check (daily_budget between 0 and 50),
  monthly_budget integer not null default 1500 check (monthly_budget between 0 and 1500)
);
insert into private.study_reminder_control default values;
insert into private.study_reminder_preferences(user_id) select id from public.profiles;

create function private.initialize_study_reminders() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into private.study_reminder_preferences(user_id) values(new.id) on conflict do nothing;
  return new;
end; $$;
create trigger initialize_study_reminders after insert on public.profiles
for each row execute function private.initialize_study_reminders();

-- Cancel attempts when goals change, including clearing and restoring a date.
create function private.invalidate_study_reminders() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.target_date is distinct from old.target_date
    or new.target is distinct from old.target or new.exam is distinct from old.exam then
    update private.study_reminder_preferences set version = extensions.gen_random_uuid(),
      goal_version = case when tg_op='INSERT' or new.target_date is distinct from old.target_date then extensions.gen_random_uuid() else goal_version end,
      past_exam_notified = case when tg_op='INSERT' or new.target_date is distinct from old.target_date then null else past_exam_notified end where user_id = new.user_id;
    update private.study_reminder_deliveries set status = 'cancelled' where user_id = new.user_id and status in ('sending','retry');
  end if;
  return new;
end; $$;
create trigger invalidate_study_reminders after insert or update on public.exam_goals
for each row execute function private.invalidate_study_reminders();

create function public.mpk_get_reminder_preferences() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('enabled', p.enabled, 'timeZone', p.time_zone,
    'timeZoneSource', p.time_zone_source, 'targetDate', g.target_date)
  from private.study_reminder_preferences p left join public.exam_goals g using(user_id)
  where p.user_id = private.require_user();
$$;
create function public.mpk_update_reminder_preferences(p_enabled boolean, p_time_zone text, p_manual boolean, p_target_date date, p_update_target_date boolean default true)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_user();
begin
  if p_enabled is null or p_manual is null or not exists(select 1 from pg_catalog.pg_timezone_names where name = p_time_zone) then
    raise exception 'Invalid reminder preferences' using errcode = '22023';
  end if;
  update private.study_reminder_preferences set enabled=p_enabled, time_zone=p_time_zone,
    time_zone_source=case when p_manual then 'manual' else 'auto' end,
    unsubscribe_version=case when p_enabled and not enabled then extensions.gen_random_uuid() else unsubscribe_version end,
    version=extensions.gen_random_uuid() where user_id=uid;
  update private.study_reminder_deliveries set status='cancelled' where user_id=uid and status in ('sending','retry');
  if p_update_target_date then
  insert into public.exam_goals(user_id,exam,target,target_date) values(uid,'Not sure yet','I''m not sure',p_target_date)
  on conflict(user_id) do update set target_date=excluded.target_date, updated_at=now()
  where public.exam_goals.target_date is distinct from excluded.target_date;
  end if;
  return public.mpk_get_reminder_preferences();
end; $$;
create function public.mpk_record_study_visit(p_time_zone text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_user();
begin
  update private.study_reminder_preferences set last_seen_at=now(),
    time_zone=case when time_zone_source='auto' and exists(select 1 from pg_catalog.pg_timezone_names where name=p_time_zone) then p_time_zone else time_zone end
  where user_id=uid and (last_seen_at is null or last_seen_at < now()-interval '10 minutes');
end; $$;

-- No counters or dates here depend on the candidate-query execution time, so a
-- claim can compare the entire snapshot after acquiring the quota lock.
create function private.study_reminder_context(p_user_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
 select jsonb_build_object(
  'userId',u.id,'email',lower(u.email),'firstName',p.first_name,'locale',p.locale,
  'createdAt',u.created_at,'lastActiveAt',greatest(u.created_at,u.last_sign_in_at,r.last_seen_at,a.at),
  'lastLearningAt',a.at,'enabled',r.enabled,
  'verified',u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until <= now()),
  'suppressed',exists(select 1 from private.study_reminder_suppressions s where s.email=lower(u.email)),
  'timeZone',r.time_zone,'version',r.version,'unsubscribeVersion',r.unsubscribe_version,'targetDate',g.target_date,
  'goalRevision',case when g.target_date is not null then g.target_date::text || ':' || r.goal_version::text else null end,
  'target',coalesce(g.target,'I''m not sure'),'readiness',(select round(avg(s.current_score)) from public.skill_scores s where s.user_id=u.id and s.exam=g.exam and s.skill in ('reading','listening')),
  'weekStartedAt',coalesce(lp.week_started_at,'1970-01-05'::date),'sessions',coalesce(lp.weekly_practice_sessions,0),
  'hasAccess',private.has_paid_entitlement(u.id),
  'hasDiagnostic',exists(select 1 from public.assessments x where x.user_id=u.id and x.kind='diagnostic' and x.status='completed'),
  'pastExamNotified',r.past_exam_notified,
  'attempts',coalesce((select jsonb_agg(jsonb_build_object('at',d.attempted_at,'localDate',d.local_date) order by d.attempted_at) from private.study_reminder_deliveries d where d.user_id=u.id and d.attempted_at>now()-interval '7 days'),'[]'::jsonb),
  'pending',(select jsonb_build_object('id',d.id,'kind',d.kind,'version',d.version,'goalRevision',d.goal_revision,'email',d.email,'localDate',d.local_date,'attemptedAt',d.attempted_at,'eligibility',d.eligibility)
    from private.study_reminder_deliveries d where d.user_id=u.id and d.status in ('sending','retry') order by d.attempted_at desc limit 1)
 ) from auth.users u join public.profiles p on p.id=u.id
 join private.study_reminder_preferences r on r.user_id=u.id
 left join public.exam_goals g on g.user_id=u.id
 left join public.learner_progress lp on lp.user_id=u.id and lp.exam=g.exam
 left join lateral(select max(at) at from private.learning_activity() where user_id=u.id) a on true
 where u.id=p_user_id and u.email is not null;
$$;
create function public.mpk_reminder_candidates() returns jsonb
language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(private.study_reminder_context(r.user_id) order by r.last_attempt_at nulls first, r.user_id),'[]'::jsonb)
 from private.study_reminder_preferences r where r.enabled;
$$;

create function public.mpk_claim_reminder(p_context jsonb, p_kind text, p_payload jsonb, p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
 uid uuid := (p_context->>'userId')::uuid;
 c jsonb; ctl private.study_reminder_control; d private.study_reminder_deliveries;
 local_now timestamp; active_at timestamptz; pending_id uuid; cnt integer;
begin
 select * into ctl from private.study_reminder_control where id for update;
 if not ctl.enabled or ctl.pause_until > now() then return null; end if;
 -- Preference writes take the same per-user lock as claims.
 perform 1 from private.study_reminder_preferences where user_id=uid for update;
 c := private.study_reminder_context(uid);
 if c is null or c is distinct from p_context then return null; end if;
 local_now := now() at time zone (c->>'timeZone');
 active_at := (c->>'lastActiveAt')::timestamptz;
 if not (c->>'enabled')::boolean or not (c->>'verified')::boolean or (c->>'suppressed')::boolean
    or (c->>'createdAt')::timestamptz > now()-interval '24 hours'
    or active_at > now()-interval '30 minutes'
    or local_now::time < '18:00'::time or local_now::time >= '20:00'::time then return null; end if;
 if (c->>'targetDate')::date = local_now::date then return null; end if;
 if p_kind != 'exam_update' and (((c->>'lastLearningAt')::timestamptz at time zone (c->>'timeZone'))::date=local_now::date
   or (c->>'targetDate')::date < local_now::date) then return null; end if;
 if p_kind='exam_update' and ((c->>'targetDate') is null or (c->>'targetDate')::date >= local_now::date) then return null; end if;
 pending_id := (c->'pending'->>'id')::uuid;
 if pending_id is not null then
   select * into d from private.study_reminder_deliveries where id=pending_id for update;
   if d.lease_until > now() or d.retry_at > now() then return null; end if;
   if d.local_date != local_now::date or d.attempted_at < now()-interval '2 hours' or d.attempts>=8
     or d.version::text != c->>'version' or d.goal_revision is distinct from c->>'goalRevision'
     or d.email != c->>'email' or d.kind != p_kind then
     update private.study_reminder_deliveries set status='expired' where id=d.id;
     return null;
   end if;
 else
   if p_kind='exam_update' and c->>'pastExamNotified'=c->>'goalRevision' then return null; end if;
   if exists(select 1 from private.study_reminder_deliveries where user_id=uid and
     (attempted_at > now()-interval '48 hours' or local_date=local_now::date)) then return null; end if;
   select count(*) into cnt from private.study_reminder_deliveries where user_id=uid and attempted_at > now()-interval '7 days';
   if cnt >= (case when active_at <= now()-interval '30 days' then 1 else 3 end) then return null; end if;
   if coalesce((select reserved from private.study_reminder_usage where bucket=to_char(now() at time zone 'UTC','YYYY-MM-DD')),0) >= ctl.daily_budget then return null; end if;
   if coalesce((select reserved from private.study_reminder_usage where bucket=to_char(now() at time zone 'UTC','YYYY-MM')),0) >= ctl.monthly_budget then return null; end if;
   insert into private.study_reminder_deliveries(id,user_id,email,kind,local_date,version,goal_revision,payload,eligibility)
   values(p_id,uid,c->>'email',p_kind,local_now::date,(c->>'version')::uuid,c->>'goalRevision',p_payload,jsonb_build_object('locale',c->'locale','hasAccess',c->'hasAccess','hasDiagnostic',c->'hasDiagnostic','timeZone',c->'timeZone')) returning * into d;
   insert into private.study_reminder_usage(bucket,reserved) values
     (to_char(now() at time zone 'UTC','YYYY-MM-DD'),1),(to_char(now() at time zone 'UTC','YYYY-MM'),1)
   on conflict(bucket) do update set reserved=private.study_reminder_usage.reserved+1;
   update private.study_reminder_preferences set last_attempt_at=now(),
     past_exam_notified=case when p_kind='exam_update' then c->>'goalRevision' else past_exam_notified end where user_id=uid;
 end if;
 update private.study_reminder_deliveries set status='sending',lease=extensions.gen_random_uuid(),lease_until=now()+interval '3 minutes',
   attempts=case when pending_id is null then attempts else attempts+1 end where id=d.id returning * into d;
 return jsonb_build_object('id',d.id,'lease',d.lease,'payload',d.payload);
end; $$;

create function public.mpk_reminder_send_context(p_id uuid,p_lease uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
 select private.study_reminder_context(user_id) from private.study_reminder_deliveries
 where id=p_id and lease=p_lease and status='sending' and lease_until>now()
 and (select enabled and (pause_until is null or pause_until<=now()) from private.study_reminder_control where id);
$$;
revoke all on function public.mpk_reminder_send_context(uuid,uuid) from public,anon,authenticated;
grant execute on function public.mpk_reminder_send_context(uuid,uuid) to service_role;

create function public.mpk_finish_reminder(p_id uuid,p_lease uuid,p_status text,p_provider_id text default null,p_error text default null,p_pause_until timestamptz default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if p_status not in ('sent','retry','failed') then raise exception 'Invalid outcome'; end if;
 update private.study_reminder_deliveries set status=case when status in ('sending','retry') then p_status else status end,
   provider_id=coalesce(provider_id,p_provider_id),error_code=left(p_error,100),retry_at=now()+interval '15 minutes',lease_until=now()
 where id=p_id and lease=p_lease;
 if p_error in ('daily_quota_exceeded','monthly_quota_exceeded','rate_limit_exceeded','eligibility_changed','validation_error','restricted_api_key','invalid_api_key') then
   update private.study_reminder_preferences r set past_exam_notified=null
   from private.study_reminder_deliveries d where d.id=p_id and d.lease=p_lease and d.kind='exam_update'
   and r.user_id=d.user_id and r.past_exam_notified=d.goal_revision;
 end if;
 if p_pause_until is not null then
   update private.study_reminder_control set pause_until=greatest(pause_until,p_pause_until),pause_reason=left(p_error,100) where id;
 end if;
end; $$;

create function public.mpk_unsubscribe_reminders(p_user_id uuid,p_version uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
 update private.study_reminder_preferences set enabled=false where user_id=p_user_id and unsubscribe_version=p_version;
 if not found then return false; end if;
 update private.study_reminder_deliveries set status='cancelled' where user_id=p_user_id and status in ('sending','retry');
 return true;
end; $$;

create function public.mpk_reminder_webhook(p_event_id text,p_type text,p_provider_id text,p_email text,p_delivery_id uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
 insert into private.study_reminder_events(id) values(p_event_id) on conflict do nothing;
 if not found then return; end if;
 -- Only correlate verified events with this reminder's provider id or signed tag
 -- AND recipient. This also handles webhooks arriving before the send response.
 if p_type in ('email.bounced','email.complained','email.suppressed') then
   insert into private.study_reminder_suppressions(email,reason) values(lower(p_email),p_type)
   on conflict(email) do update set reason=excluded.reason;
   update private.study_reminder_deliveries set status='cancelled' where email=lower(p_email) and status in ('sending','retry');
 end if;
 update private.study_reminder_deliveries set
   provider_id=coalesce(provider_id,p_provider_id),
   status=case
     when p_type='email.complained' then 'complained'
     when p_type in ('email.bounced','email.suppressed') and status != 'complained' then 'bounced'
     when p_type='email.delivered' and status not in ('bounced','complained') then 'delivered'
     when p_type='email.failed' and status not in ('delivered','bounced','complained') then 'failed'
     else status end,
   error_code=case when p_type in ('email.bounced','email.complained','email.suppressed','email.failed') then p_type else error_code end
 where email=lower(p_email) and (provider_id=p_provider_id or (id=p_delivery_id and provider_id is null));
end; $$;

create function public.mpk_reminder_maintenance() returns void
language plpgsql security definer set search_path = '' as $$
begin
 update private.study_reminder_deliveries d set status='expired'
 from private.study_reminder_preferences r where r.user_id=d.user_id and d.status in ('sending','retry') and
 (d.attempted_at < now()-interval '2 hours' or d.local_date != (now() at time zone r.time_zone)::date or (now() at time zone r.time_zone)::time >= '20:00'::time);
 delete from private.study_reminder_deliveries where attempted_at < now()-interval '30 days';
 delete from private.study_reminder_events where created_at < now()-interval '30 days';
end; $$;
create function public.mpk_reminder_metrics() returns jsonb
language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('enabled',c.enabled,'pauseUntil',c.pause_until,'pauseReason',c.pause_reason,
 'today',coalesce((select reserved from private.study_reminder_usage where bucket=to_char(now() at time zone 'UTC','YYYY-MM-DD')),0),
 'month',coalesce((select reserved from private.study_reminder_usage where bucket=to_char(now() at time zone 'UTC','YYYY-MM')),0),
 'counts',(select coalesce(jsonb_object_agg(status,n),'{}'::jsonb) from (select status,count(*) n from private.study_reminder_deliveries group by status) x),
 'failures',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select id,status,error_code,attempted_at from private.study_reminder_deliveries where error_code is not null order by attempted_at desc limit 10) x)) from private.study_reminder_control c where id;
$$;

revoke all on all tables in schema private from public,anon,authenticated;
revoke all on function private.initialize_study_reminders(),private.invalidate_study_reminders(),private.study_reminder_context(uuid) from public,anon,authenticated;
revoke all on function public.mpk_get_reminder_preferences(),public.mpk_update_reminder_preferences(boolean,text,boolean,date,boolean),public.mpk_record_study_visit(text) from public,anon;
grant execute on function public.mpk_get_reminder_preferences(),public.mpk_update_reminder_preferences(boolean,text,boolean,date,boolean),public.mpk_record_study_visit(text) to authenticated;
revoke all on function public.mpk_reminder_candidates(),public.mpk_claim_reminder(jsonb,text,jsonb,uuid),public.mpk_finish_reminder(uuid,uuid,text,text,text,timestamptz),public.mpk_unsubscribe_reminders(uuid,uuid),public.mpk_reminder_webhook(text,text,text,text,uuid),public.mpk_reminder_maintenance(),public.mpk_reminder_metrics() from public,anon,authenticated;
grant execute on function public.mpk_reminder_candidates(),public.mpk_claim_reminder(jsonb,text,jsonb,uuid),public.mpk_finish_reminder(uuid,uuid,text,text,text,timestamptz),public.mpk_unsubscribe_reminders(uuid,uuid),public.mpk_reminder_webhook(text,text,text,text,uuid),public.mpk_reminder_maintenance(),public.mpk_reminder_metrics() to service_role;

create function private.kick_study_reminders() returns void
language plpgsql security definer set search_path = '' as $$
declare jobs_url text; jobs_secret text;
begin
 perform public.mpk_reminder_maintenance();
 if not (select enabled from private.study_reminder_control where id) then return; end if;
 select decrypted_secret into jobs_url from vault.decrypted_secrets where name='mpk_study_reminders_url';
 select decrypted_secret into jobs_secret from vault.decrypted_secrets where name='mpk_jobs_secret';
 if jobs_url is null or jobs_secret is null then return; end if;
 perform net.http_post(url:=jobs_url,headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||jobs_secret),body:='{}'::jsonb,timeout_milliseconds:=55000);
end; $$;
revoke all on function private.kick_study_reminders() from public,anon,authenticated;
do $$ begin
 if exists(select 1 from pg_available_extensions where name='pg_cron') and exists(select 1 from pg_available_extensions where name='pg_net') then
   create extension if not exists pg_cron;
   create extension if not exists pg_net with schema extensions;
   perform cron.schedule('mpk-study-reminders','*/15 * * * *','select private.kick_study_reminders()');
 end if;
end; $$;
