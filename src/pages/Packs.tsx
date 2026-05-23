import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Package, Search, Filter, ShoppingBag, Eye, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import PurchaseDialog from "@/components/PurchaseDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Pack {
  id: string;
  name: string;
  price: number;
  description: string | null;
  profit_amount: number;
  level1_commission_percentage: number;
  image_url: string | null;
  images: string[];
  is_physical: boolean;
  activates_system: boolean;
  currency: string;
  sector: string | null;
  company_id: string;
}

const Packs = () => {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [packs, setPacks] = useState<Pack[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [sectors, setSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [showPurchase, setShowPurchase] = useState(false);
  const [detailPack, setDetailPack] = useState<Pack | null>(null);

  useEffect(() => {
    const load = async () => {
      const [prodRes, compRes, secRes] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("companies").select("id, name").eq("is_active", true),
        supabase.from("sectors").select("name").order("name"),
      ]);

      if (prodRes.data) {
        setPacks(prodRes.data.map((p: any) => ({
          ...p,
          images: Array.isArray(p.images) ? p.images : [],
        })));
      }

      if (compRes.data) {
        const map: Record<string, string> = {};
        compRes.data.forEach((c: any) => { map[c.id] = c.name; });
        setCompanies(map);
      }

      if (secRes.data) {
        setSectors(secRes.data.map((s: any) => s.name));
      }

      setLoading(false);
    };
    load();
  }, []);

  const filtered = packs.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase());
    const matchSector = !sectorFilter || p.sector === sectorFilter;
    return matchSearch && matchSector;
  });

  const handleBuy = (pack: Pack) => {
    setSelectedPack(pack);
    setShowPurchase(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-4">
              <Package size={14} className="text-primary" />
              <span className="text-xs font-display uppercase tracking-widest text-primary">Packs</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
              <span className="text-gradient-purple">Packs</span> d'Activation MLM
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              Choisissez un pack pour activer votre système MLM et commencer à gagner des commissions.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-10 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher un pack..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-input border-border" />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-md bg-input border border-border text-sm h-10 appearance-none min-w-[150px]">
                <option value="">Tous les secteurs</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(pack => {
                const mainImage = pack.image_url || (pack.images.length > 0 ? pack.images[0] : null);
                return (
                  <div key={pack.id} className="glass-card rounded-2xl overflow-hidden hover:glow-purple transition-all duration-500 group">
                    <button type="button" className="h-48 w-full bg-gradient-purple flex items-center justify-center overflow-hidden" onClick={() => setDetailPack(pack)}>
                      {mainImage ? (
                        <img src={mainImage} alt={pack.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <Package size={48} className="text-primary-foreground/50" />
                      )}
                    </button>
                    <div className="p-5">
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
                        {pack.sector && (
                          <Badge variant="outline" className="text-[10px]">{pack.sector}</Badge>
                        )}
                        {pack.activates_system && (
                          <Badge className="text-[10px] bg-green-600">Pack MLM</Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">{companies[pack.company_id] || ""}</span>
                      </div>
                      {pack.images.length > 1 && (
                        <div className="flex gap-1 mb-3 overflow-x-auto">
                          {pack.images.slice(0, 4).map((img, i) => (
                            <img key={i} src={img} alt="" className="w-10 h-10 rounded-lg object-cover border border-border" />
                          ))}
                          {pack.images.length > 4 && (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                              +{pack.images.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline" className="font-display text-xs" onClick={() => setDetailPack(pack)}>
                          <Eye size={14} className="mr-1" /> Détails
                        </Button>
                        <Button size="sm" className="bg-gradient-purple text-primary-foreground font-display text-xs hover:opacity-90 glow-purple" onClick={() => handleBuy(pack)}>
                          <ShoppingBag size={14} className="mr-1" /> Acheter
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Package size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-display text-sm">Aucun pack trouvé</p>
            </div>
          )}
        </div>
      </div>
      <Footer />

      <PurchaseDialog
        product={selectedPack}
        open={showPurchase}
        onOpenChange={setShowPurchase}
        companyName={selectedPack ? (companies[selectedPack.company_id] || "") : ""}
      />

      <Dialog open={!!detailPack} onOpenChange={(open) => !open && setDetailPack(null)}>
        <DialogContent className="max-w-2xl glass-card border-border max-h-[90vh] overflow-y-auto">
          {detailPack && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-gradient-gold flex items-center gap-2"><Package size={20} /> {detailPack.name}</DialogTitle>
                <DialogDescription>{companies[detailPack.company_id] || "Pack Institut Moisson"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="h-56 rounded-2xl overflow-hidden border border-border bg-gradient-purple flex items-center justify-center">
                  {(detailPack.image_url || detailPack.images[0]) ? <img src={detailPack.image_url || detailPack.images[0]} alt={detailPack.name} className="w-full h-full object-cover" /> : <Package size={48} className="text-primary-foreground/50" />}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {detailPack.activates_system && <Badge className="text-[10px] bg-green-600">Active le MLM</Badge>}
                  {detailPack.is_physical && <Badge variant="outline" className="text-[10px]"><Truck size={10} className="mr-1" /> Livraison</Badge>}
                  <Badge variant="outline" className="text-[10px]">{detailPack.sector || "Pack"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailPack.description || "Détails bientôt disponibles."}</p>
                <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
                  <span className="text-xs text-muted-foreground">Prix du pack</span>
                  <span className="font-display text-lg font-black text-primary">{detailPack.price.toLocaleString()} {detailPack.currency}</span>
                </div>
                {detailPack.activates_system && Number(detailPack.profit_amount || 0) > 0 && Number(detailPack.level1_commission_percentage || 0) > 0 && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <p className="text-xs font-display font-bold text-primary">Plan MLM de ce pack</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-background/60 p-2"><p className="text-[10px] text-muted-foreground">Bénéfice</p><p className="text-xs font-bold">{Number(detailPack.profit_amount).toLocaleString()} {detailPack.currency}</p></div>
                      <div className="rounded-lg bg-background/60 p-2"><p className="text-[10px] text-muted-foreground">Niveau 1</p><p className="text-xs font-bold">{Number(detailPack.level1_commission_percentage)}%</p></div>
                      <div className="rounded-lg bg-background/60 p-2"><p className="text-[10px] text-muted-foreground">Parrain</p><p className="text-xs font-bold">{Math.round(Number(detailPack.profit_amount) * Number(detailPack.level1_commission_percentage) / 100).toLocaleString()} {detailPack.currency}</p></div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Après le niveau 1, la commission décroît de 50 % à chaque niveau jusqu'à 0,01 %.</p>
                  </div>
                )}
                <Button className="w-full bg-gradient-purple text-primary-foreground font-display hover:opacity-90 glow-purple" onClick={() => { setDetailPack(null); handleBuy(detailPack); }}>
                  <ShoppingBag size={16} className="mr-2" /> Acheter ce pack avec mon portefeuille
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Packs;
