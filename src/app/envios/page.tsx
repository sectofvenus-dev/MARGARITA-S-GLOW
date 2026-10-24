import type { Metadata } from "next";
import { ShippingContent } from "@/components/shipping-content";
export const metadata: Metadata = { title: "Envíos y entregas", description: "Información sobre coordinación de envíos de Margarita's Glow en Uruguay." };
export default function ShippingPage(){ return <ShippingContent />; }
