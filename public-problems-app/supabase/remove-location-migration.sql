-- Run this once in Supabase SQL Editor to remove the old location-gated RPC.

drop function if exists public.submit_issue(text, text, text, text, uuid, double precision, double precision);
alter table public.issues add column if not exists submitter_id uuid;
alter table public.issues drop column if exists latitude;
alter table public.issues drop column if exists longitude;

create or replace function public.submit_issue(
  p_title text,
  p_description text,
  p_category text,
  p_image_url text,
  p_submitter_id uuid
)
returns public.issues
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_issue public.issues;
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
    from public.issues
    where submitter_id = p_submitter_id
      and created_at > now() - interval '24 hours'
  ) >= 2 then
    raise exception 'You can submit only 2 issues every 24 hours.';
  end if;

  insert into public.issues (title, description, category, image_url, submitter_id)
  values (p_title, p_description, p_category, p_image_url, p_submitter_id)
  returning * into inserted_issue;

  return inserted_issue;
end;
$$;

revoke execute on function public.submit_issue(text, text, text, text, uuid) from anon;
grant execute on function public.submit_issue(text, text, text, text, uuid) to authenticated;
