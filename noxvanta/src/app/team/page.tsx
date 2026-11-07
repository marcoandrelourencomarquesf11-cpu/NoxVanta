import { SectionHeading } from "@/components/section-heading";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

function initials(name:string|null) {
  const value=(name||"NXV").trim();
  return value.split(/\s+/).slice(0,2).map(part=>part[0]||"").join("").toUpperCase()||"NX";
}
function PlayerCard({player,substitute=false}:{player:Profile;substitute?:boolean}) {
  return <article className={`player-card ${substitute?"player-card-reserve":""}`}>
    <div className="player-card-top"><span className="player-number">{player.role==="igl"?"IGL":substitute?"RES":"NXV"}</span><span className="player-presence"><i/> ROSTER</span></div>
    <div className="avatar">{initials(player.username)}</div>
    <div className="player-card-info"><h3>{player.username||"Membro NXV"}</h3><p>{player.agent_role||"Função por definir"}</p></div>
    <div className="player-card-footer"><span>{player.country||"País não definido"}</span><span className="tag">{substitute?"Banco de reservas":player.role==="igl"?"In-game leader":"Titular"}</span></div>
  </article>;
}

export default async function TeamPage() {
  let players: Profile[] = [];
  try {
    const supabase=await createClient();
    const {data}=await supabase.from("profiles").select("id,username,role,country,agent_role,avatar_key,status,can_manage_strategies").in("role",["player","igl","substitute"]).order("created_at");
    players=(data||[]) as Profile[];
  } catch {}
  const main=players.filter(p=>p.role==="player"||p.role==="igl");
  const subs=players.filter(p=>p.role==="substitute");
  return <main>
    <section className="page-hero"><div className="container"><span className="eyebrow">NXV // COMPETITIVE ROSTER</span><h1>A EQUIPA.</h1><p>Conhece os jogadores que representam a NOXVANTA. Um plantel unido, com titulares definidos e um banco de reservas preparado para competir.</p><div className="team-hero-stats"><span><b>{main.length.toString().padStart(2,"0")}</b> TITULARES</span><span><b>{subs.length.toString().padStart(2,"0")}</b> RESERVAS</span></div></div></section>
    <section className="section"><div className="container">
      <div className="roster-section-heading"><SectionHeading eyebrow="MAIN LINEUP" title="Plantel principal"/><span>01 / TITULARES</span></div>
      {main.length?<div className="roster-grid">{main.map(p=><PlayerCard key={p.id} player={p}/>)}</div>:<div className="empty-state">O plantel principal será apresentado aqui quando os jogadores forem adicionados pelo Centro de Operações.</div>}
      <div className="reserve-section"><div className="roster-section-heading"><SectionHeading eyebrow="RESERVE LINEUP" title="Banco de reservas"/><span>02 / SUPLENTES</span></div>
        {subs.length?<div className="roster-grid">{subs.map(p=><PlayerCard key={p.id} player={p} substitute/>)}</div>:<div className="empty-state">Ainda não existem jogadores no banco de reservas.</div>}
      </div>
      <p className="privacy-note roster-note">Os dados do plantel são apresentados a partir das contas autorizadas da organização. Para integrar o roster, a conta deve ser criada e depois atribuída à posição correta pelo responsável.</p>
    </div></section>
  </main>;
}
