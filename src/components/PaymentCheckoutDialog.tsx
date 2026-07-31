import { useState } from "react";
import { CheckCircle2, Copy, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  buildPaymentLink,
  paymentDestinations,
  paymentMethods,
  type Delivery,
  type PaymentMethod,
} from "@/lib/deliveryTypes";

interface PaymentCheckoutDialogProps {
  delivery: Delivery | null;
  onOpenChange: (open: boolean) => void;
  onClaimed: () => void;
}

const PaymentCheckoutDialog = ({ delivery, onOpenChange, onClaimed }: PaymentCheckoutDialogProps) => {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copié !");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const openPaymentLink = (m: PaymentMethod) => {
    if (!delivery) return;
    const link = buildPaymentLink(m, delivery);
    if (m !== "crypto") window.open(link, "_blank");
  };

  const confirmPayment = async () => {
    if (!delivery || !method) return;
    setSubmitting(true);
    const { error } = await (supabase as any).rpc("client_claim_payment", {
      _delivery_id: delivery.id,
      _payment_method: method,
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

          {!method ? (
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((pm) => (
                <Button
                  key={pm.id}
                  type="button"
                  onClick={() => setMethod(pm.id)}
                  className={`h-14 font-display text-xs text-white ${pm.color}`}
                >
                  {pm.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs text-muted-foreground">{paymentDestinations[method].label}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted/50 rounded px-2 py-1.5 truncate">
                    {paymentDestinations[method].value}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(paymentDestinations[method].value)}
                    className="p-1.5 rounded-md hover:bg-primary/10 text-primary shrink-0"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                {method !== "crypto" && (
                  <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={() => openPaymentLink(method)}>
                    <ExternalLink size={14} className="mr-1" />
                    {method === "wave" ? "Ouvrir le lien de paiement Wave" : "Composer le code de paiement"}
                  </Button>
                )}
                {method === "crypto" && (
                  <p className="text-[10px] text-muted-foreground">
                    Envoyez exactement {delivery.amount.toLocaleString()} {delivery.currency} en équivalent USDT (réseau TRC20) à l'adresse ci-dessus.
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground flex gap-2">
                <ShieldCheck size={16} className="text-primary shrink-0" />
                Une fois le paiement effectué auprès du livreur, confirmez ci-dessous. L'administration validera la réception avant la remise du colis.
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setMethod(null)}>
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
