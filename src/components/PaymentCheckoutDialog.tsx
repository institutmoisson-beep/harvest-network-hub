import { useEffect, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  buildPaymentLink,
  defaultPaymentColor,
  paymentMethodColors,
  type Delivery,
  type PaymentDestination,
} from "@/lib/deliveryTypes";

interface PaymentCheckoutDialogProps {
  delivery: Delivery | null;
  onOpenChange: (open: boolean) => void;
  onClaimed: () => void;
}

const PaymentCheckoutDialog = ({ delivery, onOpenChange, onClaimed }: PaymentCheckoutDialogProps) => {
  const [destinations, setDestinations] = useState<PaymentDestination[]>([]);
  const [selected, setSelected] = useState<PaymentDestination | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!delivery) { setSelected(null); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from("payment_destinations")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      setDestinations(data || []);
    })();
  }, [delivery]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copié !");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const openPaymentLink = () => {
    if (!delivery || !selected) return;
    const link = buildPaymentLink(selected, delivery.amount);
    if (selected.method !== "crypto") window.open(link, "_blank");
  };

  const confirmPayment = async () => {
    if (!delivery || !selected) return;
    setSubmitting(true);
    const { error } = await (supabase as any).rpc("client_claim_payment", {
      _delivery_id: delivery.id,
      _payment_method: selected.method,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Impossible de confirmer le paiement");
      return;
    }
    toast.success("Paiement déclaré ! En attente de validation par l'administration.");
    onClaimed();
  };

  if (!delivery) return null;

  return (
    <Dialog open={!!delivery} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-gradient-gold">Paiement de la commande</DialogTitle>
          <DialogDescription>{delivery.product_name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
            <span className="text-xs text-muted-foreground">Montant à payer</span>
            <span className="font-display text-lg font-black text-primary">
              {delivery.amount.toLocaleString()} {delivery.currency}
            </span>
          </div>

          {!selected ? (
            destinations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Aucun moyen de paiement disponible pour le moment.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {destinations.map((d) => (
                  <Button
                    key={d.id}
                    type="button"
                    onClick={() => setSelected(d)}
                    className={`h-14 font-display text-xs text-white ${paymentMethodColors[d.method] || defaultPaymentColor}`}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs text-muted-foreground">{selected.label}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted/50 rounded px-2 py-1.5 truncate">
                    {selected.value}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(selected.value)}
                    className="p-1.5 rounded-md hover:bg-primary/10 text-primary shrink-0"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                {selected.method !== "crypto" && (
                  <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={openPaymentLink}>
                    <ExternalLink size={14} className="mr-1" />
                    {selected.method === "wave" ? "Ouvrir le lien de paiement" : "Composer le code de paiement"}
                  </Button>
                )}
                {selected.method === "crypto" && (
                  <p className="text-[10px] text-muted-foreground">
                    Envoyez exactement {delivery.amount.toLocaleString()} {delivery.currency} en équivalent à l'adresse ci-dessus.
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground flex gap-2">
                <ShieldCheck size={16} className="text-primary shrink-0" />
                Une fois le paiement effectué auprès du livreur, confirmez ci-dessous. L'administration validera la réception avant la remise du colis.
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setSelected(null)}>
                  Changer
                </Button>
                <Button type="button" onClick={confirmPayment} disabled={submitting} className="flex-1 bg-gradient-purple text-primary-foreground glow-purple">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} className="mr-1" /> J'ai payé</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentCheckoutDialog;
