import Link from "next/link";
export function SiteFooter() {
  return <footer className="site-footer"><div className="container footer-inner"><div><div className="footer-brand">NOXVANTA<span>.</span></div><p>NXV · Competitive VALORANT</p><small className="riot-disclaimer">NOXVANTA é um projeto independente e não é afiliado, patrocinado ou aprovado pela Riot Games.</small></div><div className="footer-links"><Link href="/privacy">Privacidade</Link><Link href="/login">Área reservada</Link></div><small>© {new Date().getFullYear()} NOXVANTA. Todos os direitos reservados.</small></div></footer>;
}
