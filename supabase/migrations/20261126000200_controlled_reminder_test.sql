-- Allow an explicitly allowlisted operational test outside the scheduled window.
-- The application verifies its deployment allowlist; this RPC remains service-only.
drop function public.mpk_claim_reminder(jsonb,text,jsonb,uuid);

create function public.mpk_claim_reminder(p_context jsonb, p_kind text, p_payload jsonb, p_id uuid, p_controlled_recipient text default null) returns jsonb
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
 -- Only the protected worker may request an explicitly addressed controlled test.
 -- All checks except the delivery-hour window remain in force.
 if p_controlled_recipient is not null and lower(trim(p_controlled_recipient)) is distinct from c->>'email' then return null; end if;
 if not (c->>'enabled')::boolean or not (c->>'verified')::boolean or (c->>'suppressed')::boolean
    or (c->>'createdAt')::timestamptz > now()-interval '24 hours'
    or active_at > now()-interval '30 minutes'
    or (p_controlled_recipient is null and (local_now::time < '18:00'::time or local_now::time >= '20:00'::time)) then return null; end if;
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

revoke all on function public.mpk_claim_reminder(jsonb,text,jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.mpk_claim_reminder(jsonb,text,jsonb,uuid,text) to service_role;
