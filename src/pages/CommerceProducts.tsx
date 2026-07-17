import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Boxes, PackageCheck, ShoppingBag, Share2, Truck, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { matchesCountryFilter } from "@/lib/countries";
import CountryFilter from "@/components/CountryFilter";
import { Search } from "lucide-react";
import ShareProductButton from "@/components/ShareProductButton";

type CommerceKind = "wholesale" | "distribution";
type CommerceProduct = {
  id: string;
  kind: CommerceKind;
  name: string;
  description: string;
  price: number;
  currency: string;
  min_quantity: number;
  available_quantity: number | null;
  commission_percentage: number;
  partner_name: string;
  images: string[];
  countries?: string[] | null;
};

const labels = {
  wholesale: { title: "Produits en gros", subtitle: "Achetez en volume ou proposez des lots partenaires à vos clients.", icon: Boxes },
  distribution: { title: "Distribution", subtitle: "Produits de distribution contrôlés par l’administration avec paiement portefeuille.", icon: PackageCheck },
};

export const CommerceProductsPage = ({ kind }: { kind: CommerceKind }) => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<CommerceProduct[]>([]);
  const [selected, setSelected] = useState<CommerceProduct | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mode, setMode] = useState<"buy" | "propose">("buy");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [client, setClient] = useState({ name: "", phone: "", note: "" });
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("auto");

  const config = labels[kind];
  const Icon = config.icon;

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: prof } = await supabase.from("profiles").select("country").eq("id", session.user.id).maybeSingle();
        if (prof?.country) setUserCountry(prof.country);
      }
      const [productsRes, walletRes, addressRes] = await Promise.all([
        supabase.from("commerce_products").select("*").eq("kind", kind).eq("is_active", true).order("created_at", { ascending: false }),
        session ? supabase.from("wallets").select("balance").eq("user_id", session.user.id).single() : Promise.resolve({ data: null }),
        session ? supabase.from("shipping_addresses").select("id").eq("user_id", session.user.id).eq("is_default", true).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      if (productsRes.data) setProducts(productsRes.data.map((p: any) => ({ ...p, images: Array.isArray(p.images) ? p.images : [] })));
      if (walletRes.data) setWalletBalance(Number(walletRes.data.balance));
      if (addressRes.data) setAddressId(addressRes.data.id);
      setLoading(false);
    };
    load();
  }, [kind]);

  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId || products.length === 0) return;
    const target = products.find(p => p.id === openId);
    if (target) openProduct(target);
  }, [searchParams, products]);

  const visibleProducts = products.filter(p => {
    if (!matchesCountryFilter(countryFilter, userCountry, (p as any).countries)) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q) || (p.partner_name || "").toLowerCase().includes(q);
  });

  const total = useMemo(() => selected ? Number(selected.price) * quantity : 0, [selected, quantity]);
  const commission = useMemo(() => selected ? (total * Number(selected.commission_percentage)) / 100 : 0, [selected, total]);

  const openProduct = (product: CommerceProduct) => {
    setSelected(product);
    setQuantity(Math.max(1, product.min_quantity));
    setMode("buy");
    setClient({ name: "", phone: "", note: "" });
  };

  const submit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selected) { toast.error("Connectez-vous pour continuer"); return; }
    if (mode === "propose" && (!client.name || !client.phone)) { toast.error("Nom et téléphone du client requis"); return; }
    if (!addressId) { toast.error("Enregistrez d’abord votre adresse de livraison dans votre profil"); return; }
    if (total > walletBalance) { toast.error(`Solde insuffisant. Disponible: ${walletBalance.toLocaleString()} FCFA`); return; }

    setSubmitting(true);
    const { error } = await supabase.rpc("purchase_commerce_product", {
      _product_id: selected.id,
      _quantity: quantity,
      _payment_method: "wallet",
      _shipping_address_id: addressId,
      _proposer_id: mode === "propose" ? user.id : null,
      _client_name: mode === "propose" ? client.name : null,
      _client_phone: mode === "propose" ? client.phone : null,
      _client_note: mode === "propose" ? client.note : null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(mode === "propose" ? "Proposition client enregistrée et commission prévue" : "Achat enregistré avec succès");
    setWalletBalance(prev => Math.max(0, prev - total));
    setSelected(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold flex items-center gap-2"><Icon size={24} className="text-primary" /> {config.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{config.subtitle}</p>
        </div>
        <Badge variant="outline" className="shrink-0"><Wallet size={12} className="mr-1" /> {walletBalance.toLocaleString()} FCFA</Badge>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={`Rechercher un produit${kind === "wholesale" ? " en gros" : " de distribution"}...`}
            value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-input border-border" />
        </div>
        <CountryFilter value={countryFilter} onChange={setCountryFilter} className="sm:w-56" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[1, 2, 3].map(i => <div key={i} className="h-64 rounded-2xl bg-muted/30 animate-pulse" />)}</div>
      ) : visibleProducts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Icon size={48} className="mx-auto mb-4 opacity-30" /><p className="font-display text-sm">Aucun produit disponible</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleProducts.map(product => {
            const image = product.images[0];
            return (
              <div key={product.id} className="glass-card rounded-2xl overflow-hidden text-left hover:glow-purple transition-all">
                <button type="button" onClick={() => openProduct(product)} className="block w-full text-left">
                  <div className="h-44 bg-muted/40 flex items-center justify-center overflow-hidden">
                    {image ? <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-cover" /> : <Icon size={40} className="text-muted-foreground" />}
                  </div>
                </button>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <button type="button" onClick={() => openProduct(product)} className="text-left">
                      <h3 className="font-display text-sm font-bold">{product.name}</h3>
                    </button>
                    <span className="text-sm font-bold text-primary whitespace-nowrap">{Number(product.price).toLocaleString()} {product.currency}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[10px]">Min. {product.min_quantity}</Badge>
                    {product.countries && product.countries.length > 0 ? (
                      <Badge variant="outline" className="text-[10px]">{product.countries.length > 2 ? `${product.countries.slice(0, 2).join(", ")} +${product.countries.length - 2}` : product.countries.join(", ")}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">🌐 Universel</Badge>
                    )}
                    {product.commission_percentage > 0 && <Badge className="text-[10px] bg-green-600">Commission {product.commission_percentage}%</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="font-display text-xs" onClick={() => openProduct(product)}>
                      <ShoppingBag size={14} className="mr-1" /> Voir
                    </Button>
                    <ShareProductButton
                      product={{ id: product.id, type: product.kind, name: product.name, price: product.price, currency: product.currency, image }}
                      variant="full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl glass-card border-border max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="font-display text-gradient-gold">{selected.name}</DialogTitle>
                    <DialogDescription>{selected.partner_name || "Partenaire Institut Moisson"}</DialogDescription>
                  </div>
                  <ShareProductButton
                    product={{ id: selected.id, type: selected.kind, name: selected.name, price: selected.price, currency: selected.currency, image: selected.images[0] }}
                    variant="icon"
                  />
                </div>
              </DialogHeader>
              <div className="space-y-4">
                {selected.images[0] && <img src={selected.images[0]} alt={selected.name} className="h-56 w-full rounded-2xl object-cover border border-border" />}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant={mode === "buy" ? "default" : "outline"} onClick={() => setMode("buy")} className="font-display text-xs"><ShoppingBag size={14} className="mr-1" /> Acheter</Button>
                  <Button variant={mode === "propose" ? "default" : "outline"} onClick={() => setMode("propose")} className="font-display text-xs"><Share2 size={14} className="mr-1" /> Proposer à un client</Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Quantité</Label><Input type="number" min={selected.min_quantity} value={quantity} onChange={e => setQuantity(Math.max(selected.min_quantity, Number(e.target.value || selected.min_quantity)))} className="mt-1 bg-input border-border" /></div>
                  <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Total</p><p className="font-display font-bold text-primary">{total.toLocaleString()} {selected.currency}</p></div>
                </div>
                {mode === "propose" && (
                  <div className="space-y-3 rounded-2xl border border-border p-3">
                    <p className="text-xs text-muted-foreground">Commission estimée: <strong className="text-primary">{commission.toLocaleString()} FCFA</strong></p>
                    <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Nom client *</Label><Input value={client.name} onChange={e => setClient(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-input border-border" /></div><div><Label className="text-xs">Téléphone client *</Label><Input value={client.phone} onChange={e => setClient(p => ({ ...p, phone: e.target.value }))} className="mt-1 bg-input border-border" /></div></div>
                    <div><Label className="text-xs">Note</Label><Textarea value={client.note} onChange={e => setClient(p => ({ ...p, note: e.target.value }))} className="mt-1 bg-input border-border" /></div>
                  </div>
                )}
                {!addressId && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"><Truck size={14} className="mr-1 inline" /> Adresse de livraison manquante. Allez dans Mon Profil pour l’enregistrer.</div>}
                <Button onClick={submit} disabled={submitting || !addressId || total > walletBalance} className="w-full bg-gradient-purple text-primary-foreground font-display hover:opacity-90 glow-purple">
                  {submitting ? "Traitement..." : total > walletBalance ? "Solde insuffisant" : "Payer avec mon portefeuille"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommerceProductsPage;
