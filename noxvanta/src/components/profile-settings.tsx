"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ProfileSettings({ initialName, email, accountId }: { initialName: string; email: string; accountId: string }) {
  const [name, setName] = useState(initialName);
  const [newEmail, setNewEmail] = useState(email);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function saveProfile() {
    setBusy(true); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ username: name.trim() }).select().single();
    setBusy(false); setMessage(error ? `Não foi possível atualizar o perfil: ${error.message}` : "Nome atualizado com sucesso.");
  }
  async function saveEmail() {
    setBusy(true); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setBusy(false); setMessage(error ? error.message : "Pedido enviado. Confirma a alteração através do email recebido.");
  }
  async function savePassword() {
    if (password.length < 8) { setMessage("A palavra-passe deve ter pelo menos 8 caracteres."); return; }
    setBusy(true); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false); setPassword(""); setMessage(error ? error.message : "Palavra-passe atualizada.");
  }
  return <div className="profile-settings">
    <section className="card profile-card account-id-card"><span className="card-label">IDENTIFICADOR DE CONTA</span><h2>O teu Account_ID</h2><p className="account-id-value">{accountId}</p><button type="button" className="button button-ghost" onClick={()=>{navigator.clipboard.writeText(accountId);setMessage("Account_ID copiado.")}}>Copiar Account_ID</button><p className="privacy-note">Envia este identificador ao Owner para poderes ser associado ao plantel depois da aprovação. Não é uma palavra-passe.</p></section>
    <section className="card profile-card"><span className="card-label">IDENTIDADE NXV</span><h2>Perfil pessoal</h2><label>Nome de apresentação<input value={name} onChange={e=>setName(e.target.value)} maxLength={32} placeholder="O teu nickname"/></label><button className="button button-red" disabled={busy || !name.trim()} onClick={saveProfile}>Guardar nome</button></section>
    <section className="card profile-card"><span className="card-label">SEGURANÇA</span><h2>Endereço de email</h2><p className="privacy-note">Email atual: {email || "Não disponível"}</p><label>Novo email<input type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} autoComplete="email"/></label><button className="button button-ghost" disabled={busy || !newEmail.trim() || newEmail===email} onClick={saveEmail}>Alterar email</button></section>
    <section className="card profile-card"><span className="card-label">SEGURANÇA</span><h2>Palavra-passe</h2><label>Nova palavra-passe<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres"/></label><button className="button button-ghost" disabled={busy || password.length<8} onClick={savePassword}>Atualizar palavra-passe</button></section>
    {message && <p className="form-message" role="status">{message}</p>}
  </div>;
}
