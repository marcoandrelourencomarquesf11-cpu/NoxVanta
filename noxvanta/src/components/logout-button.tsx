"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export function LogoutButton() {
  const router = useRouter();
  async function logout() { const supabase = createClient(); await supabase.auth.signOut(); router.push("/"); router.refresh(); }
  return <button className="button button-ghost" onClick={logout}>Terminar sessão</button>;
}
