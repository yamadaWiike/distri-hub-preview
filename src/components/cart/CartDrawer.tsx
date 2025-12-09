// External Libraries
import { ShoppingCart, X } from "lucide-react";

// UI Components
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cart } from './Cart';
import { CartEmpty } from './CartEmpty';

// Hooks
import { useCart } from "@/hooks/use-cart";
import { useLanguage } from "@/hooks/use-language";

// Utils
import { translations } from "@/lib/translations";

interface CartDrawerProps {
  onCheckout?: () => void;
}

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { items = [], totalItems } = useCart();
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <Sheet>
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
            <SheetTitle>{t.cart}</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
          <div className="text-sm text-muted-foreground">
            {totalItems > 0 ? `${totalItems} ${t.items}` : t.emptyCart}
          </div>
        </SheetHeader>
        
        <div className="flex-grow overflow-y-auto py-6">
          {items.length === 0 ? (
            <CartEmpty />
          ) : (
            <Cart onCheckout={onCheckout} />
          )}
        </div>
        
        <SheetFooter className="border-t pt-4">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              {t.continueShopping}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
