import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile, canManageStrategies } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StrategyBoard } from "@/components/strategy-board";
export default async function EditStrategyPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile(); if (!profile) redirect("/login");
  const supabase = await createClient(); const { id } = await params;
  const { data } = await supabase.from("strategies").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const editable = canManageStrategies(profile);
  return <main><section className="page-hero"><div className="container"><span className="eyebrow">NXV // STRATEGY FILE</span><h1>{data.title}</h1><p>Estratégia privada · {data.map_name}</p></div></section><section className="section"><div className="container"><Link href="/account/tactics" className="text-link">← Voltar ao Tactical Hub</Link><div style={{height:20}}/><StrategyBoard strategyId={data.id} initialBoard={data.board} initialTitle={data.title} initialMapName={data.map_name} initialSide={data.side} canEdit={editable}/></div></section></main>;
}
