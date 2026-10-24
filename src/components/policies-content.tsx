"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { StoreSettings } from "@/lib/types";
import { toWhatsAppNumber } from "@/lib/format";

const initialPolicies = [
  { title: "Compras y confirmación", body: "Enviar una solicitud registra un pedido, pero no significa que el pago esté confirmado. La tienda revisará la disponibilidad de los productos, los datos de entrega y la coordinación del transporte. El estado de pago solo cambiará cuando exista una confirmación real." },
  { title: "Precios, stock y envío", body: "Los precios publicados corresponden a los productos. El costo del envío se confirma por separado según el destino y la empresa de transporte. El stock se comprueba en el servidor al registrar el pedido y puede cambiar antes de que el pedido quede registrado." },
  { title: "Transferencias", body: "Si elegís transferencia bancaria, las instrucciones se muestran después de registrar el pedido. Enviá el comprobante por el canal de contacto para que la tienda pueda revisar el pago. No compartas claves, PIN ni contraseñas bancarias." },
  { title: "Cambios y devoluciones", body: "La política específica de cambios y devoluciones debe ser completada y aprobada por la propietaria antes de vender por la web. No se inventan plazos, excepciones ni condiciones en esta versión inicial." },
  { title: "Privacidad", body: "Los datos solicitados durante la compra se usan para registrar el pedido y coordinar la entrega. El acceso a los datos de clientes se limita al panel administrativo autorizado. Antes de publicar, la propietaria debe completar la información legal de privacidad, conservación y ejercicio de derechos que corresponda." },
];

export function PoliciesContent() {
  const [policies, setPolicies] = useState<StoreSettings["policies"]>(initialPolicies);
  const [phone, setPhone] = useState("099 782 589");
  const [instagramUrl, setInstagramUrl] = useState("https://www.instagram.com/margaritasglow.uy/");
  useEffect(() => {
    const sb = getSupabaseBrowserClient();
    if (sb) sb.from("store_settings").select("policies,phone,instagram_url").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data?.policies?.length) setPolicies(data.policies as StoreSettings["policies"]);
      if (data?.phone) setPhone(data.phone);
      if (data?.instagram_url) setInstagramUrl(data.instagram_url);
    });
  }, []);
  const whatsappUrl = `https://wa.me/${toWhatsAppNumber(phone)}`;
  return <section className="content-container page-copy">
    <div className="draft-notice"><strong>Revisión pendiente antes de publicar.</strong> Este texto es una base informativa, no una política legal definitiva. Melany debe validar las condiciones de venta, cambios, devoluciones, privacidad y tratamiento de datos aplicables a su actividad en Uruguay.</div>
    {policies.map((policy, index) => <section key={`${policy.title}-${index}`}><h2>{policy.title}</h2><p>{policy.body}</p></section>)}
    <h2>Contacto</h2><p>Para consultas sobre pedidos, escribinos por <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{color:"var(--wine)",fontWeight:700}}>WhatsApp · {phone}</a> o por <a href={instagramUrl} target="_blank" rel="noreferrer" style={{color:"var(--wine)",fontWeight:700}}>Instagram</a>.</p>
  </section>;
}
