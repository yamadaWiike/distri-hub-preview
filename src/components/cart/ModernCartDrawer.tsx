// React & Router
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// External Libraries
import { X, Plus, Minus, Trash2 } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';

// Hooks
import { useCart } from '@/hooks/use-cart';
import { useLanguage } from '@/hooks/use-language';

// Utils
import { formatIDR } from '@/lib/utils';
import { translations } from '@/lib/translations';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalAmount } = useCart();
  const { lang } = useLanguage();
  const t = translations[lang];
  const navigate = useNavigate();

  const handleCheckout = () => {
    onOpenChange(false); // Close the drawer
    navigate('/checkout'); // Navigate to checkout page
  };

  const handleContinueShopping = () => {
    onOpenChange(false); // Close the drawer
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-auto">
        <SheetHeader>
          <div className="flex justify-between items-center">
            <SheetTitle>{t.cart}</SheetTitle>
            <div className="text-sm text-muted-foreground">{items.length} {t.items}</div>
          </div>
        </SheetHeader>

        <div className="py-6">
          {items.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">{t.emptyCartMessage}</p>
              <SheetClose asChild>
                <Button variant="outline" onClick={handleContinueShopping}>
                  {t.continueShopping}
                </Button>
              </SheetClose>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cart Items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={`${item.id}-${item.province}`} 
                    className="flex gap-3 pb-4 border-b"
                  >
                    <div className="w-16 h-16 border rounded overflow-hidden flex-shrink-0">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <div className="text-sm text-muted-foreground">
                            {item.size} • {item.province}
                          </div>
                          <div className="mt-1 text-sm">
                            {formatIDR(item.unitPrice)}
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => removeItem(item.id, item.province)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-none"
                            onClick={() => updateQuantity(item.id, item.province, item.qty - 1)}
                            disabled={item.qty <= item.moq}
                          >
                            <Minus size={14} />
                          </Button>
                          <div className="w-10 text-center">{item.qty}</div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-none"
                            onClick={() => updateQuantity(item.id, item.province, item.qty + 1)}
                          >
                            <Plus size={14} />
                          </Button>
                        </div>
                        <div className="font-medium">
                          {formatIDR(item.unitPrice * item.qty)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Cart Summary */}
              <div className="pt-2">
                <div className="flex justify-between mb-4">
                  <span className="font-medium">{t.subtotal}</span>
                  <span className="font-medium">{formatIDR(totalAmount)}</span>
                </div>
                
                <Button 
                  className="w-full bg-[#F47521] hover:bg-[#E26410] text-white mb-2"
                  onClick={handleCheckout}
                >
                  {t.checkout}
                </Button>
                
                <SheetClose asChild>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleContinueShopping}
                  >
                    {t.continueShopping}
                  </Button>
                </SheetClose>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
