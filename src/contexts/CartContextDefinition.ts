/**
 * Cart Context Type Definitions
 * Contains type definitions for cart items and context
 */
import { createContext } from "react";

/**
 * Product variant information
 */
export type CartItemVariant = {
  /** Unique identifier for the variant */
  id: string;
  /** Display name of the variant */
  name: string;
  /** Additional price for this variant (can be 0) */
  additionalPrice: number;
};

/**
 * Cart item representation
 * Defines the structure of items stored in the cart
 */
export type CartItem = {
  /** Product ID */
  id: string;
  /** Product name */
  name: string;
  /** Product size/weight */
  size: string;
  /** Optional product image URL */
  image?: string;
  /** Province code for region-specific pricing */
  province: string;
  /** Price per unit */
  unitPrice: number;
  /** Minimum order quantity */
  moq: number;
  /** Quantity in cart */
  qty: number;
  /** Recommended retail price */
  consumerPrice: number;
  /** Optional variant information */
  variant?: CartItemVariant;
  /** SKU-level MOQ for mixed variants */
  skuLevelMoq?: number;
  /** Whether different variants can be mixed to meet MOQ */
  allowMixVariants?: boolean;
};

/**
 * Cart context interface
 * Defines the shape of the cart context and available operations
 */
export type CartContextType = {
  /** List of items in the cart */
  items: CartItem[];
  /** Add an item to the cart */
  addItem: (item: CartItem) => void;
  /** Remove an item from the cart */
  removeItem: (id: string, province: string, variantId?: string) => void;
  /** Update the quantity of an item */
  updateQuantity: (id: string, province: string, qty: number, variantId?: string) => void;
  /** Clear all items from the cart */
  clear: () => void;
  /** Total number of items in cart */
  totalItems: number;
  /** Total monetary value of items in cart */
  totalAmount: number;
};

/**
 * Cart context
 * Used by CartProvider to provide cart functionality
 */
export const CartContext = createContext<CartContextType | undefined>(undefined);
