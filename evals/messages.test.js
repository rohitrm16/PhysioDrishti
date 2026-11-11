/**
 * Unit tests for lib/messages.js — pure functions, no DB, no API keys.
 * Verifies the WhatsApp confirmation message contains date/time and Meet link.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// lib/messages.js → lib/tools.js → lib/db.js (Supabase client).
// Mock db.js so the Supabase constructor doesn't run; formatSlot is pure and needs no admin.
vi.mock('../lib/db.js', () => ({ admin: {} }))

import { draftMessage, waUrl } from '../lib/messages.js'

const SLOT = { starts_at: '2026-11-12T12:30:00.000Z', mode: 'online', status: 'booked' }
const HOME_SLOT = { starts_at: '2026-11-12T12:30:00.000Z', mode: 'home', status: 'booked' }
const BOOKING = { id: 1, contact_name: 'Ravi', contact_phone: '9876543210', mode: 'online', session_id: 'abc' }
const HOME_BOOKING = { ...BOOKING, mode: 'home' }

describe('draftMessage — approve', () => {
  const origMeet = process.env.MEET_LINK

  beforeEach(() => { process.env.MEET_LINK = 'https://meet.google.com/abc-defg-hij' })
  afterEach(() => {
    if (origMeet === undefined) delete process.env.MEET_LINK
    else process.env.MEET_LINK = origMeet
  })

  it('includes patient name', () => {
    expect(draftMessage('approve', BOOKING, SLOT)).toContain('Ravi')
  })

  it('includes the slot date and time', () => {
    const msg = draftMessage('approve', BOOKING, SLOT)
    // formatSlot renders in IST — Nov 12 12:30 UTC = Nov 12 18:00 IST
    expect(msg).toMatch(/nov|12/i)
    expect(msg).toMatch(/6:00 pm|18:00/i)
  })

  it('includes the Meet link when MEET_LINK is set', () => {
    const msg = draftMessage('approve', BOOKING, SLOT)
    expect(msg).toContain('https://meet.google.com/abc-defg-hij')
  })

  it('does NOT include Meet link for home-visit bookings', () => {
    const msg = draftMessage('approve', HOME_BOOKING, HOME_SLOT)
    expect(msg).not.toContain('meet.google.com')
  })

  it('falls back gracefully when MEET_LINK is not set', () => {
    delete process.env.MEET_LINK
    const msg = draftMessage('approve', BOOKING, SLOT)
    expect(msg).toContain('We will share the video link')
  })

  it('includes a reply prompt', () => {
    expect(draftMessage('approve', BOOKING, SLOT)).toContain('Reply here')
  })
})

describe('draftMessage — reschedule', () => {
  it('mentions the proposed new time', () => {
    const msg = draftMessage('reschedule', BOOKING, SLOT)
    expect(msg).toMatch(/nov|12/i)
    expect(msg).toContain('YES')
  })
})

describe('draftMessage — reject', () => {
  it('needs_doctor_first message is clear', () => {
    const msg = draftMessage('reject', BOOKING, SLOT, 'needs_doctor_first')
    expect(msg.toLowerCase()).toContain('doctor')
  })

  it('area_not_covered offers online alternative', () => {
    const msg = draftMessage('reject', BOOKING, SLOT, 'area_not_covered')
    expect(msg.toLowerCase()).toContain('online')
  })
})

describe('waUrl', () => {
  it('formats 10-digit Indian number with country code', () => {
    expect(waUrl('9876543210', 'hello')).toContain('wa.me/919876543210')
  })

  it('handles number with leading 0', () => {
    expect(waUrl('09876543210', 'hello')).toContain('wa.me/919876543210')
  })

  it('handles number already with 91 prefix', () => {
    expect(waUrl('919876543210', 'hello')).toContain('wa.me/919876543210')
  })

  it('URL-encodes the message text', () => {
    const url = waUrl('9876543210', 'Hi Ravi, confirmed for Wed 6:00 PM.')
    expect(url).toContain('%2C')     // comma encoded
    expect(url).not.toContain(' ')   // no raw spaces
  })
})
