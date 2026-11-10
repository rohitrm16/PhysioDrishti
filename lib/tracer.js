// Writes one row per step to agent_traces. Never throws (tracing must not break requests).
import crypto from 'node:crypto'
import { admin } from './db.js'

export function createTracer(sessionId = crypto.randomUUID()) {
  let step = 0
  const steps = []
  return {
    session: sessionId,
    steps,
    async log(tool, input, output, startedAt, extra = {}) {
      step += 1
      const latency_ms = Math.round(Date.now() - startedAt)
      steps.push({ step, tool, latency_ms, ...extra })
      const { error } = await admin.from('agent_traces').insert({
        session_id: sessionId, step, tool, input, output, latency_ms, ...extra,
      })
      if (error) console.error('trace insert failed:', error.message)
    },
  }
}
