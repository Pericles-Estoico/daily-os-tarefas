// ============================================
// Supabase Client Configuration
// External Supabase Instance (NOT Lovable Cloud)
// ============================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const SUPABASE_URL = 'https://hhnalonntmpfizalvfnu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Yaup9zmeax9fQMCxb27p1Q_Q5kJ1n8L';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export { SUPABASE_URL };
