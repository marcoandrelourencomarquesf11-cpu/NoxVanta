"use client";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
export function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>("pt");
  useEffect(() => {
    const saved = localStorage.getItem("nxv-locale") as Locale | null;
    if (saved && ["pt", "en", "es"].includes(saved)) setLocale(saved);
  }, []);
  function change(value: Locale) {
    setLocale(value); localStorage.setItem("nxv-locale", value);
    document.cookie = `nxv-locale=${value};path=/;max-age=31536000;samesite=lax`;
    window.dispatchEvent(new CustomEvent("nxv-locale-change", { detail: value }));
  }
  return <label className="language-select"><span className="sr-only">Idioma</span><select aria-label="Idioma" value={locale} onChange={e => change(e.target.value as Locale)}><option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option></select></label>;
}
