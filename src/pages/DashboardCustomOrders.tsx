import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Package, Send, Clock, Truck, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";

// ============= Commandes hors-catalogue (utilisateur) =============

type Frequency = "once" | "daily" | "weekly" | "monthly";

const WEEK_DAYS = [
  { key: "mon", label: "Lun" }, { key: "tue", label: "Mar" }, { key: "wed", label: "Mer" },
  { key: "thu", label: "Jeu" }, { key: "fri", label: "Ven" }, { key: "sat", label: "Sam" }, { key: "sun", label: "Dim" },
];

const STATUS_STYLE: Record<string, { label: string; className: string; icon: any }> = {
  pending:     { label: "En attente",       className: "bg-orange-500/20 text-orange-300 border-orange-500/40", icon: Clock },
  in_transit:  { label: "En cours",          className: "bg-blue-500/20 text-blue-300 border-blue-500/40",       icon: Truck },
  delivered:   { label: "Livré",             className: "bg-green-500/20 text-green-300 border-green-500/40",    icon: CheckCircle2 },
  cancelled:   { label: "Annulé",            className: "bg-muted text-muted-foreground border-border",          icon: XCircle },
};

const DashboardCustomOrders = () => {
  const { selectedCurrency, formatConverted } = useCurrency();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [addressText, setAddressText] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("once");
  const [weekDays, setWeekDays] = useState<string[]>([]);
  const [monthlyCount, setMonthlyCount] = useState<number>(1);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);

  const total = quantity * unitPrice;

  // ============= Chargement + Realtime =============
  useEffect(() => {
    let active = true;
    let channel: any;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      await load();
      channel = supabase
        .channel(`custom-orders-${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "custom_orders", filter: `user_id=eq.${user.id}` },
          () => load())
        .subscribe();
    })();
    return () => { active = false; if (channel) supabase.removeChannel(channel); };
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("custom_orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  // ============= GPS =============
  const activateGps = () => {
    setGpsError(null);
    if (!("geolocation" in navigator)) {
      setGpsError("Votre appareil ne supporte pas la géolocalisation.");
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsBusy(false);
        toast.success("Position GPS capturée");
      },
      (err) => {
        setGpsBusy(false);
        setGpsError(err.code === 1
          ? "Vous avez refusé la géolocalisation. Autorisez-la dans les paramètres du navigateur."
          : "Impossible d'obtenir votre position. Réessayez à l'extérieur ou près d'une fenêtre.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // ============= Validation + soumission =============
  const submit = async () => {
    if (!productName.trim()) return toast.error("Nom du produit requis");
    if (quantity <= 0) return toast.error("Quantité invalide");
    if (unitPrice < 0) return toast.error("Prix unitaire invalide");
    if (!coords) return toast.error("Activez le GPS pour définir le point de livraison");
    if ((frequency === "weekly") && weekDays.length === 0)
      return toast.error("Choisissez au moins un jour de livraison");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Session expirée");

    setSubmitting(true);
    const delivery_details = frequency === "weekly" ? { days: weekDays }
      : frequency === "monthly" ? { deliveries_per_month: monthlyCount }
      : {};

    const { error } = await (supabase as any).from("custom_orders").insert({
      user_id: user.id,
      product_name: productName.trim(),
      quantity,
      unit_price: unitPrice,
      delivery_latitude: coords.lat,
      delivery_longitude: coords.lng,
      delivery_address_text: addressText.trim() || null,
      delivery_frequency: frequency,
      delivery_details,
    });
    setSubmitting(false);

    if (error) return toast.error(error.message);
    toast.success("Commande envoyée !");
    setProductName(""); setQuantity(1); setUnitPrice(0); setAddressText("");
    setFrequency("once"); setWeekDays([]); setMonthlyCount(1);
    load();
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("Annuler cette commande ?")) return;
    const { error } = await (supabase as any).from("custom_orders").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Commande annulée");
    load();
  };

  const toggleDay = (k: string) =>
    setWeekDays((prev) => prev.includes(k) ? prev.filter(d => d !== k) : [...prev, k]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="font-display text-xl font-bold flex items-center gap-2">
        <Package size={22} className="text-secondary" /> Commandes hors-catalogue
      </h1>
      <p className="text-xs text-muted-foreground -mt-4">
        Commandez un produit non répertorié en indiquant vos propres détails et un point de livraison GPS.
      </p>

      {/* ============= Formulaire ============= */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-sm font-bold text-gradient-gold">Nouvelle commande</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-xs">Nom du produit *</Label>
            <Input value={productName} onChange={e => setProductName(e.target.value.slice(0, 200))}
              placeholder="Ex: Sac de riz 25kg importé" maxLength={200}
              className="mt-1 bg-input border-border text-sm" />
          </div>
          <div>
            <Label className="text-xs">Quantité *</Label>
            <Input type="number" min={1} value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-1 bg-input border-border text-sm" />
          </div>
          <div>
            <Label className="text-xs">Prix unitaire (FCFA) *</Label>
            <Input type="number" min={0} step={100} value={unitPrice}
              onChange={e => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
              className="mt-1 bg-input border-border text-sm" />
          </div>
        </div>

        <div className="rounded-xl p-3 bg-primary/5 border border-primary/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Total estimé</span>
          <span className="text-right">
            <span className="font-display font-black text-lg text-gradient-gold block">
              {total.toLocaleString()} FCFA
            </span>
            {selectedCurrency !== "XOF" && (
              <span className="text-[10px] text-muted-foreground">≈ {formatConverted(total)}</span>
            )}
          </span>
        </div>

        {/* ============= GPS ============= */}
        <div className="rounded-xl border border-border p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-display font-bold">
            <MapPin size={14} className="text-primary" /> Point de livraison
          </div>
          <Button type="button" onClick={activateGps} disabled={gpsBusy}
            className="w-full bg-gradient-purple font-display text-xs hover:opacity-90 glow-purple">
            <MapPin size={16} className="mr-2" />
            {gpsBusy ? "Localisation en cours…" : coords ? "Rafraîchir ma position" : "📍 Activer le GPS pour la livraison"}
          </Button>
          {coords && (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 font-mono">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
            </div>
          )}
          {gpsError && <p className="text-xs text-destructive">{gpsError}</p>}
          <Textarea value={addressText} onChange={e => setAddressText(e.target.value.slice(0, 500))}
            maxLength={500} placeholder="Détails complémentaires : quartier, repère, étage…"
            className="bg-input border-border text-xs min-h-[60px]" />
        </div>

        {/* ============= Fréquence ============= */}
        <div className="rounded-xl border border-border p-3 space-y-3">
          <div className="flex items-center gap-2 text-xs font-display font-bold">
            <Calendar size={14} className="text-primary" /> Fréquence de livraison
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              { v: "once", l: "Unique" }, { v: "daily", l: "Journalier" },
              { v: "weekly", l: "Hebdo" }, { v: "monthly", l: "Mensuel" },
            ] as { v: Frequency; l: string }[]).map(opt => (
              <button key={opt.v} type="button" onClick={() => setFrequency(opt.v)}
                className={`p-2 rounded-lg border text-xs transition-all ${frequency === opt.v
                  ? "border-primary bg-primary/15 text-foreground font-display font-bold"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"}`}>
                {opt.l}
              </button>
            ))}
          </div>

          {frequency === "weekly" && (
            <div>
              <Label className="text-xs">Jours de livraison *</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {WEEK_DAYS.map(d => (
                  <button key={d.key} type="button" onClick={() => toggleDay(d.key)}
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${weekDays.includes(d.key)
                      ? "border-primary bg-primary/20 text-foreground font-bold"
                      : "border-border bg-muted/30 text-muted-foreground"}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {frequency === "monthly" && (
            <div>
              <Label className="text-xs">Nombre de livraisons par mois *</Label>
              <Input type="number" min={1} max={31} value={monthlyCount}
                onChange={e => setMonthlyCount(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                className="mt-1 bg-input border-border text-sm" />
            </div>
          )}
        </div>

        <Button onClick={submit} disabled={submitting || !coords}
          className="w-full bg-gradient-gold text-secondary-foreground font-display font-bold hover:opacity-90 glow-gold">
          {submitting ? "Envoi…" : <><Send size={16} className="mr-2" /> Envoyer la commande</>}
        </Button>
      </div>

      {/* ============= Suivi ============= */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-display text-sm font-bold mb-3">Mes commandes hors-catalogue</h2>
        {loading ? (
          <p className="text-xs text-muted-foreground">Chargement…</p>
        ) : orders.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">Aucune commande pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {orders.map(o => {
              const s = STATUS_STYLE[o.status] || STATUS_STYLE.pending;
              const StatusIcon = s.icon;
              return (
                <div key={o.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm truncate">{o.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.quantity} × {Number(o.unit_price).toLocaleString()} = <span className="text-secondary font-bold">{Number(o.total_amount).toLocaleString()} FCFA</span>
                      {selectedCurrency !== "XOF" && <span className="text-[10px]"> (≈ {formatConverted(Number(o.total_amount))})</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(o.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} • {o.delivery_frequency}
                    </p>
                    {o.status === "delivered" && Number(o.calculated_commission) > 0 && (
                      <p className="text-[10px] text-green-400 mt-1">
                        Commission générée: {Number(o.calculated_commission).toLocaleString()} FCFA
                        {selectedCurrency !== "XOF" && ` (≈ ${formatConverted(Number(o.calculated_commission))})`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold ${s.className}`}>
                      <StatusIcon size={10} /> {s.label}
                    </span>
                    {o.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => cancelOrder(o.id)}
                        className="h-6 text-[10px] text-destructive hover:bg-destructive/10">
                        Annuler
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCustomOrders;
