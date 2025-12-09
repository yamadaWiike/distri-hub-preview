// React & Router
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// External Libraries
import { ShoppingCart, X, Minus, Plus, Trash2, AlertCircle } from "lucide-react";

// UI Components
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Hooks
import { useCart } from "@/hooks/use-cart";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from '@/hooks/use-auth';

// Utils
import { translations } from "@/lib/translations";
import { formatIDR } from '@/lib/utils';

// Types
import { CartItem } from "@/contexts/CartContextDefinition";

// Helper function to check if there are enough mixed variants in the cart to meet MOQ
function checkMixedVariantsMOQ(
  items: CartItem[], 
  productId: string, 
  province: string, 
  skuLevelMoq: number
): {
  hasEnoughItems: boolean;
  currentTotal: number;
  neededToReachMOQ: number;
  productName: string;
} {
  // Find all items in cart with the same base productId and province
  const matchingItems = items.filter(
    item => item.id === productId && item.province === province
  );
  
  // Get the product name from any of the matching items
  const productName = matchingItems.length > 0 ? matchingItems[0].name : 'Unknown Product';
  
  // Sum up quantities of all matching items (variants of same product)
  const totalQuantity = matchingItems.reduce((sum, item) => sum + item.qty, 0);
  
  // Determine if we have enough items
  const hasEnoughItems = totalQuantity >= skuLevelMoq;
  const neededToReachMOQ = Math.max(0, skuLevelMoq - totalQuantity);
  
  return {
    hasEnoughItems,
    currentTotal: totalQuantity,
    neededToReachMOQ,
    productName
  };
}

// Identify unique products with variants in the cart
function identifyMixVariantProducts(items: CartItem[]): Map<string, { 
  productId: string; 
  province: string; 
  variants: CartItem[];
  skuLevelMoq: number;
  allowMixVariants: boolean;
}> {
  // Group cart items by product ID and province
  const productMap = new Map();
  
  // First pass: identify products with variants
  items.forEach(item => {
    if (item.variant) {
      const key = `${item.id}|${item.province}`;
      
      if (!productMap.has(key)) {
        productMap.set(key, {
          productId: item.id,
          province: item.province,
          variants: [],
          // These would normally come from product data, but for now let's assume
          // every product with variants has a skuLevelMoq of the first variant's moq value
          // This should be replaced with actual values from the product
          skuLevelMoq: item.skuLevelMoq || item.moq,
          allowMixVariants: item.allowMixVariants || false
        });
      }
      
      // Store reference to item for easier access later
      productMap.get(key).variants.push(item);
      
      // Update skuLevelMoq and allowMixVariants if they exist on the item
      if (item.skuLevelMoq) {
        productMap.get(key).skuLevelMoq = item.skuLevelMoq;
      }
      if (item.allowMixVariants !== undefined) {
        productMap.get(key).allowMixVariants = item.allowMixVariants;
      }
    }
  });
  
  return productMap;
}

export function ModernCartDrawer() {
  const { items, totalItems, totalAmount, updateQuantity, removeItem } = useCart();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const t = translations[lang];
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  // Identify products that have mixed variants and check if they meet their MOQ
  const mixVariantValidation = useMemo(() => {
    const mixVariantProducts = identifyMixVariantProducts(items);
    const validationResults: { 
      productId: string; 
      province: string; 
      productName: string;
      isValid: boolean; 
      currentTotal: number; 
      neededMore: number;
      skuLevelMoq: number;
    }[] = [];
    
    mixVariantProducts.forEach((product, key) => {
      // Only check products that allow mixing variants
      if (product.allowMixVariants && product.skuLevelMoq > 0) {
        const validation = checkMixedVariantsMOQ(
          items,
          product.productId,
          product.province,
          product.skuLevelMoq
        );
        
        validationResults.push({
          productId: product.productId,
          province: product.province,
          productName: validation.productName,
          isValid: validation.hasEnoughItems,
          currentTotal: validation.currentTotal,
          neededMore: validation.neededToReachMOQ,
          skuLevelMoq: product.skuLevelMoq
        });
      }
    });
    
    return {
      allValid: validationResults.every(r => r.isValid),
      results: validationResults
    };
  }, [items]);
  
  const handleCheckout = () => {
    // Only allow checkout if all mixed variant MOQs are met
    if (!mixVariantValidation.allValid) {
      return;
    }
    

    setIsOpen(false);
    navigate('/checkout');
  };

  const handleQuantityChange = (itemId: string, province: string, newQty: number, variantId?: string) => {
    if (newQty < 1) {
      return; // Prevent zero or negative quantities
    }
    updateQuantity(itemId, province, newQty, variantId);
  };

  const handleTextFieldQuantityChange = (itemId: string, province: string, inputValue: string, variantId?: string) => {
    const newQty = parseInt(inputValue);
    if (!isNaN(newQty) && newQty >= 1) {
      handleQuantityChange(itemId, province, newQty, variantId);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative"
          aria-label={t.cart}
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge 
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t.cart}
            {totalItems > 0 && <span className="text-muted-foreground">({totalItems} {t.items})</span>}
          </SheetTitle>
        </SheetHeader>
        
        {/* Cart Content */}
        <div className="flex-grow overflow-auto py-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t.emptyCart}</h3>
              <p className="text-muted-foreground mb-6">{t.emptyCartMessage}</p>
              <SheetClose asChild>
                <Button onClick={() => navigate('/daftar-produk')}>
                  {t.continueShopping}
                </Button>
              </SheetClose>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.province}-${item.variant?.id || 'no-variant'}`} className="flex gap-4 py-2 border-b">
                  {item.image && (
                    <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="flex-grow">
                    <h3 className="font-semibold">
                      {item.name}
                      {item.variant && <span className="text-sm text-muted-foreground ml-1">({item.variant.name})</span>}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {item.size} • {formatIDR(item.unitPrice)}
                    </p>
                    <p className="text-gray-500 text-xs">{item.province}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(item.id, item.province, item.qty - 1, item.variant?.id)}
                          disabled={item.qty <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <Input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleTextFieldQuantityChange(item.id, item.province, e.target.value, item.variant?.id)}
                          className="h-8 w-20 text-center"
                        />
                        
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(item.id, item.province, item.qty + 1, item.variant?.id)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeItem(item.id, item.province, item.variant?.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-muted-foreground">Subtotal:</span>
                      <span className="font-medium text-sm">{formatIDR(item.qty * item.unitPrice)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Mixed Variants MOQ Validation */}
        {!mixVariantValidation.allValid && mixVariantValidation.results.length > 0 && (
          <div className="mb-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{lang === 'id' ? 'MOQ Varian Belum Terpenuhi' : 'Mixed Variant MOQ Not Met'}</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  {mixVariantValidation.results.filter(r => !r.isValid).map((result, idx) => (
                    <div key={`${result.productId}-${result.province}-warning-${idx}`} className="text-sm">
                      <strong>{result.productName}</strong>: {lang === 'id' 
                        ? `Total varian ${result.currentTotal}/${result.skuLevelMoq} (kurang ${result.neededMore} lagi)`
                        : `Total variants ${result.currentTotal}/${result.skuLevelMoq} (need ${result.neededMore} more)`}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {/* Cart Footer */}
        {items.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span>{t.subtotal}</span>
              <span className="font-medium">{formatIDR(totalAmount)}</span>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleCheckout}
              disabled={!mixVariantValidation.allValid}
            >
              {!mixVariantValidation.allValid 
                ? (lang === 'id' ? 'MOQ Varian Belum Terpenuhi' : 'Complete Mixed Variant MOQ First') 
                : t.checkout}
            </Button>
            
            {!mixVariantValidation.allValid && (
              <p className="text-xs text-center mt-2 text-muted-foreground">
                {lang === 'id' 
                  ? 'Tambahkan lebih banyak varian untuk memenuhi jumlah minimum pemesanan'
                  : 'Add more variants to meet minimum order quantities'}
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
