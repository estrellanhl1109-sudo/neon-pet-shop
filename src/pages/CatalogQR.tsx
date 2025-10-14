import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import QRCode from "qrcode";

const CatalogQR = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const navigate = useNavigate();

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
      generateQR();
    }
  }, [session]);

  const generateQR = async () => {
    try {
      const catalogUrl = window.location.origin + "/home";
      const qrUrl = await QRCode.toDataURL(catalogUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: "#00ffff",
          light: "#000000"
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error("Error generating QR:", error);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "pet-store-catalog-qr.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <h1 className="text-3xl font-bold neon-text">Código QR del Catálogo</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto text-center space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-3 neon-text">
              Escanea el código para acceder al catálogo
            </h2>
            <p className="text-muted-foreground">
              Comparte este código QR con tus clientes para que puedan ver todos tus productos
            </p>
          </div>

          {qrCodeUrl && (
            <div className="neon-border rounded-lg p-8 bg-card/80 backdrop-blur inline-block">
              <img
                src={qrCodeUrl}
                alt="Código QR del Catálogo"
                className="w-full max-w-sm mx-auto"
              />
            </div>
          )}

          <Button
            onClick={handleDownload}
            className="neon-glow"
            disabled={!qrCodeUrl}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar QR
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CatalogQR;
