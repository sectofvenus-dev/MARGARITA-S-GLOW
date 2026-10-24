import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const fixed: MetadataRoute.Sitemap = ["", "/productos", "/envios", "/preguntas-frecuentes", "/politicas"].map((path) => ({
    url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : 0.6,
  }));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fixed;
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data } = await supabase.from("products").select("slug,updated_at").eq("is_active", true);
  const productUrls: MetadataRoute.Sitemap = (data || []).map((product) => ({
    url: `${base}/productos/${product.slug}`, lastModified: product.updated_at ? new Date(product.updated_at) : new Date(), changeFrequency: "weekly", priority: 0.7,
  }));
  return [...fixed, ...productUrls];
}
