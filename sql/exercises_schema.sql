-- PhysioDrishti home-exercise library (guideline-based, clinician-approved)
--
-- How it works:
--   * Every exercise is stored as 'draft'. Drishti NEVER shows a draft.
--   * A registered physiotherapist reads each one, edits it if needed, and
--     approves it with the UPDATE at the bottom of this file.
--   * Only 'approved' rows are returned to patients.
--
-- Basis: ICMR Standard Treatment Workflows (Knee OA, Hip OA, Low Back Pain,
-- Neck Pain; 2024, advisory) and MoHFW Standard Treatment Guidelines:
-- Management of Osteoarthritis Knee (2017). The steps are original wording
-- written for patients; they are general guidance, not a prescription.
-- Safe to re-run. Re-running resets edited exercises to draft (forces re-review).

create table if not exists public.exercises (
  id               bigint generated always as identity primary key,
  slug             text unique not null,
  name             text not null,
  conditions       text[] not null,          -- knee_osteoarthritis | hip_osteoarthritis | low_back_pain | neck_pain
  purpose          text not null,
  steps            text[] not null,
  dose             text not null,
  stop_if          text not null,
  avoid_if         text,
  guideline_basis  text not null,
  sort_order       int not null default 100,
  status           text not null default 'draft' check (status in ('draft','approved','retired')),
  reviewed_by      text,
  reviewer_reg_no  text,                     -- state council / NCAHP registration number
  reviewed_at      timestamptz,
  version          int not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists exercises_conditions_idx on public.exercises using gin (conditions);

-- Server-only table: no anon or authenticated access. The API uses service_role.
alter table public.exercises enable row level security;
revoke all on public.exercises from anon, authenticated;
grant select, insert, update, delete on public.exercises to service_role;

insert into public.exercises
  (slug, name, conditions, purpose, steps, dose, stop_if, avoid_if, guideline_basis, sort_order)
values
('quad_set', 'Thigh tightening (quad set)',
 array['knee_osteoarthritis','hip_osteoarthritis'],
 'Wakes up the front thigh muscle that supports the knee, without bending the joint.',
 array['Sit or lie with the leg straight and a small rolled towel under the knee.',
       'Tighten the front of the thigh and press the back of the knee gently into the towel.',
       'Hold for 5 seconds, breathing normally, then relax.'],
 '10 times, 2 to 3 times a day.',
 'Stop if knee pain becomes sharp or is clearly worse the next morning.',
 null,
 'ICMR STW Knee OA and Hip OA: quadriceps strengthening.', 10),

('straight_leg_raise', 'Straight leg raise',
 array['knee_osteoarthritis','hip_osteoarthritis'],
 'Strengthens the thigh while keeping the knee straight and unloaded.',
 array['Lie on your back with one knee bent and that foot flat on the bed or mat.',
       'Keep the other leg straight and tighten its thigh.',
       'Lift the straight leg slowly to the height of the bent knee, hold for 3 seconds, and lower slowly.'],
 '8 to 10 times each leg, once or twice a day.',
 'Stop if you feel sharp pain in the knee, hip or lower back.',
 'Skip if lying on your back is uncomfortable for your back.',
 'ICMR STW Knee OA and Hip OA: quadriceps strengthening.', 20),

('seated_knee_extension', 'Seated knee straightening',
 array['knee_osteoarthritis'],
 'Builds thigh strength in a supported, chair-based position.',
 array['Sit well back on a firm chair with both feet on the floor.',
       'Slowly straighten one knee until the leg is almost straight.',
       'Hold for 5 seconds, then lower slowly.'],
 '10 times each leg, once or twice a day.',
 'Stop if the knee clicks painfully, swells or locks.',
 null,
 'ICMR STW Knee OA: quadriceps strengthening. MoHFW STG Knee OA: exercise is a core treatment at any age.', 30),

('hamstring_stretch', 'Back-of-thigh stretch (seated)',
 array['knee_osteoarthritis'],
 'Eases tightness behind the thigh that can limit knee straightening.',
 array['Sit on the front edge of a firm chair.',
       'Straighten one leg in front with the heel on the floor and toes pointing up.',
       'Keep your back straight and lean forward from the hips until you feel a gentle stretch behind the thigh. Hold for 20 to 30 seconds.'],
 '3 times each leg, once or twice a day.',
 'A stretch should feel mild. Stop if you feel pain behind the knee or tingling down the leg.',
 null,
 'ICMR STW Knee OA: hamstring stretching.', 40),

('side_lying_leg_lift', 'Side-lying leg lift',
 array['hip_osteoarthritis'],
 'Strengthens the muscles on the side of the hip that keep the pelvis level when you walk.',
 array['Lie on your side with the bottom knee bent for balance and the top leg straight.',
       'Keep the top leg in line with your body and toes pointing forward.',
       'Lift the top leg about a hand-span, hold for 2 seconds, and lower slowly.'],
 '8 to 10 times each side, once a day.',
 'Stop if you feel pain deep in the hip joint or groin.',
 'Skip if lying on the side hurts the hip you lie on.',
 'ICMR STW Hip OA: hip abductor strengthening.', 50),

('bridge', 'Bridge',
 array['hip_osteoarthritis','low_back_pain'],
 'Strengthens the buttock and lower back muscles.',
 array['Lie on your back with knees bent and feet flat, hip-width apart.',
       'Tighten your stomach gently and squeeze your buttocks.',
       'Lift your hips until your body is in a straight line from shoulders to knees, hold for 3 seconds, and lower slowly.'],
 '8 to 10 times, once a day.',
 'Stop if back pain increases or spreads down a leg.',
 null,
 'ICMR STW Hip OA: hip extensor strengthening. ICMR STW Low Back Pain: back strengthening once pain is bearable.', 60),

('standing_hip_extension', 'Standing leg back',
 array['hip_osteoarthritis'],
 'Strengthens the back of the hip using a counter or chair for support.',
 array['Stand tall holding the back of a sturdy chair or a kitchen counter.',
       'Keeping the knee straight and the body upright, move one leg slowly backwards.',
       'Hold for 2 seconds and return. Do not arch your lower back.'],
 '8 to 10 times each leg, once a day.',
 'Stop if you feel unsteady or the hip pain becomes sharp.',
 'Use support every time if your balance is not steady.',
 'ICMR STW Hip OA: hip extensor strengthening.', 70),

('daily_walk', 'Daily walking',
 array['knee_osteoarthritis','hip_osteoarthritis','low_back_pain'],
 'Keeps joints moving and builds stamina. Regular activity helps more than rest for most joint and back pain.',
 array['Walk on a flat, even surface in comfortable, cushioned footwear.',
       'Start with a time you can manage without extra pain, for example 10 minutes.',
       'Add 2 to 5 minutes every few days if the joint or back feels the same or better the next day.'],
 'Most days of the week. Build up gradually.',
 'Cut back if pain is clearly worse the next day. Use a walking stick in the opposite hand if your doctor or physiotherapist advised it.',
 'Avoid slopes and stairs on bad days.',
 'ICMR STW Knee OA, Hip OA and Low Back Pain: stay physically active; weight loss if overweight. MoHFW STG Knee OA: exercise is core treatment.', 80),

('pelvic_tilt', 'Pelvic tilt',
 array['low_back_pain'],
 'Gently moves the lower back and activates the deep stomach muscles.',
 array['Lie on your back with knees bent and feet flat.',
       'Gently flatten your lower back into the floor by tightening your stomach and tilting your pelvis.',
       'Hold for 5 seconds, breathing normally, then relax.'],
 '10 times, once or twice a day.',
 'Stop if pain spreads into a leg or you feel numbness or tingling.',
 null,
 'ICMR STW Low Back Pain: back strengthening and physical activity once pain is bearable.', 90),

('bird_dog', 'Opposite arm and leg reach (bird dog)',
 array['low_back_pain'],
 'Builds control and strength in the back and trunk muscles.',
 array['Start on hands and knees, hands under shoulders and knees under hips.',
       'Keep your back flat and slowly stretch one arm forward and the opposite leg back.',
       'Hold for 3 to 5 seconds, return, and switch sides.'],
 '6 to 8 times each side, once a day.',
 'Stop if your back pain increases. Start with just the leg movement if this is hard.',
 'Skip if kneeling hurts your knees.',
 'ICMR STW Low Back Pain: back strengthening once pain is bearable.', 100),

('chin_tuck', 'Chin tuck',
 array['neck_pain'],
 'Trains the deep neck muscles and counters a forward head posture from phone and laptop use.',
 array['Sit or stand tall, looking straight ahead.',
       'Gently draw your chin straight back, as if making a double chin. Do not tip your head down.',
       'Hold for 5 seconds and relax.'],
 '10 times, 2 to 3 times a day. Good to do during work breaks.',
 'Stop if you feel dizziness, or pain, tingling or numbness spreading into an arm.',
 null,
 'ICMR STW Neck Pain: neck strengthening after the acute stage.', 110),

('neck_isometric', 'Neck press (isometric)',
 array['neck_pain'],
 'Strengthens the neck muscles without moving the neck.',
 array['Sit tall. Place your palm on your forehead.',
       'Press your head gently into your hand while your hand resists, so the head does not move. Use about a quarter of your strength.',
       'Hold for 5 seconds. Repeat with the hand on the back of the head and on each side.'],
 '5 times in each direction, once a day.',
 'Stop if it causes headache, dizziness or arm symptoms.',
 'Wait until a recent flare has settled before starting.',
 'ICMR STW Neck Pain: rest in the acute stage, then neck strengthening.', 120),

('shoulder_blade_squeeze', 'Shoulder blade squeeze',
 array['neck_pain'],
 'Strengthens the upper back muscles that support the neck during desk work.',
 array['Sit tall with arms relaxed at your sides.',
       'Gently squeeze your shoulder blades back and down, without shrugging.',
       'Hold for 5 seconds and relax.'],
 '10 times, 2 to 3 times a day.',
 'Stop if it causes pain between the shoulder blades or down an arm.',
 null,
 'Supports ICMR STW Neck Pain advice on neck strengthening and returning to normal activity (clinic addition; reviewer to confirm).', 130)

on conflict (slug) do update set
  name = excluded.name, conditions = excluded.conditions, purpose = excluded.purpose,
  steps = excluded.steps, dose = excluded.dose, stop_if = excluded.stop_if,
  avoid_if = excluded.avoid_if, guideline_basis = excluded.guideline_basis,
  sort_order = excluded.sort_order,
  status = 'draft', reviewed_by = null, reviewer_reg_no = null, reviewed_at = null,
  version = public.exercises.version + 1, updated_at = now();

-- Check: 13 rows, all draft
select slug, status, conditions from public.exercises order by sort_order;

-- ───────────────────────────────────────────────────────────────────────────
-- APPROVAL (run only after a registered physiotherapist has reviewed them).
-- Edit the name, registration number and slug list, then run:
--
-- update public.exercises
-- set status = 'approved',
--     reviewed_by = 'Dr. Full Name (PT)',
--     reviewer_reg_no = 'Registration number',
--     reviewed_at = now(), updated_at = now()
-- where slug in ('quad_set','straight_leg_raise','seated_knee_extension','hamstring_stretch',
--                'side_lying_leg_lift','bridge','standing_hip_extension','daily_walk',
--                'pelvic_tilt','bird_dog','chin_tuck','neck_isometric','shoulder_blade_squeeze');
--
-- To pull one back:  update public.exercises set status = 'retired' where slug = '...';
-- ───────────────────────────────────────────────────────────────────────────
