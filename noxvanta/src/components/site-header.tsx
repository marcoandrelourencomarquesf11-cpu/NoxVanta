"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Shield } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { messages, type Locale } from "@/lib/i18n";
export function SiteHeader() {
  const [locale, setLocale] = useState<Locale>("pt");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("nxv-locale") as Locale | null;
    if (saved && saved in messages) setLocale(saved);
    const handler = (e: Event) => setLocale((e as CustomEvent<Locale>).detail);
    window.addEventListener("nxv-locale-change", handler);
    return () => window.removeEventListener("nxv-locale-change", handler);
  }, []);
  const t = messages[locale];
  const links = [["/", t.navHome], ["/team", t.navTeam], ["/matches", t.navMatches], ["/news", t.navNews], ["/recruitment", t.navRecruit]] as const;
  return <header className="site-header"><div className="nav-wrap">
    <Link href="/" className="brand"><span className="brand-mark">N</span><span>NOXVANTA<small>NXV / ESPORTS</small></span></Link>
    <button className="mobile-toggle" onClick={() => setOpen(!open)} aria-label="Abrir menu">{open ? <X/> : <Menu/>}</button>
    <nav className={open ? "main-nav open" : "main-nav"}>{links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
    <div className="nav-actions"><LanguageSwitcher/><Link className="icon-link" href="/login" aria-label={t.signIn}><Shield size={17}/></Link></div>
  </div></header>;
}
