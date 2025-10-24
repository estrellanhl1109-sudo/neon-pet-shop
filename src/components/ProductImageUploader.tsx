import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductImageUploaderProps {
  productId: string;
  onImageUploaded: () => void;
}

export const ProductImageUploader = ({ productId, onImageUploaded }: ProductImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/${Math.random()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      // Get current max order
      const { data: images } = await supabase
        .from('product_images')
        .select('display_order')
        .eq('product_id', productId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = images && images.length > 0 ? images[0].display_order + 1 : 0;

      // Save to database
      const { error: dbError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: publicUrl,
          display_order: nextOrder
        });

      if (dbError) throw dbError;

      toast({
        title: "Éxito",
        description: "Imagen cargada correctamente",
      });

      onImageUploaded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen",
        variant: "destructive",
      });
      return;
    }

    await uploadImage(file);
    e.target.value = '';
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => cameraInputRef.current?.click()}
        disabled={uploading}
      >
        <Camera className="h-4 w-4 mr-2" />
        Cámara
      </Button>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        <ImageIcon className="h-4 w-4 mr-2" />
        Galería
      </Button>
    </div>
  );
};

interface ProductImageGalleryProps {
  productId: string;
  isAdmin?: boolean;
  onImageDeleted?: () => void;
}

export const ProductImageGallery = ({ productId, isAdmin = false, onImageDeleted }: ProductImageGalleryProps) => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [productId]);

  const handleDelete = async (imageId: string, imageUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/product-images/');
      const filePath = urlParts[1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      toast({
        title: "Éxito",
        description: "Imagen eliminada correctamente",
      });

      fetchImages();
      onImageDeleted?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando imágenes...</div>;
  }

  if (images.length === 0) {
    return <div className="text-sm text-muted-foreground">No hay imágenes</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {images.map((image) => (
        <div key={image.id} className="relative group">
          <img
            src={image.image_url}
            alt="Product"
            className="w-full h-32 object-cover rounded-lg border border-border"
          />
          {isAdmin && (
            <button
              onClick={() => handleDelete(image.id, image.image_url)}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
