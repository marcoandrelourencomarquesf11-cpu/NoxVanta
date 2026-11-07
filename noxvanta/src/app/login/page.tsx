import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function LoginPage(){return <main className="container auth-wrap"><div className="auth-panel"><span className="eyebrow">NXV // SECURE ACCESS</span><h1>Área reservada.</h1><p>Inicia sessão para consultares a tua conta e o estado de membro da NOXVANTA.</p><AuthForm/><p style={{marginTop:18}}><Link className="text-link" href="/login/reset">Esqueceste-te da palavra-passe?</Link></p></div></main>}
