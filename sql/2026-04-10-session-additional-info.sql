alter table public.gm_session_templates
  add column if not exists has_ready_character_sheets boolean not null default false,
  add column if not exists allows_scenario_customization boolean not null default true;

alter table public.custom_sessions
  add column if not exists has_ready_character_sheets boolean not null default false,
  add column if not exists allows_scenario_customization boolean not null default true;

create table if not exists public.gm_session_template_languages (
  gm_session_template_id uuid not null references public.gm_session_templates(id) on delete cascade,
  language_id uuid not null references public.languages(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (gm_session_template_id, language_id)
);

create table if not exists public.custom_session_languages (
  custom_session_id uuid not null references public.custom_sessions(id) on delete cascade,
  language_id uuid not null references public.languages(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (custom_session_id, language_id)
);

create table if not exists public.gm_session_template_character_sheets (
  id uuid primary key default gen_random_uuid(),
  gm_session_template_id uuid not null references public.gm_session_templates(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_session_character_sheets (
  id uuid primary key default gen_random_uuid(),
  custom_session_id uuid not null references public.custom_sessions(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

alter table public.gm_session_template_languages enable row level security;
alter table public.custom_session_languages enable row level security;
alter table public.gm_session_template_character_sheets enable row level security;
alter table public.custom_session_character_sheets enable row level security;

drop policy if exists "gm_session_template_languages_select" on public.gm_session_template_languages;
create policy "gm_session_template_languages_select"
  on public.gm_session_template_languages
  for select
  using (true);

drop policy if exists "gm_session_template_languages_write" on public.gm_session_template_languages;
create policy "gm_session_template_languages_write"
  on public.gm_session_template_languages
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.gm_session_templates session
      where session.id = gm_session_template_id
        and session.gm_profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.gm_session_templates session
      where session.id = gm_session_template_id
        and session.gm_profile_id = auth.uid()
    )
  );

drop policy if exists "custom_session_languages_select" on public.custom_session_languages;
create policy "custom_session_languages_select"
  on public.custom_session_languages
  for select
  using (true);

drop policy if exists "custom_session_languages_write" on public.custom_session_languages;
create policy "custom_session_languages_write"
  on public.custom_session_languages
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.custom_sessions session
      where session.id = custom_session_id
        and session.gm_profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.custom_sessions session
      where session.id = custom_session_id
        and session.gm_profile_id = auth.uid()
    )
  );

drop policy if exists "gm_session_template_character_sheets_select" on public.gm_session_template_character_sheets;
create policy "gm_session_template_character_sheets_select"
  on public.gm_session_template_character_sheets
  for select
  using (true);

drop policy if exists "gm_session_template_character_sheets_write" on public.gm_session_template_character_sheets;
create policy "gm_session_template_character_sheets_write"
  on public.gm_session_template_character_sheets
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.gm_session_templates session
      where session.id = gm_session_template_id
        and session.gm_profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.gm_session_templates session
      where session.id = gm_session_template_id
        and session.gm_profile_id = auth.uid()
    )
  );

drop policy if exists "custom_session_character_sheets_select" on public.custom_session_character_sheets;
create policy "custom_session_character_sheets_select"
  on public.custom_session_character_sheets
  for select
  using (true);

drop policy if exists "custom_session_character_sheets_write" on public.custom_session_character_sheets;
create policy "custom_session_character_sheets_write"
  on public.custom_session_character_sheets
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.custom_sessions session
      where session.id = custom_session_id
        and session.gm_profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.custom_sessions session
      where session.id = custom_session_id
        and session.gm_profile_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('docs', 'docs', true)
on conflict (id) do nothing;

drop policy if exists "docs_public_read" on storage.objects;
create policy "docs_public_read"
  on storage.objects
  for select
  using (bucket_id = 'docs');

drop policy if exists "docs_authenticated_write" on storage.objects;
create policy "docs_authenticated_write"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'docs'
    and split_part(name, '/', 1) = 'sessions'
    and split_part(name, '/', 2) = auth.uid()::text
  );

drop policy if exists "docs_authenticated_delete" on storage.objects;
create policy "docs_authenticated_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'docs'
    and split_part(name, '/', 1) = 'sessions'
    and split_part(name, '/', 2) = auth.uid()::text
  );
