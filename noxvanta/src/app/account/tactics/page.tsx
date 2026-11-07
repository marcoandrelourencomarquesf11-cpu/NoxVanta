import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, isApprovedMember, canManageStrategies } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StrategyBoard } from "@/components/strategy-board";
export default async function TacticsPage(){
  const profile=await getCurrentProfile();if(!profile)redirect("/login"); if(!isApprovedMember(profile)) redirect("/account");
  const supabase=await createClient();
  const {data}=await supabase.from("strategies").select("*").order("updated_at",{ascending:false});
  const editable=canManageStrategies(profile);
  return <main><section className="page-hero"><div className="container"><span className="eyebrow">NXV // PRIVATE OPERATIONS</span><h1>TACTICAL HUB.</h1><p>Quadro de trabalho interno. Sala privada para análise de equipa, com os minimapas reais do jogo.</p></div></section><section className="section"><div className="container"><div className="section-top"><div><span className="eyebrow">STRATEGY ROOM</span><h2 style={{font:"800 42px var(--font-head)",margin:"10px 0 25px"}}>Sala tática</h2></div><Link href="/account" className="text-link">← Área da equipa</Link></div><StrategyBoard canEdit={editable}/><div style={{height:30}}/><h2 style={{font:"800 36px var(--font-head)"}}>Estratégias guardadas</h2>{data?.length?<div className="cards">{data.map(s=><article className="card" key={s.id}><span className="card-label">{s.map_name} · {s.side==="attack"?"Ataque":"Defesa"}</span><h3>{s.title}</h3><p>{s.description||"Sem descrição adicional."}</p><Link className="text-link" href={`/account/tactics/${s.id}`}>Abrir estratégia ↗</Link>{editable&&<form action={`/account/tactics/delete`} method="post"><input type="hidden" name="id" value={s.id}/><button className="tool" type="submit">Eliminar</button></form>}</article>)}</div>:<div className="empty-state">Ainda não existem estratégias guardadas.</div>}<p className="privacy-note" style={{marginTop:18}}>{editable?"Tens permissões para criar e editar estratégias.":"Acesso de consulta. Apenas Owner, IGL e Sub-owner e estrategistas autorizados podem editar."}</p></div></section></main>
}
