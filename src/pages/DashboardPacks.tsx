import { useEffect, useState } from "react";
import { Package, ShoppingBag, Check, ChevronLeft, ChevronRight, ImageIcon, Eye, Truck, Globe, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import PurchaseDialog from "@/components/PurchaseDialog";
import CountryFilter from "@/components/CountryFilter";
import { matchesCountryFilter } from "@/lib/countries";

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
  countries?: string[] | null;
}

const PackImageCarousel = ({ images, name }: { images: string[]; name: string }) => {
  const [current, setCurrent] = useState(0);
  if (images.length === 0) return (
    <div className="h-44 bg-gradient-purple flex items-center justify-center">
      <Package size={40} className="text-primary-foreground/50" />
    </div>
  );
  return (
    <div className="relative h-44 overflow-hidden group">
      <img
        src={images[current]}
        alt={`${name} - ${current + 1}`}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).src = ""; (e.target as HTMLImageElement).style.display = "none"; }}
      />
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setCurrent(p => p === 0 ? images.length - 1 : p - 1); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setCurrent(p => p === images.length - 1 ? 0 : p + 1); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight size={14} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-white/50"}`} />
            ))}
          </div>
          <div className="absolute top-2 right-2 bg-background/60 rounded-full px-2 py-0.5 text-[10px] flex items-center gap-1">
            <ImageIcon size={10} /> {current + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
};

const DashboardPacks = () => {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [showPurchase, setShowPurchase] = useState(false);
  const [detailPack, setDetailPack] = useState<Pack | null>(null);
  const [userOrders, setUserOrders] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>("auto");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const [prodRes, compRes, profileRes, ordersRes] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).order("price", { ascending: true }),
        supabase.from("companies").select("id, name").eq("is_active", true),
        supabase.from("profiles").select("is_system_active, country").eq("id", session.user.id).single(),
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
      if (profileRes.data) { setIsSystemActive(profileRes.data.is_system_active); setUserCountry((profileRes.data as any).country || null); }
      if (ordersRes.data) setUserOrders(ordersRes.data.map((o: any) => o.product_id));
      setLoading(false);
    };
    load();
  }, []);

  const handleBuy = (pack: Pack) => {
    setSelectedPack(pack);
    setShowPurchase(true);
  };

  const refreshAfterPurchase = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const [profileRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("is_system_active").eq("id", session.user.id).single(),
      supabase.from("orders").select("product_id").eq("user_id", session.user.id).neq("status", "cancelled"),
    ]);
    if (profileRes.data) setIsSystemActive(profileRes.data.is_system_active);
    if (ordersRes.data) setUserOrders(ordersRes.data.map((o: any) => o.product_id));
  };

  const sectors = Array.from(new Set(packs.map(p => p.sector).filter(Boolean))) as string[];
  const visiblePacks = packs.filter(p => {
    if (!matchesCountryFilter(countryFilter, userCountry, p.countries)) return false;
    if (sectorFilter !== "all" && p.sector !== sectorFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const partner = (companies[p.company_id] || "").toLowerCase();
    return p.name.toLowerCase().includes(q) || partner.includes(q) || (p.sector || "").toLowerCase().includes(q);
  });

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

      <div className="glass-card rounded-xl p-3 mb-4 flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Rechercher par nom de pack, partenaire ou secteur…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={sectorFilter} onValueChange={setSectorFilter}>
          <SelectTrigger className="sm:w-56"><SelectValue placeholder="Secteur" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les secteurs</SelectItem>
            {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <CountryFilter value={countryFilter} onChange={setCountryFilter} className="sm:w-56" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-60 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visiblePacks.map(pack => {
            const allImages = [pack.image_url, ...pack.images].filter(Boolean) as string[];
            const alreadyBought = userOrders.includes(pack.id);
            return (
              <div key={pack.id} className="glass-card rounded-2xl overflow-hidden hover:glow-purple transition-all duration-500 group">
                <button type="button" className="block w-full text-left" onClick={() => setDetailPack(pack)}>
                  <PackImageCarousel images={allImages} name={pack.name} />
                </button>
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
                    {pack.countries && pack.countries.length > 0 ? (
                      <Badge variant="outline" className="text-[10px] gap-1"><MapPin size={10} />{pack.countries.length > 2 ? `${pack.countries.slice(0, 2).join(", ")} +${pack.countries.length - 2}` : pack.countries.join(", ")}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1"><Globe size={10} /> Universel</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">{companies[pack.company_id] || ""}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="font-display text-xs" onClick={() => setDetailPack(pack)}>
                      <Eye size={14} className="mr-1" /> Détails
                    </Button>
                    <Button size="sm" className="bg-gradient-purple text-primary-foreground font-display text-xs hover:opacity-90 glow-purple"
                      onClick={() => handleBuy(pack)}>
                      <ShoppingBag size={14} className="mr-1" /> {alreadyBought ? "Racheter" : "Acheter"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && visiblePacks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-display text-sm">Aucun pack ne correspond à votre recherche</p>
        </div>
      )}

      <PurchaseDialog
        product={selectedPack}
        open={showPurchase}
        onOpenChange={(open) => { setShowPurchase(open); if (!open) void refreshAfterPurchase(); }}
        companyName={selectedPack ? (companies[selectedPack.company_id] || "") : ""}
      />

      <Dialog open={!!detailPack} onOpenChange={(open) => !open && setDetailPack(null)}>
        <DialogContent className="max-w-2xl glass-card border-border max-h-[90vh] overflow-y-auto">
          {detailPack && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-gradient-gold flex items-center gap-2">
                  <Package size={20} /> {detailPack.name}
                </DialogTitle>
                <DialogDescription>{companies[detailPack.company_id] || "Pack Institut Moisson"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-border">
                  <PackImageCarousel images={[detailPack.image_url, ...detailPack.images].filter(Boolean) as string[]} name={detailPack.name} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {detailPack.activates_system && <Badge className="text-[10px] bg-green-600">Active le MLM</Badge>}
                  {detailPack.is_physical && <Badge variant="outline" className="text-[10px]"><Truck size={10} className="mr-1" /> Livraison</Badge>}
                  <Badge variant="outline" className="text-[10px]">{detailPack.sector || "Pack"}</Badge>
                  {detailPack.countries && detailPack.countries.length > 0 ? (
                    <Badge variant="outline" className="text-[10px] gap-1"><MapPin size={10} />{detailPack.countries.join(", ")}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] gap-1"><Globe size={10} /> Universel / International</Badge>
                  )}
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
                      <div className="rounded-lg bg-background/60 p-2"><p className="text-[10px] text-muted-foreground">Parrain direct</p><p className="text-xs font-bold">{Math.round(Number(detailPack.profit_amount) * Number(detailPack.level1_commission_percentage) / 100).toLocaleString()} {detailPack.currency}</p></div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Après le niveau 1, la commission décroît de 50 % à chaque niveau jusqu'à 0,01 %.</p>
                  </div>
                )}
                <Button className="w-full bg-gradient-purple text-primary-foreground font-display hover:opacity-90 glow-purple" onClick={() => { setDetailPack(null); handleBuy(detailPack); }}>
                  <ShoppingBag size={16} className="mr-2" /> Acheter ce pack
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPacks;
