import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
const MATCH_COUNT = 5;
const MATCH_THRESHOLD = 0.5;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ error: "Missing required query parameter: q" });

  const geminiKey  = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!geminiKey)   return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  if (!supabaseUrl) return res.status(500).json({ error: "SUPABASE_URL is not configured" });
  if (!serviceKey)  return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" });

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    // 1. Embed the query
    const embedResponse = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [q],
      config: {
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    });

    const embedding = embedResponse.embeddings?.[0]?.values;
    if (!embedding) throw new Error("Gemini returned no embedding");

    // 2. Vector search via match_chunks RPC (defined in supabase/migrations/)
    const { data, error } = await supabase.rpc("match_chunks", {
      query_embedding: embedding,
      match_count: MATCH_COUNT,
      match_threshold: MATCH_THRESHOLD,
    });

    if (error) throw new Error(`Supabase RPC error: ${error.message}`);

    const results = (data ?? []).map((row) => ({
      content:      row.content,
      similarity:   row.similarity,
      title:        row.metadata?.title ?? null,
      slug:         row.metadata?.slug ?? null,
      source_type:  row.metadata?.source_type ?? null,
      body_area:    row.metadata?.body_area ?? null,
    }));

    return res.json({ query: q, results });
  } catch (err) {
    console.error("ask handler error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
