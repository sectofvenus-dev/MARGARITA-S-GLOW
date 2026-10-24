import test from "node:test";
import assert from "node:assert/strict";
import { orderRequestSchema } from "../src/lib/order-validation";

const goodOrder = {
  customer: { full_name: "Ana Pérez", phone: "099 123 456", department: "Salto", locality: "Constitución", address: "", postal_code: "" },
  items: [{ product_id: "550e8400-e29b-41d4-a716-446655440000", quantity: 2 }],
  shipping_company: "UES", shipping_other: "", notes: "", payment_method: "transferencia",
};

test("accepts a valid order without trusting client prices", () => {
  const result = orderRequestSchema.safeParse(goodOrder);
  assert.equal(result.success, true);
});

test("rejects quantities below one", () => {
  const result = orderRequestSchema.safeParse({ ...goodOrder, items: [{ ...goodOrder.items[0], quantity: 0 }] });
  assert.equal(result.success, false);
});

test("requires a name when another carrier is selected", () => {
  const result = orderRequestSchema.safeParse({ ...goodOrder, shipping_company: "Otra empresa", shipping_other: " " });
  assert.equal(result.success, false);
});

test("does not accept fake client-side payment methods", () => {
  const result = orderRequestSchema.safeParse({ ...goodOrder, payment_method: "tarjeta" });
  assert.equal(result.success, false);
});
