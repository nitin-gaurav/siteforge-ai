import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isUsableUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

const hasConfiguredSupabase =
  isUsableUrl(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes("your_") &&
  !supabaseAnonKey.includes("your_");

export const isSupabaseConfigured = hasConfiguredSupabase;

export const supabase = createClient(
  hasConfiguredSupabase ? supabaseUrl : "http://127.0.0.1:54321",
  hasConfiguredSupabase ? supabaseAnonKey : "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
