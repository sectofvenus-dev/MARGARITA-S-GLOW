import type { Metadata } from "next";
import { Catalog } from "@/components/catalog";
export const metadata: Metadata = { title: "Tienda online", description: "Explorá el catálogo de maquillaje, cuidado personal y accesorios de Margarita's Glow." };
export default function ProductsPage() { return <><section className="page-hero"><div className="eyebrow"><span className="eyebrow-line"/> EL CATÁLOGO</div><h1>Encontrá tu próximo <em>favorito.</em></h1><p>Explorá la selección disponible y consultá por WhatsApp cuando necesites una mano para elegir.</p></section><Catalog/></>; }
