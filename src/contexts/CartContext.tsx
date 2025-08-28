import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string; // product id
  name: string;
  size: string;
  image?: string;
  province: string;
  unitPrice: number; // distributor price used
  moq: number;
  qty: number;
  consumerPrice: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "baskit_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setItems(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      // merge by product+province if exists
      const idx = prev.findIndex((p) => p.id === item.id && p.province === item.province);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + item.qty };
        return copy;
      }
      return [...prev, item];
    });
  };

  const clear = () => setItems([]);

  const value = useMemo(() => ({ items, addItem, clear }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
