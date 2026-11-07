import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export const metadata: Metadata = {
  title: "NOXVANTA — NXV | VALORANT Esports",
  description: "NOXVANTA — organização competitiva de VALORANT. NXV.",
  robots: { index: true, follow: true }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-PT"><body><SiteHeader/>{children}<SiteFooter/></body></html>;
}
