import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettings } from "@/components/profile-settings";
export default async function ProfilePage(){
 const profile=await getCurrentProfile(); if(!profile) redirect("/login");
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
 return <main><section className="page-hero"><div className="container"><span className="eyebrow">NXV // ACCOUNT SETTINGS</span><h1>O TEU PERFIL.</h1><p>Gere a tua identidade e os dados de acesso à NOXVANTA.</p></div></section><section className="section"><div className="container"><div className="section-top"><h2>Definições da conta</h2><Link href="/account" className="text-link">← Área da equipa</Link></div><ProfileSettings initialName={profile.username||""} email={user?.email||""} accountId={profile.id}/><p className="privacy-note">As alterações de email podem exigir confirmação. A palavra-passe é gerida pelo Supabase Auth e nunca é guardada neste site em texto simples.</p></div></section></main>
}
