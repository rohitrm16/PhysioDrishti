import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.SUPABASE_URL  ?? process.env.VITE_SUPABASE_URL!
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
}

// Server-side client — uses service role key, bypasses RLS.
// Never expose this in browser code.
export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
})
