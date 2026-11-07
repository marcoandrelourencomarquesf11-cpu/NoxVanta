"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
export function AuthForm({ mode = "login" }: { mode?: "login" | "reset" | "signup" }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/account/update-password` });
        if (error) throw error;
        setMessage("Se existir uma conta para este email, receberá instruções de recuperação.");
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("A palavra-passe deve ter pelo menos 8 caracteres.");
        if (password !== confirmPassword) throw new Error("As palavras-passe não coincidem.");
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username: username.trim() } } });
        if (error) throw error;
        if (data.session) { router.push("/account/profile"); router.refresh(); }
        else setMessage("Conta criada. Confirma o teu email para ativares o acesso. Depois inicia sessão para consultares o teu Account_ID.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/account"); router.refresh();
      }
    } catch (err) { setMessage(err instanceof Error ? err.message : "Não foi possível concluir."); }
    finally { setBusy(false); }
  }
  return <form className="form-card" onSubmit={submit}>
    {mode === "signup" && <label>Nickname / nome de jogador<input value={username} onChange={e=>setUsername(e.target.value)} required maxLength={32} autoComplete="nickname" placeholder="O teu nickname"/></label>}
    <label>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}/></label>
    {mode !== "reset" && <label>Palavra-passe<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required value={password} onChange={e => setPassword(e.target.value)}/></label>}
    {mode === "signup" && <label>Confirmar palavra-passe<input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/></label>}
    <button className="button button-red" disabled={busy}>{busy ? "A processar..." : mode === "reset" ? "Enviar instruções" : mode === "signup" ? "Criar conta NOXVANTA" : "Iniciar sessão"}</button>
    {message && <p className="form-message" role="status">{message}</p>}
    {mode === "login" && <p className="privacy-note">Ainda não tens conta? <Link className="text-link" href="/register">Criar conta</Link></p>}
    {mode === "signup" && <p className="privacy-note">Já tens conta? <Link className="text-link" href="/login">Iniciar sessão</Link></p>}
  </form>;
}
