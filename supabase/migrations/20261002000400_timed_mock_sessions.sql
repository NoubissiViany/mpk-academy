-- Deadlines and navigation are authoritative in the database, never supplied by the browser.
create or replace function private.mock_position(s jsonb,m jsonb,at_ms numeric,advance boolean)
returns jsonb language plpgsql set search_path='' as $$
declare sec integer:=(s->>'sectionIndex')::integer; idx integer:=(s->>'itemIndex')::integer;
 section jsonb:=m->'sections'->sec; task_seconds numeric; item_id text; slot numeric;
begin
 if advance then
   idx:=idx+1;
   if idx>=jsonb_array_length(section->'itemIds') then sec:=sec+1;idx:=0;section:=m->'sections'->sec;
     if sec>=jsonb_array_length(m->'sections') then return s||jsonb_build_object('status','completed'); end if;
     s:=s||jsonb_build_object('deadline',at_ms+(section->>'durationSeconds')::numeric*1000);
   end if;
 end if;
 item_id:=section->'itemIds'->>idx;
 select duration_seconds into task_seconds from private.question_bank where id=item_id;
 slot:=case when section->>'skill'='listening' then (section->>'durationSeconds')::numeric/jsonb_array_length(section->'itemIds')
   when (section->>'taskTimers')::boolean then task_seconds else null end;
 return s||jsonb_build_object('sectionIndex',sec,'itemIndex',idx,'taskStartedAt',at_ms,
   'taskDeadline',case when slot is null then null else least((s->>'deadline')::numeric,at_ms+slot*1000) end,'audioUntil',null);
end; $$;
revoke all on function private.mock_position(jsonb,jsonb,numeric,boolean) from public,anon,authenticated;

create or replace function public.mpk_mock_event(p_session_id uuid,p_manifest_id text,p_event jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=private.require_user(); rec private.mock_sessions%rowtype; m jsonb; s jsonb; sec jsonb;
 at_ms numeric:=floor(extract(epoch from clock_timestamp())*1000); expiry numeric; action text:=p_event->>'type';
 item_id text; q private.question_bank%rowtype; answer text; answer_rows jsonb; result jsonb; audio_end numeric; audio_granted boolean:=false;
begin
 if not exists(select 1 from public.entitlements where user_id=uid and plan_id in ('complete','intensive') and status='active' and starts_at<=now() and (ends_at is null or ends_at>now())) then raise exception 'An active entitlement is required' using errcode='42501'; end if;
 if action is null or action not in ('start','resume','answer','next','previous','play','tick') then raise exception 'Invalid event' using errcode='22023'; end if;
 if p_session_id is null then
   if action<>'start' then raise exception 'Session required' using errcode='22023'; end if;
   select manifest into m from private.content_manifests where id=p_manifest_id;
   if m is null then raise exception 'Unknown mock' using errcode='22023'; end if;
   if exists(select 1 from private.question_bank where purpose='mock' and exam=m->>'exam' and skill='listening' and audio_status is distinct from 'ready') then raise exception 'Audio pending: full mock unavailable' using errcode='55000'; end if;
   perform pg_advisory_xact_lock(hashtextextended(uid::text||p_manifest_id,0));
   select * into rec from private.mock_sessions where user_id=uid and manifest_id=p_manifest_id and state->>'status'='in_progress' order by updated_at desc limit 1 for update;
   if rec.id is null then
     s:=jsonb_build_object('status','in_progress','sectionIndex',0,'itemIndex',0,'answers','{}'::jsonb,'consumedAudio','[]'::jsonb,'deadline',at_ms+(m->'sections'->0->>'durationSeconds')::numeric*1000);
     s:=private.mock_position(s,m,at_ms,false);
     insert into private.mock_sessions(user_id,manifest_id,state) values(uid,p_manifest_id,s) returning * into rec;
   end if;
 else
   select * into rec from private.mock_sessions where id=p_session_id and user_id=uid for update;
   if rec.id is null then raise exception 'Unknown session' using errcode='42501'; end if;
   select manifest into m from private.content_manifests where id=rec.manifest_id;
 end if;
 s:=rec.state;
 if s->>'status'='completed' then return jsonb_build_object('id',rec.id,'manifestId',rec.manifest_id,'state',s,'assessmentId',rec.assessment_id,'audioGranted',audio_granted); end if;
 -- Catch up across expired tasks/sections without extending time after tab inactivity.
 loop
   exit when s->>'status'='completed';
   expiry:=least((s->>'deadline')::numeric,coalesce((s->>'taskDeadline')::numeric,(s->>'deadline')::numeric));
   exit when at_ms<expiry;
   sec:=m->'sections'->(s->>'sectionIndex')::integer;
   if expiry=(s->>'deadline')::numeric then s:=s||jsonb_build_object('itemIndex',jsonb_array_length(sec->'itemIds')-1); end if;
   s:=private.mock_position(s,m,expiry,true);
   action:='tick'; -- A stale answer cannot be applied to the newly active item.
 end loop;
 if s->>'status'<>'completed' then
   sec:=m->'sections'->(s->>'sectionIndex')::integer;
   item_id:=sec->'itemIds'->>(s->>'itemIndex')::integer;
   select * into q from private.question_bank where id=item_id;
   if action in ('answer','next','previous','play') and p_event->>'itemId' is distinct from item_id then raise exception 'Stale item' using errcode='22023'; end if;
   if action='answer' then
     answer:=p_event->>'answer';
     if answer is null or length(answer)>30000 or (q.kind='mcq' and not(answer=any(q.option_ids))) then raise exception 'Invalid answer' using errcode='22023'; end if;
     if q.skill='listening' and (not((s->'consumedAudio') ? item_id) or at_ms<coalesce((s->>'audioUntil')::numeric,at_ms+1)) then raise exception 'Listen before answering' using errcode='22023'; end if;
     if q.preparation_seconds>0 and at_ms<(s->>'taskStartedAt')::numeric+q.preparation_seconds*1000 then raise exception 'Preparation is still running' using errcode='22023'; end if;
     s:=jsonb_set(s,array['answers',item_id],to_jsonb(answer));
   elsif action='play' then
     if q.skill<>'listening' or q.audio_status<>'ready' or (s->'consumedAudio') ? item_id then raise exception 'Audio cannot be replayed' using errcode='22023'; end if;
     audio_granted:=true;
     audio_end:=at_ms+q.audio_duration*1000;
     if audio_end>(s->>'taskDeadline')::numeric then raise exception 'Audio window expired' using errcode='22023'; end if;
     s:=s||jsonb_build_object('consumedAudio',(s->'consumedAudio')||to_jsonb(item_id),'audioUntil',audio_end);
   elsif action='previous' then
     if sec->>'navigation'<>'free' or (s->>'itemIndex')::integer=0 then raise exception 'Backward navigation locked' using errcode='22023'; end if;
     s:=s||jsonb_build_object('itemIndex',(s->>'itemIndex')::integer-1);
   elsif action='next' then
     if q.skill='listening' and (not((s->'consumedAudio') ? item_id) or at_ms<coalesce((s->>'audioUntil')::numeric,at_ms+1)) then raise exception 'Listen before advancing' using errcode='22023'; end if;
     if q.skill='speaking' and at_ms<(s->>'taskStartedAt')::numeric+q.preparation_seconds*1000 then raise exception 'Preparation is still running' using errcode='22023'; end if;
     s:=private.mock_position(s,m,at_ms,true);
   end if;
 end if;
 if s->>'status'='completed' then
   select jsonb_agg(jsonb_build_object('question_id',id,'sequence',n-1,'answer',coalesce(s->'answers'->>id,'')) order by n)
   into answer_rows from (select id,row_number() over(order by section_n,item_n) n
     from jsonb_array_elements(m->'sections') with ordinality a(section,section_n)
     cross join lateral jsonb_array_elements_text(section->'itemIds') with ordinality b(id,item_n)) ordered;
   result:=private.submit_assessment_impl_20260924('mock:'||rec.id,'mock_exam',(m->>'exam')||' Canada','{}',answer_rows);
   rec.assessment_id:=(result->>'id')::uuid;
 end if;
 update private.mock_sessions set state=s,assessment_id=rec.assessment_id,updated_at=now() where id=rec.id;
 return jsonb_build_object('id',rec.id,'manifestId',rec.manifest_id,'state',s,'assessmentId',rec.assessment_id,'audioGranted',audio_granted);
end; $$;
revoke all on function public.mpk_mock_event(uuid,text,jsonb) from public,anon;
grant execute on function public.mpk_mock_event(uuid,text,jsonb) to authenticated;
