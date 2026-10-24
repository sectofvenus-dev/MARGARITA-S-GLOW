import type { Metadata } from "next";
import CartPage from "@/components/cart-page";
export const metadata: Metadata = { title: "Carrito de compras", robots: { index: false, follow: false } };
export default function CartRoute(){ return <CartPage />; }
