"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { StoreSettings } from "@/lib/types";
import { toWhatsAppNumber } from "@/lib/format";
const defaults = [
 {question:"¿Cómo realizo una compra?",answer:"Elegí los productos, agregalos al carrito y completá tus datos para registrar el pedido. Después coordinaremos el envío y el pago."},
 {question:"¿Hacen envíos a todo Uruguay?",answer:"Recibimos pedidos desde todo el país. La empresa disponible se coordina según tu destino."},
 {question:"¿Qué empresas de transporte puedo elegir?",answer:"Podés indicar La Nave, UES, Norteño, Correo Uruguayo u otra empresa. La preferencia queda sujeta a disponibilidad y confirmación."},
 {question:"¿Cómo se confirma el costo del envío?",answer:"El costo queda pendiente de confirmación hasta verificar el destino y la empresa de transporte."},
 {question:"¿Cuáles son los medios de pago?",answer:"El método inicial es la transferencia bancaria manual. Las instrucciones se muestran después de registrar el pedido y seleccionar este método. El pago se confirma manualmente al revisar el comprobante."},
 {question:"¿Cómo envío el comprobante?",answer:"Podés enviarlo por WhatsApp al canal de contacto de la tienda."},
 {question:"¿Qué pasa si un producto está agotado?",answer:"El catálogo indica los productos agotados y el sistema verifica el stock nuevamente al registrar el pedido."},
 {question:"¿Cómo puedo comunicarme con la tienda?",answer:"Podés escribir por WhatsApp al 099 782 589 o por Instagram en @margaritasglow.uy."},
];
export function FAQContent(){
 const [faqs,setFaqs]=useState(defaults); const [phone,setPhone]=useState("099 782 589"); const [instagramUrl,setInstagramUrl]=useState("https://www.instagram.com/margaritasglow.uy/");
 useEffect(()=>{const sb=getSupabaseBrowserClient();if(sb)sb.from("store_settings").select("faqs,phone,instagram_url").eq("id",1).maybeSingle().then(({data})=>{if(data?.faqs?.length)setFaqs(data.faqs as StoreSettings["faqs"]);if(data?.phone)setPhone(data.phone);if(data?.instagram_url)setInstagramUrl(data.instagram_url);});},[]);
 const whatsappUrl = `https://wa.me/${toWhatsAppNumber(phone)}`;
 return <><section className="page-hero"><div className="eyebrow"><span className="eyebrow-line"/> PREGUNTAS FRECUENTES</div><h1>Lo que necesitás <em>saber.</em></h1><p>Queremos que comprar sea sencillo desde el primer clic.</p></section><section className="content-container faq-page">{faqs.map((faq)=><details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}<div className="notice" style={{marginTop:30}}>¿No encontraste tu respuesta? <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{fontWeight:700,textDecoration:"underline"}}>Escribinos por WhatsApp.</a> <a href={instagramUrl} target="_blank" rel="noreferrer" style={{fontWeight:700,textDecoration:"underline"}}>También estamos en Instagram.</a></div></section></>
}
