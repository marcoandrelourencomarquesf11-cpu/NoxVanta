import { redirect } from "next/navigation";
import { getCurrentProfile, isApprovedMember, canAccessManagement, canManageCompetitive, canManageRecruitment, canManageRoster, canManageContent, roleLabel } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ManagementConsole } from "@/components/management-console";

export default async function ManagementPage(){
  const profile=await getCurrentProfile();
  if(!profile) redirect("/login"); if(!isApprovedMember(profile)) redirect("/account");
  if(!canAccessManagement(profile)) redirect("/account");
  const supabase=await createClient();
  const manageApps=canManageRecruitment(profile);
  const manageMatches=canManageCompetitive(profile);
  const manageRoster=canManageRoster(profile);
  const isOwner=profile.role==="owner";
  const [apps,matches,people]=await Promise.all([
    manageApps ? supabase.from("applications").select("id,user_id,nickname,age,rank,player_role,experience,availability,discord,introduction,status,created_at").order("created_at",{ascending:false}).limit(100) : Promise.resolve({data:[],error:null}),
    manageMatches ? supabase.from("matches").select("id,opponent,starts_at,competition,status,score_for,score_against").order("starts_at",{ascending:false}).limit(50) : Promise.resolve({data:[],error:null}),
    manageRoster ? (isOwner ? supabase.from("profiles").select("id,username,role,can_manage_strategies,country,agent_role").order("created_at") : supabase.from("profiles").select("id,username,role,can_manage_strategies,country,agent_role").in("role",["pending","player","substitute","igl","strategist"]).order("created_at")) : Promise.resolve({data:[],error:null})
  ]);
  const loadErrors = [
    apps.error ? `Candidaturas: ${apps.error.message}` : null,
    matches.error ? `Resultados: ${matches.error.message}` : null,
    people.error ? `Plantel: ${people.error.message}` : null,
  ].filter(Boolean).join(" · ");
  return <main>
    <section className="page-hero"><div className="container"><span className="eyebrow">NXV // OPERATIONS CENTER</span><h1>GESTÃO.</h1><p>Um centro de operações para gerir resultados, candidaturas e composição do plantel. Cada cargo vê apenas as ferramentas que lhe competem.</p></div></section>
    <section className="section"><div className="container dashboard-grid">
      <aside className="side-panel"><Link href="/account">Área da equipa</Link><Link href="/account/tactics">Tactical Hub</Link><Link href="/account/voice">Team Voice</Link><Link href="/account/profile">O meu perfil</Link>{canManageContent(profile)&&<Link href="/news">Gestão de notícias</Link>}</aside>
      <div className="content-panel"><div className="management-welcome"><span className="eyebrow">ACESSO AUTORIZADO</span><h2>Olá, {profile.username||"membro"}.</h2><p>Permissões ativas: <strong>{roleLabel(profile.role)}</strong></p></div>
        <ManagementConsole initialApplications={(apps.data||[]) as never[]} initialMatches={(matches.data||[]) as never[]} initialMembers={(people.data||[]) as never[]} showRecruitment={manageApps} showMatches={manageMatches} showRoster={manageRoster} loadError={loadErrors} isOwner={isOwner} isSubOwner={profile.role==="sub_owner"} currentUserId={profile.id}/>
      </div>
    </div></section>
  </main>;
}
