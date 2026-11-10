// Rule-based warnings shown on each request. They inform the clinician; they never decide.
import { hasRedFlag } from './safety.js'

const SURGERY = /\b(surgery|surgical|operation|operated|post[- ]?op|replacement|fracture|arthroscop|acl repair|stitches)\b/i

export function precheck(booking, slot, { duplicates = 0, now = Date.now() } = {}) {
  const badges = []
  const summary = String(booking.patient_summary || '')
  const start = slot ? new Date(slot.starts_at).getTime() : null

  if (hasRedFlag(summary)) badges.push({ level: 'danger', text: 'Possible red-flag symptom in the summary. Review before approving.' })
  if (start !== null && start < now) badges.push({ level: 'danger', text: 'This slot time has already passed.' })
  else if (start !== null && start - now < 3 * 3600 * 1000) badges.push({ level: 'warn', text: 'Slot starts in under 3 hours.' })
  if (SURGERY.test(summary)) badges.push({ level: 'warn', text: 'Mentions surgery or a fracture. Check the surgeon has cleared physiotherapy.' })
  if (booking.mode === 'home') badges.push({ level: 'warn', text: 'Home visit. Confirm the address is in a covered area.' })
  if (duplicates > 0) badges.push({ level: 'warn', text: `Same number has ${duplicates} other request${duplicates > 1 ? 's' : ''} this week.` })
  if (!booking.contact_name) badges.push({ level: 'info', text: 'No name given.' })
  if (!slot) badges.push({ level: 'danger', text: 'Slot not found.' })
  return badges
}
