// Clinician approval queue for agent bookings (staff only).
//   GET  /api/approvals                 -> queue, recent decisions, open slots, metrics
//   POST /api/approvals { booking_id, action, reason?, slot_id?, note? }
// Actions: approve | reschedule | reject | confirm | cancel | notified | note
import { admin } from '../lib/db.js'
import { requireStaff } from '../lib/staffAuth.js'
import { precheck } from '../lib/precheck.js'
import { draftMessage, waUrl, REJECT_REASONS } from '../lib/messages.js'
import { formatSlot } from '../lib/tools.js'

const QUEUE = ['pending_approval', 'proposed']
const FROM = {
  approve: ['pending_approval'],
  reschedule: ['pending_approval', 'proposed'],
  reject: ['pending_approval', 'proposed'],
  confirm: ['proposed'],
  cancel: ['pending_approval', 'proposed', 'approved'],
}
const TO = { approve: 'approved', reschedule: 'proposed', reject: 'rejected', confirm: 'approved', cancel: 'cancelled' }

async function logEvent(row) {
  const { error } = await admin.from('booking_events').insert(row)
  if (error) console.error('booking_events insert failed:', error.message)
}

async function setSlot(id, from, to) {
  if (!id) return
  const { error } = await admin.from('slots').update({ status: to }).eq('id', id).in('status', from)
  if (error) console.error('slot update failed:', error.message)
}

// Lazy expiry: runs whenever the queue loads (Vercel Hobby cron runs only daily)
async function expireOverdue() {
  const { data, error } = await admin.from('agent_bookings')
    .update({ status: 'expired', decided_by: 'system', decided_at: new Date().toISOString(), decision_reason: 'no_response' })
    .in('status', QUEUE).lt('expires_at', new Date().toISOString()).select('id, slot_id, status')
  if (error) throw error
  for (const b of data || []) {
    await setSlot(b.slot_id, ['held'], 'open')
    await logEvent({ booking_id: b.id, action: 'expire', from_status: 'pending', to_status: 'expired', actor: 'system', slot_id: b.slot_id })
  }
  return (data || []).length
}

function median(xs) {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function metrics(rows, events) {
  const decided = rows.filter((r) => r.decided_at && r.decided_by !== 'system')
  const firstDecision = decided.map((r) => (new Date(r.decided_at) - new Date(r.created_at)) / 60000).filter((m) => m >= 0)
  const finished = rows.filter((r) => ['approved', 'rejected', 'expired', 'cancelled'].includes(r.status))
  const reasons = {}
  for (const r of rows.filter((x) => x.status === 'rejected')) reasons[r.decision_reason || 'other'] = (reasons[r.decision_reason || 'other'] || 0) + 1
  const rescheduled = new Set(events.filter((e) => e.action === 'reschedule').map((e) => e.booking_id))
  return {
    requests_30d: rows.length,
    median_minutes_to_decision: median(firstDecision),
    approval_rate: finished.length ? finished.filter((r) => r.status === 'approved').length / finished.length : null,
    expiry_rate: rows.length ? rows.filter((r) => r.status === 'expired').length / rows.length : null,
    reschedule_rate: decided.length ? rescheduled.size / decided.length : null,
    rejection_reasons: reasons,
  }
}

async function getQueue(res) {
  const expired = await expireOverdue()
  const since = new Date(Date.now() - 30 * 86400e3).toISOString()
  const { data: rows, error } = await admin.from('agent_bookings').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(500)
  if (error) throw error

  const slotIds = [...new Set(rows.map((r) => r.slot_id).filter(Boolean))]
  const { data: slots } = slotIds.length ? await admin.from('slots').select('id, starts_at, mode, status').in('id', slotIds) : { data: [] }
  const slotById = Object.fromEntries((slots || []).map((s) => [s.id, s]))
  const ids = rows.map((r) => r.id)
  const { data: events } = ids.length ? await admin.from('booking_events').select('*').in('booking_id', ids).order('created_at') : { data: [] }

  const weekAgo = Date.now() - 7 * 86400e3
  const recentByPhone = {}
  for (const r of rows) {
    if (r.contact_phone && new Date(r.created_at).getTime() > weekAgo && !['expired', 'rejected', 'cancelled'].includes(r.status)) {
      recentByPhone[r.contact_phone] = (recentByPhone[r.contact_phone] || 0) + 1
    }
  }

  const decorate = (r) => {
    const slot = slotById[r.slot_id] || null
    return {
      ...r,
      slot,
      when: slot ? formatSlot(slot.starts_at) : null,
      badges: QUEUE.includes(r.status) ? precheck(r, slot, { duplicates: Math.max(0, (recentByPhone[r.contact_phone] || 1) - 1) }) : [],
      events: (events || []).filter((e) => e.booking_id === r.id),
    }
  }

  const queue = rows.filter((r) => QUEUE.includes(r.status)).map(decorate)
    .sort((a, b) => new Date(a.slot?.starts_at || 0) - new Date(b.slot?.starts_at || 0))
  const recent = rows.filter((r) => !QUEUE.includes(r.status)).slice(0, 20).map(decorate)

  const { data: open } = await admin.from('slots').select('id, starts_at, mode')
    .eq('status', 'open').gte('starts_at', new Date(Date.now() + 2 * 3600e3).toISOString()).order('starts_at').limit(30)

  res.status(200).json({
    expired_now: expired,
    queue,
    recent,
    open_slots: (open || []).map((s) => ({ id: s.id, when: formatSlot(s.starts_at), mode: s.mode })),
    reject_reasons: REJECT_REASONS,
    metrics: metrics(rows, events || []),
  })
}

async function act(req, res, staff) {
  const { booking_id, action, reason, slot_id, note } = req.body || {}
  const id = Number(booking_id)
  if (!id) return res.status(400).json({ error: 'booking_id is required' })
  const actor = staff.email

  const { data: current, error: e0 } = await admin.from('agent_bookings').select('*').eq('id', id)
  if (e0) throw e0
  const booking = current?.[0]
  if (!booking) return res.status(404).json({ error: 'Booking not found' })

  if (action === 'notified') {
    await admin.from('agent_bookings').update({ notified_at: new Date().toISOString() }).eq('id', id)
    await logEvent({ booking_id: id, action: 'notified', from_status: booking.status, to_status: booking.status, actor })
    return res.status(200).json({ ok: true })
  }
  if (action === 'note') {
    const text = String(note || '').trim().slice(0, 500)
    if (!text) return res.status(400).json({ error: 'note is empty' })
    await admin.from('agent_bookings').update({ staff_note: text }).eq('id', id)
    await logEvent({ booking_id: id, action: 'note', from_status: booking.status, to_status: booking.status, actor, note: text })
    return res.status(200).json({ ok: true })
  }
  if (!FROM[action]) return res.status(400).json({ error: 'Unknown action' })
  if (action === 'reject' && !REJECT_REASONS[reason]) return res.status(400).json({ error: 'Choose a rejection reason' })

  const now = new Date().toISOString()
  let newSlot = null
  if (action === 'reschedule') {
    const target = Number(slot_id)
    if (!target || target === booking.slot_id) return res.status(400).json({ error: 'Pick a different slot' })
    const { data: held, error } = await admin.from('slots').update({ status: 'held' }).eq('id', target).eq('status', 'open').select('id, starts_at, mode')
    if (error) throw error
    if (!held?.length) return res.status(409).json({ error: 'That slot was just taken. Pick another.' })
    newSlot = held[0]
  }

  const patch = { status: TO[action], decided_by: actor, decided_at: now, decision_reason: action === 'reject' ? reason : (note ? String(note).slice(0, 200) : null) }
  if (newSlot) {
    patch.slot_id = newSlot.id
    patch.mode = newSlot.mode
    patch.proposed_at = now
    patch.expires_at = new Date(Math.min(Date.now() + 24 * 3600e3, new Date(newSlot.starts_at).getTime() - 2 * 3600e3)).toISOString()
  }

  // Conflict-safe: only succeeds if the booking is still in an allowed state
  const { data: updated, error: e1 } = await admin.from('agent_bookings').update(patch).eq('id', id).in('status', FROM[action]).select('*')
  if (e1) throw e1
  if (!updated?.length) {
    if (newSlot) await setSlot(newSlot.id, ['held'], 'open')
    return res.status(409).json({ error: 'This request was already handled or has expired. Refresh the queue.' })
  }
  const after = updated[0]

  if (action === 'approve' || action === 'confirm') await setSlot(after.slot_id, ['held'], 'booked')
  if (action === 'reject') await setSlot(booking.slot_id, ['held'], 'open')
  if (action === 'cancel') await setSlot(booking.slot_id, ['held', 'booked'], 'open')
  if (action === 'reschedule') await setSlot(booking.slot_id, ['held'], 'open')

  await logEvent({ booking_id: id, action, from_status: booking.status, to_status: after.status, actor, reason: action === 'reject' ? reason : null, note: note ? String(note).slice(0, 500) : null, slot_id: after.slot_id })

  const { data: slotRows } = await admin.from('slots').select('id, starts_at, mode, status').eq('id', after.slot_id)
  const message = draftMessage(action, after, slotRows?.[0], reason)
  res.status(200).json({ ok: true, booking: after, message, whatsapp_url: after.contact_phone && message ? waUrl(after.contact_phone, message) : null })
}

export default async function handler(req, res) {
  const staff = await requireStaff(req)
  if (!staff) return res.status(401).json({ error: 'Staff login required' })
  try {
    if (req.method === 'POST') return await act(req, res, staff)
    return await getQueue(res)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err.message || err) })
  }
}
