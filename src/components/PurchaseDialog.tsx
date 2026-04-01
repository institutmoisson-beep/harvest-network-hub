import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingBag, Truck, FileText } from "lucide-react";
import { downloadContract } from "@/utils/generateContract";

interface Product {
  id: string;
  name: string;
  price: number;
  is_physical: boolean;
  activates_system?: boolean;
  image_url?: string;
  description?: string;
  currency?: string;
}

interface PurchaseDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
}

const PurchaseDialog = ({ product, open, onOpenChange, companyName }: PurchaseDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [savedAddress, setSavedAddress] = useState<any>(null);
  const [useSaved, setUseSaved] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", country: "", city: "", addressLine: "", postalCode: "" });
  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  useEffect(() => {
    if (!open || !product?.is_physical) return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("shipping_addresses").select("*").eq("user_id", user.id).eq("is_default", true).maybeSingle();
      if (data) {
        setSavedAddress(data);
        setUseSaved(true);
        setForm({ fullName: data.full_name, phone: data.phone, country: data.country, city: data.city, addressLine: data.address_line, postalCode: data.postal_code || "" });
      }
    };
    load();
  }, [open, product]);

  const handlePurchase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !product) { toast.error("Vous devez être connecté"); return; }

    if (product.is_physical && (!form.fullName || !form.phone || !form.country || !form.city || !form.addressLine)) {
      toast.error("Remplissez tous les champs d'adresse");
      return;
    }

    setLoading(true);
    try {
      // Check wallet
      const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
      if (!wallet || Number(wallet.balance) < product.price) {
        toast.error("Solde insuffisant. Rechargez votre portefeuille.");
        setLoading(false);
        return;
      }

      let shippingAddressId = null;
      if (product.is_physical) {
        if (useSaved && savedAddress) {
          shippingAddressId = savedAddress.id;
        } else {
          await supabase.from("shipping_addresses").update({ is_default: false } as any).eq("user_id", user.id);
          const { data: newAddr, error: addrErr } = await supabase.from("shipping_addresses").insert({
            user_id: user.id, full_name: form.fullName, phone: form.phone, country: form.country, city: form.city,
            address_line: form.addressLine, postal_code: form.postalCode || null, is_default: true,
          } as any).select().single();
          if (addrErr) throw addrErr;
          shippingAddressId = newAddr.id;
        }
      }

      const { data: prodData } = await supabase.from("products").select("company_id, activates_system").eq("id", product.id).single();
      if (!prodData) throw new Error("Produit introuvable");

      // Create order
      const { error: orderErr } = await supabase.from("orders").insert({
        user_id: user.id, product_id: product.id, company_id: prodData.company_id,
        shipping_address_id: shippingAddressId, total_price: product.price, status: "pending",
      } as any);
      if (orderErr) throw orderErr;

      // Debit wallet
      const newBalance = Number(wallet.balance) - product.price;
      await supabase.from("wallets").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("id", wallet.id);

      // Record wallet transaction
      await supabase.from("wallet_transactions").insert({
        user_id: user.id, type: "achat" as const, amount: product.price,
        status: "approved" as const, notes: `Achat: ${product.name} (${companyName})`,
      });

      // Activate system if pack
      if (prodData.activates_system) {
        await supabase.from("profiles").update({ is_system_active: true }).eq("id", user.id);
      }

      // Pay commissions to sponsors up the chain
      await payCommissions(user.id, product.price, product.id);

      toast.success("Achat effectué avec succès ! Votre portefeuille a été débité.");
      // Offer contract download
      const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single();
      const memberName = profile ? `${profile.first_name} ${profile.last_name}` : "Membre";
      downloadContract(memberName, product.name, product.price, companyName);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'achat");
    } finally {
      setLoading(false);
    }
  };

  const payCommissions = async (buyerId: string, amount: number, productId: string) => {
    try {
      // Get per-pack commission rates
      const { data: rates } = await supabase.from("pack_commission_rates").select("*").eq("product_id", productId).order("level", { ascending: true });
      
      if (!rates || rates.length === 0) return;

      // Build rate lookup + find last configured level for decay formula
      const rateMap = new Map<number, number>();
      let maxConfiguredLevel = 0;
      let lastPct = 0;
      rates.forEach((r: any) => {
        rateMap.set(r.level, Number(r.percentage));
        if (r.level > maxConfiguredLevel) {
          maxConfiguredLevel = r.level;
          lastPct = Number(r.percentage);
        }
      });

      // Walk up the sponsor chain infinitely
      let currentUserId = buyerId;
      let level = 0;
      const MIN_PCT = 0.01;

      while (true) {
        level++;
        const { data: profile } = await supabase.from("profiles").select("referred_by").eq("id", currentUserId).single();
        if (!profile?.referred_by) break;

        const sponsorId = profile.referred_by;

        // Determine commission percentage
        let pct: number;
        if (rateMap.has(level)) {
          pct = rateMap.get(level)!;
        } else if (maxConfiguredLevel > 0 && lastPct > MIN_PCT) {
          // Infinite decay: halve per extra level beyond configured
          const extraLevels = level - maxConfiguredLevel;
          pct = lastPct / Math.pow(2, extraLevels);
          if (pct < MIN_PCT) break; // Stop when too small
        } else {
          break;
        }

        if (pct <= 0) { currentUserId = sponsorId; continue; }

        const commission = (amount * pct) / 100;
        if (commission < 1) { currentUserId = sponsorId; continue; } // Min 1 FCFA

        // Credit sponsor wallet
        const { data: sponsorWallet } = await supabase.from("wallets").select("*").eq("user_id", sponsorId).single();
        if (sponsorWallet) {
          await supabase.from("wallets").update({
            balance: Number(sponsorWallet.balance) + commission,
            updated_at: new Date().toISOString()
          }).eq("id", sponsorWallet.id);
        }

        // Record wallet transaction
        await supabase.from("wallet_transactions").insert({
          user_id: sponsorId, type: "commission" as const, amount: commission,
          status: "approved" as const,
          notes: `Commission niveau ${level} (${pct.toFixed(2)}%) sur achat de filleul`,
        });

        // Record in commissions table
        await supabase.from("commissions").insert({
          user_id: sponsorId, source_user_id: buyerId, amount: commission,
          level, description: `Commission niveau ${level} (${pct.toFixed(2)}%)`,
        });

        currentUserId = sponsorId;
      }
    } catch (err) {
      console.error("Error paying commissions:", err);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-gradient-purple flex items-center gap-2">
            <ShoppingBag size={20} /> Acheter
          </DialogTitle>
          <DialogDescription>{product.name} — {companyName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <p className="font-display text-sm font-bold">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.description}</p>
              {product.activates_system && <p className="text-xs text-green-500 mt-1">✅ Pack d'activation MLM</p>}
            </div>
            <span className="font-display text-sm font-bold text-primary">{product.price.toLocaleString()} {product.currency || "FCFA"}</span>
          </div>

          {product.is_physical && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-display"><Truck size={16} className="text-primary" /> Adresse de livraison</div>
              {savedAddress && (
                <div className="flex items-center gap-2">
                  <Checkbox checked={useSaved} onCheckedChange={v => {
                    setUseSaved(!!v);
                    if (v) setForm({ fullName: savedAddress.full_name, phone: savedAddress.phone, country: savedAddress.country, city: savedAddress.city, addressLine: savedAddress.address_line, postalCode: savedAddress.postal_code || "" });
                  }} />
                  <span className="text-xs text-muted-foreground">Utiliser l'adresse enregistrée</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Nom complet *</Label><Input value={form.fullName} onChange={e => update("fullName", e.target.value)} disabled={useSaved} className="mt-1 text-sm bg-input border-border" /></div>
                <div><Label className="text-xs">Téléphone *</Label><Input value={form.phone} onChange={e => update("phone", e.target.value)} disabled={useSaved} className="mt-1 text-sm bg-input border-border" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Pays *</Label><Input value={form.country} onChange={e => update("country", e.target.value)} disabled={useSaved} className="mt-1 text-sm bg-input border-border" /></div>
                <div><Label className="text-xs">Ville *</Label><Input value={form.city} onChange={e => update("city", e.target.value)} disabled={useSaved} className="mt-1 text-sm bg-input border-border" /></div>
              </div>
              <div><Label className="text-xs">Adresse complète *</Label><Input value={form.addressLine} onChange={e => update("addressLine", e.target.value)} disabled={useSaved} placeholder="Rue, quartier..." className="mt-1 text-sm bg-input border-border" /></div>
            </div>
          )}

          <Button onClick={handlePurchase} disabled={loading} className="w-full bg-gradient-purple text-primary-foreground font-display font-bold hover:opacity-90 glow-purple">
            {loading ? "Traitement..." : `Payer ${product.price.toLocaleString()} ${product.currency || "FCFA"} depuis mon portefeuille`}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">Le montant sera débité de votre portefeuille</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;
