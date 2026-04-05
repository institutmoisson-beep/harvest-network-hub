import { useEffect, useState } from "react";
import { Package, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import PurchaseDialog from "@/components/PurchaseDialog";

interface Pack {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  images: string[];
  is_physical: boolean;
  activates_system: boolean;
  currency: string;
  sector: string | null;
  company_id: string;
}

const DashboardPacks = () => {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [showPurchase, setShowPurchase] = useState(false);
  const [userOrders, setUserOrders] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [prodRes, compRes, profileRes, ordersRes] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).order("price", { ascending: true }),
        supabase.from("companies").select("id, name").eq("is_active", true),
        supabase.from("profiles").select("is_system_active").eq("id", session.user.id).single(),
        supabase.from("orders").select("product_id").eq("user_id", session.user.id).neq("status", "cancelled"),
      ]);

      if (prodRes.data) {
        setPacks(prodRes.data.map((p: any) => ({ ...p, images: Array.isArray(p.images) ? p.images : [] })));
      }
      if (compRes.data) {
        const map: Record<string, string> = {};
        compRes.data.forEach((c: any) => { map[c.id] = c.name; });
        setCompanies(map);
      }
      if (profileRes.data) setIsSystemActive(profileRes.data.is_system_active);
      if (ordersRes.data) setUserOrders(ordersRes.data.map((o: any) => o.product_id));
      setLoading(false);
    };
    load();
  }, []);

  const handleBuy = (pack: Pack) => {
    setSelectedPack(pack);
    setShowPurchase(true);
  };

  return (
    <div className="p-6">
      <h1 className="font-display text-xl font-bold mb-2 flex items-center gap-2">
        <Package size={24} className="text-secondary" /> Packs MLM
      </h1>

      {!isSystemActive && (
        <div className="glass-card rounded-xl p-4 mb-6 border-l-4 border-yellow-500 bg-yellow-500/5">
          <p className="text-sm font-display font-bold text-yellow-500">⚠️ Système inactif</p>
          <p className="text-xs text-muted-foreground mt-1">
            Achetez un pack d'activation pour démarrer votre système MLM et commencer à gagner des commissions.
          </p>
        </div>
      )}

      {isSystemActive && (
        <div className="glass-card rounded-xl p-4 mb-6 border-l-4 border-green-500 bg-green-500/5">
          <p className="text-sm font-display font-bold text-green-500 flex items-center gap-2"><Check size={16} /> Système actif</p>
          <p className="text-xs text-muted-foreground mt-1">
            Votre système MLM est actif. Vous pouvez acheter d'autres packs pour diversifier.
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-60 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {packs.map(pack => {
            const mainImage = pack.image_url || (pack.images.length > 0 ? pack.images[0] : null);
            const alreadyBought = userOrders.includes(pack.id);
            return (
              <div key={pack.id} className="glass-card rounded-2xl overflow-hidden hover:glow-purple transition-all duration-500 group">
                <div className="h-36 bg-gradient-purple flex items-center justify-center overflow-hidden">
                  {mainImage ? (
                    <img src={mainImage} alt={pack.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Package size={40} className="text-primary-foreground/50" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-display text-sm font-bold">{pack.name}</h3>
                    <span className="font-display text-sm font-bold text-primary whitespace-nowrap">
                      {pack.price.toLocaleString()} {pack.currency}
                    </span>
                  </div>
                  {pack.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{pack.description}</p>
                  )}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {pack.activates_system && <Badge className="text-[10px] bg-green-600">Active le MLM</Badge>}
                    {alreadyBought && <Badge variant="outline" className="text-[10px]">Déjà acheté</Badge>}
                    <span className="text-[10px] text-muted-foreground">{companies[pack.company_id] || ""}</span>
                  </div>
                  <Button size="sm" className="w-full bg-gradient-purple text-primary-foreground font-display text-xs hover:opacity-90 glow-purple"
                    onClick={() => handleBuy(pack)}>
                    <ShoppingBag size={14} className="mr-1" /> {alreadyBought ? "Racheter" : "Acheter"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && packs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-display text-sm">Aucun pack disponible pour le moment</p>
        </div>
      )}

      <PurchaseDialog
        product={selectedPack}
        open={showPurchase}
        onOpenChange={(open) => { setShowPurchase(open); if (!open) { /* reload after purchase */ window.location.reload(); } }}
        companyName={selectedPack ? (companies[selectedPack.company_id] || "") : ""}
      />
    </div>
  );
};

export default DashboardPacks;
