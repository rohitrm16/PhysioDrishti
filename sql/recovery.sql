-- Adherence, progress and clinician continuity. Run AFTER sql/guided_sessions.sql. Safe to re-run.

-- 1) Remember the pain-adjusted dose used in each session (1 = full approved dose)
alter table public.exercise_sessions add column if not exists rep_scale numeric(3,2);

-- 2) Weekly goal check-ins (Patient-Specific Functional Scale style: 0 = cannot do it, 10 = as before)
create table if not exists public.goal_checkins (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  device_id  text not null,
  condition  text not null,
  goal       text not null,
  rating     int not null check (rating between 0 and 10)
);
create index if not exists goal_checkins_device_idx on public.goal_checkins (device_id, created_at);

-- 3) Patient-consented link between a phone's sessions and their name + WhatsApp number,
--    so their physiotherapist can see progress between visits. Patients can stop sharing anytime.
create table if not exists public.progress_links (
  device_id   text primary key,
  name        text not null,
  phone       text not null,          -- 10-digit Indian mobile
  consent_at  timestamptz not null default now(),
  revoked_at  timestamptz
);
create index if not exists progress_links_phone_idx on public.progress_links (phone);

alter table public.goal_checkins  enable row level security;
alter table public.progress_links enable row level security;
revoke all on public.goal_checkins, public.progress_links from anon, authenticated;
grant select, insert, update, delete on public.goal_checkins, public.progress_links to service_role;
grant select on public.exercise_sessions to service_role;
grant usage, select on all sequences in schema public to service_role;
