"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Instagram, MessageCircle, MapPin, Heart } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toWhatsAppNumber } from "@/lib/format";

export function SiteFooter() {
  const [phone, setPhone] = useState("099 782 589");
  const [instagramUrl, setInstagramUrl] = useState("https://www.instagram.com/margaritasglow.uy/");
  useEffect(() => { const sb = getSupabaseBrowserClient(); if (sb) sb.from("store_settings").select("phone,instagram_url").eq("id", 1).maybeSingle().then(({ data }) => { if (data?.phone) setPhone(data.phone); if (data?.instagram_url) setInstagramUrl(data.instagram_url); }); }, []);
  const wa = `https://wa.me/${toWhatsAppNumber(phone)}`;
  return <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-brand"><img src="/brand/wordmark.png" alt="Margarita's Glow"/><p>Maquillaje, cuidado personal y pequeños favoritos para tu rutina.</p><span className="footer-love">Con cariño, Margarita's Glow <Heart size={13} fill="currentColor"/></span></div>
      <div><h3>La tienda</h3><Link href="/productos">Ver productos</Link><Link href="/envios">Envíos y entregas</Link><Link href="/preguntas-frecuentes">Preguntas frecuentes</Link><Link href="/politicas">Condiciones y privacidad</Link></div>
      <div><h3>Hablemos</h3><a href={wa} target="_blank" rel="noreferrer"><MessageCircle size={16}/> WhatsApp · {phone}</a><a href={instagramUrl} target="_blank" rel="noreferrer"><Instagram size={16}/> @margaritasglow.uy</a><span><MapPin size={16}/> Villa Constitución, Salto</span></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Margarita's Glow</span><span>Hecho con cuidado en Uruguay</span><Link href="/admin/login">Administración</Link></div>
  </footer>;
}
