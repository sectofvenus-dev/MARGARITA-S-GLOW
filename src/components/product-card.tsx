import Link from "next/link";
import { ArrowUpRight, Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatUYU } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const image = product.image_urls?.[0];
  const soldOut = product.stock < 1;
  return <article className="product-card">
    <Link href={`/productos/${product.slug}`} className="product-image-link" aria-label={`Ver ${product.name}`}>
      <div className={`product-image ${image ? "has-image" : ""}`}>
        {image ? <img src={image} alt={product.name} loading="lazy"/> : <div className="image-placeholder"><img src="/brand/mark.png" alt=""/><span>Foto próximamente</span></div>}
        {product.is_featured && <span className="product-ribbon">Favorito</span>}
        {soldOut && <span className="sold-out-ribbon">Agotado</span>}
        <span className="product-quick-view"><ArrowUpRight size={17}/></span>
      </div>
    </Link>
    <div className="product-card-body">
      <div className="product-brand">{product.brand || product.categories?.name || "Margarita's Glow"}</div>
      <Link href={`/productos/${product.slug}`} className="product-name">{product.name}</Link>
      <div className="product-card-bottom"><div className="product-price">{formatUYU(product.price)}{product.compare_at_price && product.compare_at_price > product.price && <del>{formatUYU(product.compare_at_price)}</del>}</div><span className={soldOut ? "stock-label out" : "stock-label"}>{soldOut ? "Agotado" : "Disponible"}</span></div>
    </div>
  </article>;
}
