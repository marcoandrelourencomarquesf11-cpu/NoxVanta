import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, canManageContent } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import { SectionHeading } from "@/components/section-heading";
import { NewsManager } from "@/components/news-manager";

type NewsItem = { id: string; title: string; body: string; published: boolean; created_at: string };
export default async function NewsPage() {
  let news: NewsItem[] = [];
  let profile: Profile | null = null;
  try {
    const supabase = await createClient();
    profile = await getCurrentProfile();
    const query = supabase.from("news").select("*").order("created_at", { ascending: false });
    const { data } = canManageContent(profile) ? await query : await query.eq("published", true);
    news = (data || []) as NewsItem[];
  } catch { /* O conteúdo público continua disponível mesmo sem sessão. */ }
  const canEdit = canManageContent(profile);
  return <main>
    <section className="page-hero"><div className="container"><span className="eyebrow">NXV // MEDIA CENTER</span><h1>NOTÍCIAS<span className="red-dot">.</span></h1><p>Comunicados oficiais, resultados, anúncios e novidades da NOXVANTA.</p></div></section>
    <section className="section"><div className="container">
      {canEdit ? <><SectionHeading eyebrow="ÁREA DE IMPRENSA · ACESSO AUTORIZADO" title="Gestão de notícias"/><NewsManager initialNews={news}/></> : <><SectionHeading eyebrow="LATEST UPDATES" title="Da NOXVANTA"/><div className="news-public-grid">{news.length ? news.map(item => <article className="news-public-card" key={item.id}><div className="news-public-meta"><span>NOXVANTA // OFFICIAL</span><time>{new Date(item.created_at).toLocaleDateString("pt-PT")}</time></div><h2>{item.title}</h2><p>{item.body}</p><div className="news-card-footer">NXV <span>COMUNICADO OFICIAL</span></div></article>) : <div className="empty-state">Ainda não existem notícias publicadas. Volta em breve para acompanhares as novidades da equipa.</div>}</div></>}
    </div></section>
  </main>;
}
