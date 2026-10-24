"use client";

import Link from "next/link";
import { Instagram, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useCart } from "@/components/cart-provider";

export function SiteHeader() {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("https://www.instagram.com/margaritasglow.uy/");
  useEffect(() => { const sb = getSupabaseBrowserClient(); if (sb) sb.from("store_settings").select("instagram_url").eq("id", 1).maybeSingle().then(({ data }) => { if (data?.instagram_url) setInstagramUrl(data.instagram_url); }); }, []);
  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    window.location.href = `/productos?q=${encodeURIComponent(search.trim())}`;
  }
  return <>
    <div className="top-strip">Tu próximo favorito está acá <span aria-hidden="true">✿</span> Envíos a todo Uruguay</div>
    <header className="site-header">
      <button className="icon-button mobile-only" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button>
      <Link className="brand-link" href="/" aria-label="Margarita's Glow - inicio"><img src="/brand/wordmark.png" alt="Margarita's glow" /></Link>
      <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Principal">
        <Link href="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
        <Link href="/productos" onClick={() => setMenuOpen(false)}>Tienda</Link>
        <Link href="/envios" onClick={() => setMenuOpen(false)}>Envíos</Link>
        <Link href="/preguntas-frecuentes" onClick={() => setMenuOpen(false)}>Preguntas frecuentes</Link>
      </nav>
      <form className="header-search" onSubmit={submitSearch} role="search">
        <Search size={17} aria-hidden="true"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar un favorito" aria-label="Buscar productos" />
      </form>
      <a className="header-instagram" href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram de Margarita's Glow"><Instagram size={19}/></a>
      <Link className="cart-link" href="/carrito" aria-label={`Carrito con ${count} productos`}><ShoppingBag size={20}/><span>Carrito</span>{count > 0 && <b>{count}</b>}</Link>
    </header>
  </>;
}
