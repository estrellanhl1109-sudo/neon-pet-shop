import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, updateQuantity, removeItem, clearCart, getSubtotal, getTotalDiscount, getTotal } = useCart();
  const { toast } = useToast();

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 255, 255);
    doc.text("NEON PET STORE", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Resumen de Compra", 105, 30, { align: "center" });
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 105, 37, { align: "center" });
    
    let yPos = 50;
    
    // Products
    doc.setFontSize(14);
    doc.text("Productos:", 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    items.forEach((item) => {
      const itemText = `${item.name} x${item.quantity}`;
      const priceText = `$${(item.price * item.quantity).toFixed(2)}`;
      
      doc.text(itemText, 20, yPos);
      doc.text(priceText, 190, yPos, { align: "right" });
      
      if (item.discount > 0) {
        doc.setTextColor(255, 0, 255);
        doc.text(`  Descuento: ${item.discount}%`, 20, yPos + 5);
        doc.setTextColor(0, 0, 0);
        yPos += 5;
      }
      
      yPos += 7;
      
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    // Totals
    doc.setFontSize(11);
    doc.text("Subtotal:", 20, yPos);
    doc.text(`$${getSubtotal().toFixed(2)}`, 190, yPos, { align: "right" });
    yPos += 7;
    
    if (getTotalDiscount() > 0) {
      doc.setTextColor(0, 255, 0);
      doc.text("Descuento Total:", 20, yPos);
      doc.text(`-$${getTotalDiscount().toFixed(2)}`, 190, yPos, { align: "right" });
      doc.setTextColor(0, 0, 0);
      yPos += 7;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(0, 255, 255);
    doc.text("TOTAL:", 20, yPos);
    doc.text(`$${getTotal().toFixed(2)}`, 190, yPos, { align: "right" });
    
    doc.save(`neon-pet-compra-${Date.now()}.pdf`);
    
    toast({
      title: "PDF Generado",
      description: "Tu resumen de compra ha sido descargado",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl neon-text">Carrito de Compras</SheetTitle>
        </SheetHeader>
        
        <div className="mt-8 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 neon-border rounded-lg bg-card/50">
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {item.discount > 0 ? (
                        <>
                          <span className="text-sm line-through text-muted-foreground">
                            ${item.originalPrice.toFixed(2)}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            ${item.price.toFixed(2)}
                          </span>
                          <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">
                            -{item.discount}%
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          ${item.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 ml-auto"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="border-t border-primary pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${getSubtotal().toFixed(2)}</span>
                </div>
                {getTotalDiscount() > 0 && (
                  <div className="flex justify-between text-sm text-accent">
                    <span>Descuento:</span>
                    <span>-${getTotalDiscount().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold">
                  <span className="neon-text">Total:</span>
                  <span className="neon-text">${getTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-2 pt-4">
                <Button 
                  className="w-full neon-glow" 
                  size="lg"
                  onClick={generatePDF}
                >
                  <FileDown className="mr-2 h-5 w-5" />
                  Generar PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={clearCart}
                >
                  Vaciar Carrito
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
