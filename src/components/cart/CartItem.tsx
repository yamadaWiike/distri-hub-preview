import React from 'react';
import { CartItem as CartItemType } from '@/contexts/CartContextDefinition';
import { useCart } from '@/hooks/use-cart';
import { formatIDR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MinusIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();
  const { lang } = useLanguage();
  const t = translations[lang];
  
  const handleDecrease = () => {
    updateQuantity(item.id, item.province, item.qty - 1);
  };
  
  const handleIncrease = () => {
    updateQuantity(item.id, item.province, item.qty + 1);
  };
  
  const handleRemove = () => {
    removeItem(item.id, item.province);
  };
  
  return (
    <div className="flex gap-4 py-2 border-b">
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
              onClick={handleDecrease}
            >
              <MinusIcon className="h-4 w-4" />
            </Button>
            
            <span className="w-8 text-center">{item.qty}</span>
            
            <Button 
              variant="outline" 
              size="icon"
              className="h-8 w-8"
              onClick={handleIncrease}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
          
          <span className="font-medium">
            {formatIDR(item.unitPrice * item.qty)}
          </span>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-red-600"
            onClick={handleRemove}
          >
            <TrashIcon className="h-4 w-4" />
            <span className="sr-only">{t.remove}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
