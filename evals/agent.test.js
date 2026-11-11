/**
 * Agent tool-selection evals — no network, no DB, no API keys.
 * Mocks: lib/llm.js (LLM calls), lib/tools.js (runTool), lib/tracer.js (DB writes).
 * Real:  lib/safety.js, lib/pii.js (pure functions — tested as-is).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- mock tracer (records tool names, skips DB) ---
vi.mock('../lib/tracer.js', () => ({
  createTracer: () => {
    const steps = []
    return {
      session: 'test-session',
      steps,
      log: vi.fn(async (tool, _input, _output, _t) => { steps.push(tool) }),
    }
  },
}))

// --- mock LLM (createChat returns scripted step() sequences) ---
const mockStep = vi.fn()
const mockChat = {
  addHistory: vi.fn(),
  addUser: vi.fn(),
  addToolResults: vi.fn(),
  step: mockStep,
}
vi.mock('../lib/llm.js', () => ({ createChat: vi.fn(() => mockChat), PROVIDER: 'gemini' }))

// --- mock tools (runTool returns scripted results, TOOL_DEFS unused) ---
vi.mock('../lib/tools.js', () => ({ TOOL_DEFS: [], runTool: vi.fn() }))

import { runAgent } from '../lib/agent.js'
import { createChat } from '../lib/llm.js'
import { runTool } from '../lib/tools.js'

// ── helpers ──────────────────────────────────────────────────────────────────

/** LLM turn that returns a plain text reply (no tool calls). */
const textStep = (text) => ({ text, calls: [], model: 'gemini-test', tokensIn: 10, tokensOut: 20, costUsd: 0.0001 })

/** LLM turn that calls one or more tools. */
const toolStep = (...calls) => ({
  text: '',
  calls: calls.map((c) => ({ id: c.name, name: c.name, args: c.args || {} })),
  model: 'gemini-test', tokensIn: 10, tokensOut: 20, costUsd: 0.0001,
})

const reset = () => {
  vi.clearAllMocks()
  mockChat.addHistory.mockReset()
  mockChat.addUser.mockReset()
  mockChat.addToolResults.mockReset()
  mockStep.mockReset()
}

// ── safety guard (pre-LLM) ───────────────────────────────────────────────────

describe('safety guard fires before any LLM call', () => {
  beforeEach(reset)

  it('refuses chest-pain message; createChat is never called', async () => {
    const r = await runAgent({ message: 'I have chest pain when climbing stairs' })
    expect(r.refused).toBe(true)
    expect(r.reason).toBe('red_flag')
    expect(createChat).not.toHaveBeenCalled()
    expect(r.steps).not.toContain('llm')
  })

  it('refuses bladder-control / cauda-equina message', async () => {
    const r = await runAgent({ message: 'Since this morning I cannot control my bladder and my back hurts' })
    expect(r.refused).toBe(true)
    expect(r.reason).toBe('red_flag')
    expect(createChat).not.toHaveBeenCalled()
  })

  it('refuses medication-dosage question; createChat is never called', async () => {
    const r = await runAgent({ message: 'What dose of ibuprofen should I take for back pain?' })
    expect(r.refused).toBe(true)
    expect(r.reason).toBe('medication')
    expect(createChat).not.toHaveBeenCalled()
  })
})

// ── PII masking ──────────────────────────────────────────────────────────────

describe('PII masking', () => {
  beforeEach(reset)

  it('masks Indian mobile number before the LLM or trace sees it', async () => {
    mockStep.mockResolvedValueOnce(textStep('Happy to help with knee pain.'))
    const r = await runAgent({ message: 'My phone is 9123456789 and I have knee pain' })
    expect(r.question).toContain('[PHONE]')
    expect(r.question).not.toContain('9123456789')
  })

  it('masks email address', async () => {
    mockStep.mockResolvedValueOnce(textStep('Lower back pain usually improves in a few weeks.'))
    const r = await runAgent({ message: 'Contact me at patient@example.com — I have lower back pain' })
    expect(r.question).toContain('[EMAIL]')
    expect(r.question).not.toContain('patient@example.com')
  })
})

// ── tool selection ───────────────────────────────────────────────────────────

describe('tool selection', () => {
  beforeEach(reset)

  it('calls search_knowledge for a health question', async () => {
    mockStep
      .mockResolvedValueOnce(toolStep({ name: 'search_knowledge', args: { query: 'lower back pain recovery' } }))
      .mockResolvedValueOnce(textStep('Lower back pain usually improves in a few weeks with gentle movement.'))
    runTool.mockResolvedValueOnce({ results: [{ title: 'Lower back pain', similarity: 0.78, text: 'Gentle movement helps.' }] })

    await runAgent({ message: 'How long does lower back pain take to get better?' })
    expect(runTool.mock.calls.map((c) => c[0])).toContain('search_knowledge')
  })

  it('calls check_red_flags when the LLM decides to (non-blocking symptom mention)', async () => {
    mockStep
      .mockResolvedValueOnce(toolStep({ name: 'check_red_flags', args: { text: 'my knee swells after exercise' } }))
      .mockResolvedValueOnce(textStep('Mild swelling after exercise can be normal.'))
    runTool.mockResolvedValueOnce({ flagged: false, medication_question: false })

    await runAgent({ message: 'my knee swells after exercise, is that normal?' })
    expect(runTool.mock.calls.map((c) => c[0])).toContain('check_red_flags')
  })

  it('stops early when the LLM-called check_red_flags returns flagged=true', async () => {
    // Message that bypasses the pre-LLM pattern guard but the LLM decides to check
    mockStep.mockResolvedValueOnce(toolStep({ name: 'check_red_flags', args: { text: 'numbness in foot and weakness in left leg for two days' } }))
    runTool.mockResolvedValueOnce({ flagged: true, medication_question: false })

    const r = await runAgent({ message: 'I have numbness in my foot and weakness in my left leg for two days' })
    expect(r.refused).toBe(true)
    expect(r.reason).toBe('red_flag')
    // Exactly one LLM step (which returned the tool call), then the agent stopped
    expect(mockStep).toHaveBeenCalledTimes(1)
  })
})

// ── booking flow ─────────────────────────────────────────────────────────────

describe('booking flow', () => {
  beforeEach(reset)

  it('calls suggest_slots before create_booking', async () => {
    mockStep
      .mockResolvedValueOnce(toolStep({ name: 'suggest_slots', args: { part_of_day: 'evening' } }))
      .mockResolvedValueOnce(toolStep({ name: 'create_booking', args: { slot_id: 1, summary: 'Knee pain on stairs' } }))
      .mockResolvedValueOnce(textStep('Your booking request has been sent. A clinician will confirm on WhatsApp.'))
    runTool
      .mockResolvedValueOnce({ slots: [{ slot_id: 1, when: 'Wed, 12 Nov 6:00 PM', mode: 'online' }] })
      // create_booking: real impl sets ctx.booking; mock must do the same
      .mockImplementationOnce(async (_name, _args, ctx) => {
        ctx.booking = { id: 42, when: 'Wed, 12 Nov 6:00 PM', mode: 'online', status: 'pending_approval' }
        return { ok: true, booking_id: 42, when: 'Wed, 12 Nov 6:00 PM', status: 'pending_approval', instruction: 'Tell the patient.' }
      })

    const r = await runAgent({ message: 'Book tomorrow evening', contact: { name: 'Ravi', phone: '9876543210' } })
    const order = runTool.mock.calls.map((c) => c[0])
    expect(order.indexOf('suggest_slots')).toBeLessThan(order.indexOf('create_booking'))
    expect(r.booking).not.toBeNull()
    expect(r.refused).toBe(false)
  })

  it('does not complete booking when contact is missing', async () => {
    mockStep
      .mockResolvedValueOnce(toolStep({ name: 'suggest_slots', args: {} }))
      .mockResolvedValueOnce(toolStep({ name: 'create_booking', args: { slot_id: 1, summary: 'back pain' } }))
      .mockResolvedValueOnce(textStep('Please fill in your contact details in the box on screen.'))
    runTool
      .mockResolvedValueOnce({ slots: [{ slot_id: 1, when: 'Tomorrow 6pm', mode: 'online' }] })
      .mockResolvedValueOnce({ ok: false, error: 'contact_required', instruction: 'Ask the patient to fill the contact box on screen, then try again.' })

    const r = await runAgent({ message: 'Book a session', contact: null })
    expect(r.booking).toBeNull()
    expect(r.refused).toBe(false)
  })

  it('reply does not ask patient to say their phone number in the chat', async () => {
    mockStep
      .mockResolvedValueOnce(toolStep({ name: 'create_booking', args: { slot_id: 1, summary: 'back pain' } }))
      .mockResolvedValueOnce(textStep('Please fill in your name and WhatsApp number in the contact box on screen.'))
    runTool.mockResolvedValueOnce({ ok: false, error: 'contact_required', instruction: 'Ask the patient to fill the contact box on screen.' })

    const r = await runAgent({ message: 'book slot 1', contact: null })
    // Must not ask patient to say/type phone in the message thread
    expect(r.reply.toLowerCase()).not.toMatch(/say.*(?:phone|number)|type.*(?:phone|number)|tell.*(?:phone|number)/)
  })

  it('does not book the same slot twice in one session', async () => {
    // First booking succeeds
    mockStep
      .mockResolvedValueOnce(toolStep({ name: 'create_booking', args: { slot_id: 1, summary: 'knee' } }))
      .mockResolvedValueOnce(textStep('Booking sent.'))
    runTool.mockImplementationOnce(async (_name, _args, ctx) => {
      ctx.booking = { id: 7, when: '6pm', mode: 'online', status: 'pending_approval' }
      return { ok: true, booking_id: 7, when: '6pm', status: 'pending_approval', instruction: 'Tell the patient.' }
    })

    const r = await runAgent({ message: 'Book slot 1', contact: { name: 'Ravi', phone: '9876543210' } })
    expect(r.booking?.id).toBe(7)

    // Second runAgent call reuses the same tracer/ctx so ctx.booking is already set.
    // Test via runTool returning already_booked:
    reset()
    mockStep
      .mockResolvedValueOnce(toolStep({ name: 'create_booking', args: { slot_id: 2, summary: 'knee' } }))
      .mockResolvedValueOnce(textStep('You already have a booking in this session.'))
    runTool.mockResolvedValueOnce({ ok: false, error: 'already_booked', booking_id: 7 })

    const r2 = await runAgent({ message: 'Book slot 2', contact: { name: 'Ravi', phone: '9876543210' } })
    // No second booking created
    expect(r2.booking).toBeNull()
  })
})
