"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowRight, Check, Heart, Instagram, MessageCircle, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Product, StoreSettings } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { toWhatsAppNumber } from "@/lib/format";

const fallbackFaqs = [
  { question: "¿Hacen envíos a todo Uruguay?", answer: "Coordinamos envíos a distintos puntos del país. La empresa disponible y el costo se confirman antes de cerrar la entrega." },
  { question: "¿Cómo puedo pagar?", answer: "El método inicial es la transferencia bancaria. Las instrucciones aparecen después de confirmar el pedido." },
  { question: "¿Cómo consulto por un producto?", answer: "Podés escribirnos por WhatsApp o Instagram y te ayudamos a resolver tus dudas." },
];

export function HomeContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<{ display_name: string; rating: number; comment: string }[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setLoaded(true); return; }
    Promise.all([
      supabase.from("products").select("*, categories(id,name,slug)").eq("is_active", true).gt("stock", 0).eq("is_featured", true).order("created_at", { ascending: false }).limit(4),
      supabase.from("reviews").select("display_name,rating,comment").eq("status", "approved").order("created_at", { ascending: false }).limit(3),
      supabase.from("store_settings").select("*").eq("id", 1).maybeSingle(),
    ]).then(([p, r, s]) => {
      if (!p.error && p.data) setProducts(p.data as Product[]);
      if (!r.error && r.data) setReviews(r.data as typeof reviews);
      if (!s.error && s.data) setSettings(s.data as StoreSettings);
    }).finally(() => setLoaded(true));
  }, []);

  const faqs = settings?.faqs?.length ? settings.faqs : fallbackFaqs;
  const whatsappLink = `https://wa.me/${toWhatsAppNumber(settings?.phone || "099 782 589")}`;
  const instagramUrl = settings?.instagram_url || "https://www.instagram.com/margaritasglow.uy/";
  return <>
    <main>
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line"/> BEAUTY · MAQUILLAJE · ACCESORIOS</div>
          <h1>Pequeños detalles.<br/><em>Mucho glow.</em></h1>
          <p className="hero-description">Tu próximo favorito está acá. Descubrí maquillaje, cuidado personal y accesorios para acompañarte todos los días.</p>
          <div className="hero-actions"><Link className="button button-primary" href="/productos">Explorar la tienda <ArrowRight size={17}/></Link><a className="text-link" href={instagramUrl} target="_blank" rel="noreferrer">Conocenos en Instagram <ArrowDownRight size={16}/></a></div>
          <div className="hero-trust"><span><Check size={15}/> Atención cercana</span><span><Check size={15}/> Envíos a todo Uruguay</span></div>
        </div>
        <div className="hero-art" aria-label="Identidad visual de Margarita's Glow">
          <div className="hero-back-circle"/><div className="hero-note note-top">Un toque<br/>de color <span>♡</span></div>
          <img className="hero-logo" src="/brand/mark.png" alt="Símbolo original de Margarita's Glow"/>
          <div className="hero-round-label"><span>ENCONTRÁ</span><strong>tu próximo<br/>favorito</strong><Heart size={17}/></div>
          <span className="hero-spark hero-spark-one">✳</span><span className="hero-spark hero-spark-two">✦</span>
          <div className="hero-note note-bottom">Un mimo<br/>para vos ✿</div>
        </div>
        <a href="#destacados" className="hero-scroll"><span>DESLIZÁ PARA DESCUBRIR</span><ArrowDownRight size={17}/></a>
      </section>

      <section className="benefit-strip" aria-label="Ventajas de compra">
        <div><span className="benefit-icon"><Heart size={18}/></span><div><strong>Elegidos con cariño</strong><small>Productos para tu rutina</small></div></div>
        <div><span className="benefit-icon"><MessageCircle size={18}/></span><div><strong>Te ayudamos a elegir</strong><small>Atención por WhatsApp</small></div></div>
        <div><span className="benefit-icon"><Sparkles size={18}/></span><div><strong>Tu estilo, tus reglas</strong><small>Encontrá tu favorito</small></div></div>
      </section>

      <section className="section featured-section" id="destacados">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> LOS FAVORITOS</div><h2>Un poquito de <em>glow</em></h2><p>Descubrí productos que pueden convertirse en tus nuevos esenciales.</p></div><Link className="text-link" href="/productos">Ver toda la tienda <ArrowRight size={16}/></Link></div>
        {products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="empty-featured"><div className="empty-flower">✿</div><div><h3>{loaded ? "Estamos preparando el catálogo" : "Buscando tus favoritos…"}</h3><p>{loaded ? "Muy pronto vas a encontrar acá los productos disponibles. Mientras tanto, escribinos y te ayudamos a consultar el stock." : "Cargando los productos destacados de la tienda."}</p><a className="button button-outline" href={whatsappLink} target="_blank" rel="noreferrer">Consultar por WhatsApp <ArrowRight size={16}/></a></div></div>}
      </section>

      <section className="brand-story">
        <div className="story-mark"><img src="/brand/mark.png" alt=""/><span>MAQUILLAJE Y ACCESORIOS</span></div>
        <div className="story-copy"><div className="eyebrow"><span className="eyebrow-line"/> UN EMPRENDIMIENTO CON AMOR</div><h2>Tu belleza,<br/><em>a tu manera.</em></h2><p>Margarita's Glow nació para acercarte esos detalles que levantan el ánimo: un color que te encanta, un accesorio que necesitabas o ese producto que querías probar.</p><p>Estamos en Villa Constitución, Salto, y coordinamos envíos para que puedas comprar desde cualquier punto de Uruguay.</p><Link className="text-link" href="/productos">Conocé la tienda <ArrowRight size={16}/></Link></div>
        <div className="story-stamp"><span>MG</span><small>Un toque<br/>de glow</small><Heart size={17}/></div>
      </section>

      <section className="section review-section">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> PALABRAS REALES</div><h2>Lo que dicen <em>ellas</em></h2><p>Opiniones publicadas luego de la moderación de la tienda.</p></div><a className="text-link" href={instagramUrl} target="_blank" rel="noreferrer">Seguinos en Instagram <Instagram size={16}/></a></div>
        {reviews.length ? <div className="review-grid">{reviews.map((review, index) => <article className="review-card" key={`${review.display_name}-${index}`}><div className="review-stars" aria-label={`${review.rating} de 5 estrellas`}>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</div><p>“{review.comment}”</p><div className="review-author"><span className="review-avatar">{review.display_name.charAt(0).toUpperCase()}</span><strong>{review.display_name}</strong></div></article>)}</div> : <div className="review-empty"><span>♡</span><p>Las opiniones auténticas van a aparecer acá cuando haya reseñas aprobadas.</p></div>}
      </section>

      <section className="shipping-banner"><div className="shipping-flower">✿</div><div><span className="eyebrow">DESDE VILLA CONSTITUCIÓN PARA TODO EL PAÍS</span><h2>Tu pedido, más cerca.</h2><p>{settings?.shipping_message || "Coordinamos la empresa de transporte y el costo antes de confirmar la entrega. Sin tarifas inventadas ni sorpresas."}</p></div><Link href="/envios" className="button button-dark">Cómo funcionan los envíos <ArrowRight size={16}/></Link></section>

      <section className="section faq-preview"><div className="faq-intro"><div className="eyebrow"><span className="eyebrow-line"/> TE CONTAMOS</div><h2>¿Tenés dudas?<br/><em>Estamos acá.</em></h2><Link className="text-link" href="/preguntas-frecuentes">Ver todas las respuestas <ArrowRight size={16}/></Link></div><div className="faq-list">{faqs.slice(0,3).map((faq) => <details key={faq.question}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>)}</div></section>
    </main>
  </>;
}
