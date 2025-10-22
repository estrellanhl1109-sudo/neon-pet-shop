import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";

interface CartButtonProps {
  onClick: () => void;
}

export const CartButton = ({ onClick }: CartButtonProps) => {
  const { getTotalItems } = useCart();
  const itemCount = getTotalItems();

  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl neon-glow z-50"
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {itemCount}
          </Badge>
        )}
      </div>
    </Button>
  );
};
