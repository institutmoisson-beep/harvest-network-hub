import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingBag, MapPin, Truck } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  is_physical: boolean;
  image_url?: string;
  description?: string;
}

interface PurchaseDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
}

const PurchaseDialog = ({ product, open, onOpenChange, companyName }: PurchaseDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [savedAddress, setSavedAddress] = useState<any>(null);
  const [useSaved, setUseSaved] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    country: "",
    city: "",
    addressLine: "",
    postalCode: "",
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  // Load saved default address
  useEffect(() => {
    if (!open || !product?.is_physical) return;
    const loadAddress = async () => {
      setLoadingAddress(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingAddress(false); return; }
      
      const { data } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();
      
      if (data) {
        setSavedAddress(data);
        setUseSaved(true);
        setForm({
          fullName: data.full_name,
          phone: data.phone,
          country: data.country,
          city: data.city,
          addressLine: data.address_line,
          postalCode: data.postal_code || "",
        });
      }
      setLoadingAddress(false);
    };
    loadAddress();
  }, [open, product]);

  const handlePurchase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Vous devez être connecté pour acheter");
      return;
    }
    if (!product) return;

    if (product.is_physical) {
      if (!form.fullName || !form.phone || !form.country || !form.city || !form.addressLine) {
        toast.error("Veuillez remplir tous les champs d'adresse obligatoires");
        return;
      }
    }

    setLoading(true);
    try {
      let shippingAddressId = null;

      if (product.is_physical) {
        if (useSaved && savedAddress) {
          shippingAddressId = savedAddress.id;
        } else {
          // Save new address as default
          // First unset existing defaults
          await supabase
            .from("shipping_addresses")
            .update({ is_default: false } as any)
            .eq("user_id", user.id);

          const { data: newAddr, error: addrErr } = await supabase
            .from("shipping_addresses")
            .insert({
              user_id: user.id,
              full_name: form.fullName,
              phone: form.phone,
              country: form.country,
              city: form.city,
              address_line: form.addressLine,
              postal_code: form.postalCode || null,
              is_default: true,
            } as any)
            .select()
            .single();

          if (addrErr) throw addrErr;
          shippingAddressId = newAddr.id;
        }
      }

      // Check wallet balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (!wallet || Number(wallet.balance) < product.price) {
        toast.error("Solde insuffisant. Veuillez recharger votre portefeuille.");
        setLoading(false);
        return;
      }

      // Create order - get company_id from product
      const { data: prodData } = await supabase
        .from("products")
        .select("company_id")
        .eq("id", product.id)
        .single();

      if (!prodData) throw new Error("Produit introuvable");

      const { error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          product_id: product.id,
          company_id: prodData.company_id,
          shipping_address_id: shippingAddressId,
          total_price: product.price,
          status: "pending",
        } as any);

      if (orderErr) throw orderErr;

      toast.success("Commande passée avec succès !");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'achat");
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-gradient-purple flex items-center gap-2">
            <ShoppingBag size={20} /> Acheter
          </DialogTitle>
          <DialogDescription>
            {product.name} — {companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <p className="font-display text-sm font-bold">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.description}</p>
            </div>
            <span className="font-display text-sm font-bold text-primary">
              {product.price.toLocaleString()} FCFA
            </span>
          </div>

          {product.is_physical && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-display">
                <Truck size={16} className="text-primary" />
                <span>Adresse de livraison</span>
              </div>

              {savedAddress && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={useSaved}
                    onCheckedChange={(v) => {
                      setUseSaved(!!v);
                      if (v) {
                        setForm({
                          fullName: savedAddress.full_name,
                          phone: savedAddress.phone,
                          country: savedAddress.country,
                          city: savedAddress.city,
                          addressLine: savedAddress.address_line,
                          postalCode: savedAddress.postal_code || "",
                        });
                      }
                    }}
                  />
                  <span className="text-xs text-muted-foreground">Utiliser l'adresse enregistrée</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Nom complet *</Label>
                  <Input value={form.fullName} onChange={(e) => update("fullName", e.target.value)}
                    placeholder="Nom complet" className="mt-1 text-sm bg-input border-border"
                    disabled={useSaved} />
                </div>
                <div>
                  <Label className="text-xs">Téléphone *</Label>
                  <Input value={form.phone} onChange={(e) => update("phone", e.target.value)}
                    placeholder="+225..." className="mt-1 text-sm bg-input border-border"
                    disabled={useSaved} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Pays *</Label>
                  <Input value={form.country} onChange={(e) => update("country", e.target.value)}
                    placeholder="Pays" className="mt-1 text-sm bg-input border-border"
                    disabled={useSaved} />
                </div>
                <div>
                  <Label className="text-xs">Ville *</Label>
                  <Input value={form.city} onChange={(e) => update("city", e.target.value)}
                    placeholder="Ville" className="mt-1 text-sm bg-input border-border"
                    disabled={useSaved} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Adresse complète *</Label>
                <Input value={form.addressLine} onChange={(e) => update("addressLine", e.target.value)}
                  placeholder="Rue, quartier, repère..." className="mt-1 text-sm bg-input border-border"
                  disabled={useSaved} />
              </div>
              <div>
                <Label className="text-xs">Code postal</Label>
                <Input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)}
                  placeholder="Optionnel" className="mt-1 text-sm bg-input border-border"
                  disabled={useSaved} />
              </div>
            </div>
          )}

          <Button onClick={handlePurchase} disabled={loading}
            className="w-full bg-gradient-purple text-primary-foreground font-display font-bold hover:opacity-90 glow-purple">
            {loading ? "Traitement..." : `Payer ${product.price.toLocaleString()} FCFA`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;
