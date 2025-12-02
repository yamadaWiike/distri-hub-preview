import { CartItem } from "@/contexts/CartContextDefinition";

/**
 * Check if mixed variants in cart meet the SKU-level MOQ requirement
 */
export const checkMixedVariantsMOQ = (
  items: CartItem[], 
  baseProductId: string, 
  area: string, 
  skuLevelMoq: number
) => {
  // Find all items in cart that match this base product and area
  const relatedItems = items.filter(item => 
    item.id === baseProductId && item.province === area
  );
  
  const currentTotal = relatedItems.reduce((sum, item) => sum + item.qty, 0);
  const hasEnoughItems = currentTotal >= skuLevelMoq;
  const neededToReachMOQ = Math.max(0, skuLevelMoq - currentTotal);
  
  return {
    hasEnoughItems,
    currentTotal,
    neededToReachMOQ
  };
};
