import { createClient } from "@supabase/supabase-js";
import { DEFAULT_SUPABASE_URL } from "@shared/const";

/**
 * Valid-shaped placeholder so the bundle loads when `VITE_SUPABASE_ANON_KEY` is unset.
 * Set `VITE_SUPABASE_ANON_KEY` (Dashboard → Settings → API → anon public) for login and PostgREST.
 */
const PLACEHOLDER_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.local-preview-only";

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ||
  DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  PLACEHOLDER_ANON_KEY;

if (supabaseAnonKey === PLACEHOLDER_ANON_KEY) {
  console.warn(
    "[Supabase] Set VITE_SUPABASE_ANON_KEY in .env / .env.local (Settings → API → anon public). Login requires it."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
