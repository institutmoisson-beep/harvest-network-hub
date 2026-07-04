import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, CheckCircle2, AlertTriangle, XCircle, RotateCcw, Flashlight, FlashlightOff } from "lucide-react";

type Status = "idle" | "scanning" | "success" | "warning" | "error";
interface Result {
  id_moissonneur: string; first_name: string; last_name: string; avatar_url: string | null;
  country: string | null; is_system_active: boolean; account_status: string; career_level: string; member_since: string;
}

const ScannerCommunautaire = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);

  const stop = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setTorchOn(false);
    setTorchAvailable(false);
  };

  useEffect(() => () => { void stop(); }, []);

  const verifyToken = async (token: string) => {
    const { data, error } = await (supabase as any).rpc("verify_member_token", { _token: token });
    if (error || !data || data.length === 0) {
      setStatus("error"); setErrorMsg("Code inconnu ou invalide."); return;
    }
    const r = data[0] as Result;
    setResult(r);
    if (!r.is_system_active || r.account_status !== "active") setStatus("warning");
    else setStatus("success");
  };

  const start = async () => {
    setResult(null); setErrorMsg(""); setStatus("scanning");
    await new Promise(r => setTimeout(r, 50));
    try {
      const html5 = new Html5Qrcode("scanner-region");
      scannerRef.current = html5;
      await html5.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          await stop();
          try {
            const url = new URL(decoded);
            const token = url.searchParams.get("token");
            if (!token) { setStatus("error"); setErrorMsg("QR sans token Moissonneur"); return; }
            await verifyToken(token);
          } catch {
            // not a URL — maybe just a uuid
            await verifyToken(decoded);
          }
        },
        () => {}
      );
      // Detect torch capability (retry briefly while track initializes)
      const detectTorch = async () => {
        for (let i = 0; i < 10; i++) {
          try {
            const caps: any = (html5 as any).getRunningTrackCameraCapabilities?.();
            if (caps?.torchFeature && caps.torchFeature().isSupported?.()) {
              setTorchAvailable(true); return;
            }
          } catch {}
          try {
            const trackCaps: any = (html5 as any).getRunningTrackSettings?.();
            if (trackCaps && "torch" in trackCaps) { setTorchAvailable(true); return; }
          } catch {}
          // Fallback: read the underlying video track directly
          const video = document.querySelector("#scanner-region video") as HTMLVideoElement | null;
          const stream = video?.srcObject as MediaStream | null;
          const track = stream?.getVideoTracks?.()[0];
          const c: any = track?.getCapabilities?.();
          if (c && "torch" in c) { setTorchAvailable(true); return; }
          await new Promise(r => setTimeout(r, 300));
        }
      };
      detectTorch();
    } catch (e: any) {
      setStatus("error"); setErrorMsg(e?.message || "Caméra indisponible");
    }
  };

  const toggleTorch = async () => {
    const html5 = scannerRef.current as any;
    if (!html5) return;
    const next = !torchOn;
    try {
      const caps = html5.getRunningTrackCameraCapabilities?.();
      if (caps?.torchFeature) {
        await caps.torchFeature().apply(next);
        setTorchOn(next); return;
      }
      const video = document.querySelector("#scanner-region video") as HTMLVideoElement | null;
      const stream = video?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks?.()[0];
      if (track) {
        await track.applyConstraints({ advanced: [{ torch: next } as any] });
        setTorchOn(next);
      }
    } catch (e) {
      setTorchAvailable(false);
    }
  };

  const reset = async () => { await stop(); setStatus("idle"); setResult(null); setErrorMsg(""); };

  const bgFor = () =>
    status === "success" ? "bg-green-600" :
    status === "warning" ? "bg-orange-500" :
    status === "error" ? "bg-red-600 animate-pulse" : "bg-card";

  return (
    <div className={`rounded-xl p-4 transition-colors ${bgFor()}`}>
      <div id="scanner-region" className={`w-full max-w-sm mx-auto rounded-lg overflow-hidden ${status === "scanning" ? "block" : "hidden"}`} />

      {status === "idle" && (
        <div className="text-center py-8">
          <Camera size={48} className="mx-auto mb-3 text-primary" />
          <p className="text-sm text-muted-foreground mb-4">Scannez le QR Code d'un Moissonneur pour vérifier son identité.</p>
          <Button onClick={start} className="bg-gradient-purple"><Camera size={14} className="mr-1" /> Activer la caméra</Button>
        </div>
      )}

      {status === "scanning" && (
        <div className="mt-3 flex gap-2">
          {torchAvailable && (
            <Button onClick={toggleTorch} variant="outline" className="flex-1">
              {torchOn ? <><FlashlightOff size={14} className="mr-1" /> Éteindre</> : <><Flashlight size={14} className="mr-1" /> Torche</>}
            </Button>
          )}
          <Button onClick={reset} variant="outline" className="flex-1"><CameraOff size={14} className="mr-1" /> Arrêter</Button>
        </div>
      )}

      {status === "success" && result && (
        <div className="text-white text-center animate-scale-in">
          {result.avatar_url ? (
            <img src={result.avatar_url} alt="" className="w-24 h-24 rounded-full mx-auto border-4 border-white object-cover mb-3" />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto border-4 border-white bg-white/20 flex items-center justify-center text-3xl font-bold mb-3">{result.first_name[0]}</div>
          )}
          <p className="font-display text-xl font-bold">{result.first_name} {result.last_name}</p>
          <p className="text-xs opacity-90 mt-1">{result.id_moissonneur} · {result.country}</p>
          <p className="text-xs mt-1 opacity-90 capitalize">Niveau : {result.career_level}</p>
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-white/20 backdrop-blur font-display font-bold">
            <CheckCircle2 /> VÉRIFIÉ ✅
          </div>
          <Button onClick={reset} variant="outline" className="mt-4 w-full bg-white/10 border-white text-white"><RotateCcw size={14} className="mr-1" /> Scanner à nouveau</Button>
        </div>
      )}

      {status === "warning" && result && (
        <div className="text-white text-center">
          <AlertTriangle size={48} className="mx-auto mb-2" />
          <p className="font-display text-lg font-bold">{result.first_name} {result.last_name}</p>
          <p className="text-sm opacity-90">{result.id_moissonneur}</p>
          <p className="text-sm mt-2">Profil existant — mais adhésion <strong>{result.account_status}</strong> {!result.is_system_active && "/ non activée"}.</p>
          <Button onClick={reset} variant="outline" className="mt-4 w-full bg-white/10 border-white text-white"><RotateCcw size={14} className="mr-1" /> Scanner à nouveau</Button>
        </div>
      )}

      {status === "error" && (
        <div className="text-white text-center">
          <XCircle size={48} className="mx-auto mb-2" />
          <p className="font-display text-lg font-bold">ATTENTION — Risque de contrefaçon ❌</p>
          <p className="text-sm mt-1 opacity-90">{errorMsg}</p>
          <Button onClick={reset} variant="outline" className="mt-4 w-full bg-white/10 border-white text-white"><RotateCcw size={14} className="mr-1" /> Réessayer</Button>
        </div>
      )}
    </div>
  );
};

export default ScannerCommunautaire;