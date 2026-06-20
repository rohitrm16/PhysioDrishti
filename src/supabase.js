import { createClient } from '@supabase/supabase-js'

export const db = createClient(
  'https://etndkfbegeccwjupmzyq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bmRrZmJlZ2VjY3dqdXBtenlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwOTEzNjYsImV4cCI6MjA5NDY2NzM2Nn0.JzuoJ4CY_DECkRVfFM5cL60Oe26P_NuUNLpRTiTJwOY'
)
