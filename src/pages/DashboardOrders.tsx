import { useEffect, useState } from "react";
import { ShoppingBag, Package, CheckCircle, Clock, Truck, XCircle, Share2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import OrderDeliveryConfirm from "@/components/OrderDeliveryConfirm";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "En attente", color: "bg-yellow-600", icon: Clock },
  confirmed: { label: "Confirmé", color: "bg-blue-600", icon: CheckCircle },
  shipped: { label: "Expédié", color: "bg-purple-600", icon: Truck },
  delivered: { label: "Livré", color: "bg-green-600", icon: CheckCircle },
  cancelled: { label: "Annulé", color: "bg-destructive", icon: XCircle },
};

const DashboardOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [confirmOrder, setConfirmOrder] = useState<any>(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const [ordersRes, prodsRes, compsRes, ratingsRes] = await Promise.all([
      supabase.from("orders").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
      supabase.from("products").select("id, name, image_url, currency"),
      supabase.from("companies").select("id, name"),
      supabase.from("order_ratings").select("*").eq("user_id", session.user.id),
    ]);

    if (ordersRes.data) setOrders(ordersRes.data);
    if (prodsRes.data) {
      const m: Record<string, any> = {};
      prodsRes.data.forEach((p: any) => { m[p.id] = p; });
      setProducts(m);
    }
    if (compsRes.data) {
      const m: Record<string, string> = {};
      compsRes.data.forEach((c: any) => { m[c.id] = c.name; });
      setCompanies(m);
    }
    if (ratingsRes.data) {
      const m: Record<string, any> = {};
      ratingsRes.data.forEach((r: any) => { m[r.order_id] = r; });
      setRatings(m);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
        <ShoppingBag size={24} className="text-secondary" /> Mes Commandes
      </h1>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted/30 animate-pulse rounded-xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-display text-sm">Aucune commande</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const product = products[order.product_id];
            const company = companies[order.company_id];
            const rating = ratings[order.id];
            const cfg = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;

            return (
              <div key={order.id} className="glass-card rounded-xl p-4">
                <div className="flex items-start gap-3">
                  {product?.image_url ? (
                    <img src={product.image_url} alt={product?.name} className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted/50 flex items-center justify-center"><Package size={20} className="text-muted-foreground" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-bold truncate">{product?.name || "Produit"}</p>
                    <p className="text-xs text-muted-foreground">{company || ""}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("fr-FR")}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-[10px] ${cfg.color}`}>
                        <StatusIcon size={10} className="mr-1" /> {cfg.label}
                      </Badge>
                      <span className="font-display text-xs font-bold text-primary">{Number(order.total_price).toLocaleString()} {product?.currency || "FCFA"}</span>
                    </div>

                    {/* Confirm delivery button for shipped orders */}
                    {order.status === "shipped" && !rating && (
                      <Button size="sm" className="mt-2 text-xs bg-green-600 hover:bg-green-700 font-display"
                        onClick={() => setConfirmOrder({ id: order.id, product_name: product?.name || "Produit", company_name: company || "" })}>
                        <CheckCircle size={12} className="mr-1" /> Confirmer la réception
                      </Button>
                    )}

                    {/* Show rating if exists */}
                    {rating && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className={s <= rating.product_rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} />)}</div>
                        <span>{rating.comment || ""}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OrderDeliveryConfirm
        order={confirmOrder}
        open={!!confirmOrder}
        onOpenChange={(open) => { if (!open) setConfirmOrder(null); }}
        onConfirmed={loadOrders}
      />
    </div>
  );
};

export default DashboardOrders;
