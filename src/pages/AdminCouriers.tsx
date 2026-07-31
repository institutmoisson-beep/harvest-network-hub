import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Truck, Package, User, Phone, MapPin, CheckCircle2, XCircle,
  PackagePlus, ArrowLeft, Loader2, RefreshCw,
} from "lucide-react";
import logo from "@/assets/logo.png";
import DeliveryNotificationsBell from "@/components/DeliveryNotificationsBell";
import { deliveryStatusConfig, type Delivery } from "@/lib/deliveryTypes";

interface PendingOrder {
  key: string;
  orderType: "pack" | "commerce";
  orderId: string;
  clientId: string;
  productName: string;
  amount: number;
  currency: string;
  clientName: string;
  clientPhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
}

interface Courier {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  city: string | null;
  country: string | null;
}

const AdminCouriers = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState<string | null>(null);

  useEffect(() => { checkAccess(); }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    const hasAccess = roles?.some((r) => r.role === "admin" || r.role === "delivery_manager");
    if (!hasAccess) { navigate("/dashboard"); toast.error("Accès refusé"); return; }
    setAuthorized(true);
    loadAll();
  };

  const loadAll = async () => {
    setLoading(true);
    const [
      { data: couriersData },
      { data: deliveriesData },
      { data: packOrders },
      { data: commerceOrders },
      { data: products },
      { data: commerceProducts },
      { data: addresses },
      { data: profiles },
    ] = await Promise.all([
      (supabase as any).rpc("list_couriers"),
      (supabase as any).from("deliveries").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("orders").select("*").in("status", ["confirmed", "shipped"]).order("created_at", { ascending: false }).limit(200),
      supabase.from("commerce_orders").select("*").in("status", ["confirmed", "shipped"]).order("created_at", { ascending: false }).limit(200),
      supabase.from("products").select("id, name, currency"),
      supabase.from("commerce_products").select("id, name, currency"),
      supabase.from("shipping_addresses").select("*"),
      supabase.from("profiles").select("id, first_name, last_name, phone, city, country"),
    ]);

    setCouriers(couriersData || []);
    const deliveryList: Delivery[] = deliveriesData || [];
    setDeliveries(deliveryList);
    const assignedOrderIds = new Set(deliveryList.map((d) => d.order_id));

    const productMap: Record<string, any> = {};
    (products || []).forEach((p: any) => { productMap[p.id] = p; });
    const commerceProductMap: Record<string, any> = {};
    (commerceProducts || []).forEach((p: any) => { commerceProductMap[p.id] = p; });
    const addressMap: Record<string, any> = {};
    (addresses || []).forEach((a: any) => { addressMap[a.id] = a; });
    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

    const pending: PendingOrder[] = [];

    (packOrders || []).forEach((o: any) => {
      if (assignedOrderIds.has(o.id)) return;
      const addr = o.shipping_address_id ? addressMap[o.shipping_address_id] : null;
      const prof = profileMap[o.user_id];
      pending.push({
        key: `pack-${o.id}`,
        orderType: "pack",
        orderId: o.id,
        clientId: o.user_id,
        productName: productMap[o.product_id]?.name || "Pack",
        amount: Number(o.total_price),
        currency: productMap[o.product_id]?.currency || "FCFA",
        clientName: addr?.full_name || (prof ? `${prof.first_name} ${prof.last_name}` : "Client"),
        clientPhone: addr?.phone || prof?.phone || null,
        address: addr?.address_line || null,
        city: addr?.city || prof?.city || null,
        country: addr?.country || prof?.country || null,
        createdAt: o.created_at,
      });
    });

    (commerceOrders || []).forEach((o: any) => {
      if (assignedOrderIds.has(o.id)) return;
      const addr = o.shipping_address_id ? addressMap[o.shipping_address_id] : null;
      const prof = profileMap[o.user_id];
      pending.push({
        key: `commerce-${o.id}`,
        orderType: "commerce",
        orderId: o.id,
        clientId: o.user_id,
        productName: commerceProductMap[o.product_id]?.name || "Produit",
        amount: Number(o.total_price),
        currency: commerceProductMap[o.product_id]?.currency || "FCFA",
        clientName: o.client_name || addr?.full_name || (prof ? `${prof.first_name} ${prof.last_name}` : "Client"),
        clientPhone: o.client_phone || addr?.phone || prof?.phone || null,
        address: addr?.address_line || null,
        city: addr?.city || prof?.city || null,
        country: addr?.country || prof?.country || null,
        createdAt: o.created_at,
      });
    });

    pending.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setPendingOrders(pending);
    setLoading(false);
  };

  useEffect(() => {
    const channel = supabase
      .channel("admin-deliveries-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const courierName = (id: string | null) => {
    if (!id) return "—";
    const c = couriers.find((x) => x.id === id);
    return c ? `${c.first_name} ${c.last_name}` : id.slice(0, 8);
  };

  const assign = async (order: PendingOrder) => {
    const courierId = selectedCourier[order.key];
    if (!courierId) { toast.error("Choisissez un livreur"); return; }
    setAssigning(order.key);
    const { error } = await (supabase as any).rpc("assign_delivery", {
      _order_type: order.orderType,
      _order_id: order.orderId,
      _client_id: order.clientId,
      _courier_id: courierId,
      _amount: order.amount,
      _currency: order.currency,
      _product_name: order.productName,
      _client_name: order.clientName,
      _client_phone: order.clientPhone,
      _delivery_address: order.address,
      _delivery_city: order.city,
      _delivery_country: order.country,
    });
    setAssigning(null);
    if (error) { toast.error(error.message || "Échec de l'assignation"); return; }
    toast.success("Livreur assigné !");
    loadAll();
  };

  const review = async (deliveryId: string, approve: boolean) => {
    setReviewing(deliveryId);
    const { error } = await (supabase as any).rpc("admin_review_delivery_payment", { _delivery_id: deliveryId, _approve: approve });
    setReviewing(null);
    if (error) { toast.error(error.message || "Échec"); return; }
    toast.success(approve ? "Paiement approuvé" : "Paiement refusé");
    loadAll();
  };

  const claimedDeliveries = useMemo(() => deliveries.filter((d) => d.status === "payment_claimed"), [deliveries]);
  const activeDeliveries = useMemo(() => deliveries.filter((d) => !["delivered", "cancelled", "payment_rejected"].includes(d.status)), [deliveries]);

  if (!authorized) return null;

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin")}><ArrowLeft size={16} /></Button>
          <img src={logo} alt="" className="h-8" />
          <h1 className="font-display text-xl font-bold flex items-center gap-2"><Truck className="text-primary" /> Livreurs & Livraison</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadAll}><RefreshCw size={16} /></Button>
          <DeliveryNotificationsBell />
        </div>
      </div>

      {claimedDeliveries.length > 0 && (
        <div className="glass-card rounded-xl p-4 mb-6 border-2 border-yellow-500/40">
          <h2 className="font-display font-bold mb-3 flex items-center gap-2 text-yellow-500">
            <PackagePlus size={18} /> Paiements à valider ({claimedDeliveries.length})
          </h2>
          <div className="space-y-3">
            {claimedDeliveries.map((d) => (
              <div key={d.id} className="rounded-lg border border-border p-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-bold">{d.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.client_name} · {d.amount.toLocaleString()} {d.currency} · via {d.payment_method} · Livreur : {courierName(d.courier_id)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={reviewing === d.id} onClick={() => review(d.id, true)} className="bg-green-600 hover:bg-green-700 text-white font-display text-xs">
                    {reviewing === d.id ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} className="mr-1" /> Approuver</>}
                  </Button>
                  <Button size="sm" disabled={reviewing === d.id} onClick={() => review(d.id, false)} variant="destructive" className="font-display text-xs">
                    <XCircle size={14} className="mr-1" /> Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-4">
          <h2 className="font-display font-bold mb-3 flex items-center gap-2"><Package size={18} className="text-primary" /> Commandes à assigner ({pendingOrders.length})</h2>
          {loading ? (
            <p className="text-xs text-muted-foreground">Chargement…</p>
          ) : pendingOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Aucune commande en attente d'assignation.</p>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {pendingOrders.map((o) => (
                <div key={o.key} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-sm font-bold">{o.productName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><User size={11} /> {o.clientName}</p>
                      {o.clientPhone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={11} /> {o.clientPhone}</p>}
                      {(o.address || o.city) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin size={11} /> {[o.address, o.city, o.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-primary whitespace-nowrap">{o.amount.toLocaleString()} {o.currency}</span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedCourier[o.key] || ""}
                      onChange={(e) => setSelectedCourier((prev) => ({ ...prev, [o.key]: e.target.value }))}
                      className="flex-1 h-9 rounded-md border bg-background px-2 text-xs"
                    >
                      <option value="">Choisir un livreur…</option>
                      {couriers.map((c) => (
                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name} {c.city ? `— ${c.city}` : ""}</option>
                      ))}
                    </select>
                    <Button size="sm" disabled={assigning === o.key} onClick={() => assign(o)} className="bg-gradient-purple font-display text-xs">
                      {assigning === o.key ? <Loader2 size={14} className="animate-spin" /> : "Assigner"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-4">
          <h2 className="font-display font-bold mb-3 flex items-center gap-2"><Truck size={18} className="text-primary" /> Livraisons actives ({activeDeliveries.length})</h2>
          {activeDeliveries.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Aucune livraison en cours.</p>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {activeDeliveries.map((d) => {
                const cfg = deliveryStatusConfig[d.status];
                return (
                  <div key={d.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-display text-sm font-bold">{d.product_name}</p>
                      <Badge className={`text-[10px] ${cfg.color} text-white`}>{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Client : {d.client_name}</p>
                    <p className="text-xs text-muted-foreground">Livreur : {courierName(d.courier_id)}</p>
                    <p className="text-xs font-bold text-primary mt-1">{d.amount.toLocaleString()} {d.currency}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 mt-6">
        <h2 className="font-display font-bold mb-3 flex items-center gap-2"><User size={18} className="text-primary" /> Livreurs ({couriers.length})</h2>
        {couriers.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucun livreur pour le moment. Attribuez le rôle "Livreur" à un utilisateur depuis{" "}
            <button onClick={() => navigate("/admin/roles")} className="text-primary hover:underline">Gestion des rôles</button>.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {couriers.map((c) => (
              <div key={c.id} className="rounded-lg border border-border p-3">
                <p className="font-display text-sm font-bold">{c.first_name} {c.last_name}</p>
                {c.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={11} /> {c.phone}</p>}
                {c.city && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={11} /> {c.city}, {c.country}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {deliveries.filter((d) => d.courier_id === c.id && !["delivered", "cancelled"].includes(d.status)).length} livraison(s) en cours
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCouriers;
