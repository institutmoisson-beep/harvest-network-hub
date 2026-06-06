import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Sparkles } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from "@/assets/logo.png";

interface Props {
  profile: {
    id_moissonneur?: string | null;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
    verification_token: string;
    is_system_active?: boolean;
  };
}

const formatClock = (d: Date) => ({
  time: d.toLocaleTimeString("fr-FR", { hour12: false }),
  date: d.toLocaleDateString("fr-FR"),
});

const CarteIdentiteMoissonneur = ({ profile }: Props) => {
  const [flipped, setFlipped] = useState(false);
  const [now, setNow] = useState(new Date());
  const rectoRef = useRef<HTMLDivElement>(null);
  const versoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const verifyUrl = `${window.location.origin}/dashboard/verify?token=${profile.verification_token}`;
  const fullName = `${profile.first_name} ${profile.last_name}`.trim() || "Moissonneur";
  const memberId = profile.id_moissonneur || "MS-2026-000000";
  const clock = formatClock(now);

  const downloadPdf = async () => {
    if (!rectoRef.current || !versoRef.current) return;
    const opts = { backgroundColor: "#0a0a0a", scale: 2, useCORS: true };
    const r = await html2canvas(rectoRef.current, opts);
    const v = await html2canvas(versoRef.current, opts);
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [86, 54] });
    pdf.addImage(r.toDataURL("image/png"), "PNG", 0, 0, 86, 54);
    pdf.addPage([86, 54], "landscape");
    pdf.addImage(v.toDataURL("image/png"), "PNG", 0, 0, 86, 54);
    pdf.save(`carte-moissonneur-${memberId}.pdf`);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="[perspective:1500px] mb-4">
        <div
          className={`relative w-full transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
          style={{ aspectRatio: "1.586/1" }}
        >
          {/* RECTO */}
          <div ref={rectoRef} className="absolute inset-0 [backface-visibility:hidden] rounded-xl overflow-hidden border-2 border-yellow-600/60 shadow-2xl"
               style={{ background: "linear-gradient(135deg,#0a0a0a 0%,#1a1410 50%,#0a0a0a 100%)" }}>
            {/* gold filigree */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #d4af37 1px, transparent 2px), radial-gradient(circle at 80% 80%, #d4af37 1px, transparent 2px)", backgroundSize: "24px 24px" }} />
            <div className="absolute inset-2 rounded-lg border border-yellow-600/40" />
            <div className="relative h-full p-3 flex flex-col text-yellow-50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] font-bold" style={{ color: "#d4af37" }}>MOISSONNEUR SOUVERAIN</span>
                <img src={logo} alt="" className="h-6 w-6" />
              </div>
              <div className="flex gap-3 mt-2 flex-1">
                <div className="w-16 h-20 rounded-md border-2 overflow-hidden flex items-center justify-center bg-black/40" style={{ borderColor: "#d4af37" }}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold" style={{ color: "#d4af37" }}>{fullName[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm leading-tight truncate">{fullName.toUpperCase()}</p>
                  <p className="text-[10px] mt-1 opacity-80">N° MEMBRE</p>
                  <p className="font-mono text-xs font-bold" style={{ color: "#d4af37" }}>{memberId}</p>
                  <p className="text-[9px] mt-1 opacity-70">VALIDITÉ : PERMANENTE</p>
                  <p className="text-[10px] mt-2 font-bold italic" style={{ color: "#d4af37" }}>✦ Moisson ✦</p>
                </div>
                <div className="bg-white p-1 rounded">
                  <QRCodeSVG value={verifyUrl} size={60} level="H" />
                </div>
              </div>
              <div className="mt-1 text-center font-mono text-[10px] bg-black/40 rounded px-2 py-0.5" style={{ color: "#d4af37" }}>
                ⏱ {clock.time} — {clock.date}
              </div>
            </div>
          </div>
          {/* VERSO */}
          <div ref={versoRef} className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl overflow-hidden border-2 border-yellow-600/60 shadow-2xl"
               style={{ background: "linear-gradient(135deg,#0a0a0a 0%,#141014 50%,#0a0a0a 100%)" }}>
            <div className="absolute inset-2 rounded-lg border border-yellow-600/40" />
            <div className="relative h-full p-3 flex flex-col text-yellow-50">
              <p className="text-center text-[10px] tracking-[0.2em] font-bold" style={{ color: "#d4af37" }}>ACADÉMIE DES MOISSONNEURS</p>
              <p className="text-[9px] font-bold mt-2" style={{ color: "#d4af37" }}>CONDITION D'UTILISATION & SÉCURITÉ</p>
              <p className="text-[7px] leading-tight opacity-80 mt-0.5">
                Cette carte est personnelle, incessible et reste la propriété de l'Académie des Moissonneurs.
                Toute reproduction ou usage frauduleux expose son auteur à des sanctions civiles et pénales.
                Vérification du membre via QR code et token unique sécurisé.
              </p>
              <div className="my-2 h-7 rounded relative overflow-hidden" style={{ background: "linear-gradient(110deg, #d4af37, #fef08a, #d4af37, #b8860b, #d4af37)", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }}>
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-black/70 tracking-widest">★ HOLO SECURITY ★</div>
              </div>
              <div className="mt-auto">
                <div className="border-t border-yellow-600/40 pt-1">
                  <p className="italic font-display text-xs" style={{ color: "#d4af37" }}>~ Signature du Titulaire ~</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes shimmer { 0% {background-position: 0% 0;} 100% {background-position: 200% 0;} }`}</style>
      <div className="flex gap-2">
        <Button onClick={() => setFlipped(f => !f)} variant="outline" className="flex-1">
          <RefreshCw size={14} className="mr-1" /> Retourner la carte
        </Button>
        <Button onClick={downloadPdf} className="flex-1 bg-gradient-gold text-secondary-foreground">
          <Download size={14} className="mr-1" /> Télécharger PDF
        </Button>
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
        <Sparkles size={10} /> L'horloge en temps réel garantit qu'il ne s'agit pas d'une capture d'écran
      </p>
    </div>
  );
};

export default CarteIdentiteMoissonneur;