"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export function RecruitmentForm() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setStatus("");
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Tens de iniciar sessão para enviares uma candidatura.");
      const { error } = await supabase.from("applications").insert({
        user_id: user.id,
        nickname: form.get("nickname"), age: Number(form.get("age")), rank: form.get("rank"),
        player_role: form.get("player_role"), experience: form.get("experience"),
        availability: form.get("availability"), discord: form.get("discord"), introduction: form.get("introduction")
      });
      if (error) throw error;
      formElement.reset(); setStatus("Candidatura enviada. Obrigado pelo interesse!");
    } catch (err) { setStatus(err instanceof Error ? err.message : "Não foi possível enviar a candidatura."); }
    finally { setBusy(false); }
  }
  return <form className="form-card form-grid" onSubmit={submit}>
    <label>Nickname<input name="nickname" required maxLength={40}/></label>
    <label>Idade<input name="age" type="number" min="13" max="99" required/></label>
    <label>Rank atual<input name="rank" required placeholder="Ex.: Ascendant 2"/></label>
    <label>Função<select name="player_role" required><option value="">Selecionar</option>{["Duelist","Initiator","Controller","Sentinel","Flex"].map(x=><option key={x}>{x}</option>)}</select></label>
    <label className="full">Experiência<textarea name="experience" rows={3} required/></label>
    <label className="full">Horários disponíveis<input name="availability" required/></label>
    <label className="full">Contacto Discord<input name="discord" required placeholder="nickname"/></label>
    <label className="full">Apresentação<textarea name="introduction" rows={4} required maxLength={2000}/></label>
    <p className="privacy-note full">A candidatura fica associada à tua conta NOXVANTA. O teu Account_ID está disponível na aba Perfil.</p>
    <button className="button button-red full" disabled={busy}>{busy ? "A enviar..." : "Enviar candidatura"}</button>
    {status && <p className="form-message full" role="status">{status}</p>}
  </form>;
}
