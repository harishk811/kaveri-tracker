-- ─────────────────────────────────────────────────────────────────────────────
-- Kaveri → 70.3 Goa Tracker — Supabase schema (v2)
-- Run this in the Supabase SQL editor to enable cloud sync.
-- See README.md → "Enable Supabase (v2)" for setup steps.
-- ─────────────────────────────────────────────────────────────────────────────

-- Athletes (single-athlete app, but keep a clean owner FK)
create table if not exists public.athletes (
  id uuid primary key default auth.uid(),
  display_name text,
  body_weight_kg numeric default 75,
  created_at timestamptz default now()
);

-- Session set logs (gym)
create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.athletes(id) on delete cascade,
  session_id text not null,          -- w{week}d{day}s{slot}
  exercise_id text not null,
  set_index int not null,
  prescribed_reps text,
  actual_reps int,
  actual_weight numeric,
  rpe int check (rpe between 1 and 10),
  done boolean default false,
  note text,
  logged_at timestamptz default now()
);
create index on public.set_logs (athlete_id, session_id);

-- Run logs
create table if not exists public.run_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.athletes(id) on delete cascade,
  session_id text not null unique,
  date date not null,
  actual_distance_km numeric,
  actual_duration_sec int,
  avg_pace text,
  avg_hr int,
  max_hr int,
  avg_cadence int,
  rpe int check (rpe between 1 and 10),
  splits jsonb,
  fuel jsonb,
  heat text,
  humidity text,
  note text,
  altered boolean default false,
  altered_reason text
);
create index on public.run_logs (athlete_id, date);

-- Swim logs
create table if not exists public.swim_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.athletes(id) on delete cascade,
  session_id text not null unique,
  date date not null,
  actual_distance text,
  drills_completed text[],
  continuous_200m boolean default false,
  note text
);
create index on public.swim_logs (athlete_id, date);

-- Morning check-ins
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.athletes(id) on delete cascade,
  date date not null unique,
  rhr int,
  sleep_hours numeric,
  weight_kg numeric,
  mood int check (mood between 1 and 5),
  soreness int check (soreness between 1 and 5),
  motivation int check (motivation between 1 and 5),
  note text
);
create index on public.check_ins (athlete_id, date);

-- Daily journal
create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.athletes(id) on delete cascade,
  date date not null unique,
  text text,
  updated_at timestamptz default now()
);
create index on public.journals (athlete_id, date);

-- Pain log
create table if not exists public.pain_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.athletes(id) on delete cascade,
  date date not null,
  location text not null,
  intensity int check (intensity between 0 and 10),
  type text check (type in ('dull','sharp','ache','burning','stabbing')),
  context text,
  light text check (light in ('green','amber','red'))
);
create index on public.pain_logs (athlete_id, date);

-- Settings (one row per athlete)
create table if not exists public.settings (
  athlete_id uuid primary key references public.athletes(id) on delete cascade,
  start_date date default '2026-08-17',
  session_times jsonb,
  dark_mode text default 'auto' check (dark_mode in ('auto','light','dark')),
  notifications_enabled boolean default false,
  rest_timer_sec int default 90,
  body_weight_kg numeric default 75,
  marathon_band text
);

-- Push subscriptions (for Web Push v2)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.athletes(id) on delete cascade,
  endpoint text not null,
  keys jsonb not null,
  created_at timestamptz default now()
);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.athletes        enable row level security;
alter table public.set_logs        enable row level security;
alter table public.run_logs        enable row level security;
alter table public.swim_logs       enable row level security;
alter table public.check_ins       enable row level security;
alter table public.journals        enable row level security;
alter table public.pain_logs       enable row level security;
alter table public.settings        enable row level security;
alter table public.push_subscriptions enable row level security;

-- Athletes can only see/modify their own rows
create policy "own athletes"   on public.athletes   for all using (auth.uid() = id);
create policy "own set logs"   on public.set_logs   for all using (auth.uid() = athlete_id);
create policy "own run logs"   on public.run_logs   for all using (auth.uid() = athlete_id);
create policy "own swim logs"  on public.swim_logs  for all using (auth.uid() = athlete_id);
create policy "own check ins"  on public.check_ins  for all using (auth.uid() = athlete_id);
create policy "own journals"   on public.journals   for all using (auth.uid() = athlete_id);
create policy "own pain logs"  on public.pain_logs  for all using (auth.uid() = athlete_id);
create policy "own settings"   on public.settings   for all using (auth.uid() = athlete_id);
create policy "own push subs"  on public.push_subscriptions for all using (auth.uid() = athlete_id);
