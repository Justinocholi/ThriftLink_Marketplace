// Frontend Supabase client — used only for OAuth (Google/Facebook) redirects.
// Regular email/password auth goes through our backend. If the env vars are
// missing the client is null and the social login buttons are hidden.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (url && anonKey) ? createClient(url, anonKey) : null;
