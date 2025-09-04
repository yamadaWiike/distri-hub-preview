import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CartContext, CartContextType, CartItem } from "./CartContextDefinition";

const STORAGE_KEY = "baskit_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setItems(JSON.parse(raw));
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      // Check if the product already exists in the cart
      const idx = prev.findIndex((p) => p.id === item.id && p.province === item.province);
      if (idx >= 0) {
        // Replace the entire item with the new one but use the exact quantity passed
        // instead of adding quantities together
        const copy = [...prev];
        copy[idx] = { ...item };
        return copy;
      }
      return [...prev, item];
    });
  }, []);
  
  const removeItem = useCallback((id: string, province: string) => {
    setItems((prev) => 
      prev.filter(item => !(item.id === id && item.province === province))
    );
  }, []);

  const updateQuantity = useCallback((id: string, province: string, qty: number) => {
    if (qty <= 0) {
      removeItem(id, province);
      return;
    }
    
    setItems((prev) => {
      return prev.map(item => {
        if (item.id === id && item.province === province) {
          return { ...item, qty };
        }
        return item;
      });
    });
  }, [removeItem]);

  const clear = useCallback(() => setItems([]), []);
  
  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }, [items]);
  
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
  }, [items]);

  const value = useMemo(() => ({ 
    items, 
    addItem, 
    removeItem, 
    updateQuantity, 
    clear, 
    totalItems, 
    totalAmount 
  }), [items, totalItems, totalAmount, addItem, removeItem, updateQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
