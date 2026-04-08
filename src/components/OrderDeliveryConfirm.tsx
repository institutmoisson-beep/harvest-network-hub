import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, CheckCircle, Share2 } from "lucide-react";

interface OrderDeliveryConfirmProps {
  order: { id: string; product_name: string; company_name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
}

const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
  <div>
    <p className="text-xs font-display font-bold mb-1">{label}</p>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} onClick={() => onChange(s)} className="transition-transform hover:scale-110">
          <Star size={20} className={s <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} />
        </button>
      ))}
    </div>
  </div>
);

const OrderDeliveryConfirm = ({ order, open, onOpenChange, onConfirmed }: OrderDeliveryConfirmProps) => {
  const [productRating, setProductRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      // Update order to delivered
      await supabase.from("orders").update({ status: "delivered" as any, updated_at: new Date().toISOString() }).eq("id", order.id);

      // Save rating
      await supabase.from("order_ratings").insert({
        order_id: order.id, user_id: user.id,
        product_rating: productRating, delivery_rating: deliveryRating,
        comment: comment || null,
      });

      toast.success("Livraison confirmée ! Merci pour votre avis.");
      setConfirmed(true);
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const shareOnSocial = (platform: string) => {
    if (!order) return;
    const text = `Je viens de recevoir mon pack "${order.product_name}" de ${order.company_name} via Institut Moisson ! ⭐${productRating}/5`;
    const url = window.location.origin;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    const links: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    };
    window.open(links[platform], "_blank");
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-gradient-gold flex items-center gap-2">
            <CheckCircle size={20} /> Confirmer la livraison
          </DialogTitle>
          <DialogDescription>{order.product_name}</DialogDescription>
        </DialogHeader>

        {!confirmed ? (
          <div className="space-y-4">
            <StarRating value={productRating} onChange={setProductRating} label="Note du produit" />
            <StarRating value={deliveryRating} onChange={setDeliveryRating} label="Note de la livraison" />
            <div>
              <p className="text-xs font-display font-bold mb-1">Commentaire (optionnel)</p>
              <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Votre avis..." className="bg-input border-border text-sm" rows={3} />
            </div>
            <Button onClick={handleConfirm} disabled={loading} className="w-full bg-gradient-gold text-secondary-foreground font-display font-bold hover:opacity-90 glow-gold">
              {loading ? "Envoi..." : "✅ Confirmer la réception"}
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4 py-4">
            <CheckCircle size={48} className="mx-auto text-green-500" />
            <p className="font-display font-bold text-sm">Merci pour votre avis !</p>
            <p className="text-xs text-muted-foreground">Partagez votre expérience</p>
            <div className="flex justify-center gap-3">
              <Button size="sm" variant="outline" onClick={() => shareOnSocial("whatsapp")} className="text-xs">
                <Share2 size={14} className="mr-1" /> WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={() => shareOnSocial("facebook")} className="text-xs">
                <Share2 size={14} className="mr-1" /> Facebook
              </Button>
              <Button size="sm" variant="outline" onClick={() => shareOnSocial("twitter")} className="text-xs">
                <Share2 size={14} className="mr-1" /> Twitter
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { onConfirmed(); onOpenChange(false); }} className="text-xs mt-2">Fermer</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDeliveryConfirm;
