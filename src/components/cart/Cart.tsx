// React
import React from 'react';

// UI Components
import { Button } from '@/components/ui/button';
import { CartItem } from '@/components/cart/CartItem';

// Hooks
import { useCart } from '@/hooks/use-cart';
import { useLanguage } from '@/hooks/use-language';

// Utils
import { formatIDR } from '@/lib/utils';
import { translations } from '@/lib/translations';

interface CartProps {
  onCheckout?: () => void;
}

export function Cart({ onCheckout }: CartProps) {
  const { items, totalAmount } = useCart();
  const { lang } = useLanguage();
  const t = translations[lang];
  
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-4">
        {items.map((item) => (
          <CartItem 
            key={`${item.id}-${item.province}`}
            item={item}
          />
        ))}
      </div>
      
      <div className="border-t pt-4">
        <div className="flex justify-between text-sm mb-2">
          <span>{t.subtotal}</span>
          <span>{formatIDR(totalAmount)}</span>
        </div>
        
        <Button 
          className="w-full" 
          onClick={onCheckout}
        >
          {t.checkout}
        </Button>
      </div>
    </div>
  );
}
