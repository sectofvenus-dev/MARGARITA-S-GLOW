import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { ProductDetail } from "@/components/product-detail";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { title: "Detalle del producto", description: "Información, disponibilidad y reseñas de productos de Margarita's Glow." };
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data } = await supabase.from("products").select("name,brand,description,image_urls,price").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!data) return { title: "Producto no encontrado" };
  const description = (data.description || `${data.name}${data.brand ? ` de ${data.brand}` : ""} en Margarita's Glow.`).slice(0, 160);
  return {
    title: data.name,
    description,
    openGraph: { title: `${data.name} | Margarita's Glow`, description, type: "website", images: data.image_urls?.[0] ? [data.image_urls[0]] : ["/brand/wordmark.png"] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}
