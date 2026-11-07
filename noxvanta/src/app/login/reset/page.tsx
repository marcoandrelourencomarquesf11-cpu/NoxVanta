import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function ResetPage(){return <main className="container auth-wrap"><div className="auth-panel"><span className="eyebrow">ACCOUNT RECOVERY</span><h1>Recuperar acesso.</h1><p>Indica o email associado à tua conta.</p><AuthForm mode="reset"/><p style={{marginTop:18}}><Link className="text-link" href="/login">Voltar ao login</Link></p></div></main>}
