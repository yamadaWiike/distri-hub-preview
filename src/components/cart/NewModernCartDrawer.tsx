import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/translations";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function ModernCartDrawer() {
  const { items, totalItems, totalAmount, updateQuantity, removeItem } = useCart();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const t = translations[lang];
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleCheckout = () => {
    console.log('Navigating to checkout');
    setIsOpen(false);
    navigate('/checkout');
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
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t.cart}
              {totalItems > 0 && <span className="text-muted-foreground">({totalItems} {t.items})</span>}
            </SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
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
                <div key={`${item.id}-${item.province}`} className="flex gap-4 py-2 border-b">
                  {item.image && (
                    <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="flex-grow">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-gray-600 text-sm">
                      {item.size} • {formatIDR(item.unitPrice)}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.province, item.qty - 1)}
                          disabled={item.qty <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="w-8 text-center">{item.qty}</span>
                        
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.province, item.qty + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeItem(item.id, item.province)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Cart Footer */}
        {items.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span>{t.subtotal}</span>
              <span className="font-medium">{formatIDR(totalAmount)}</span>
            </div>
            
            <Button className="w-full" onClick={handleCheckout}>
              {t.checkout}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
