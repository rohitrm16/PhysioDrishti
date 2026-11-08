-- Run this in the Supabase SQL editor or via `supabase db push`.

-- 1. Enable pgvector
create extension if not exists vector;

-- 2. Documents table — one row per source .md file
create table if not exists documents (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  language     text not null default 'en',
  source_type  text not null default 'education',
  content      text not null,
  content_hash text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 3. Chunks table — one row per embedding chunk
create table if not exists chunks (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references documents(id) on delete cascade,
  chunk_index    int  not null,
  content        text not null,
  token_estimate int,
  embedding      vector(768),
  metadata       jsonb not null default '{}',
  content_hash   text not null,
  created_at     timestamptz not null default now(),
  unique (document_id, chunk_index)
);

-- 4. IVFFlat index for fast approximate nearest-neighbour search
--    (create after ingesting at least a few hundred chunks for best results)
create index if not exists chunks_embedding_idx
  on chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- 5. match_chunks RPC — called by api/ask.js
create or replace function match_chunks(
  query_embedding  vector(768),
  match_count      int     default 5,
  match_threshold  float   default 0.5,
  filter           jsonb   default '{}'
)
returns table (
  id             uuid,
  document_id    uuid,
  chunk_index    int,
  content        text,
  token_estimate int,
  metadata       jsonb,
  similarity     float
)
language sql stable
as $$
  select
    chunks.id,
    chunks.document_id,
    chunks.chunk_index,
    chunks.content,
    chunks.token_estimate,
    chunks.metadata,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where
    (1 - (chunks.embedding <=> query_embedding)) >= match_threshold
    and (filter = '{}' or chunks.metadata @> filter)
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- 6. Keep updated_at current
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_updated_at
  before update on documents
  for each row execute function set_updated_at();
