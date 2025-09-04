import { useContext } from "react";
import { CartContext } from "../contexts/CartContextDefinition";

/**
 * Custom hook to access the cart context
 * @returns Cart context with items, methods for adding, removing, and updating items
 */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
