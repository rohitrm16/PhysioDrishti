// WhatsApp message drafts. Templates (not AI) so wording is predictable and reviewable.
import { formatSlot } from './tools.js'

export const REJECT_REASONS = {
  needs_doctor_first: 'needs a doctor review first',
  area_not_covered: 'area not covered for home visits',
  out_of_scope: 'outside what physiotherapy can help with',
  duplicate: 'duplicate request',
  patient_unreachable: 'patient unreachable',
  other: 'other',
}

export function waUrl(phone, text) {
  let digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 10) digits = '91' + digits
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function draftMessage(action, booking, slot, reason) {
  const name = booking.contact_name ? ` ${booking.contact_name}` : ''
  const when = slot ? formatSlot(slot.starts_at) : 'the requested time'
  const meet = process.env.MEET_LINK
  const join = booking.mode === 'online'
    ? (meet ? `\n\nJoin here: ${meet}` : '\n\nWe will share the video link before your session.')
    : ''
  if (action === 'approve' || action === 'confirm') {
    return `Hi${name}, your PhysioDrishti session is confirmed for ${when} (${booking.mode}).${join}\n\nReply here if you need to change it.`
  }
  if (action === 'reschedule') {
    return `Hi${name}, thanks for your request. Your requested time is not available, but we can offer ${when} (${booking.mode}). Does that work for you? Reply YES to confirm.`
  }
  if (action === 'reject') {
    if (reason === 'needs_doctor_first') return `Hi${name}, thank you for reaching out. Based on what you shared, please see a doctor first. Once they confirm physiotherapy is right for you, we would be glad to help.`
    if (reason === 'area_not_covered') return `Hi${name}, thank you for your request. We do not offer home visits in your area yet, but we can see you in an online session. Would you like that?`
    return `Hi${name}, thank you for your request. We are not able to book this session. Please reply here and our team will help you find the right option.`
  }
  if (action === 'cancel') return `Hi${name}, your PhysioDrishti request for ${when} has been cancelled. Reply here any time to book again.`
  return ''
}
