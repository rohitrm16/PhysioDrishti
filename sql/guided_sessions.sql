-- Guided exercise sessions. Run AFTER sql/exercises_schema.sql. Safe to re-run.
-- Does NOT change approval status: the targets below match each exercise's written dose,
-- and the reviewing physiotherapist can edit them like any other field.

-- 1) Session targets per exercise (used by the follow-along timer and the camera coach)
alter table public.exercises
  add column if not exists reps int,            -- reps per side; 0 = not part of a guided session (e.g. walking)
  add column if not exists hold_seconds int,    -- hold at the top of each rep
  add column if not exists sides int not null default 1;  -- 1 = once, 2 = left then right, 4 = front/back/left/right

update public.exercises e set reps = v.reps, hold_seconds = v.hold, sides = v.sides, updated_at = now()
from (values
  ('quad_set',               10,  5, 1),
  ('straight_leg_raise',      8,  3, 2),
  ('seated_knee_extension',  10,  5, 2),
  ('hamstring_stretch',       3, 20, 2),
  ('side_lying_leg_lift',     8,  2, 2),
  ('bridge',                  8,  3, 1),
  ('standing_hip_extension',  8,  2, 2),
  ('daily_walk',              0,  0, 1),
  ('pelvic_tilt',            10,  5, 1),
  ('bird_dog',                6,  3, 2),
  ('chin_tuck',              10,  5, 1),
  ('neck_isometric',          5,  5, 4),
  ('shoulder_blade_squeeze', 10,  5, 1)
) as v(slug, reps, hold, sides)
where e.slug = v.slug;

-- 2) Anonymous session log (no names, phone numbers or video; a random device id only)
create table if not exists public.exercise_sessions (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  device_id        text not null,
  condition        text not null,
  mode             text not null check (mode in ('follow','camera','mixed')),
  items            jsonb not null,          -- [{slug, target, done}]
  pain_before      int check (pain_before between 0 and 10),
  pain_after       int check (pain_after between 0 and 10),
  stopped_for_pain boolean not null default false,
  duration_s       int
);
create index if not exists exercise_sessions_device_idx on public.exercise_sessions (device_id, created_at desc);
alter table public.exercise_sessions enable row level security;
revoke all on public.exercise_sessions from anon, authenticated;
grant select, insert on public.exercise_sessions to service_role;
grant usage, select on all sequences in schema public to service_role;

select slug, status, reps, hold_seconds, sides from public.exercises order by sort_order;
