import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, ShieldAlert, Clock, Smartphone, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { deviceStatusConfig, type DeviceStatus } from "@/lib/careSwapTypes";
import WarrantyClaimForm from "@/components/WarrantyClaimForm";

interface VerifyResult {
  device_id: string;
  brand_name: string;
  model: string;
  status: DeviceStatus;
  is_authentic: boolean;
  warranty_end_date: string | null;
  days_remaining: number;
}

const VerifyDevice = () => {
  const { qrHash } = useParams<{ qrHash: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!qrHash) return;
      const { data, error } = await (supabase as any).rpc("verify_device_by_qr", { _qr_hash: qrHash });
      if (error || !data || data.length === 0) {
        setNotFound(true);
      } else {
        setResult(data[0]);
      }
      setLoading(false);
    };
    load();
  }, [qrHash]);

  const warrantyValid = (result?.days_remaining ?? 0) > 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          {loading ? (
            <Skeleton className="h-80 rounded-2xl" />
          ) : notFound ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <AlertTriangle size={48} className="mx-auto mb-4 text-destructive" />
              <h1 className="font-display text-lg font-bold mb-2">Appareil non reconnu</h1>
              <p className="text-sm text-muted-foreground">
                Ce QR code ne correspond à aucun appareil certifié Institut Moisson. Méfiez-vous des contrefaçons.
              </p>
            </div>
          ) : result ? (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="bg-gradient-purple p-8 text-center">
                <ShieldCheck size={56} className="mx-auto mb-3 text-primary-foreground" />
                <h1 className="font-display text-lg font-bold text-primary-foreground">
                  Certifié Origine {result.brand_name} by Institut Moisson
                </h1>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
                  <div className="flex items-center gap-2">
                    <Smartphone size={18} className="text-primary" />
                    <span className="text-sm font-medium">{result.brand_name} {result.model}</span>
                  </div>
                  <Badge className={`text-[10px] ${deviceStatusConfig[result.status].color} text-white`}>
                    {deviceStatusConfig[result.status].label}
                  </Badge>
                </div>

                <div className={`rounded-xl p-4 flex items-center gap-3 ${warrantyValid ? "bg-green-500/10 border border-green-500/30" : "bg-destructive/10 border border-destructive/30"}`}>
                  {warrantyValid ? <ShieldCheck size={22} className="text-green-500 shrink-0" /> : <ShieldAlert size={22} className="text-destructive shrink-0" />}
                  <div>
                    <p className="text-sm font-bold">
                      {warrantyValid ? `Garantie valide — ${result.days_remaining} jours restants` : "Garantie expirée"}
                    </p>
                    {result.warranty_end_date && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock size={11} /> Expire le {new Date(result.warranty_end_date).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                </div>

                <Button onClick={() => setClaimOpen(true)} className="w-full bg-gradient-purple text-primary-foreground glow-purple">
                  Signaler une Panne / Demander un Échange 48H
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <Footer />

      <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
        <DialogContent className="max-w-md glass-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-gradient-gold">Signaler une panne</DialogTitle></DialogHeader>
          {qrHash && <WarrantyClaimForm qrHash={qrHash} onSubmitted={() => setTimeout(() => setClaimOpen(false), 2500)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerifyDevice;
