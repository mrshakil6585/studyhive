-- StudyHive: store tutoring requests in Supabase instead of the browser.
-- Builds on the existing public.requests / public.messages tables and policies.
-- Safe to re-run (idempotent).

-- ---------------------------------------------------------------------------
-- Helpers (private schema, not exposed through the API)
-- ---------------------------------------------------------------------------
create schema if not exists private;

-- Display name of the caller, or null for anonymous sessions.
create or replace function private.current_display_name()
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then null
    else coalesce(
      nullif(trim(auth.jwt() -> 'user_metadata' ->> 'display_name'), ''),
      nullif(split_part(auth.jwt() ->> 'email', '@', 1), '')
    )
  end
$$;

-- Triggers run as the calling user, so it needs to reach the helper.
-- The private schema is not exposed through the Data API.
grant usage on schema private to authenticated;
revoke execute on function private.current_display_name() from public, anon;
grant execute on function private.current_display_name() to authenticated;

-- ---------------------------------------------------------------------------
-- requests: slide context and names
-- ---------------------------------------------------------------------------
alter table public.requests
  add column if not exists slide_number integer,
  add column if not exists pdf_title text,
  add column if not exists slide_summary text,
  add column if not exists slide_text text,
  add column if not exists slide_image_path text,
  add column if not exists topics text[] not null default '{}',
  add column if not exists author_name text,
  add column if not exists tutor_name text,
  add column if not exists accepted_at timestamptz,
  add column if not exists message_count integer not null default 0;

alter table public.requests alter column student_id set default auth.uid();

alter table public.requests drop constraint if exists requests_lengths_check;
alter table public.requests add constraint requests_lengths_check check (
  length(trim(title)) between 1 and 200
  and length(trim(description)) between 1 and 2000
  and (subject is null or length(subject) <= 60)
  and (pdf_title is null or length(pdf_title) <= 300)
  and (slide_summary is null or length(slide_summary) <= 2000)
  and (slide_text is null or length(slide_text) <= 15000)
  and (slide_image_path is null or length(slide_image_path) <= 300)
  and cardinality(topics) <= 12
  and (slide_number is null or slide_number between 1 and 10000)
);

create index if not exists requests_created_at_idx on public.requests (created_at desc);
create index if not exists requests_student_id_idx on public.requests (student_id);
create index if not exists requests_tutor_id_idx on public.requests (tutor_id);
create index if not exists messages_request_id_idx on public.messages (request_id, created_at);

-- Server decides names and counters; the client can only opt in to showing its name.
create or replace function private.requests_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.author_name := case
    when new.author_name is not null then private.current_display_name()
    else null
  end;
  new.tutor_name := null;
  new.accepted_at := null;
  new.message_count := 0;
  return new;
end;
$$;

drop trigger if exists requests_before_insert on public.requests;
create trigger requests_before_insert
  before insert on public.requests
  for each row execute function private.requests_before_insert();

-- Students can delete their own requests (messages cascade).
drop policy if exists "Students can delete own requests" on public.requests;
create policy "Students can delete own requests"
  on public.requests for delete
  to authenticated
  using (student_id = (select auth.uid()));

-- Accepting requires a real account (not an anonymous session) and records the tutor name.
create or replace function public.accept_request(p_request_id uuid)
returns public.requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed public.requests;
begin
  if auth.uid() is null then
    raise exception 'You must sign in first';
  end if;

  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Sign in with an account to tutor';
  end if;

  update public.requests
  set
    tutor_id = auth.uid(),
    tutor_name = coalesce(private.current_display_name(), 'Tutor'),
    status = 'accepted',
    accepted_at = now()
  where id = p_request_id
    and status = 'open'
    and tutor_id is null
    and student_id <> auth.uid()
  returning * into claimed;

  if not found then
    raise exception 'Request is unavailable or already accepted';
  end if;

  return claimed;
end;
$$;

revoke execute on function public.accept_request(uuid) from public, anon;
grant execute on function public.accept_request(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- messages: sender name and request message count
-- ---------------------------------------------------------------------------
alter table public.messages add column if not exists sender_name text;
alter table public.messages alter column sender_id set default auth.uid();

alter table public.messages drop constraint if exists messages_length_check;
alter table public.messages add constraint messages_length_check
  check (length(content) <= 2000);

create or replace function private.messages_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.sender_name := coalesce(private.current_display_name(), 'Anonymous student');
  return new;
end;
$$;

drop trigger if exists messages_before_insert on public.messages;
create trigger messages_before_insert
  before insert on public.messages
  for each row execute function private.messages_before_insert();

-- Keeps requests.message_count in sync (runs as owner so it can bypass RLS).
create or replace function private.messages_count_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.requests set message_count = message_count + 1 where id = new.request_id;
  elsif tg_op = 'DELETE' then
    update public.requests set message_count = greatest(message_count - 1, 0) where id = old.request_id;
  end if;
  return null;
end;
$$;

drop trigger if exists messages_count_sync on public.messages;
create trigger messages_count_sync
  after insert or delete on public.messages
  for each row execute function private.messages_count_sync();

-- ---------------------------------------------------------------------------
-- Storage: slide images (public read, owners write into their own folder)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('slide-images', 'slide-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload slide images to own folder" on storage.objects;
create policy "Users upload slide images to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'slide-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users delete own slide images" on storage.objects;
create policy "Users delete own slide images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'slide-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Storage needs to read an object's row to delete it; limit that to the owner's folder.
-- (Anyone can still view images through the public URL.)
drop policy if exists "Users read own slide image rows" on storage.objects;
create policy "Users read own slide image rows"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'slide-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
