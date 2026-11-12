// Records one row per step in agent_traces.
// Inserts run in the background (no waiting between steps); call flush() before responding.
// Tracing never throws: it must not break a patient request.
import crypto from 'node:crypto'
import { admin } from './db.js'

export function createTracer(sessionId = crypto.randomUUID()) {
  let step = 0
  const steps = []
  const pending = []
  return {
    session: sessionId,
    steps,
    log(tool, input, output, startedAt, extra = {}) {
      step += 1
      const latency_ms = Math.round(Date.now() - startedAt)
      steps.push({ step, tool, latency_ms, ...extra })
      const p = admin.from('agent_traces')
        .insert({ session_id: sessionId, step, tool, input, output, latency_ms, ...extra })
        .then(({ error }) => { if (error) console.error('trace insert failed:', error.message) },
              (err) => console.error('trace insert failed:', err?.message || err))
      pending.push(p)
      return Promise.resolve()
    },
    async flush() {
      await Promise.allSettled(pending)
    },
  }
}
