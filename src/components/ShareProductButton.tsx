import { useEffect, useState } from "react";
import { Share2, Copy, Check, MessageCircle, Instagram, Youtube, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { buildShareMessage, buildShareUrl, ShareableProduct } from "@/lib/shareLink";

interface ShareProductButtonProps {
  product: ShareableProduct;
  /** "icon" for a compact square button in a card, "full" for a labelled button. */
  variant?: "icon" | "full";
  className?: string;
}

const ShareProductButton = ({ product, variant = "icon", className }: ShareProductButtonProps) => {
  const [open, setOpen] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!cancelled && prof?.referral_code) setReferralCode(prof.referral_code);
    })();
    return () => { cancelled = true; };
  }, [open]);

  const shareUrl = buildShareUrl(product, referralCode);
  const shareMessage = buildShareMessage(product, referralCode);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier automatiquement, copiez le texte manuellement");
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareMessage}\n${shareUrl}`)}`, "_blank");
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  // Instagram, TikTok and YouTube don't support pre-filled share text via a web
  // URL, so we copy the caption + link and open the app so the user can paste it
  // (e.g. into a story, bio link or comment).
  const shareToAppByCopy = async (appUrl: string, appName: string) => {
    await copyToClipboard(`${shareMessage}\n${shareUrl}`, `Message copié ! Collez-le dans ${appName}`);
    window.open(appUrl, "_blank");
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: shareMessage, url: shareUrl });
      } catch {
        /* user cancelled */
      }
    } else {
      copyToClipboard(`${shareMessage}\n${shareUrl}`, "Message et lien copiés");
    }
  };

  return (
    <>
      <Button
        type="button"
        size={variant === "icon" ? "icon" : "sm"}
        variant="outline"
        className={className || (variant === "icon" ? "shrink-0" : "font-display text-xs")}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="Partager"
      >
        <Share2 size={14} className={variant === "full" ? "mr-1" : ""} />
        {variant === "full" && "Partager"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md glass-card border-border" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="font-display text-gradient-gold flex items-center gap-2">
              <Share2 size={18} /> Partager {product.name}
            </DialogTitle>
            <DialogDescription>
              Faites la promotion de ce {product.type === "pack" ? "pack" : "produit"} sur vos réseaux.
              {referralCode ? " Votre code de parrainage sera inclus dans le lien." : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {product.image && (
              <div className="h-32 rounded-xl overflow-hidden border border-border">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
            )}

            {referralCode && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
                "Tu es nouveau ? Inscris-toi avec mon code d'invitation : <strong className="text-primary">{referralCode}</strong>"
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Button type="button" onClick={shareWhatsApp} className="flex-col h-16 gap-1 bg-green-600 hover:bg-green-700 text-white text-[11px] font-display">
                <MessageCircle size={18} /> WhatsApp
              </Button>
              <Button type="button" onClick={shareFacebook} className="flex-col h-16 gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-display">
                <Share2 size={18} /> Facebook
              </Button>
              <Button type="button" onClick={() => shareToAppByCopy("https://www.instagram.com/", "Instagram")} className="flex-col h-16 gap-1 bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-600 hover:opacity-90 text-white text-[11px] font-display">
                <Instagram size={18} /> Instagram
              </Button>
              <Button type="button" onClick={() => shareToAppByCopy("https://www.tiktok.com/upload", "TikTok")} className="flex-col h-16 gap-1 bg-black hover:bg-neutral-800 text-white text-[11px] font-display">
                <span className="text-lg leading-none font-bold">♪</span> TikTok
              </Button>
              <Button type="button" onClick={() => shareToAppByCopy("https://www.youtube.com/", "YouTube")} className="flex-col h-16 gap-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-display">
                <Youtube size={18} /> YouTube
              </Button>
              <Button type="button" onClick={nativeShare} variant="outline" className="flex-col h-16 gap-1 text-[11px] font-display">
                <MoreHorizontal size={18} /> Autres
              </Button>
            </div>

            <div>
              <Label className="text-xs">Lien du produit {referralCode ? "(avec votre code)" : ""}</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={shareUrl} readOnly className="bg-input border-border text-xs" />
                <button
                  type="button"
                  onClick={() => copyToClipboard(shareUrl, "Lien copié !")}
                  className="p-2 rounded-md hover:bg-primary/10 text-primary shrink-0"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              {!referralCode && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Connectez-vous pour inclure automatiquement votre code de parrainage dans ce lien.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareProductButton;
