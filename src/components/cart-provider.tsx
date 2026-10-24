"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/lib/types";

const CART_KEY = "margaritas-glow-cart-v1";
type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  total: number;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed.filter((item) => item?.product?.id && Number.isInteger(item.quantity) && item.quantity > 0));
      }
    } catch {
      window.localStorage.removeItem(CART_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    const safeQty = Math.max(1, Math.min(20, Math.floor(quantity)));
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) => item.product.id === product.id
          ? { ...item, product: { ...item.product, price: product.price, stock: product.stock }, quantity: Math.min(product.stock, item.quantity + safeQty) }
          : item);
      }
      const snapshot = {
        id: product.id, slug: product.slug, sku: product.sku, name: product.name,
        brand: product.brand, price: product.price, stock: product.stock, image_urls: product.image_urls,
      };
      return [...current, { product: snapshot, quantity: Math.min(safeQty, product.stock) }].filter((item) => item.quantity > 0);
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) => current.filter((item) => item.product.id !== productId));
      return;
    }
    setItems((current) => current.map((item) => item.product.id === productId
      ? { ...item, quantity: Math.max(1, Math.min(item.product.stock || 1, Math.min(20, Math.floor(quantity)))) }
      : item));
  }, []);
  const removeItem = useCallback((productId: string) => setItems((current) => current.filter((item) => item.product.id !== productId)), []);
  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({
    items, hydrated,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    addItem, updateQuantity, removeItem, clearCart,
  }), [items, hydrated, addItem, updateQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart debe usarse dentro de CartProvider");
  return value;
}
