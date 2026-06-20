import { createClient } from '@supabase/supabase-js'

export const db = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)
