/**
 * Shopping Cart Context Provider
 * Manages shopping cart state, storage, and operations
 */

// Third-party imports
import React, { useCallback, useEffect, useMemo, useState } from "react";

// Type definitions
import { CartContext, CartContextType, CartItem } from "./CartContextDefinition";

// Constants
const STORAGE_KEY = "baskit_cart";

/**
 * Cart Provider Component
 * Provides cart functionality to the application
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  // State to hold cart items
  const [items, setItems] = useState<CartItem[]>([]);

  /**
   * Load cart from localStorage on component mount
   */
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

  /**
   * Save cart to localStorage whenever it changes
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  /**
   * Add an item to the cart
   * If the item already exists (same id, province, and variant), it will be replaced
   * @param item - The cart item to add
   */
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
  }, []);

  /**
   * Remove an item from the cart
   * @param id - Product ID
   * @param province - Product province
   * @param variantId - Optional variant ID
   */
  const removeItem = useCallback((id: string, province: string, variantId?: string) => {
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

  /**
   * Update item quantity in the cart
   * If quantity <= 0, the item will be removed from the cart
   * 
   * @param id - Product ID
   * @param province - Product province
   * @param qty - New quantity
   * @param variantId - Optional variant ID
   */
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

  /**
   * Clear all items from the cart
   */
  const clear = useCallback(() => setItems([]), []);
  
  /**
   * Calculate total number of items in the cart
   */
  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }, [items]);
  
  /**
   * Calculate total monetary amount in the cart
   */
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
  }, [items]);

  /**
   * Create memoized context value to prevent unnecessary re-renders
   */
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
