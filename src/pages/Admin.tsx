import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { Switch } from "@/components/ui/switch";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category_id: string;
  is_active: boolean;
  discount_percentage: number;
  offer_active: boolean;
  offer_start_date: string | null;
  offer_end_date: string | null;
}

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
    discount_percentage: "",
    offer_active: false,
    offer_start_date: "",
    offer_end_date: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

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
    if (session) {
      checkAdminAndFetchData();
    }
  }, [session]);

  const checkAdminAndFetchData = async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos de administrador",
          variant: "destructive",
        });
        navigate("/home");
        return;
      }

      setIsAdmin(true);
      await Promise.all([fetchCategories(), fetchProducts()]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/home");
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) throw error;
    setCategories(data || []);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category_id) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("products").insert({
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        category_id: formData.category_id,
        is_active: true,
        discount_percentage: parseInt(formData.discount_percentage) || 0,
        offer_active: formData.offer_active,
        offer_start_date: formData.offer_start_date || null,
        offer_end_date: formData.offer_end_date || null,
      });

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "Producto agregado correctamente",
      });

      setFormData({
        name: "",
        description: "",
        price: "",
        stock: "",
        category_id: "",
        discount_percentage: "",
        offer_active: false,
        offer_start_date: "",
        offer_end_date: "",
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado correctamente",
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

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
            <h1 className="text-3xl font-bold neon-text">Panel de Administrador</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="neon-border bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Agregar Nuevo Producto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-input border-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-input border-primary/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="bg-input border-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="bg-input border-primary/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger className="bg-input border-primary/30">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Descuento (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    className="bg-input border-primary/30"
                  />
                </div>

                <div className="space-y-4 p-4 border border-primary/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="offer-active">Activar Oferta</Label>
                    <Switch
                      id="offer-active"
                      checked={formData.offer_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, offer_active: checked })}
                    />
                  </div>

                  {formData.offer_active && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Fecha Inicio</Label>
                        <Input
                          id="start-date"
                          type="datetime-local"
                          value={formData.offer_start_date}
                          onChange={(e) => setFormData({ ...formData, offer_start_date: e.target.value })}
                          className="bg-input border-primary/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">Fecha Fin</Label>
                        <Input
                          id="end-date"
                          type="datetime-local"
                          value={formData.offer_end_date}
                          onChange={(e) => setFormData({ ...formData, offer_end_date: e.target.value })}
                          className="bg-input border-primary/30"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full neon-glow">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="neon-border bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Productos Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : products.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay productos registrados
                </p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center p-4 rounded-lg border border-primary/30 bg-background/50"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${product.price.toFixed(2)} | Stock: {product.stock}
                        </p>
                        {product.discount_percentage > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                              Descuento: {product.discount_percentage}%
                            </span>
                            {product.offer_active && (
                              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                                Oferta Activa
                              </span>
                            )}
                          </div>
                        )}
                        {product.offer_active && (product.offer_start_date || product.offer_end_date) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {product.offer_start_date && `Desde: ${new Date(product.offer_start_date).toLocaleDateString()}`}
                            {product.offer_start_date && product.offer_end_date && " | "}
                            {product.offer_end_date && `Hasta: ${new Date(product.offer_end_date).toLocaleDateString()}`}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;
