// Rule-based red-flag screen. Runs BEFORE any AI call.
// Deliberately broad: a false alarm is far safer than a miss.
const RED_FLAGS = [
  /chest (pain|pressure|tightness)/i,
  /(can'?t|cannot|difficulty) breath|short(ness)? of breath/i,
  /(loss of|losing|no|lost) (bladder|bowel) control|incontinen/i,
  /numb\w*.{0,40}(groin|saddle|genital|inner thigh)|saddle.{0,15}numb/i,
  /(can'?t|cannot|unable to) (control|hold) (my )?(bladder|bowel|urine|stool)/i,
  /(groin|saddle|genital|private parts?).{0,30}numb/i,
  /back pain.{0,60}(fever|weight loss|cancer)|(fever|weight loss|cancer).{0,60}back pain/i,
  /neck pain.{0,60}(fever|weight loss|cancer)|(fever|weight loss|cancer).{0,60}neck pain/i,
  /sudden(ly)?.{0,20}(weak|numb|paraly|lost|drooping)/i,
  /face droop|slurred speech|worst headache/i,
  /(calf|leg).{0,40}(swollen|swelling).{0,40}(red|hot|warm|painful)/i,
  /(unable|can'?t|cannot).{0,15}(walk|stand|bear weight).{0,40}(fall|fell|injur|accident)/i,
  /(can'?t|cannot).{0,20}(bladder|bowel)/i,
  /(groin|inner thigh|saddle area).{0,15}numb/i,
  /(suicid|self[- ]harm|want to die)/i,
]

export function hasRedFlag(text) {
  return RED_FLAGS.some((r) => r.test(String(text)))
}

export const RED_FLAG_MESSAGE =
  'Some of what you describe can need urgent medical attention. ' +
  'Please contact a doctor or call 112 (India emergency number) now, ' +
  'rather than waiting for a physiotherapy appointment.'

// Medicine questions get a clear redirect instead of an AI answer.
const MEDICATION =
  /\b(pain ?killers?|medications?|medicines? (for|to)|which (pill|tablet|medicine)|dose|dosage|ibuprofen|paracetamol|diclofenac|steroids?)\b/i

export function asksAboutMedication(text) {
  return MEDICATION.test(String(text))
}

export const MEDICATION_MESSAGE =
  "I can't advise on medicines or doses. Please ask your doctor or pharmacist. " +
  "A physiotherapist can help with exercises and movement after an assessment."

// ── Fixed replies approved by our physiotherapist (Dr Anushka Sharma, 18 Nov 2026) ──
// Chosen by code before any AI call, so the wording cannot drift.

// Problems after an operation (wound, stitches, fever): the surgical team, not the ambulance.
// Emergencies after surgery (hot swollen calf, chest pain, breathlessness) still hit RED_FLAGS first.
const SURGERY_CONTEXT = /\b(surger(y|ies)|operat(ion|ed)|replacement|arthroscop\w*|post[- ]?op\w*)\b/i
const SURGERY_COMPLICATION = /\b(fever|pus|discharge|oozing|infect\w*)\b|\b(wound|stitch\w*|suture\w*|incision|scar)\b.{0,40}\b(red(ness)?|hot|warm|swollen|open(ed|ing)?|bleed\w*|smell\w*|pus|discharg\w*|oozing|infect\w*)\b/i
const isPostSurgeryProblem = (t) => SURGERY_CONTEXT.test(t) && SURGERY_COMPLICATION.test(t)
export const POST_SURGERY_MESSAGE =
  'This is outside routine physiotherapy advice. Please contact your surgeon or the hospital where you had surgery today.'

const PREGNANCY = /\b(pregnan\w*|antenatal|prenatal|postnatal|post[- ]?partum|maternity|c[- ]?section|after (giving )?birth|after (my |the )?delivery)\b/i
export const PREGNANCY_MESSAGE =
  'This is outside routine physiotherapy advice. Please contact your doctor or maternity team for assessment.'

const PRICING = [
  /\b(cost|costs|costing|price|prices|pricing|charges|fees?|tariff)\b/i,
  /how much (is|does|do|will|would|for)\b.{0,40}(session|appointment|visit|consult\w*|physio\w*|treatment|home visit)/i,
]
export const PRICING_MESSAGE =
  'Session charges may vary depending on the type of appointment and treatment required. Please speak to our reception team for the exact cost.'

// Questions outside physiotherapy, or with nothing reliable in our knowledge base.
export const OUT_OF_SCOPE_MESSAGE =
  'I can help with physiotherapy and booking or appointment queries. For other medical concerns, please contact a doctor or clinician.'

// One place that decides fixed replies, in priority order. Returns { reason, message } or null.
export function fixedReply(text) {
  const t = String(text)
  if (hasRedFlag(t)) return { reason: 'red_flag', message: RED_FLAG_MESSAGE }
  if (asksAboutMedication(t)) return { reason: 'medication', message: MEDICATION_MESSAGE }
  if (isPostSurgeryProblem(t)) return { reason: 'post_surgery', message: POST_SURGERY_MESSAGE }
  if (PREGNANCY.test(t)) return { reason: 'pregnancy', message: PREGNANCY_MESSAGE }
  if (PRICING.some((r) => r.test(t))) return { reason: 'pricing', message: PRICING_MESSAGE }
  return null
}
