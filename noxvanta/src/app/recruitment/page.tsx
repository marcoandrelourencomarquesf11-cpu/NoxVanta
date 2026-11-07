import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { RecruitmentForm } from "@/components/recruitment-form";
export default async function RecruitmentPage(){
 const profile=await getCurrentProfile();
 return <main><section className="page-hero"><div className="container"><span className="eyebrow">NXV // JOIN THE ROSTER</span><h1>O TEU PRÓXIMO<br/>NÍVEL.</h1><p>Procuramos jogadores dedicados, comunicativos e disponíveis para trabalhar em equipa. Para enviares uma candidatura, cria primeiro a tua conta NOXVANTA.</p></div></section><section className="section"><div className="container" style={{maxWidth:820}}><div className="section-heading"><span className="eyebrow">RECRUITMENT FORM</span><h2>{profile ? "Faz parte da NXV." : "Primeiro, cria a tua conta."}</h2></div>{profile ? <RecruitmentForm/> : <div className="form-card recruitment-gate"><p>O formulário só fica disponível depois de iniciares sessão. A tua candidatura ficará ligada ao Account_ID para a equipa de recrutamento conseguir identificar a tua conta.</p><div className="hero-actions"><Link className="button button-red" href="/register">Criar conta</Link><Link className="button button-ghost" href="/login">Já tenho conta</Link></div></div>}</div></section></main>
}
