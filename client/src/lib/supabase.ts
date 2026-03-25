import { createClient } from "@supabase/supabase-js";

/** Valid-shaped defaults so the app bundle loads without throwing when env is unset (e.g. static `serve` of `dist/public`). Auth and DB calls need real `VITE_*` values. */
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.local-preview-only";

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || PLACEHOLDER_URL;
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  PLACEHOLDER_ANON_KEY;

if (
  supabaseUrl === PLACEHOLDER_URL ||
  supabaseAnonKey === PLACEHOLDER_ANON_KEY
) {
  console.warn(
    "[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set (or incomplete); using placeholders. Set them for auth and synced data."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "implicit",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
