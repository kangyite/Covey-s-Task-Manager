-- Convey Task Manager — Initial Schema
-- Users are managed by Supabase Auth (auth.users table)
-- We extend with a profiles table for app-level settings

create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  calendar_enabled  boolean not null default false,
  provider_token    text,
  created_at        timestamptz not null default now()
);

create type public.quadrant_enum as enum ('Q1', 'Q2', 'Q3', 'Q4');

create table public.tasks (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  title                   text not null check (char_length(title) between 1 and 255),
  description             text check (char_length(description) <= 2000),
  quadrant                quadrant_enum not null,
  deadline                timestamptz,
  urgency_threshold_days  integer check (urgency_threshold_days >= 1),
  escalated               boolean not null default false,
  pre_escalation_quadrant quadrant_enum,
  calendar_event_id       text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint urgency_requires_deadline
    check (urgency_threshold_days is null or deadline is not null)
);

create table public.completed_tasks (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  title                text not null,
  original_quadrant    quadrant_enum not null,
  deadline             timestamptz,
  completion_timestamp timestamptz not null default now(),
  calendar_event_id    text
);

-- Row Level Security

alter table public.profiles enable row level security;
create policy "Users manage own profile"
  on public.profiles for all
  using (auth.uid() = id);

alter table public.tasks enable row level security;
create policy "Users manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id);

alter table public.completed_tasks enable row level security;
create policy "Users manage own completed tasks"
  on public.completed_tasks for all
  using (auth.uid() = user_id);
