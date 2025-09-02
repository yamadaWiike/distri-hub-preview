import { createContext } from "react";
import { CartItem } from "./CartContext";

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
