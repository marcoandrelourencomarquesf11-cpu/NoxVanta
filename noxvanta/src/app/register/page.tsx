import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function RegisterPage(){return <main className="container auth-wrap"><div className="auth-panel"><span className="eyebrow">NXV // CREATE ACCOUNT</span><h1>Entra na NOXVANTA.</h1><p>Cria a tua conta para obteres o teu Account_ID e poderes candidatar-te. A criação da conta não garante entrada no plantel: o acesso de membro depende de aprovação.</p><AuthForm mode="signup"/><p style={{marginTop:18}}><Link className="text-link" href="/">← Voltar ao site</Link></p></div></main>}
