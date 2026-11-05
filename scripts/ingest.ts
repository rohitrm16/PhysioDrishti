import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import { encodingForModel } from "js-tiktoken";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
const MAX_CHUNK_TOKENS = 700;
const CHUNK_OVERLAP_TOKENS = 80;
const BATCH_SIZE = 8;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const encoder = encodingForModel("gpt-4o-mini");

function sha1(value: string) {
  return crypto.createHash("sha1").update(value).digest("hex");
}

function chunkText(text: string) {
  const tokens = encoder.encode(text);
  const chunks: string[] = [];

  let start = 0;
  while (start < tokens.length) {
    const end = Math.min(start + MAX_CHUNK_TOKENS, tokens.length);
    chunks.push(encoder.decode(tokens.slice(start, end)));
    if (end === tokens.length) break;
    start = end - CHUNK_OVERLAP_TOKENS;
  }

  return chunks;
}

async function embedBatch(texts: string[], titles: string[]) {
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: texts,
    config: {
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: EMBEDDING_DIMENSIONS,
      title: titles[0],
    },
  });

  const embeddings = response.embeddings?.map((item) => item.values);
  if (!embeddings || embeddings.length !== texts.length) {
    throw new Error(`Embedding count mismatch: expected ${texts.length}`);
  }

  return embeddings;
}

async function upsertDocument(file: string) {
  const raw = await fs.readFile(file, "utf8");
  const { data: frontmatter, content } = matter(raw);

  const slug = frontmatter.slug ?? path.basename(file, ".md");
  const title = frontmatter.title ?? slug;
  const language = frontmatter.language ?? "en";
  const sourceType = frontmatter.source_type ?? "education";
  const contentHash = sha1(content);

  const { data: existing, error: existingError } = await supabase
    .from("documents")
    .select("id, content_hash")
    .eq("slug", slug)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.content_hash === contentHash) {
    console.log(`↩︎ unchanged: ${slug}`);
    return;
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .upsert(
      {
        slug,
        title,
        language,
        source_type: sourceType,
        content,
        content_hash: contentHash,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (documentError) throw documentError;

  // Deleting chunks first makes re-ingestion deterministic.
  await supabase.from("chunks").delete().eq("document_id", document.id);

  const pieces = chunkText(content);
  const metadata = {
    slug,
    title,
    language,
    source_type: sourceType,
    body_area: frontmatter.body_area ?? null,
    audience: frontmatter.audience ?? "patient",
  };

  for (let i = 0; i < pieces.length; i += BATCH_SIZE) {
    const batch = pieces.slice(i, i + BATCH_SIZE);
    const embeddings = await embedBatch(
      batch,
      batch.map(() => title)
    );

    const rows = batch.map((chunk, batchIndex) => ({
      document_id: document.id,
      chunk_index: i + batchIndex,
      content: chunk,
      token_estimate: encoder.encode(chunk).length,
      embedding: embeddings[batchIndex],
      metadata,
      content_hash: sha1(chunk),
    }));

    const { error } = await supabase.from("chunks").insert(rows);
    if (error) throw error;
  }

  console.log(`✓ ingested ${slug}: ${pieces.length} chunks`);
}

async function main() {
  const dir = path.join(process.cwd(), "content/knowledge");
  const files = (await fs.readdir(dir))
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.join(dir, file));

  if (files.length === 0) throw new Error("No Markdown documents found");

  for (const file of files) {
    await upsertDocument(file);
  }

  console.log(`Done: ${files.length} documents`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
