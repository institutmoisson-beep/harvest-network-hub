import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Truck, Phone, MapPin, QrCode, Navigation, ArrowLeft, PackageCheck, Send,
} from "lucide-react";
import logo from "@/assets/logo.png";
import DeliveryNotificationsBell from "@/components/DeliveryNotificationsBell";
import DeliveryQRCode from "@/components/DeliveryQRCode";
import LiveDeliveryMap from "@/components/LiveDeliveryMap";
import { useLiveLocationSharing } from "@/hooks/useLiveLocationSharing";
import { deliveryStatusConfig, type Delivery } from "@/lib/deliveryTypes";

const CourierDashboard = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDelivery, setQrDelivery] = useState<Delivery | null>(null);
  const [mapDelivery, setMapDelivery] = useState<Delivery | null>(null);
  const { sharing, toggle } = useLiveLocationSharing("courier");

  useEffect(() => { checkAccess(); }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    const hasAccess = roles?.some((r) => r.role === "courier" || r.role === "admin");
    if (!hasAccess) { navigate("/dashboard"); toast.error("Accès réservé aux livreurs"); return; }
    setUserId(session.user.id);
    setAuthorized(true);
    loadDeliveries(session.user.id);
  };

  const loadDeliveries = async (uid: string) => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("deliveries")
      .select("*")
      .eq("courier_id", uid)
      .order("created_at", { ascending: false });
    setDeliveries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`courier-deliveries-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries", filter: `courier_id=eq.${userId}` }, () => loadDeliveries(userId))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const updateStatus = async (deliveryId: string, status: "en_route" | "arrived") => {
    const { error } = await (supabase as any).rpc("courier_update_delivery_status", { _delivery_id: deliveryId, _status: status });
    if (error) { toast.error(error.message); return; }
    toast.success(status === "en_route" ? "En route vers le client" : "Arrivée signalée");
  };

  const activeDeliveries = deliveries.filter((d) => !["delivered", "cancelled", "payment_rejected"].includes(d.status));
  const pastDeliveries = deliveries.filter((d) => ["delivered", "cancelled", "payment_rejected"].includes(d.status));

  if (!authorized) return null;

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft size={16} /></Button>
          <img src={logo} alt="" className="h-8" />
          <h1 className="font-display text-xl font-bold flex items-center gap-2"><Truck className="text-primary" /> Espace Livreur</h1>
        </div>
        <DeliveryNotificationsBell />
      </div>

      <div className="glass-card rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Navigation size={22} className={sharing ? "text-green-500" : "text-muted-foreground"} />
          <div>
            <p className="font-display text-sm font-bold">Partage de ma position GPS</p>
            <p className="text-xs text-muted-foreground">
              {sharing ? "Position partagée en temps réel avec vos clients." : "Activez pour que le client vous voie arriver."}
            </p>
          </div>
        </div>
        <Switch checked={sharing} onCheckedChange={toggle} />
      </div>

      <h2 className="font-display font-bold mb-3">Livraisons en cours ({activeDeliveries.length})</h2>
      {loading ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : activeDeliveries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground glass-card rounded-xl">
          <Truck size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-display text-sm">Aucune livraison assignée pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {activeDeliveries.map((d) => {
            const cfg = deliveryStatusConfig[d.status];
            return (
              <div key={d.id} className="glass-card rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-display text-sm font-bold">{d.product_name}</p>
                    <p className="text-xs text-muted-foreground">{d.amount.toLocaleString()} {d.currency}</p>
                  </div>
                  <Badge className={`text-[10px] ${cfg.color} text-white`}>{cfg.label}</Badge>
                </div>

                <div className="rounded-lg bg-muted/30 p-3 space-y-1 mb-3">
                  <p className="text-sm font-medium flex items-center gap-2"><Truck size={13} className="text-primary" /> {d.client_name}</p>
                  {d.client_phone && (
                    <a href={`tel:${d.client_phone}`} className="text-sm text-primary flex items-center gap-2 hover:underline w-fit">
                      <Phone size={13} /> {d.client_phone}
                    </a>
                  )}
                  {(d.delivery_address || d.delivery_city) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <MapPin size={13} /> {[d.delivery_address, d.delivery_city, d.delivery_country].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {d.status === "assigned" && (
                    <Button size="sm" onClick={() => updateStatus(d.id, "en_route")} className="bg-gradient-purple font-display text-xs">
                      <Send size={13} className="mr-1" /> Démarrer la course
                    </Button>
                  )}
                  {d.status === "en_route" && (
                    <Button size="sm" onClick={() => updateStatus(d.id, "arrived")} className="bg-orange-500 hover:bg-orange-600 text-white font-display text-xs">
                      <MapPin size={13} className="mr-1" /> Je suis arrivé
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setMapDelivery(d)} className="font-display text-xs">
                    <Navigation size={13} className="mr-1" /> Voir le client sur la carte
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setQrDelivery(d)} className="font-display text-xs">
                    <QrCode size={13} className="mr-1" /> QR de paiement
                  </Button>
                </div>

                {d.status === "payment_claimed" && (
                  <p className="text-xs text-yellow-500 mt-2 font-medium">
                    ⏳ Le client dit avoir payé — en attente de validation par l'administration avant remise du colis.
                  </p>
                )}
                {d.status === "payment_approved" && (
                  <p className="text-xs text-green-500 mt-2 font-medium flex items-center gap-1">
                    <PackageCheck size={13} /> Paiement confirmé — vous pouvez remettre le colis !
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pastDeliveries.length > 0 && (
        <>
          <h2 className="font-display font-bold mb-3 text-muted-foreground">Historique</h2>
          <div className="space-y-2">
            {pastDeliveries.map((d) => {
              const cfg = deliveryStatusConfig[d.status];
              return (
                <div key={d.id} className="rounded-lg border border-border p-3 flex items-center justify-between opacity-70">
                  <div>
                    <p className="text-sm font-medium">{d.product_name}</p>
                    <p className="text-xs text-muted-foreground">{d.client_name}</p>
                  </div>
                  <Badge className={`text-[10px] ${cfg.color} text-white`}>{cfg.label}</Badge>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={!!qrDelivery} onOpenChange={(o) => !o && setQrDelivery(null)}>
        <DialogContent className="max-w-sm glass-card border-border">
          <DialogHeader><DialogTitle className="font-display text-gradient-gold">QR Code de paiement</DialogTitle></DialogHeader>
          {qrDelivery && <DeliveryQRCode delivery={qrDelivery} />}
          <p className="text-[10px] text-muted-foreground text-center">
            Présentez ce QR code au client pour qu'il scanne et paie sa commande.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={!!mapDelivery} onOpenChange={(o) => !o && setMapDelivery(null)}>
        <DialogContent className="max-w-lg glass-card border-border">
          <DialogHeader><DialogTitle className="font-display text-gradient-gold">Position du client</DialogTitle></DialogHeader>
          {mapDelivery && (
            <LiveDeliveryMap watchUserId={mapDelivery.client_id} watchLabel={mapDelivery.client_name} heightClass="h-80" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourierDashboard;
