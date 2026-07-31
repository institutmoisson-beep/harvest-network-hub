import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, XCircle, RotateCcw } from "lucide-react";
import type { Delivery } from "@/lib/deliveryTypes";

type Status = "idle" | "scanning" | "error";

interface DeliveryQRScannerProps {
  onFound: (delivery: Delivery) => void;
}

const DeliveryQRScanner = ({ onFound }: DeliveryQRScannerProps) => {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stop = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { /* already stopped */ }
      try { scannerRef.current.clear(); } catch { /* noop */ }
      scannerRef.current = null;
    }
  };

  useEffect(() => () => { void stop(); }, []);

  const resolveToken = async (raw: string) => {
    let token = raw;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.im_delivery) token = parsed.im_delivery;
    } catch {
      /* not JSON — treat raw string as the token */
    }

    const { data, error } = await (supabase as any).rpc("get_delivery_by_qr", { _token: token });
    if (error || !data || data.length === 0) {
      setStatus("error");
      setErrorMsg("QR code de livraison invalide ou cette commande ne vous appartient pas.");
      return;
    }
    onFound(data[0] as Delivery);
  };

  const start = async () => {
    setErrorMsg("");
    setStatus("scanning");
    await new Promise((r) => setTimeout(r, 50));
    try {
      const html5 = new Html5Qrcode("delivery-scanner-region");
      scannerRef.current = html5;
      await html5.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          await stop();
          await resolveToken(decoded);
        },
        () => {}
      );
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message || "Caméra indisponible");
    }
  };

  const reset = async () => {
    await stop();
    setStatus("idle");
    setErrorMsg("");
  };

  return (
    <div className="rounded-xl p-4 bg-card">
      <div
        id="delivery-scanner-region"
        className={`w-full max-w-sm mx-auto rounded-lg overflow-hidden ${status === "scanning" ? "block" : "hidden"}`}
      />

      {status === "idle" && (
        <div className="text-center py-8">
          <Camera size={48} className="mx-auto mb-3 text-primary" />
          <p className="text-sm text-muted-foreground mb-4">
            Scannez le QR code présenté par votre livreur pour payer votre commande.
          </p>
          <Button onClick={start} className="bg-gradient-purple">
            <Camera size={14} className="mr-1" /> Activer la caméra
          </Button>
        </div>
      )}

      {status === "scanning" && (
        <Button onClick={reset} variant="outline" className="mt-3 w-full">
          <CameraOff size={14} className="mr-1" /> Arrêter
        </Button>
      )}

      {status === "error" && (
        <div className="text-center py-4">
          <XCircle size={40} className="mx-auto mb-2 text-destructive" />
          <p className="text-sm text-destructive font-medium">{errorMsg}</p>
          <Button onClick={reset} variant="outline" className="mt-4 w-full">
            <RotateCcw size={14} className="mr-1" /> Réessayer
          </Button>
        </div>
      )}
    </div>
  );
};

export default DeliveryQRScanner;
