import { createClient } from '@supabase/supabase-js'

// Server-side only. The service-role key bypasses row-level security,
// so this file must never be imported by browser code.
export const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)
