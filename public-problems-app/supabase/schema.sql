-- Supabase schema for Public Problems App
-- Run this in Supabase SQL Editor (Project -> SQL Editor -> New query)

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- Issues table
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  image_url text,
  submitter_id uuid,
  created_at timestamptz default now()
);

alter table issues add column if not exists submitter_id uuid;
alter table issues drop column if exists latitude;
alter table issues drop column if exists longitude;
create index if not exists issues_submitter_created_at_idx
  on issues (submitter_id, created_at desc);

-- Comments table
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- The browser client uses the anon key with authenticated user sessions.
-- These policies allow users to read issues and submit comments.
alter table issues enable row level security;
alter table comments enable row level security;

drop policy if exists "Anyone can read issues" on issues;
create policy "Anyone can read issues"
  on issues for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can submit issues" on issues;

-- The function makes the count-and-insert operation atomic so concurrent
-- requests cannot bypass the per-account limit. The location check currently
-- does not require or store the reporter's location.
drop function if exists submit_issue(text, text, text, text, uuid, double precision, double precision);
create or replace function submit_issue(
  p_title text,
  p_description text,
  p_category text,
  p_image_url text,
  p_submitter_id uuid
)
returns issues
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_issue issues;
begin
  if p_submitter_id is null then
    raise exception 'A submitter ID is required.';
  end if;

  if auth.uid() is null or auth.uid() <> p_submitter_id then
    raise exception 'You must be logged in to submit an issue.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_submitter_id::text, 0));

  if (
    select count(*)
    from issues
    where submitter_id = p_submitter_id
      and created_at > now() - interval '24 hours'
  ) >= 2 then
    raise exception 'You can submit only 2 issues every 24 hours.';
  end if;

  insert into issues (title, description, category, image_url, submitter_id)
  values (p_title, p_description, p_category, p_image_url, p_submitter_id)
  returning * into inserted_issue;

  return inserted_issue;
end;
$$;

revoke insert on issues from anon, authenticated;
revoke execute on function submit_issue(text, text, text, text, uuid) from anon;
grant execute on function submit_issue(text, text, text, text, uuid) to authenticated;

drop policy if exists "Anyone can read comments" on comments;
create policy "Anyone can read comments"
  on comments for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can submit comments" on comments;
create policy "Anyone can submit comments"
  on comments for insert
  to anon, authenticated
  with check (true);

-- Storage policies are required when the optional photo is uploaded.
drop policy if exists "Anyone can upload issue images" on storage.objects;
create policy "Anyone can upload issue images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'issues-images');

drop policy if exists "Anyone can read issue images" on storage.objects;
create policy "Anyone can read issue images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'issues-images');

-- Create storage bucket for images via Supabase UI: Storage -> New bucket -> name 'issues-images'

-- If you need guidance for Row Level Security (RLS) policies, see the README next to this file.
