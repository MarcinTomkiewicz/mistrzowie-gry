alter table public.user_work_log
  drop constraint if exists user_work_log_hours_check;

alter table public.user_work_log
  drop column if exists hours;

alter table public.user_work_log
  drop column if exists legacy_hours;

alter table public.user_work_log
  add column if not exists is_chaotic_thursday boolean not null default false;

create table if not exists public.user_work_log_ranges (
  id uuid not null default gen_random_uuid (),
  work_log_id uuid not null,
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_work_log_ranges_pkey primary key (id),
  constraint user_work_log_ranges_work_log_id_fkey foreign key (work_log_id) references public.user_work_log (id) on delete cascade,
  constraint user_work_log_ranges_interval_check check (ends_at > starts_at)
) tablespace pg_default;

create index if not exists idx_user_work_log_ranges_work_log_id
  on public.user_work_log_ranges using btree (work_log_id)
  tablespace pg_default;

create index if not exists idx_user_work_log_ranges_starts_at
  on public.user_work_log_ranges using btree (starts_at)
  tablespace pg_default;
