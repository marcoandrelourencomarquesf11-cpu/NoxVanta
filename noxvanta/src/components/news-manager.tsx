"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Newspaper, Send, Trash2, Eye, EyeOff } from "lucide-react";

type NewsItem = { id: string; title: string; body: string; published: boolean; created_at: string };
export function NewsManager({ initialNews }: { initialNews: NewsItem[] }) {
  const [items, setItems] = useState(initialNews);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function createNews(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("news").insert({ title: title.trim(), body: body.trim(), published }).select("*").single();
      if (error) throw error;
      setItems(current => [data as NewsItem, ...current]); setTitle(""); setBody("");
      setMessage(published ? "Notícia publicada com sucesso." : "Rascunho guardado com sucesso."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível guardar a notícia."); }
    finally { setBusy(false); }
  }
  async function toggle(item: NewsItem) {
    const supabase = createClient(); setBusy(true); setMessage("");
    const { error } = await supabase.from("news").update({ published: !item.published, updated_at: new Date().toISOString() }).eq("id", item.id);
    if (error) setMessage(error.message);
    else { setItems(current => current.map(n => n.id === item.id ? { ...n, published: !n.published } : n)); setMessage("Estado da notícia atualizado."); router.refresh(); }
    setBusy(false);
  }
  async function remove(item: NewsItem) {
    if (!window.confirm(`Eliminar a notícia “${item.title}”?`)) return;
    const supabase = createClient(); setBusy(true); setMessage("");
    const { error } = await supabase.from("news").delete().eq("id", item.id);
    if (error) setMessage(error.message);
    else { setItems(current => current.filter(n => n.id !== item.id)); setMessage("Notícia eliminada."); router.refresh(); }
    setBusy(false);
  }
  return <div className="news-admin-layout">
    <section className="news-admin-panel">
      <div className="news-admin-heading"><span className="news-admin-icon"><Newspaper size={19}/></span><div><span className="eyebrow">CENTRO EDITORIAL</span><h2>Nova publicação</h2><p>Cria comunicados oficiais para a comunidade NXV.</p></div></div>
      <form className="form-card news-editor" onSubmit={createNews}>
        <label>Título da notícia<input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} required placeholder="Ex.: NXV confirma presença no torneio..."/></label>
        <label>Conteúdo<textarea value={body} onChange={e => setBody(e.target.value)} rows={7} maxLength={8000} required placeholder="Escreve aqui o comunicado completo..."/></label>
        <label className="news-publish-toggle"><input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}/> Publicar imediatamente <small>Desmarca para guardar como rascunho.</small></label>
        <button className="button button-red" disabled={busy}><Send size={15}/>{busy ? "A guardar..." : published ? "Publicar notícia" : "Guardar rascunho"}</button>
        {message && <p className="form-message" role="status">{message}</p>}
      </form>
    </section>
    <section className="news-admin-panel">
      <div className="news-admin-heading"><div><span className="eyebrow">GESTÃO DE CONTEÚDO</span><h2>Publicações</h2><p>{items.length} notícia(s) e rascunho(s).</p></div></div>
      <div className="news-admin-list">{items.length ? items.map(item => <article className="news-admin-item" key={item.id}>
        <div className="news-admin-item-top"><span className={item.published ? "news-status is-live" : "news-status"}>{item.published ? "Publicado" : "Rascunho"}</span><time>{new Date(item.created_at).toLocaleDateString("pt-PT")}</time></div>
        <h3>{item.title}</h3><p>{item.body}</p>
        <div className="news-admin-actions"><button type="button" className="button button-ghost" disabled={busy} onClick={() => toggle(item)}>{item.published ? <EyeOff size={14}/> : <Eye size={14}/>} {item.published ? "Retirar" : "Publicar"}</button><button type="button" className="icon-action danger" disabled={busy} onClick={() => remove(item)} aria-label="Eliminar notícia"><Trash2 size={16}/></button></div>
      </article>) : <div className="empty-state">Ainda não existem notícias. Cria a primeira publicação ao lado.</div>}</div>
    </section>
  </div>;
}
