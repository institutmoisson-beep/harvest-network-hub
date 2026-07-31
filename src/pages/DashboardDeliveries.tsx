import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Truck, QrCode, Navigation, Clock, CheckCircle2, XCircle } from "lucide-react";
import LiveDeliveryMap from "@/components/LiveDeliveryMap";
import DeliveryQRScanner from "@/components/DeliveryQRScanner";
import PaymentCheckoutDialog from "@/components/PaymentCheckoutDialog";
import { useLiveLocationSharing } from "@/hooks/useLiveLocationSharing";
import { deliveryStatusConfig, type Delivery } from "@/lib/deliveryTypes";

const DashboardDeliveries = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannerDelivery, setScannerDelivery] = useState<Delivery | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [checkoutDelivery, setCheckoutDelivery] = useState<Delivery | null>(null);
  const { sharing, toggle } = useLiveLocationSharing("client");

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    setUserId(session.user.id);
    const { data } = await (supabase as any)
      .from("deliveries")
      .select("*")
      .eq("client_id", session.user.id)
      .order("created_at", { ascending: false });
    setDeliveries(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`client-deliveries-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries", filter: `client_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const activeDeliveries = deliveries.filter((d) => !["delivered", "cancelled"].includes(d.status));
  const pastDeliveries = deliveries.filter((d) => ["delivered", "cancelled"].includes(d.status));

  const onScanFound = (delivery: Delivery) => {
    setScannerOpen(false);
    setCheckoutDelivery(delivery);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="font-display text-xl font-bold mb-2 flex items-center gap-2">
        <Truck size={24} className="text-secondary" /> Mes Livraisons
      </h1>
      <p className="text-xs text-muted-foreground mb-6">
        Suivez votre livreur en temps réel et payez en toute sécurité en scannant son QR code à l'arrivée.
      </p>

      <div className="glass-card rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Navigation size={20} className={sharing ? "text-green-500" : "text-muted-foreground"} />
          <div>
            <p className="font-display text-sm font-bold">Partager ma position</p>
            <p className="text-xs text-muted-foreground">Aide le livreur à vous localiser plus facilement.</p>
          </div>
        </div>
        <Switch checked={sharing} onCheckedChange={toggle} />
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : activeDeliveries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground glass-card rounded-xl">
          <Truck size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-display text-sm">Aucune livraison en cours.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeDeliveries.map((d) => {
            const cfg = deliveryStatusConfig[d.status];
            const canPay = ["assigned", "en_route", "arrived"].includes(d.status);
            const canTrack = ["assigned", "en_route", "arrived"].includes(d.status) && d.courier_id;
            return (
              <div key={d.id} className="glass-card rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-display text-sm font-bold">{d.product_name}</p>
                    <p className="text-xs text-muted-foreground">{d.amount.toLocaleString()} {d.currency}</p>
                  </div>
                  <Badge className={`text-[10px] ${cfg.color} text-white`}>{cfg.label}</Badge>
                </div>

                {d.status === "payment_claimed" && (
                  <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-2 mb-3">
                    <Clock size={14} className="shrink-0" />
                    Paiement déclaré — en attente de validation par l'administration.
                  </div>
                )}
                {d.status === "payment_approved" && (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-xs text-green-600 dark:text-green-400 flex items-center gap-2 mb-3">
                    <CheckCircle2 size={14} className="shrink-0" />
                    Paiement validé — votre colis va vous être remis.
                  </div>
                )}
                {d.status === "payment_rejected" && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2 mb-3">
                    <XCircle size={14} className="shrink-0" />
                    Paiement non confirmé. Contactez le support.
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {canTrack && (
                    <Button size="sm" variant="outline" onClick={() => setScannerDelivery(d)} className="font-display text-xs">
                      <Navigation size={13} className="mr-1" /> Suivre le livreur
                    </Button>
                  )}
                  {canPay && (
                    <Button size="sm" onClick={() => setScannerOpen(true)} className="bg-gradient-purple font-display text-xs">
                      <QrCode size={13} className="mr-1" /> Scanner pour payer
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pastDeliveries.length > 0 && (
        <>
          <h2 className="font-display font-bold mt-8 mb-3 text-muted-foreground">Historique</h2>
          <div className="space-y-2">
            {pastDeliveries.map((d) => {
              const cfg = deliveryStatusConfig[d.status];
              return (
                <div key={d.id} className="rounded-lg border border-border p-3 flex items-center justify-between opacity-70">
                  <p className="text-sm font-medium">{d.product_name}</p>
                  <Badge className={`text-[10px] ${cfg.color} text-white`}>{cfg.label}</Badge>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Live tracking map */}
      <Dialog open={!!scannerDelivery} onOpenChange={(o) => !o && setScannerDelivery(null)}>
        <DialogContent className="max-w-lg glass-card border-border">
          <DialogHeader><DialogTitle className="font-display text-gradient-gold">Votre livreur arrive</DialogTitle></DialogHeader>
          {scannerDelivery?.courier_id && (
            <>
              <LiveDeliveryMap watchUserId={scannerDelivery.courier_id} watchLabel="Votre livreur" heightClass="h-80" />
              {scannerDelivery.client_phone === null ? null : (
                <p className="text-xs text-muted-foreground text-center">
                  Besoin d'aide ? Le livreur vous appellera à votre numéro dès son arrivée.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* QR scanner */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="max-w-sm glass-card border-border">
          <DialogHeader><DialogTitle className="font-display text-gradient-gold flex items-center gap-2"><QrCode size={18} /> Scanner le QR du livreur</DialogTitle></DialogHeader>
          <DeliveryQRScanner onFound={onScanFound} />
        </DialogContent>
      </Dialog>

      {/* Payment checkout */}
      <PaymentCheckoutDialog
        delivery={checkoutDelivery}
        onOpenChange={(o) => !o && setCheckoutDelivery(null)}
        onClaimed={() => { setCheckoutDelivery(null); load(); }}
      />
    </div>
  );
};

export default DashboardDeliveries;
