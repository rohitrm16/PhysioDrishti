// Guideline-based home exercises. Only clinician-approved rows are ever returned.
// Safety is enforced here in code, not left to the model:
//  - red flags are re-checked on the whole patient conversation
//  - recent surgery, fracture, injury or pregnancy -> no exercises, ask for clearance
//  - no approved exercises -> nothing shown, offer a free call
import { admin } from './db.js'
import { hasRedFlag, RED_FLAG_MESSAGE } from './safety.js'

export const CONDITIONS = {
  knee_osteoarthritis: {
    label: 'Knee osteoarthritis',
    source: 'ICMR Standard Treatment Workflow: Knee Osteoarthritis (2024); MoHFW Standard Treatment Guidelines: Osteoarthritis Knee (2017)',
    avoid: ['Sitting cross-legged on the floor', 'Deep squatting, such as on an Indian-style toilet', 'Frequent stair climbing while it is painful'],
    self_care: ['Lose weight if you are overweight', 'Cushioned footwear', 'Heat or cold pack on painful days'],
  },
  hip_osteoarthritis: {
    label: 'Hip osteoarthritis',
    source: 'ICMR Standard Treatment Workflow: Hip Osteoarthritis (2024)',
    avoid: ['Standing for long periods', 'Sitting cross-legged and deep squatting', 'Frequent stair climbing'],
    self_care: ['Lose weight if you are overweight', 'Walking stick in the hand opposite the painful hip, if advised'],
  },
  low_back_pain: {
    label: 'Lower back pain',
    source: 'ICMR Standard Treatment Workflow: Low Back Pain (2024)',
    avoid: ['Lifting heavy weights while it settles', 'Long bed rest'],
    self_care: ['Keep up daily activities and return to work early', 'Alternate cold and heat packs', 'See a doctor if not improving in 2 to 6 weeks'],
  },
  neck_pain: {
    label: 'Neck pain',
    source: 'ICMR Standard Treatment Workflow: Neck Pain (2024)',
    avoid: ['Long unbroken screen time', 'Strengthening during a fresh, acute flare (rest first)'],
    self_care: ['Screen at eye level and breaks every 30 to 45 minutes', 'Alternate cold and heat packs', 'Continue normal daily activities'],
  },
}

const NEEDS_CLEARANCE = [
  /\b(surger(y|ies)|operat(ion|ed)|replacement|arthroscop\w*|fractur\w*|broken bone|broke my|pregnan\w*)\b/i,
  /\b(fell|fall|accident|injur\w*|twist\w*|sprain\w*)\b.{0,40}\b(yesterday|today|last night|last week|days? ago|recently)\b/i,
]
const needsClearance = (text) => NEEDS_CLEARANCE.some((r) => r.test(String(text)))

export const DISCLAIMER = 'General guidance from Indian national guidelines, reviewed by our physiotherapist. Not a personal prescription.'

// patientText: the patient's words in this conversation (current message + recent turns), already PII-masked
export async function getHomeExercises(condition, patientText = '') {
  const info = CONDITIONS[condition]
  if (!info) return { ok: false, error: 'unknown_condition', supported: Object.keys(CONDITIONS), instruction: 'Only these conditions have home exercises. For anything else, suggest a free call.' }

  if (hasRedFlag(patientText)) return { ok: false, error: 'red_flag', instruction: 'Stop. Tell the patient exactly: ' + RED_FLAG_MESSAGE }
  if (needsClearance(patientText)) {
    return { ok: false, error: 'clearance_required', instruction: 'Do not give exercises. Explain that after recent surgery, a fracture, a fresh injury or during pregnancy, exercises must be set by their surgeon or a physiotherapist after an assessment, and offer to book a session.' }
  }

  const { data, error } = await admin.from('exercises')
    .select('slug, name, purpose, steps, dose, stop_if, avoid_if, reviewed_by, reviewed_at, version')
    .eq('status', 'approved').contains('conditions', [condition]).order('sort_order').limit(4)
  if (error) throw error
  if (!data?.length) {
    return { ok: false, error: 'none_approved', instruction: 'No reviewed exercises are available for this yet. Share general advice from search_knowledge only and suggest a free call.' }
  }

  return {
    ok: true,
    condition, label: info.label, source: info.source, disclaimer: DISCLAIMER,
    avoid: info.avoid, self_care: info.self_care,
    exercises: data.map((e) => ({ slug: e.slug, name: e.name, purpose: e.purpose, steps: e.steps, dose: e.dose, stop_if: e.stop_if, avoid_if: e.avoid_if || null })),
    reviewed: { by: data[0].reviewed_by || null, at: data[0].reviewed_at || null },
    instruction: 'The exercise cards are shown on screen. In your reply, name the exercises in one short line each, say to stop if pain becomes sharp or spreads, mention one thing to avoid, and offer a session for a personal plan. Do not repeat every step.',
  }
}
