// POST /api/voice  { audio: base64, mime, history?, contact? }
// Browser audio -> Sarvam STT -> agent -> Sarvam TTS -> audio back.
// Every stage is traced under one session id.
import { runAgent } from '../lib/agent.js'
import { speechToText, textToSpeech, STT_MODEL, TTS_MODEL } from '../lib/sarvam.js'
import { createTracer } from '../lib/tracer.js'
import { maskPii } from '../lib/pii.js'
import { isRateLimited, clientIp } from '../lib/limit.js'

export const config = { maxDuration: 60 }
const MAX_BYTES = 2_500_000   // about 30 seconds of compressed audio

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })
  if (await isRateLimited('voice:' + clientIp(req), 6)) return res.status(429).json({ error: 'Too many requests. Try again in a minute.' })

  const { audio, mime, history, contact } = req.body || {}
  let buffer
  try { buffer = Buffer.from(String(audio || ''), 'base64') } catch { buffer = Buffer.alloc(0) }
  if (!buffer.length) return res.status(400).json({ error: 'No audio received' })
  if (buffer.length > MAX_BYTES) return res.status(413).json({ error: 'Recording too long. Keep it under 25 seconds.' })

  const tracer = createTracer()
  try {
    // 1. Speech to text (English translation + detected language)
    let t = Date.now()
    const stt = await speechToText(buffer, mime)
    const transcript = maskPii(stt.transcript)
    await tracer.log('stt', { bytes: buffer.length, mime: String(mime || '') }, { transcript, language: stt.language }, t, { model: STT_MODEL })

    if (!transcript) {
      return res.status(200).json({ session: tracer.session, transcript: '', reply: 'Sorry, I did not catch that. Please try again.', audio: null })
    }

    // 2. Agent (tools + LLM), reply in the patient language
    const r = await runAgent({ message: transcript, history: Array.isArray(history) ? history : [], contact, language: stt.language, channel: 'voice', tracer })

    // 3. Text to speech (falls back to text-only if it fails)
    t = Date.now()
    let speech = null
    try {
      speech = await textToSpeech(r.reply, stt.language)
      await tracer.log('tts', { chars: speech.chars, language: speech.language, speaker: speech.speaker }, {
        est_inr: Number(((speech.chars / 10000) * 20).toFixed(4)),
      }, t, { model: TTS_MODEL })
    } catch (err) {
      await tracer.log('tts', { language: stt.language }, { error: String(err.message || err).slice(0, 200) }, t, { model: TTS_MODEL })
    }

    res.status(200).json({
      session: tracer.session, transcript, language: stt.language, reply: r.reply,
      refused: r.refused, reason: r.reason, citations: r.citations, booking: r.booking,
      audio: speech?.base64 ? { mime: speech.mime, base64: speech.base64 } : null,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
