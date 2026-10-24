import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  title: { default: "Margarita's Glow | Maquillaje y accesorios", template: "%s | Margarita's Glow" },
  description: "Maquillaje, cuidado personal y accesorios. Tienda online de Margarita's Glow, en Villa Constitución, Salto, Uruguay. Envíos a todo el país.",
  openGraph: { title: "Margarita's Glow", description: "Tu próximo favorito está acá.", type: "website", locale: "es_UY", images: ["/brand/wordmark.png"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-UY"><body><CartProvider><SiteHeader/><div className="page-shell">{children}</div><SiteFooter/></CartProvider></body></html>;
}
