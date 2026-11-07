"use client";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Pencil, Plus, ShieldCheck, Trash2, Users, Trophy, X, Save } from "lucide-react";

type Application = {
  id: string; user_id: string | null; nickname: string; age: number; rank: string; player_role: string;
  experience: string; availability: string; discord: string; introduction: string;
  status: string; created_at: string;
};
type Match = {
  id: string; opponent: string; starts_at: string; competition: string | null;
  status: "upcoming" | "live" | "completed"; score_for: number | null; score_against: number | null;
};
type Member = { id: string; username: string | null; role: string; country: string | null; agent_role: string | null; can_manage_strategies: boolean };

const appStatuses = [{value:"New",label:"Nova"},{value:"Em análise",label:"Em análise"},{value:"Aprovada",label:"Aprovada"},{value:"Reprovada",label:"Reprovada"}];
const roleNames: Record<string,string> = { owner:"Owner", sub_owner:"Sub-owner", igl:"IGL", recruiter:"Recrutador", strategist:"Estrategista", admin:"Administrador", player:"Titular", substitute:"Suplente", pending:"Pendente" };
const gameRoles = ["Por definir","Duelista","Controlador","Iniciador","Sentinela","Flex"];

function localDateTime(value?: string) {
  const d = value ? new Date(value) : new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0,16);
}

export function ManagementConsole({
  initialApplications, initialMatches, initialMembers,
  showRecruitment, showMatches, showRoster, loadError, isOwner, isSubOwner, currentUserId
}: {
  initialApplications: Application[]; initialMatches: Match[]; initialMembers: Member[];
  showRecruitment: boolean; showMatches: boolean; showRoster: boolean; loadError?: string; isOwner: boolean; isSubOwner: boolean; currentUserId: string;
}) {
  const [applications,setApplications] = useState(initialApplications);
  const [matches,setMatches] = useState(initialMatches);
  const [members,setMembers] = useState(initialMembers);
  const [busy,setBusy] = useState<string|null>(null);
  const [message,setMessage] = useState("");
  const [editingId,setEditingId] = useState<string|null>(null);
  const [opponent,setOpponent] = useState("");
  const [competition,setCompetition] = useState("");
  const [startsAt,setStartsAt] = useState(localDateTime());
  const [scoreFor,setScoreFor] = useState("2");
  const [scoreAgainst,setScoreAgainst] = useState("0");
  const [accountId,setAccountId] = useState("");
  const [newRole,setNewRole] = useState("player");

  async function updateApplication(id:string,status:string) {
    setBusy(id); setMessage("");
    const {error}=await createClient().from("applications").update({status}).eq("id",id);
    if(error) setMessage(`Não foi possível atualizar a candidatura: ${error.message}`);
    else {
      setApplications(old=>old.map(a=>a.id===id?{...a,status}:a));
      setMessage(`Candidatura de ${applications.find(a=>a.id===id)?.nickname||"jogador"}: ${status}.`);
    }
    setBusy(null);
  }

  function resetMatchForm() {
    setEditingId(null); setOpponent(""); setCompetition(""); setStartsAt(localDateTime()); setScoreFor("2"); setScoreAgainst("0");
  }

  function beginEditMatch(match:Match) {
    setEditingId(match.id); setOpponent(match.opponent); setCompetition(match.competition||"");
    setStartsAt(localDateTime(match.starts_at)); setScoreFor(String(match.score_for??0)); setScoreAgainst(String(match.score_against??0));
    setMessage("");
    document.getElementById("match-entry")?.scrollIntoView({behavior:"smooth",block:"center"});
  }

  async function saveMatch(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy("match"); setMessage("");
    const payload={opponent:opponent.trim(),competition:competition.trim()||null,starts_at:new Date(startsAt).toISOString(),status:"completed",score_for:Number(scoreFor),score_against:Number(scoreAgainst)};
    const query = editingId
      ? await createClient().from("matches").update(payload).eq("id",editingId).select("id,opponent,starts_at,competition,status,score_for,score_against").single()
      : await createClient().from("matches").insert(payload).select("id,opponent,starts_at,competition,status,score_for,score_against").single();
    if(query.error) setMessage(`Não foi possível ${editingId?"corrigir":"publicar"} o resultado: ${query.error.message}`);
    else if(query.data) {
      const saved=query.data as Match;
      setMatches(old=>editingId?old.map(m=>m.id===saved.id?saved:m).sort((a,b)=>+new Date(b.starts_at)-+new Date(a.starts_at)):[saved,...old]);
      setMessage(editingId?"Resultado atualizado com sucesso.":"Resultado publicado com sucesso.");
      resetMatchForm();
    }
    setBusy(null);
  }

  async function deleteMatch(id:string) {
    if(!window.confirm("Eliminar este resultado? Esta ação não pode ser anulada.")) return;
    setBusy(id); setMessage("");
    const {error}=await createClient().from("matches").delete().eq("id",id);
    if(error) setMessage(`Não foi possível eliminar: ${error.message}`);
    else { setMatches(old=>old.filter(m=>m.id!==id)); setMessage("Resultado eliminado."); if(editingId===id) resetMatchForm(); }
    setBusy(null);
  }

  async function addAccountToRoster(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isOwner) return;
    const id=accountId.trim();
    if (!id) return;
    setBusy("account"); setMessage("");
    const {data,error}=await createClient().from("profiles").update({role:newRole,status:"Active"}).eq("id",id).select("id,username,role,can_manage_strategies,country,agent_role").maybeSingle();
    if(error) setMessage(`Não foi possível adicionar a conta: ${error.message}`);
    else if(!data) setMessage("Não foi encontrada nenhuma conta com esse Account_ID. Pede à pessoa para criar a conta primeiro.");
    else {
      setMembers(old=>[...old.filter(m=>m.id!==data.id),data as Member]);
      setMessage(`Conta ${data.username||data.id.slice(0,8)} adicionada ao plantel como ${roleNames[newRole]||newRole}.`);
      setAccountId("");
    }
    setBusy(null);
  }

  async function updateMember(id:string,patch:Partial<Member>) {
    setBusy(id); setMessage("");
    const {error}=await createClient().from("profiles").update(patch).eq("id",id);
    if(error) setMessage(`Não foi possível atualizar o membro: ${error.message}`);
    else { setMembers(old=>old.map(m=>m.id===id?{...m,...patch}:m)); setMessage("Dados do membro atualizados."); }
    setBusy(null);
  }

  return <div className="management-console">
    {loadError && <div className="form-message management-feedback" role="alert"><strong>Não foi possível carregar todos os dados.</strong><br/>{loadError}<br/><span>Confirma se executaste a migração 03 no Supabase e se o cargo desta conta está correto.</span></div>}
    {message && <p className="form-message management-feedback" role="status">{message}</p>}

    <nav className="management-nav" aria-label="Secções de gestão">
      {showMatches&&<a href="#gestao-resultados"><Trophy size={15}/> Resultados</a>}
      {showRoster&&<a href="#gestao-plantel"><Users size={15}/> Plantel</a>}
      {showRecruitment&&<a href="#gestao-recrutamento"><ShieldCheck size={15}/> Recrutamento</a>}
    </nav>

    {showMatches && <section className="management-section" id="gestao-resultados">
      <div className="management-section-head"><div><span className="eyebrow">MATCH OPERATIONS</span><h2><Trophy size={23}/> Resultados</h2><p>Regista vitórias, empates e derrotas. As alterações aparecem automaticamente na página pública de jogos.</p></div><span className="management-count">{matches.length} jogos</span></div>
      <form id="match-entry" className="form-card form-grid match-entry" onSubmit={saveMatch}>
        <div className="form-card-heading"><strong>{editingId?"Corrigir resultado":"Registar partida"}</strong><span>{editingId?"Edição de resultado publicado":"O desfecho é calculado a partir do marcador"}</span></div>
        <label>Adversário<input value={opponent} onChange={e=>setOpponent(e.target.value)} required maxLength={80} placeholder="Nome da equipa adversária"/></label>
        <label>Competição<input value={competition} onChange={e=>setCompetition(e.target.value)} maxLength={80} placeholder="Ex.: Liga / Torneio"/></label>
        <label>Data e hora<input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} required/></label>
        <div className="score-entry"><label>NOXVANTA<input type="number" min="0" max="99" value={scoreFor} onChange={e=>setScoreFor(e.target.value)} required/></label><span>:</span><label>Adversário<input type="number" min="0" max="99" value={scoreAgainst} onChange={e=>setScoreAgainst(e.target.value)} required/></label></div>
        <div className="match-form-actions"><button className="button button-red" disabled={busy==="match"||!opponent.trim()||!startsAt}><Save size={16}/>{busy==="match"?"A guardar...":editingId?"Guardar alterações":"Publicar resultado"}</button>{editingId&&<button type="button" className="button button-ghost" onClick={resetMatchForm}><X size={15}/> Cancelar edição</button>}</div>
      </form>
      <div className="management-list">{matches.length?matches.map(m=>{
        const outcome=m.score_for===null||m.score_against===null?"Por confirmar":m.score_for>m.score_against?"Vitória":m.score_for<m.score_against?"Derrota":"Empate";
        return <article className="management-row" key={m.id}>
          <div className="management-row-main"><span className="card-label">{m.competition||"Jogo oficial"} · {new Date(m.starts_at).toLocaleDateString("pt-PT")}</span><h3>NOXVANTA <span>vs</span> {m.opponent}</h3><p>{outcome} · {new Date(m.starts_at).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"})}</p></div>
          <div className="management-score">{m.score_for??"—"} : {m.score_against??"—"}</div>
          <div className="management-row-actions"><button className="icon-action" onClick={()=>beginEditMatch(m)} disabled={busy===m.id} aria-label={`Editar resultado contra ${m.opponent}`}><Pencil size={16}/></button><button className="icon-action danger" onClick={()=>deleteMatch(m.id)} disabled={busy===m.id} aria-label={`Eliminar resultado contra ${m.opponent}`}><Trash2 size={16}/></button></div>
        </article>;
      }):<div className="empty-state">Ainda não foram registadas partidas.</div>}</div>
    </section>}

    {showRoster && <section className="management-section" id="gestao-plantel">
      {isOwner && <form className="form-card form-grid account-assign-form" onSubmit={addAccountToRoster}>
        <div className="form-card-heading full"><strong>Adicionar conta ao plantel</strong><span>A pessoa tem de criar primeiro a sua conta e enviar-te o Account_ID que aparece no Perfil.</span></div>
        <label className="full">Account_ID<input value={accountId} onChange={e=>setAccountId(e.target.value)} required placeholder="Cola aqui o UUID da conta"/></label>
        <label>Cargo inicial<select value={newRole} onChange={e=>setNewRole(e.target.value)}>{[["player","Titular"],["substitute","Suplente"],["igl","IGL"],["strategist","Estrategista"],["recruiter","Recrutador"],["sub_owner","Sub-owner"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <button className="button button-red" disabled={busy==="account"||!accountId.trim()}>{busy==="account"?"A adicionar...":"Adicionar membro"}</button>
      </form>}
      <div className="management-section-head"><div><span className="eyebrow">ROSTER CONTROL</span><h2><Users size={23}/> Plantel & cargos</h2><p>Organiza titulares, banco de reservas, IGL e funções dentro do jogo.</p></div><span className="management-count">{members.length} contas</span></div>
      <div className="roster-management-summary"><div><strong>{members.filter(m=>m.role==="player"||m.role==="igl").length}</strong><span>TITULARES / IGL</span></div><div><strong>{members.filter(m=>m.role==="substitute").length}</strong><span>RESERVAS</span></div><div><strong>{members.filter(m=>m.role==="strategist").length}</strong><span>ESTRATÉGIA</span></div></div>
      <div className="table-wrap"><table className="management-table"><thead><tr><th>Membro / Account_ID</th><th>Função no jogo</th><th>Cargo</th><th>Guardar</th></tr></thead><tbody>{members.map(m=>{
        const permitted = isOwner ? ["pending","player","substitute","igl","strategist","recruiter","sub_owner"] : isSubOwner ? ["igl","player","substitute","strategist"] : ["player","substitute","strategist"];
        return <tr key={m.id}><td><strong>{m.username||m.id.slice(0,8)}</strong><small className="member-account-id">ID: {m.id}</small><small>{m.country||"País não definido"}</small></td><td><select aria-label={`Função no jogo de ${m.username||"membro"}`} value={m.agent_role||"Por definir"} disabled={busy===m.id||["owner","sub_owner","recruiter","admin"].includes(m.role)} onChange={e=>updateMember(m.id,{agent_role:e.target.value==="Por definir"?null:e.target.value})}>{gameRoles.map(r=><option key={r} value={r}>{r}</option>)}</select></td><td><select aria-label={`Cargo de ${m.username||"membro"}`} value={m.role} disabled={busy===m.id||m.role==="owner"||m.id===currentUserId} onChange={e=>updateMember(m.id,{role:e.target.value})}>{[...new Set([m.role,...permitted])].map(r=><option key={r} value={r}>{roleNames[r]||r}</option>)}</select></td><td><span className="saved-indicator"><Check size={14}/> Auto</span></td></tr>;
      })}</tbody></table></div>
      <p className="privacy-note">As alterações são guardadas automaticamente. Só o Owner pode atribuir Sub-owner e Recrutador. IGL e Sub-owner podem organizar o plantel, mas não podem alterar o cargo Owner nem as próprias permissões.</p>
    </section>}

    {showRecruitment && <section className="management-section" id="gestao-recrutamento">
      <div className="management-section-head"><div><span className="eyebrow">PLAYER ACQUISITION</span><h2><ShieldCheck size={23}/> Candidaturas</h2><p>Consulta os perfis, analisa os dados e aprova ou recusa candidaturas.</p></div><span className="management-count">{applications.length} candidaturas</span><button type="button" className="button button-ghost" onClick={()=>window.location.reload()}>Atualizar lista</button></div>
      <div className="application-summary"><span><b>{applications.filter(a=>a.status==="New").length}</b> Novas</span><span><b>{applications.filter(a=>a.status==="Em análise").length}</b> Em análise</span><span><b>{applications.filter(a=>a.status==="Aprovada").length}</b> Aprovadas</span></div>
      <div className="management-list">{applications.length?applications.map(a=><article className="application-card" key={a.id}>
        <div className="application-top"><div><span className="card-label">{new Date(a.created_at).toLocaleDateString("pt-PT")} · {a.rank}</span><h3>{a.nickname}</h3><p>{a.player_role} · {a.age} anos</p></div><span className={`application-status ${a.status.toLowerCase().replaceAll(" ","-")}`}>{a.status==="New"?"Nova":a.status}</span></div>
        <div className="application-details"><p><b>Account_ID:</b> <span className="member-account-id">{a.user_id || "Conta antiga sem associação"}</span></p><p><b>Experiência:</b> {a.experience}</p><p><b>Disponibilidade:</b> {a.availability}</p><p><b>Discord:</b> {a.discord}</p><p><b>Apresentação:</b> {a.introduction}</p></div>
        <div className="application-actions"><label>Estado<select value={a.status} onChange={e=>updateApplication(a.id,e.target.value)} disabled={busy===a.id}>{appStatuses.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label><button className="button button-ghost" onClick={()=>updateApplication(a.id,"Aprovada")} disabled={busy===a.id||a.status==="Aprovada"}><Check size={15}/> Aprovar</button><button className="button button-ghost" onClick={()=>updateApplication(a.id,"Reprovada")} disabled={busy===a.id||a.status==="Reprovada"}>Reprovar</button></div>
      </article>):<div className="empty-state">Ainda não existem candidaturas.</div>}</div>
      <p className="privacy-note">Depois de aprovares uma candidatura, pede ao jogador que crie a conta (ou que te envie o Account_ID se já tiver conta) e adiciona-o na secção Plantel & cargos. A candidatura e a conta ficam ligadas pelo Account_ID.</p>
    </section>}
  </div>;
}
