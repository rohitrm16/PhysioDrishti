// POST /api/agent { message, session_id?, contact?, history? }
// Runs a Gemini agent loop with tool calling.
// contact: { name, phone } — filled by the contact form in the UI
// history: Gemini contents array from prior turns (client stores + echoes back)
import crypto from 'node:crypto'
import { chat, GEN_MODEL, costUsd } from '../lib/gemini.js'
import { TOOL_DEFS, runTool } from '../lib/tools.js'
import { maskPii } from '../lib/pii.js'
import { admin } from '../lib/db.js'

const SYSTEM = `You are Drishti, PhysioDrishti's friendly booking assistant.
Your goal: understand the patient's concern, offer helpful information, then book a session.

RULES (follow every one):
1. When the patient mentions any symptom, call check_red_flags first. If flagged, stop and relay the message exactly.
2. For health or treatment questions, call search_knowledge. Use only what the sources say.
3. When the patient is ready to book, call suggest_slots to show available times.
4. When the patient picks a slot, call create_booking.
5. Never ask for a phone number in the chat. Tell them to fill the contact form on screen.
6. Keep replies short and warm — under 80 words. Use plain language.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const { message, session_id, contact, history = [] } = req.body || {}
  const text = String(message || '').trim().slice(0, 500)
  if (!text) return res.status(400).json({ error: 'message is required' })

  const session = session_id || crypto.randomUUID()
  const ctx = { session, contact: contact || null, channel: 'web', sources: [], booking: null }

  // Append new user message to history
  let contents = [...history, { role: 'user', parts: [{ text: maskPii(text) }] }]

  let reply = ''
  let totalIn = 0
  let totalOut = 0

  try {
    // Agent loop: up to 6 tool calls per turn
    for (let i = 0; i < 6; i++) {
      const result = await chat(SYSTEM, contents, TOOL_DEFS)
      totalIn += result.tokensIn
      totalOut += result.tokensOut
      contents = [...contents, { role: result.role || 'model', parts: result.parts }]

      if (!result.functionCall) {
        reply = result.text
        break
      }

      const { name, args } = result.functionCall
      const toolResult = await runTool(name, args, ctx)
      contents = [...contents, { role: 'user', parts: [{ functionResponse: { name, response: toolResult } }] }]
    }

    // Log the turn
    await admin.from('agent_traces').insert({
      session_id: session, step: 1, tool: 'agent_turn',
      input: { question: maskPii(text) },
      output: { reply: reply.slice(0, 500), booking: ctx.booking },
      latency_ms: 0, model: GEN_MODEL,
      tokens_in: totalIn, tokens_out: totalOut, cost_usd: costUsd(totalIn, totalOut),
    }).then(({ error }) => { if (error) console.error('trace insert:', error.message) })

    res.status(200).json({
      reply: reply || "I'm having a little trouble right now. Please try again.",
      session_id: session,
      booking: ctx.booking,
      history: contents,
    })
  } catch (err) {
    console.error('agent error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
