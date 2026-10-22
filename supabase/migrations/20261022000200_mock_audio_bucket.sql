-- Private bucket for mock-exam listening clips. It has no storage policies, so
-- only the service role can read it: the app signs a short-lived link for the
-- single play a mock session allows. Practice clips are public files instead.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('mock-audio', 'mock-audio', false, 2097152, array['audio/mpeg'])
    on conflict (id) do update
      set public = false,
          file_size_limit = excluded.file_size_limit,
          allowed_mime_types = excluded.allowed_mime_types;
  end if;
end $$;
