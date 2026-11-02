create or replace function private.create_mock_presentation(manifest jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare sections jsonb:='[]'; section jsonb; ids jsonb; options jsonb:='{}'; item record;
begin
  for section in select value from jsonb_array_elements(manifest->'sections') loop
    if section->>'skill' in ('reading','listening') then
      select jsonb_agg(id order by difficulty,draw) into ids from (
        select x.id,q.difficulty,random() as draw from jsonb_array_elements_text(section->'itemIds') x(id)
        join private.question_bank q on q.id=x.id
      ) shuffled;
      section:=jsonb_set(section,'{itemIds}',ids);
    end if;
    sections:=sections||jsonb_build_array(section);
    for item in select q.id,q.option_ids from jsonb_array_elements_text(section->'itemIds') x(id)
      join private.question_bank q on q.id=x.id where q.kind='mcq' loop
      select jsonb_agg(option_id order by random()) into ids from unnest(item.option_ids) option_id;
      options:=options||jsonb_build_object(item.id,ids);
    end loop;
  end loop;
  return jsonb_build_object('manifest',jsonb_set(manifest,'{sections}',sections),'optionOrder',options,'version',1);
end; $$;
revoke all on function private.create_mock_presentation(jsonb) from public,anon,authenticated;

create or replace function public.mpk_mock_event(p_session_id uuid,p_manifest_id text,p_event jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=private.require_user(); rec private.mock_sessions%rowtype; m jsonb; s jsonb; sec jsonb; presentation jsonb; writing_id text; incomplete_ids jsonb;
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
     presentation:=private.create_mock_presentation(m);
     m:=presentation->'manifest';
     s:=jsonb_build_object('status','in_progress','sectionIndex',0,'itemIndex',0,'answers','{}'::jsonb,'consumedAudio','[]'::jsonb,'deadline',at_ms+(m->'sections'->0->>'durationSeconds')::numeric*1000);
     s:=private.mock_position(s,m,at_ms,false);
     insert into private.mock_sessions(user_id,manifest_id,state,presentation) values(uid,p_manifest_id,s,presentation) returning * into rec;
   end if;
 else
   select * into rec from private.mock_sessions where id=p_session_id and user_id=uid for update;
   if rec.id is null then raise exception 'Unknown session' using errcode='42501'; end if;
   select manifest into m from private.content_manifests where id=rec.manifest_id;
 end if;
 if rec.presentation is null then
   rec.presentation:=jsonb_build_object('manifest',m,'optionOrder','{}'::jsonb,'version',1);
   update private.mock_sessions set presentation=rec.presentation where id=rec.id;
 end if;
 m:=rec.presentation->'manifest';
 s:=rec.state;
 if s->>'status'='completed' then return jsonb_build_object('id',rec.id,'manifestId',rec.manifest_id,'state',s,'assessmentId',rec.assessment_id,'audioGranted',audio_granted,'manifest',m,'optionOrder',rec.presentation->'optionOrder'); end if;
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
     if q.kind='writing' then
       if sec->>'navigation'='forward' then
         perform private.require_writing_minimum(item_id,s->'answers'->>item_id);
       elsif (s->>'itemIndex')::integer=jsonb_array_length(sec->'itemIds')-1 then
         for writing_id in select jsonb_array_elements_text(sec->'itemIds') loop
           perform private.require_writing_minimum(writing_id,s->'answers'->>writing_id);
         end loop;
       end if;
     end if;
     if q.skill='listening' and (not((s->'consumedAudio') ? item_id) or at_ms<coalesce((s->>'audioUntil')::numeric,at_ms+1)) then raise exception 'Listen before advancing' using errcode='22023'; end if;
     if q.skill='speaking' and at_ms<(s->>'taskStartedAt')::numeric+q.preparation_seconds*1000 then raise exception 'Preparation is still running' using errcode='22023'; end if;
     s:=private.mock_position(s,m,at_ms,true);
   end if;
 end if;
 if s->>'status'='completed' then
   select coalesce(jsonb_agg(writing_task.id),'[]') into incomplete_ids
   from jsonb_array_elements(m->'sections') section
   cross join lateral jsonb_array_elements_text(section->'itemIds') x(id)
   join private.question_bank writing_task on writing_task.id=x.id
   where writing_task.kind='writing' and (writing_task.minimum_words is null or private.writing_word_count(s->'answers'->>writing_task.id)<writing_task.minimum_words);
   s:=s||jsonb_build_object('incompleteWritingIds',incomplete_ids);
   select jsonb_agg(jsonb_build_object('question_id',id,'sequence',n-1,'answer',coalesce(s->'answers'->>id,'')) order by n)
   into answer_rows from (select id,row_number() over(order by section_n,item_n) n
     from jsonb_array_elements(m->'sections') with ordinality a(section,section_n)
     cross join lateral jsonb_array_elements_text(section->'itemIds') with ordinality b(id,item_n)) ordered;
   result:=private.submit_assessment_impl_20260924('mock:'||rec.id,'mock_exam',(m->>'exam')||' Canada',jsonb_build_object('incompleteWritingIds',incomplete_ids),answer_rows);
   rec.assessment_id:=(result->>'id')::uuid;
 end if;
 update private.mock_sessions set state=s,assessment_id=rec.assessment_id,updated_at=now() where id=rec.id;
 return jsonb_build_object('id',rec.id,'manifestId',rec.manifest_id,'state',s,'assessmentId',rec.assessment_id,'audioGranted',audio_granted,'manifest',m,'optionOrder',rec.presentation->'optionOrder');
end; $$;
revoke all on function public.mpk_mock_event(uuid,text,jsonb) from public,anon;
grant execute on function public.mpk_mock_event(uuid,text,jsonb) to authenticated;
