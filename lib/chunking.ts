/**
 * Split text into overlapping chunks suitable for embedding.
 * Strategy: paragraph-aware split, then merge/trim to stay within maxChars,
 * with an overlap of overlapChars to preserve context across boundaries.
 */
export function chunkText(
  text: string,
  maxChars = 1200,
  overlapChars = 200,
): string[] {
  // Split on blank lines (paragraph boundaries)
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)

  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxChars && current.length > 0) {
      chunks.push(current.trim())
      // Start next chunk with overlap from the tail of the previous one
      const overlap = current.slice(-overlapChars)
      current = overlap + '\n\n' + para
    } else {
      current = current ? current + '\n\n' + para : para
    }
  }

  if (current.trim()) chunks.push(current.trim())

  return chunks
}
