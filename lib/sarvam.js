// Sarvam AI speech APIs (Bengaluru-based). Keys stay server-side.
const BASE = 'https://api.sarvam.ai'
export const STT_MODEL = process.env.SARVAM_STT_MODEL || 'saaras:v3'
export const TTS_MODEL = process.env.SARVAM_TTS_MODEL || 'bulbul:v4-flash'
export const TTS_LANGS = ['en-IN', 'hi-IN', 'bn-IN', 'ta-IN', 'te-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'gu-IN', 'pa-IN', 'od-IN']
const DEFAULT_SPEAKERS = { 'en-IN': 'simran_en_customer', 'hi-IN': 'aparna_hi_customer' }

// Speech -> English text (mode=translate), plus the language the patient spoke.
export async function speechToText(buffer, mime = 'audio/webm') {
  const type = String(mime).split(';')[0] || 'audio/webm'
  const ext = type.includes('mp4') || type.includes('m4a') ? 'm4a' : type.includes('ogg') ? 'ogg' : type.includes('wav') ? 'wav' : 'webm'
  const form = new FormData()
  form.append('file', new Blob([buffer], { type }), `speech.${ext}`)
  form.append('model', STT_MODEL)
  form.append('mode', 'translate')
  form.append('language_code', 'unknown')
  const res = await fetch(`${BASE}/speech-to-text`, { method: 'POST', headers: { 'api-subscription-key': process.env.SARVAM_API_KEY || '' }, body: form })
  if (!res.ok) throw new Error(`Sarvam STT ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  return { transcript: String(data.transcript || '').trim(), language: data.language_code || 'en-IN' }
}

// Text -> speech. Returns base64 audio.
export async function textToSpeech(text, language = 'en-IN') {
  const code = TTS_LANGS.includes(language) ? language : 'en-IN'
  const envSpeaker = process.env[`SARVAM_SPEAKER_${code.split('-')[0].toUpperCase()}`]
  const speaker = envSpeaker || DEFAULT_SPEAKERS[code]
  const body = {
    text: String(text).slice(0, 1500),
    target_language_code: code,
    model: TTS_MODEL,
    speech_sample_rate: 24000,
    output_audio_codec: 'mp3',
  }
  if (speaker) body.speaker = speaker
  const res = await fetch(`${BASE}/text-to-speech`, {
    method: 'POST',
    headers: { 'api-subscription-key': process.env.SARVAM_API_KEY || '', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Sarvam TTS ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  return { base64: data.audios?.[0] || '', mime: 'audio/mpeg', language: code, speaker: speaker || 'api-default', chars: body.text.length }
}
