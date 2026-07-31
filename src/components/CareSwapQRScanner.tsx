import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, XCircle, RotateCcw } from "lucide-react";

type Status = "idle" | "scanning" | "error";

interface CareSwapQRScannerProps {
  onDecoded: (qrHash: string) => void;
  regionId?: string;
}

/** Extracts the qr_hash from either a full /verify/:hash URL or a raw hash string. */
export function extractQrHash(raw: string): string {
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("verify");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    /* not a URL — treat as raw hash */
  }
  return raw.trim();
}

const CareSwapQRScanner = ({ onDecoded, regionId = "care-swap-scanner-region" }: CareSwapQRScannerProps) => {
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

  const start = async () => {
    setErrorMsg("");
    setStatus("scanning");
    await new Promise((r) => setTimeout(r, 50));
    try {
      const html5 = new Html5Qrcode(regionId);
      scannerRef.current = html5;
      await html5.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          await stop();
          setStatus("idle");
          onDecoded(extractQrHash(decoded));
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
      <div id={regionId} className={`w-full max-w-sm mx-auto rounded-lg overflow-hidden ${status === "scanning" ? "block" : "hidden"}`} />

      {status === "idle" && (
        <div className="text-center py-6">
          <Camera size={40} className="mx-auto mb-3 text-primary" />
          <p className="text-sm text-muted-foreground mb-4">Scannez le QR code de l'appareil.</p>
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
          <XCircle size={36} className="mx-auto mb-2 text-destructive" />
          <p className="text-sm text-destructive font-medium">{errorMsg}</p>
          <Button onClick={reset} variant="outline" className="mt-4 w-full">
            <RotateCcw size={14} className="mr-1" /> Réessayer
          </Button>
        </div>
      )}
    </div>
  );
};

export default CareSwapQRScanner;
