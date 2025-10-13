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
 * UOM conversion information for cart items
 */
export type UomConversion = {
  /** Unit of measurement */
  uom: string;
  /** Conversion factor */
  factor: number;
  /** Converted quantity (for MOQ) */
  convertedQuantity?: number;
  /** Converted price (for pricing) */
  convertedPrice?: number;
};

/**
 * Selected UOMs for the cart item
 */
export type SelectedUoms = {
  /** MOQ unit of measurement */
  moq: string;
  /** Pricing unit of measurement */
  pricing: string;
  /** Base unit of measurement */
  base: string;
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
  /** UOM conversion data (not displayed but available for calculations) */
  uomConversions?: {
    moq: UomConversion;
    pricing: UomConversion;
    base: UomConversion;
  };
  /** Selected UOMs for this cart item */
  selectedUoms?: SelectedUoms;
  /** SKU-level MOQ (for mixed variants) */
  skuLevelMoq?: number;
  /** Whether variants can be mixed for MOQ */
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
