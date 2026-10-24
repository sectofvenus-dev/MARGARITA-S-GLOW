"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ProductCard } from "@/components/product-card";
import { toWhatsAppNumber } from "@/lib/format";

export function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [stock, setStock] = useState("available");
  const [sort, setSort] = useState("newest");
  const [maxPrice, setMaxPrice] = useState("all");
  const [connectionMissing, setConnectionMissing] = useState(false);
  const [contactPhone, setContactPhone] = useState("099 782 589");

  useEffect(() => {
    const queryFromUrl = new URLSearchParams(window.location.search).get("q");
    if (queryFromUrl) setSearch(queryFromUrl);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setConnectionMissing(true); setLoading(false); return; }
    Promise.all([
      supabase.from("products").select("*, categories(id,name,slug)").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("categories").select("id,name,slug,is_active").eq("is_active", true).order("name"),
      supabase.from("store_settings").select("phone").eq("id", 1).maybeSingle(),
    ]).then(([p, c, settings]) => {
      if (!p.error && p.data) setProducts(p.data as Product[]);
      if (!c.error && c.data) setCategories(c.data as Category[]);
      if (!settings.error && settings.data?.phone) setContactPhone(settings.data.phone);
      setConnectionMissing(Boolean(p.error || c.error));
    }).finally(() => setLoading(false));
  }, []);

  const whatsappLink = `https://wa.me/${toWhatsAppNumber(contactPhone)}`;
  const brands = useMemo(() => [...new Set(products.map((product) => product.brand).filter(Boolean) as string[])].sort(), [products]);
  const visible = useMemo(() => {
    let rows = [...products];
    const query = search.trim().toLocaleLowerCase("es-UY");
    if (query) rows = rows.filter((product) => `${product.name} ${product.brand || ""} ${product.description || ""} ${product.sku}`.toLocaleLowerCase("es-UY").includes(query));
    if (category !== "all") rows = rows.filter((product) => product.category_id === category);
    if (brand !== "all") rows = rows.filter((product) => product.brand === brand);
    if (stock === "available") rows = rows.filter((product) => product.stock > 0);
    if (stock === "soldout") rows = rows.filter((product) => product.stock < 1);
    if (maxPrice !== "all") rows = rows.filter((product) => product.price <= Number(maxPrice));
    if (sort === "price-asc") rows.sort((a,b) => a.price-b.price);
    if (sort === "price-desc") rows.sort((a,b) => b.price-a.price);
    if (sort === "newest") rows.sort((a,b) => b.created_at.localeCompare(a.created_at));
    if (sort === "relevance") rows.sort((a,b) => Number(b.is_featured)-Number(a.is_featured));
    return rows;
  }, [products, search, category, brand, stock, sort, maxPrice]);

  return <section className="content-container">
    <div className="catalog-toolbar"><div className="header-search" style={{maxWidth:"none",flex:1}}><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscá por producto o marca" aria-label="Buscar en catálogo"/></div><select aria-label="Ordenar productos" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Más nuevos</option><option value="relevance">Destacados</option><option value="price-asc">Precio: menor a mayor</option><option value="price-desc">Precio: mayor a menor</option></select><span className="catalog-count">{loading ? "Cargando…" : `${visible.length} producto${visible.length === 1 ? "" : "s"}`}</span></div>
    <div className="catalog-layout"><aside className="filter-panel"><h3><SlidersHorizontal size={15} style={{display:"inline",marginRight:7}}/> Filtrar</h3><div className="filter-group"><label htmlFor="category">Categoría</label><select id="category" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">Todas las categorías</option>{categories.filter((c) => products.some((p) => p.category_id === c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="filter-group"><label htmlFor="brand">Marca</label><select id="brand" value={brand} onChange={(e) => setBrand(e.target.value)}><option value="all">Todas las marcas</option>{brands.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className="filter-group"><label htmlFor="price">Precio máximo</label><select id="price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}><option value="all">Sin límite</option><option value="150">Hasta $ 150</option><option value="250">Hasta $ 250</option><option value="500">Hasta $ 500</option><option value="1000">Hasta $ 1.000</option></select></div><div className="filter-group"><label htmlFor="stock">Disponibilidad</label><select id="stock" value={stock} onChange={(e) => setStock(e.target.value)}><option value="available">Disponibles</option><option value="all">Todos</option><option value="soldout">Agotados</option></select></div><p className="filter-note">Los precios y el stock definitivos se comprueban nuevamente al confirmar el pedido.</p></aside>
      <div>{loading ? <div className="loading-screen">Estamos preparando los productos…</div> : visible.length ? <div className="product-grid">{visible.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="catalog-empty"><div className="empty-flower">✿</div><h2>{connectionMissing ? "La tienda se está conectando" : products.length ? "No encontramos coincidencias" : "Estamos preparando el catálogo"}</h2><p>{connectionMissing ? "La base de datos aún no está configurada o no está disponible. Consultá por WhatsApp mientras tanto." : products.length ? "Probá cambiar los filtros o escribinos para consultar por un producto." : "Los productos reales se cargarán desde el panel privado. No mostramos artículos ni stock inventados."}</p>{products.length > 0 ? <button className="button button-outline" onClick={() => {setSearch("");setCategory("all");setBrand("all");setStock("available");setMaxPrice("all");}}>Limpiar filtros</button> : <a className="button button-outline" href={whatsappLink} target="_blank" rel="noreferrer">Consultar por WhatsApp</a>}</div>}</div>
    </div>
  </section>;
}
