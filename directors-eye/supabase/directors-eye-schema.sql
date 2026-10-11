-- Director's Eye database setup
-- Run this in the existing Supabase project's SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.director_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled scene',
  scene_description text not null default '',
  mood text,
  location text,
  shot_type text,
  lens text,
  camera_height text,
  camera_angle numeric,
  camera_movement text,
  coverage text,
  recommendation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.director_references (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.director_projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  reference_type text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists director_projects_owner_updated_idx
  on public.director_projects(owner_id, updated_at desc);
create index if not exists director_references_project_idx
  on public.director_references(project_id, sort_order);

alter table public.director_projects enable row level security;
alter table public.director_references enable row level security;

drop policy if exists "Owners can read director projects" on public.director_projects;
create policy "Owners can read director projects"
  on public.director_projects for select
  to authenticated using (auth.uid() = owner_id);

drop policy if exists "Owners can create director projects" on public.director_projects;
create policy "Owners can create director projects"
  on public.director_projects for insert
  to authenticated with check (auth.uid() = owner_id);

drop policy if exists "Owners can update director projects" on public.director_projects;
create policy "Owners can update director projects"
  on public.director_projects for update
  to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "Owners can delete director projects" on public.director_projects;
create policy "Owners can delete director projects"
  on public.director_projects for delete
  to authenticated using (auth.uid() = owner_id);

drop policy if exists "Owners can read director references" on public.director_references;
create policy "Owners can read director references"
  on public.director_references for select
  to authenticated using (auth.uid() = owner_id);

drop policy if exists "Owners can create director references" on public.director_references;
create policy "Owners can create director references"
  on public.director_references for insert
  to authenticated with check (auth.uid() = owner_id);

drop policy if exists "Owners can delete director references" on public.director_references;
create policy "Owners can delete director references"
  on public.director_references for delete
  to authenticated using (auth.uid() = owner_id);

insert into storage.buckets (id, name, public)
values ('director-references', 'director-references', false)
on conflict (id) do nothing;

drop policy if exists "Owners can upload director references" on storage.objects;
create policy "Owners can upload director references"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'director-references' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Owners can read director references storage" on storage.objects;
create policy "Owners can read director references storage"
  on storage.objects for select to authenticated
  using (bucket_id = 'director-references' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Owners can delete director references storage" on storage.objects;
create policy "Owners can delete director references storage"
  on storage.objects for delete to authenticated
  using (bucket_id = 'director-references' and (storage.foldername(name))[1] = auth.uid()::text);
