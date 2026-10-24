import type { Metadata } from "next";
import { FAQContent } from "@/components/faq-content";
export const metadata: Metadata = { title: "Preguntas frecuentes", description: "Respuestas sobre compras, envíos, pagos y contacto de Margarita's Glow." };
export default function FAQPage(){ return <FAQContent />; }
