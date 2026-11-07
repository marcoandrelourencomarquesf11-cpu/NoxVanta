import Link from "next/link";
import { ArrowUpRight, Crosshair, Shield, Trophy } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/lib/i18n";
export default async function HomePage() {
  let matches: any[] = [], news: any[] = [];
  try {
    const supabase = await createClient();
    const [m,n] = await Promise.all([
      supabase.from("matches").select("*").eq("status","completed").order("starts_at",{ascending:false}).limit(3),
      supabase.from("news").select("id,title,body,created_at").eq("published",true).order("created_at",{ascending:false}).limit(3)
    ]);
    matches = m.data || []; news = n.data || [];
  } catch {}
  return <main>
    <section className="hero"><div className="container hero-content"><span className="eyebrow">ORGANIZAÇÃO COMPETITIVA DE VALORANT</span><h1><span>BUILT IN</span><span className="red">SILENCE.</span><span>READY TO</span><span className="red">STRIKE.</span></h1><p className="hero-copy">Disciplina. Leitura. Execução. A NOXVANTA compete com propósito. Uma identidade, uma equipa, um objetivo.</p><div className="hero-actions"><Link className="button button-red" href="/team">Conhecer a equipa <ArrowUpRight size={15}/></Link><Link className="button button-ghost" href="/login"><Shield size={15}/> Tactical Hub</Link></div></div><div className="hero-meta">NOXVANTA // NXV</div></section>
    <section className="section"><div className="container"><div className="cards">
      <article className="card"><span className="card-label"><Crosshair size={13}/> Identidade</span><h3>Precision first.</h3><p>Preparação, comunicação e execução em cada ronda.</p></article>
      <article className="card"><span className="card-label"><Shield size={13}/> Estrutura</span><h3>One unit.</h3><p>Uma equipa construída sobre confiança e responsabilidade.</p></article>
      <article className="card"><span className="card-label"><Trophy size={13}/> Ambição</span><h3>Earn the win.</h3><p>Resultados conquistados com consistência e trabalho.</p></article>
    </div></div></section>
    <section className="section" style={{paddingTop:20}}><div className="container"><div className="section-top"><SectionHeading eyebrow="COMPETIÇÃO" title="Últimos resultados"/></div>{matches.length ? <div className="cards">{matches.map(m=><article className="card" key={m.id}><span className="card-label">{m.competition || "Competição"}</span><h3>vs {m.opponent}</h3><div className="score">{m.result_for ?? "—"} : {m.result_against ?? "—"}</div><p>{new Date(m.starts_at).toLocaleDateString("pt-PT")}</p></article>)}</div> : <div className="empty-state">Ainda não existem resultados publicados.</div>}</div></section>
    <section className="section" style={{paddingTop:20}}><div className="container"><div className="section-top"><SectionHeading eyebrow="DA ORGANIZAÇÃO" title="Últimas notícias"/><Link href="/news" className="text-link">Todas as notícias ↗</Link></div>{news.length ? <div className="cards">{news.map(n=><article className="card" key={n.id}><span className="card-label">{new Date(n.created_at).toLocaleDateString("pt-PT")}</span><h3>{n.title}</h3><p>{n.body.slice(0,130)}{n.body.length>130?"…":""}</p></article>)}</div> : <div className="empty-state">Ainda não existem notícias publicadas.</div>}</div></section>
    <section className="section" style={{paddingTop:10}}><div className="container split-banner"><div><span className="eyebrow">NEXT UP</span><h2>O próximo capítulo<br/>começa aqui.</h2><p>Procuramos pessoas com compromisso, visão e vontade de evoluir.</p></div><Link href="/recruitment" className="button button-red">Recrutamento <ArrowUpRight size={15}/></Link></div></section>
  </main>;
}
