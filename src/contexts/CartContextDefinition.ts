import { createContext } from "react";

// Define CartItem type here to avoid circular import
export type CartItem = {
  id: string;
  name: string;
  size: string;
  image?: string;
  province: string;
  unitPrice: number;
  moq: number;
  qty: number;
  consumerPrice: number;
};

export type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, province: string) => void;
  updateQuantity: (id: string, province: string, qty: number) => void;
  clear: () => void;
  totalItems: number;
  totalAmount: number;
};

export const CartContext = createContext<CartContextType | undefined>(undefined);
