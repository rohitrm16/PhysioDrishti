// Split text into ~size-character chunks on paragraph boundaries,
// carrying a small word-aligned overlap into the next chunk.
export function chunkText(text, size = 900, overlap = 150) {
  const paras = String(text).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const chunks = []
  let cur = ''
  for (const p of paras) {
    if (cur && (cur + '\n\n' + p).length > size) {
      chunks.push(cur)
      const tail = cur.slice(-overlap).replace(/^\S*\s/, '')
      cur = tail + '\n\n' + p
    } else {
      cur = cur ? cur + '\n\n' + p : p
    }
  }
  if (cur) chunks.push(cur)
  return chunks
}
