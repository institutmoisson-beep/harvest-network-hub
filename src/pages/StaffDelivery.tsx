import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Truck, PackageCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  en_preparation: "En préparation",
  en_route_relais: "En route vers le relais",
  disponible_au_relais: "Disponible au relais",
  recupere: "Récupéré",
};
const NEXT: Record<string, string | null> = {
  en_preparation: "en_route_relais",
  en_route_relais: "disponible_au_relais",
  disponible_au_relais: "recupere",
  recupere: null,
};

const StaffDelivery = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [p, c] = await Promise.all([
      (supabase as any).from("orders").select("id, total_price, delivery_status, created_at, product_id, relay_point_id").order("created_at", { ascending: false }).limit(100),
      (supabase as any).from("commerce_orders").select("id, total_price, delivery_status, created_at, product_id, relay_point_id").order("created_at", { ascending: false }).limit(100),
    ]);
    const list = [
      ...(p.data || []).map((o: any) => ({ ...o, kind: "pack" })),
      ...(c.data || []).map((o: any) => ({ ...o, kind: "commerce" })),
    ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    setOrders(list); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const advance = async (o: any) => {
    const next = NEXT[o.delivery_status];
    if (!next) return;
    const { error } = await (supabase as any).rpc("update_delivery_status", { _order_id: o.id, _kind: o.kind, _status: next });
    if (error) { toast.error(error.message); return; }
    toast.success("Statut mis à jour"); load();
  };

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-6 flex items-center gap-2"><Truck className="text-primary" /> Gestion Livraison</h1>
      {loading ? <p>Chargement...</p> : (
        <div className="glass-card rounded-xl overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Commande</TableHead><TableHead>Montant</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead>Relais</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {orders.map(o => (
                <TableRow key={`${o.kind}-${o.id}`}>
                  <TableCell><Badge variant="outline">{o.kind}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                  <TableCell>{Number(o.total_price).toLocaleString()} FCFA</TableCell>
                  <TableCell className="text-xs">{new Date(o.created_at).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell><Badge>{STATUS_LABELS[o.delivery_status] || o.delivery_status}</Badge></TableCell>
                  <TableCell className="text-xs">{o.relay_point_id ? "✅" : "À domicile"}</TableCell>
                  <TableCell>
                    {NEXT[o.delivery_status] && (
                      <Button size="sm" onClick={() => advance(o)}><PackageCheck size={14} /> {STATUS_LABELS[NEXT[o.delivery_status]!]}</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
export default StaffDelivery;