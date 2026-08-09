export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { messages } = req.body ?? {}
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' })
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return res.json({
      text: "Our AI chat is being set up. Please use the 'Book free call' button instead!",
      lead: null,
    })
  }

  const SYSTEM = `You are Maya, a warm and empathetic intake assistant at PhysioDrishti, a physiotherapy clinic based in Bengaluru, India.

Your job is to understand the patient's pain and collect their contact details so a specialist can call them back.

Collect these through natural conversation:
1. Where it hurts — pain area (REQUIRED)
2. How long they have had this — duration (nice to have, ask naturally)
3. Online session or in-person preference (nice to have)
4. Their first name (REQUIRED)
5. Their WhatsApp number (REQUIRED — ask after you know name and pain area)

Rules:
- Keep every reply to 1–2 short sentences maximum
- Never ask for more than one or two things at a time
- Be warm, reassuring, and human — never robotic or clinical
- Do NOT mention "booking form", "system", "AI", or anything technical
- Once you have name, phone number, and pain area, output this exact marker on its own line at the very end of your message:
  LEAD_READY:{"name":"[name]","phone":"[phone]","pain":"[pain area]","note":"[any extra context collected]"}
- After the LEAD_READY line, write one short warm closing message reassuring them the doctor will call back soon`

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: SYSTEM,
        messages,
      }),
    })

    if (!r.ok) {
      console.error('Anthropic API error:', r.status, await r.text())
      return res.json({
        text: "I'm having a bit of trouble right now. Please use the 'Book free call' button and we'll be with you shortly!",
        lead: null,
      })
    }

    const data = await r.json()
    const raw = data.content?.[0]?.text ?? ''

    const leadMatch = raw.match(/LEAD_READY:(\{[^\n]+\})/)
    let lead = null
    if (leadMatch) {
      try { lead = JSON.parse(leadMatch[1]) } catch (e) { console.error('Lead parse error', e) }
    }

    const text = raw.replace(/\nLEAD_READY:\{[^\n]+\}/g, '').replace(/LEAD_READY:\{[^\n]+\}/g, '').trim()
    res.json({ text, lead })
  } catch (err) {
    console.error('Chat handler error:', err)
    res.json({ text: "Something went wrong on our end. Please try the booking form!", lead: null })
  }
}
