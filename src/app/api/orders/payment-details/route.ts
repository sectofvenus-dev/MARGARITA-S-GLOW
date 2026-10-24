import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const runtime = "nodejs";
const schema = z.object({ order_number: z.string().min(8).max(40), access_token: z.string().uuid() });
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ message: "La tienda todavía no está conectada." }, { status: 503 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ message: "Solicitud no válida." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ message: "No se pudo validar el pedido." }, { status: 400 });
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: result, error } = await supabase.rpc("get_order_payment_access", { p_order_number: parsed.data.order_number, p_access_token: parsed.data.access_token });
  if (error || !result) return NextResponse.json({ message: "No se pudo verificar el pedido. Contactá a la tienda para coordinar el pago." }, { status: 403 });
  if (result.payment_method !== "transferencia") return NextResponse.json({ message: "Este pedido no utiliza transferencia bancaria." }, { status: 400 });
  const { BANK_HOLDER, BANK_NAME, BANK_ACCOUNT } = process.env;
  if (!BANK_HOLDER || !BANK_NAME || !BANK_ACCOUNT) return NextResponse.json({ message: "El pedido quedó registrado, pero las instrucciones de transferencia aún no están configuradas. Contactá a la tienda antes de pagar." }, { status: 503 });
  return NextResponse.json({ payment: { holder: BANK_HOLDER, bank: BANK_NAME, account: BANK_ACCOUNT } });
}
