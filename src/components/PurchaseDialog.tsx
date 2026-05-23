import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingBag, Truck, CreditCard, Banknote } from "lucide-react";
import { downloadContract } from "@/utils/generateContract";

interface Product {
  id: string;
  name: string;
  price: number;
  profit_amount?: number;
  level1_commission_percentage?: number;
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
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<"wallet" | "cod">("wallet");
  const [contractReady, setContractReady] = useState<{ memberName: string; productName: string; price: number; companyName: string } | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", country: "", city: "", addressLine: "", postalCode: "" });
  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  useEffect(() => {
    if (!open || !product) return;
    setContractReady(null);
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load wallet balance
      const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
      if (wallet) setWalletBalance(Number(wallet.balance));

      // Default payment mode based on product type
      if (!product.activates_system) {
        setPaymentMode(wallet && Number(wallet.balance) >= product.price ? "wallet" : "cod");
      } else {
        setPaymentMode("wallet");
      }

      if (!product.is_physical) return;
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

    // Check wallet for wallet payments
    if (paymentMode === "wallet") {
      if (walletBalance < product.price) {
        toast.error(`Solde insuffisant (${walletBalance.toLocaleString()} FCFA). Rechargez votre portefeuille ou choisissez le paiement à la livraison.`);
        return;
      }
    }

    setLoading(true);
    try {
      let shippingAddressId: string | null = null;
      if (product.is_physical) {
        if (useSaved && savedAddress) {
          shippingAddressId = savedAddress.id;
        } else {
          // Reset other defaults
          await supabase.from("shipping_addresses").update({ is_default: false }).eq("user_id", user.id);
          const { data: newAddr, error: addrErr } = await supabase.from("shipping_addresses").insert({
            user_id: user.id, full_name: form.fullName, phone: form.phone, country: form.country, city: form.city,
            address_line: form.addressLine, postal_code: form.postalCode || null, is_default: true,
          }).select().single();
          if (addrErr) throw addrErr;
          shippingAddressId = newAddr.id;
        }
      }

      const { data: prodData } = await supabase.from("products").select("company_id, activates_system").eq("id", product.id).single();
      if (!prodData) throw new Error("Produit introuvable");

      if (paymentMode === "wallet") {
        const { error: rpcError } = await (supabase as any).rpc("purchase_pack_product", {
          _product_id: product.id,
          _shipping_address_id: shippingAddressId,
        });
        if (rpcError) throw rpcError;
        toast.success("Achat effectué ! Portefeuille débité.");
      } else {
        const { error: orderErr } = await supabase.from("orders").insert({
          user_id: user.id, product_id: product.id, company_id: prodData.company_id,
          shipping_address_id: shippingAddressId, total_price: product.price, status: "pending" as const,
        });
        if (orderErr) throw orderErr;
        toast.success("Commande enregistrée ! Paiement à la livraison.");
      }

      const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single();
      const memberName = profile ? `${profile.first_name} ${profile.last_name}` : "Membre";
      setContractReady({ memberName, productName: product.name, price: product.price, companyName });
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'achat");
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  const insufficientBalance = walletBalance < product.price;
  const canCOD = !product.activates_system && product.is_physical;

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

          {product.activates_system && Number(product.profit_amount || 0) > 0 && Number(product.level1_commission_percentage || 0) > 0 && (
            <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs space-y-1">
              <p className="font-display font-bold text-primary">Commission calculée sur le bénéfice</p>
              <p className="text-muted-foreground">Bénéfice: {Number(product.profit_amount).toLocaleString()} {product.currency || "FCFA"} • Niveau 1: {Number(product.level1_commission_percentage)}% = {Math.round(Number(product.profit_amount) * Number(product.level1_commission_percentage) / 100).toLocaleString()} {product.currency || "FCFA"}</p>
              <p className="text-[10px] text-muted-foreground">Les niveaux suivants décroissent de 50 % jusqu'à 0,01 %.</p>
            </div>
          )}

          {/* Wallet balance info */}
          <div className={`p-3 rounded-xl text-xs ${insufficientBalance ? "bg-destructive/10 border border-destructive/30" : "bg-green-500/10 border border-green-500/30"}`}>
            <p className="font-display font-bold">
              💰 Solde: {walletBalance.toLocaleString()} FCFA
            </p>
            {insufficientBalance && (
              <p className="text-destructive mt-1">
                ⚠️ Solde insuffisant pour payer avec le portefeuille.
                {canCOD ? " Vous pouvez choisir le paiement à la livraison." : " Rechargez votre portefeuille."}
              </p>
            )}
          </div>

          {/* Payment mode selector */}
          {canCOD && (
            <div className="space-y-2">
              <p className="text-xs font-display font-bold">Mode de paiement</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMode("wallet")}
                  disabled={insufficientBalance}
                  className={`p-3 rounded-xl border text-xs text-left transition-all ${paymentMode === "wallet" ? "border-primary bg-primary/10" : "border-border bg-muted/30"} ${insufficientBalance ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <CreditCard size={16} className="mb-1 text-primary" />
                  <p className="font-display font-bold">Portefeuille</p>
                  <p className="text-muted-foreground text-[10px]">Paiement immédiat</p>
                </button>
                <button
                  onClick={() => setPaymentMode("cod")}
                  className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${paymentMode === "cod" ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}
                >
                  <Banknote size={16} className="mb-1 text-secondary" />
                  <p className="font-display font-bold">À la livraison</p>
                  <p className="text-muted-foreground text-[10px]">Payez quand vous recevez</p>
                </button>
              </div>
            </div>
          )}

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

          <Button onClick={handlePurchase} disabled={loading || (paymentMode === "wallet" && insufficientBalance)}
            className="w-full bg-gradient-purple text-primary-foreground font-display font-bold hover:opacity-90 glow-purple">
            {loading ? "Traitement..." : paymentMode === "wallet"
              ? `Payer ${product.price.toLocaleString()} ${product.currency || "FCFA"} depuis mon portefeuille`
              : `Commander — Paiement à la livraison`}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            {paymentMode === "wallet" ? "Le montant sera débité de votre portefeuille" : "Vous paierez le livreur à la réception"}
          </p>
          {contractReady && (
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs"
              onClick={() => downloadContract(contractReady.memberName, contractReady.productName, contractReady.price, contractReady.companyName)}
            >
              Télécharger mon contrat de garantie
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;
