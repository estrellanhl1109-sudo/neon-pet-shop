import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { useCart } from "@/contexts/CartContext";
import { CartButton } from "@/components/CartButton";
import { CartDrawer } from "@/components/CartDrawer";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  discount_percentage: number;
  offer_active: boolean;
  offer_start_date: string | null;
  offer_end_date: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();

  const calculateFinalPrice = (product: Product) => {
    if (!product.offer_active || product.discount_percentage === 0) {
      return product.price;
    }
    
    const now = new Date();
    if (product.offer_start_date && new Date(product.offer_start_date) > now) {
      return product.price;
    }
    if (product.offer_end_date && new Date(product.offer_end_date) < now) {
      return product.price;
    }
    
    return product.price * (1 - product.discount_percentage / 100);
  };

  const getActiveDiscount = (product: Product) => {
    if (!product.offer_active || product.discount_percentage === 0) {
      return 0;
    }
    
    const now = new Date();
    if (product.offer_start_date && new Date(product.offer_start_date) > now) {
      return 0;
    }
    if (product.offer_end_date && new Date(product.offer_end_date) < now) {
      return 0;
    }
    
    return product.discount_percentage;
  };

  const handleAddToCart = (product: Product) => {
    const finalPrice = calculateFinalPrice(product);
    const activeDiscount = getActiveDiscount(product);
    
    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      originalPrice: product.price,
      discount: activeDiscount,
      image_url: product.image_url,
    });
    
    toast({
      title: "Producto agregado",
      description: `${product.name} se agregó al carrito`,
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session && slug) {
      fetchCategoryAndProducts();
    }
  }, [session, slug]);

  const fetchCategoryAndProducts = async () => {
    if (!slug) return;

    try {
      setLoading(true);

      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .single();

      if (categoryError) throw categoryError;
      setCategory(categoryData);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", categoryData.id)
        .eq("is_active", true)
        .order("name");

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary neon-glow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/home")}
              className="border-primary hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold neon-text">
              {category?.name || "Cargando..."}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Cargando productos...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No hay productos disponibles</h2>
            <p className="text-muted-foreground">
              Pronto agregaremos productos en esta categoría
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                className="neon-border hover-glow bg-card/80 backdrop-blur"
              >
                <CardHeader>
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.image_url && (
                    <div className="relative aspect-square overflow-hidden rounded-lg">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {getActiveDiscount(product) > 0 && (
                        <Badge className="absolute top-2 right-2 bg-secondary text-secondary-foreground">
                          -{getActiveDiscount(product)}%
                        </Badge>
                      )}
                    </div>
                  )}
                  {product.description && (
                    <p className="text-muted-foreground">{product.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      {getActiveDiscount(product) > 0 ? (
                        <>
                          <span className="text-sm line-through text-muted-foreground">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="text-2xl font-bold text-primary neon-text">
                            ${calculateFinalPrice(product).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-primary neon-text">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Stock: {product.stock}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full neon-glow" 
                    disabled={product.stock === 0}
                    onClick={() => handleAddToCart(product)}
                  >
                    {product.stock === 0 ? "Agotado" : "Agregar al Carrito"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <CartButton onClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
};

export default Category;
