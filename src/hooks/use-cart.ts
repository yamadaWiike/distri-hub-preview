/**
 * Shopping Cart hook
 * Used to access cart items and cart management functions
 */

import { useContext } from "react";
import { CartContext } from "@/contexts/CartContextDefinition";

/**
 * Custom hook for accessing the cart context
 * Must be used within a CartProvider
 * 
 * @returns The cart context containing items, cart operations, and totals
 */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
