export type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export type Product = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brand: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  image_urls: string[];
  category_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  categories?: { id: string; name: string; slug: string } | null;
};

export type CartItem = {
  product: Pick<Product, "id" | "slug" | "sku" | "name" | "brand" | "price" | "stock" | "image_urls">;
  quantity: number;
};

export type StoreSettings = {
  id: number;
  phone: string;
  instagram_url: string;
  shipping_message: string;
  faqs: { question: string; answer: string }[];
  policies: { title: string; body: string }[];
};

export type OrderLine = {
  product_id: string | null;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export const ORDER_STATUSES = [
  { value: "pendiente_confirmacion", label: "Pendiente de confirmación" },
  { value: "pendiente_pago", label: "Pendiente de pago" },
  { value: "pago_confirmado", label: "Pago confirmado" },
  { value: "en_preparacion", label: "En preparación" },
  { value: "enviado", label: "Enviado" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
] as const;
