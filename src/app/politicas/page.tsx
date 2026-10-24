import type { Metadata } from "next";
import { PoliciesContent } from "@/components/policies-content";
export const metadata: Metadata = { title: "Condiciones de compra y privacidad" };
export default function PoliciesPage(){return <><section className="page-hero"><div className="eyebrow"><span className="eyebrow-line"/> INFORMACIÓN IMPORTANTE</div><h1>Condiciones claras, <em>compra tranquila.</em></h1><p>Antes de publicar la tienda, la propietaria debe revisar y completar las políticas del emprendimiento.</p></section><PoliciesContent/></>}
