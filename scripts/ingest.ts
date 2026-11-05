/**
 * Ingestion script — reads all .md files under content/knowledge/,
 * chunks them, generates Gemini embeddings, and upserts into the
 * Supabase `knowledge_chunks` table.
 *
 * Run:  npx tsx scripts/ingest.ts
 *
 * Required env vars (set in .env.local):
 *   GEMINI_API_KEY
 *   SUPABASE_URL               (or VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config'
import fs   from 'node:fs'
import path from 'node:path'
import { embed }         from '../lib/embeddings'
import { chunkText }     from '../lib/chunking'
import { supabaseAdmin } from '../lib/supabaseAdmin'

const KNOWLEDGE_DIR = path.join(process.cwd(), 'content', 'knowledge')

async function ingestFile(filePath: string) {
  const source  = path.relative(process.cwd(), filePath)
  const rawText = fs.readFileSync(filePath, 'utf8')
  const chunks  = chunkText(rawText)

  console.log(`  ${source}: ${chunks.length} chunk(s)`)

  for (let i = 0; i < chunks.length; i++) {
    const content   = chunks[i]
    const embedding = await embed(content, 'RETRIEVAL_DOCUMENT')

    const { error } = await supabaseAdmin
      .from('knowledge_chunks')
      .upsert(
        { source, chunk_index: i, content, embedding },
        { onConflict: 'source,chunk_index' },
      )

    if (error) throw new Error(`Supabase upsert failed: ${error.message}`)
  }
}

async function main() {
  const files = fs.readdirSync(KNOWLEDGE_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(KNOWLEDGE_DIR, f))

  if (files.length === 0) {
    console.error('No .md files found in content/knowledge/')
    process.exit(1)
  }

  console.log(`Ingesting ${files.length} file(s)…`)
  for (const f of files) await ingestFile(f)
  console.log('Done.')
}

main().catch(err => { console.error(err); process.exit(1) })
