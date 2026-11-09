
// Rule-based red-flag screen. Runs BEFORE any AI call.
// Deliberately broad: a false alarm is far safer than a miss.
const RED_FLAGS = [
  /chest (pain|pressure|tightness)/i,
  /(can'?t|cannot|difficulty) breath|short(ness)? of breath/i,
  /(loss of|losing|no|lost) (bladder|bowel) control|incontinen/i,
  /numb\w*.{0,40}(groin|saddle|genital|inner thigh)|saddle.{0,15}numb/i,
  /sudden(ly)?.{0,20}(weak|numb|paraly|lost|drooping)/i,
  /face droop|slurred speech|worst headache/i,
  /fever.{0,60}(surgery|operation|wound|stitch)|(surgery|operation|wound|stitch).{0,60}fever/i,
  /(calf|leg).{0,40}(swollen|swelling).{0,40}(red|hot|warm|painful)/i,
  /(unable|can'?t|cannot).{0,15}(walk|stand|bear weight).{0,40}(fall|fell|injur|accident)/i,
  /(suicid|self[- ]harm|want to die)/i,
  /(can'?t|cannot).{0,20}(bladder|bowel)/i,
  /(groin|inner thigh|saddle area).{0,15}numb/i,
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
