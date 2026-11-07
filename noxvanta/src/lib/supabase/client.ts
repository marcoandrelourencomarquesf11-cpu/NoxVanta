import { createBrowserClient } from "@supabase/ssr";
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase não configurado. Preencha as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  return createBrowserClient(url, key, { cookieOptions: { maxAge: 60 * 60 * 24 * 365 }, auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
}
