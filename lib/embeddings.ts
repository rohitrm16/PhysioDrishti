import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

/**
 * Returns a 768-dim embedding vector for a single text string.
 * For batch ingestion use the embedBatch helper in scripts/ingest.ts directly.
 */
export async function embed(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT",
  title?: string,
): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: [text],
    config: {
      taskType,
      outputDimensionality: EMBEDDING_DIMENSIONS,
      ...(title ? { title } : {}),
    },
  });

  const values = response.embeddings?.[0]?.values;
  if (!values) throw new Error("No embedding returned from Gemini");
  return values;
}
