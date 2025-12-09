// React & Router
import React from 'react';
import { Link } from 'react-router-dom';

// External Libraries
import { ShoppingBasket } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';

// Hooks
import { useLanguage } from '@/hooks/use-language';

// Utils
import { translations } from '@/lib/translations';

export function CartEmpty() {
  const { lang } = useLanguage();
  const t = translations[lang];
  
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <ShoppingBasket className="h-12 w-12 mb-4 text-gray-400" />
      <h3 className="text-lg font-medium mb-2">{t.emptyCart}</h3>
      <p className="text-gray-500 mb-6">{t.emptyCartMessage}</p>
      <Button asChild>
        <Link to="/products">{t.continueShopping}</Link>
      </Button>
    </div>
  );
}
