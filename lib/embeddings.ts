import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) throw new Error('Missing GEMINI_API_KEY in environment')

const genai = new GoogleGenerativeAI(apiKey)
// text-embedding-004 outputs 768-dimensional vectors
const model = genai.getGenerativeModel({ model: 'text-embedding-004' })

/**
 * Returns a 768-dim embedding vector for the given text.
 * Pass taskType 'RETRIEVAL_DOCUMENT' when indexing, 'RETRIEVAL_QUERY' when searching.
 */
export async function embed(
  text: string,
  taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_DOCUMENT',
): Promise<number[]> {
  const result = await model.embedContent({
    content: { parts: [{ text }], role: 'user' },
    taskType,
  })
  return result.embedding.values
}
