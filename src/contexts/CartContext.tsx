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
    // Check if the product already exists in the cart with the same variant
    const idx = prev.findIndex((p) => 
      p.id === item.id && 
      p.province === item.province && 
      ((!p.variant && !item.variant) || // Both don't have variants
       (p.variant && item.variant && p.variant.id === item.variant.id)) // Same variant
    );
    
    if (idx >= 0) {
      // Replace the entire item with the new one but use the exact quantity passed
      // instead of adding quantities together
      const copy = [...prev];
      copy[idx] = { ...item };
      return copy;
    }
    return [...prev, item];
  });
  
  // Log the current cart for debugging
  console.log(`Added item to cart: ${item.name} ${item.variant ? `(${item.variant.name})` : ''}`);
}, []);  const removeItem = useCallback((id: string, province: string, variantId?: string) => {
    setItems((prev) => 
      prev.filter(item => {
        // If variantId is provided, we need to match it as well
        if (variantId) {
          return !(item.id === id && 
                   item.province === province && 
                   item.variant?.id === variantId);
        }
        // Otherwise, just match product ID and province
        return !(item.id === id && item.province === province);
      })
    );
  }, []);

  const updateQuantity = useCallback((id: string, province: string, qty: number, variantId?: string) => {
    if (qty <= 0) {
      removeItem(id, province, variantId);
      return;
    }
    
    setItems((prev) => {
      return prev.map(item => {
        // If variantId is provided, match it as well
        if (variantId) {
          if (item.id === id && item.province === province && item.variant?.id === variantId) {
            return { ...item, qty };
          }
        } else if (item.id === id && item.province === province) {
          // If no variantId is provided, just match product ID and province
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
