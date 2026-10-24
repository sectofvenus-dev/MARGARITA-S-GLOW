import { z } from "zod";

export const orderRequestSchema = z.object({
  customer: z.object({
    full_name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(7).max(30),
    department: z.string().trim().min(2).max(80),
    locality: z.string().trim().min(2).max(100),
    address: z.string().trim().max(200).optional().default(""),
    postal_code: z.string().trim().max(20).optional().default(""),
  }),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1).max(20),
  })).min(1).max(40),
  shipping_company: z.enum(["La Nave", "UES", "Norteño", "Correo Uruguayo", "Otra empresa"]),
  shipping_other: z.string().trim().max(100).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
  payment_method: z.literal("transferencia"),
}).superRefine((data, ctx) => {
  if (data.shipping_company === "Otra empresa" && data.shipping_other.trim().length < 2) {
    ctx.addIssue({ code: "custom", path: ["shipping_other"], message: "Indica el nombre de la empresa de transporte." });
  }
  const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQuantity > 80) {
    ctx.addIssue({ code: "custom", path: ["items"], message: "El pedido supera la cantidad máxima permitida." });
  }
});

export type OrderRequest = z.infer<typeof orderRequestSchema>;
