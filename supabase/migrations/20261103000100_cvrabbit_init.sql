-- CVRabbit initial schema
-- Apply to the existing CRGT Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled CV' check (char_length(title) between 1 and 120),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  source_file_path text,
  source_file_name text,
  source_file_type text,
  source_file_size bigint check (source_file_size is null or source_file_size >= 0),
  extraction_status text not null default 'none'
    check (extraction_status in ('none', 'processing', 'complete', 'partial', 'failed')),
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cvs_user_updated_idx
  on public.cvs (user_id, updated_at desc);

create index if not exists cvs_updated_idx
  on public.cvs (updated_at desc);

alter table public.cvs enable row level security;

drop policy if exists "cvs_select_own" on public.cvs;
create policy "cvs_select_own"
  on public.cvs for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "cvs_insert_own" on public.cvs;
create policy "cvs_insert_own"
  on public.cvs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "cvs_update_own" on public.cvs;
create policy "cvs_update_own"
  on public.cvs for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "cvs_delete_own" on public.cvs;
create policy "cvs_delete_own"
  on public.cvs for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.touch_cv()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  new.revision = coalesce(old.revision, 0) + 1;
  return new;
end;
$$;

drop trigger if exists cvs_touch_updated_at on public.cvs;
create trigger cvs_touch_updated_at
  before update on public.cvs
  for each row execute function public.touch_cv();

-- Private bucket for the original uploaded file. Never public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cv-originals',
  'cv-originals',
  false,
  15728640,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cv_files_select_own" on storage.objects;
create policy "cv_files_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'cv-originals'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "cv_files_insert_own" on storage.objects;
create policy "cv_files_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'cv-originals'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "cv_files_update_own" on storage.objects;
create policy "cv_files_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'cv-originals'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'cv-originals'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "cv_files_delete_own" on storage.objects;
create policy "cv_files_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'cv-originals'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
