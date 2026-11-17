-- RetailMind: private per-user file storage + AI usage quota.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- 1) Private bucket for uploaded files (50 MB per file).
insert into storage.buckets (id, name, public, file_size_limit)
values ('datasets', 'datasets', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

-- 2) Each user can only touch files inside their own folder: <user id>/<file name>.
drop policy if exists "datasets_select_own" on storage.objects;
drop policy if exists "datasets_insert_own" on storage.objects;
drop policy if exists "datasets_update_own" on storage.objects;
drop policy if exists "datasets_delete_own" on storage.objects;

create policy "datasets_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'datasets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "datasets_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'datasets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "datasets_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'datasets' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'datasets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "datasets_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'datasets' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3) Daily AI usage counter. Only the Edge Function (service role) can touch it.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  count integer not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;  -- no policies: clients cannot read or write it

create or replace function public.consume_ai_quota(p_user uuid, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.ai_usage as u (user_id, day, count)
  values (p_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update set count = u.count + 1
    where u.count < p_limit
  returning u.count into v_count;
  return v_count is not null;
end;
$$;

revoke all on function public.consume_ai_quota(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, integer) to service_role;
