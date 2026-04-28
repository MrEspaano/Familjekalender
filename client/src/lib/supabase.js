import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    'Saknade miljövariabler: VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY måste vara satta.'
  );
}

export const supabase = createClient(url, key);
