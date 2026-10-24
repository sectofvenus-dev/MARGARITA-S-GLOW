import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { orderRequestSchema } from "@/lib/order-validation";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "La tienda todavía no está conectada a la base de datos. Intentá más tarde o escribinos por WhatsApp." }, { status: 503 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "El formato de la solicitud no es válido." }, { status: 400 }); }
  const parsed = orderRequestSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Revisá los datos del pedido." }, { status: 400 });
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const data = parsed.data;
  const { data: result, error } = await supabase.rpc("place_order", {
    p_customer: data.customer,
    p_items: data.items,
    p_shipping_company: data.shipping_company,
    p_shipping_other: data.shipping_company === "Otra empresa" ? data.shipping_other : null,
    p_notes: data.notes || null,
    p_payment_method: data.payment_method,
  });
  if (error) {
    const message = error.message.includes("STOCK_INSUFFICIENT") ? "Uno de los productos ya no tiene stock suficiente. Volvé al carrito y actualizá las cantidades." : error.message.includes("PRODUCT_UNAVAILABLE") ? "Uno de los productos dejó de estar disponible. Actualizá el carrito." : "No pudimos registrar el pedido. Revisá los datos e intentá nuevamente.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
  return NextResponse.json({ order: result }, { status: 201 });
}
