"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Minus, Plus, Share2, Star } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Product } from "@/lib/types";
import { formatUYU } from "@/lib/format";
import { useCart } from "@/components/cart-provider";
import { ProductCard } from "@/components/product-card";

export function ProductDetail({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    let alive = true;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setLoading(false); return; }
    supabase.from("products").select("*, categories(id,name,slug)").eq("slug", slug).eq("is_active", true).maybeSingle().then(async ({data}) => {
      if (!alive) return;
      if (!data) { setProduct(null); setLoading(false); return; }
      setProduct(data as Product);
      setActiveImageIndex(0);
      const [r, p] = await Promise.all([
        supabase.from("reviews").select("id,display_name,rating,comment,created_at,is_verified").eq("product_id", data.id).eq("status", "approved").order("created_at", {ascending:false}),
        supabase.from("products").select("*, categories(id,name,slug)").eq("is_active", true).eq("category_id", data.category_id).neq("id", data.id).gt("stock",0).limit(4),
      ]);
      if (!alive) return;
      if (r.data) setReviews(r.data);
      if (p.data) setRelated(p.data as Product[]);
      setLoading(false);
    }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault(); setReviewMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !product) { setReviewMessage("La base de datos no está configurada todavía."); return; }
    if (reviewName.trim().length < 2 || reviewComment.trim().length < 5) { setReviewMessage("Completá tu nombre o seudónimo y un comentario de al menos 5 caracteres."); return; }
    setReviewBusy(true);
    const { error } = await supabase.from("reviews").insert({ product_id: product.id, display_name: reviewName.trim(), rating: Number(reviewRating), comment: reviewComment.trim(), status: "pending", is_verified: false, order_id: null });
    setReviewBusy(false);
    if (error) setReviewMessage("No se pudo enviar la reseña. Revisá la conexión e intentá nuevamente.");
    else { setReviewMessage("¡Gracias! Tu reseña quedó pendiente de moderación antes de publicarse."); setReviewName(""); setReviewComment(""); }
  }

  if (loading) return <div className="loading-screen">Cargando el producto…</div>;
  if (!product) return <section className="content-container"><div className="catalog-empty"><div className="empty-flower">✿</div><h2>No encontramos este producto</h2><p>Puede que ya no esté disponible o que el enlace haya cambiado.</p><Link className="button button-outline" href="/productos"><ArrowLeft size={16}/> Volver al catálogo</Link></div></section>;

  const avg = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const isOut = product.stock < 1;
  return <>
    <div className="content-container"><div style={{marginBottom:22}}><Link className="text-link" href="/productos"><ArrowLeft size={15}/> Volver a la tienda</Link></div><div className="product-detail"><div className="detail-gallery"><div className="detail-image">{product.image_urls?.[activeImageIndex] ? <img src={product.image_urls[activeImageIndex]} alt={`${product.name} · foto ${activeImageIndex+1}`}/> : <div className="detail-placeholder"><img src="/brand/mark.png" alt=""/><span>Foto próximamente</span></div>}</div>{product.image_urls?.length>1&&<div className="detail-thumbnails">{product.image_urls.map((url,index)=><button type="button" className={activeImageIndex===index?"active":""} key={`${url}-${index}`} onClick={()=>setActiveImageIndex(index)} aria-label={`Ver foto ${index+1} de ${product.name}`}><img src={url} alt=""/></button>)}</div>}</div><div className="detail-info"><div className="eyebrow"><span className="eyebrow-line"/> {product.brand || product.categories?.name || "Margarita's Glow"}</div><h1>{product.name}</h1>{reviews.length > 0 && <div className="review-stars" aria-label={`Promedio ${avg.toFixed(1)} de 5 estrellas`}>{"★".repeat(Math.round(avg))}{"☆".repeat(5-Math.round(avg))} <span style={{fontSize:11,color:"var(--muted)",letterSpacing:0}}> {avg.toFixed(1)} · {reviews.length} opinión{reviews.length===1?"":"es"}</span></div>}<div className="detail-price">{formatUYU(product.price)}{product.compare_at_price && product.compare_at_price > product.price && <del>{formatUYU(product.compare_at_price)}</del>}</div><p className="detail-description">{product.description || "La tienda actualizará esta descripción con información confirmada del producto."}</p><div className={`detail-stock ${isOut ? "out" : ""}`}>{isOut ? "Actualmente agotado" : `Disponible · ${product.stock} en stock`}</div>{!isOut && <div className="detail-actions"><div className="quantity-control"><button aria-label="Reducir cantidad" onClick={() => setQty((n)=>Math.max(1,n-1))}><Minus size={15}/></button><span>{qty}</span><button aria-label="Aumentar cantidad" onClick={() => setQty((n)=>Math.min(product.stock,20,n+1))}><Plus size={15}/></button></div><button className="button button-primary" onClick={() => {addItem(product,qty);setMessage("Agregado al carrito. Podés seguir mirando o finalizar tu pedido.");}}><Heart size={15}/> Agregar al carrito</button></div>}{message && <p className="form-success" role="status">{message} <Link href="/carrito" style={{fontWeight:700,textDecoration:"underline"}}>Ver carrito</Link></p>}<div className="notice" style={{marginTop:22}}>El costo del envío y la empresa disponible se coordinan según el destino antes de confirmar la entrega. El total del pedido no incluye un envío no cotizado.</div><p className="field-hint" style={{marginTop:15}}>SKU: {product.sku}</p></div></div>
      <section style={{marginTop:60}}><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> OPINIONES</div><h2 style={{fontFamily:"Georgia,serif",fontWeight:400,fontSize:34,margin:"12px 0 4px"}}>Experiencias <em>reales</em></h2><p>Las reseñas se revisan antes de publicarse. “Compra verificada” solo aparece cuando la compra se comprueba.</p></div></div><div className="review-list">{reviews.length ? reviews.map((r) => <article className="review-list-card" key={r.id}><div className="review-stars">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</div><p>{r.comment}</p><small>{r.display_name} · {new Date(r.created_at).toLocaleDateString("es-UY")}{r.is_verified ? " · Compra verificada" : ""}</small></article>) : <p className="admin-muted">Todavía no hay reseñas publicadas para este producto.</p>}</div><form className="review-form" onSubmit={submitReview}><h3>Dejá tu opinión</h3><p className="admin-muted">Tu reseña quedará pendiente hasta que la tienda la revise.</p><div className="form-grid"><div className="form-field"><label htmlFor="reviewName">Nombre o seudónimo autorizado</label><input id="reviewName" maxLength={80} value={reviewName} onChange={(e)=>setReviewName(e.target.value)} required/></div><div className="form-field"><label htmlFor="reviewRating">Calificación</label><select id="reviewRating" value={reviewRating} onChange={(e)=>setReviewRating(e.target.value)}>{[5,4,3,2,1].map((n)=><option value={n} key={n}>{n} de 5 estrellas</option>)}</select></div><div className="form-field full"><label htmlFor="reviewComment">Tu comentario</label><textarea id="reviewComment" maxLength={1000} value={reviewComment} onChange={(e)=>setReviewComment(e.target.value)} required/></div></div><button className="button button-outline" type="submit" disabled={reviewBusy}>{reviewBusy ? "Enviando…" : "Enviar reseña"} <Star size={14}/></button>{reviewMessage && <p className={reviewMessage.startsWith("¡Gracias") ? "form-success" : "form-error"} role="status">{reviewMessage}</p>}</form></section>
      {related.length>0 && <section style={{marginTop:65}}><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> PARA SEGUIR DESCUBRIENDO</div><h2 style={{fontFamily:"Georgia,serif",fontWeight:400,fontSize:34,margin:"12px 0 4px"}}>También te puede <em>gustar</em></h2></div></div><div className="product-grid">{related.map((p)=><ProductCard key={p.id} product={p}/>)}</div></section>}
    </div>
  </>;
}
