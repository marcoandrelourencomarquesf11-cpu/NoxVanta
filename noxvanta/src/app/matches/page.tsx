import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";
import type { Match } from "@/lib/types";

export default async function MatchesPage() {
  let upcoming: Match[] = [], completed: Match[] = [];
  try {
    const s=await createClient();
    const [a,b]=await Promise.all([
      s.from("matches").select("id,opponent,starts_at,competition,status,score_for,score_against").eq("status","upcoming").order("starts_at"),
      s.from("matches").select("id,opponent,starts_at,competition,status,score_for,score_against").eq("status","completed").order("starts_at",{ascending:false})
    ]);
    upcoming=(a.data||[]) as Match[]; completed=(b.data||[]) as Match[];
  } catch {}
  const wins=completed.filter(m=>m.score_for!==null&&m.score_against!==null&&m.score_for>m.score_against).length;
  const draws=completed.filter(m=>m.score_for!==null&&m.score_against!==null&&m.score_for===m.score_against).length;
  const losses=completed.filter(m=>m.score_for!==null&&m.score_against!==null&&m.score_for<m.score_against).length;
  const table=(rows:Match[],future:boolean)=><div className="table-wrap"><table><thead><tr><th>Adversário</th><th>Competição</th><th>Data</th><th>{future?"Estado":"Resultado"}</th><th>Desfecho</th></tr></thead><tbody>{rows.map(m=>{
    const outcome=future?"Agendado":m.score_for===null||m.score_against===null?"Por confirmar":m.score_for>m.score_against?"Vitória":m.score_for<m.score_against?"Derrota":"Empate";
    return <tr key={m.id}><td><strong>{m.opponent}</strong></td><td>{m.competition||"—"}</td><td>{new Date(m.starts_at).toLocaleString("pt-PT")}</td><td>{future?<span className="status-pill">Agendado</span>:<strong className="match-score">{m.score_for??"—"} : {m.score_against??"—"}</strong>}</td><td><span className={`outcome-pill ${outcome.toLowerCase()}`}>{outcome}</span></td></tr>;
  })}</tbody></table></div>;
  return <main>
    <section className="page-hero"><div className="container"><span className="eyebrow">NXV // COMPETITION</span><h1>JOGOS & RESULTADOS.</h1><p>Calendário competitivo e histórico oficial da NOXVANTA.</p></div></section>
    <section className="section"><div className="container">
      <div className="record-grid"><article><span>VITÓRIAS</span><strong>{wins}</strong></article><article><span>EMPATES</span><strong>{draws}</strong></article><article><span>DERROTAS</span><strong>{losses}</strong></article><article><span>JOGOS</span><strong>{completed.length}</strong></article></div>
      <SectionHeading eyebrow="UP NEXT" title="Próximos jogos"/>{upcoming.length?table(upcoming,true):<div className="empty-state">Não existem jogos agendados.</div>}
      <div style={{height:55}}/><SectionHeading eyebrow="MATCH HISTORY" title="Resultados"/>{completed.length?table(completed,false):<div className="empty-state">Ainda não existem resultados publicados.</div>}
    </div></section>
  </main>;
}
