import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Package, ShoppingBag, Truck, Boxes, PackageCheck, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import ShareProductButton from "@/components/ShareProductButton";
import { setPendingRedirect } from "@/lib/pendingRedirect";
import type { ShareProductType } from "@/lib/shareLink";

interface LandingItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image: string | null;
  isPhysical?: boolean;
  activatesSystem?: boolean;
}

const typeConfig: Record<ShareProductType, { icon: LucideIcon; label: string; buyPath: (id: string) => string }> = {
  pack: { icon: Package, label: "Pack MLM", buyPath: (id) => `/packs?open=${id}` },
  wholesale: { icon: Boxes, label: "Produit en gros", buyPath: (id) => `/dashboard/wholesale?open=${id}` },
  distribution: { icon: PackageCheck, label: "Produit de distribution", buyPath: (id) => `/dashboard/distribution?open=${id}` },
};

const ProductLanding = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<LandingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const ref = searchParams.get("ref") || "";
  const productType = (type === "wholesale" || type === "distribution" ? type : "pack") as ShareProductType;
  const config = typeConfig[productType];
  const Icon = config.icon;

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      if (productType === "pack") {
        const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
        if (data) {
          setItem({
            id: data.id,
            name: data.name,
            description: data.description,
            price: Number(data.price),
            currency: data.currency,
            image: data.image_url || (Array.isArray(data.images) && data.images[0]) || null,
            isPhysical: data.is_physical,
            activatesSystem: data.activates_system,
          });
        }
      } else {
        const { data } = await supabase.from("commerce_products").select("*").eq("id", id).maybeSingle();
        if (data) {
          setItem({
            id: data.id,
            name: data.name,
            description: data.description,
            price: Number(data.price),
            currency: data.currency,
            image: (Array.isArray(data.images) && data.images[0]) || null,
          });
        }
      }
      setLoading(false);
    };
    load();
  }, [id, productType]);

  const handleBuy = () => {
    const buyPath = config.buyPath(id || "");
    if (isLoggedIn) {
      navigate(buyPath);
      return;
    }
    setPendingRedirect(buyPath);
    const registerUrl = `/register${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`;
    navigate(registerUrl);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {loading ? (
            <Skeleton className="h-96 rounded-2xl" />
          ) : !item ? (
            <div className="text-center py-24 text-muted-foreground">
              <Icon size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-display text-sm">Ce produit n'est plus disponible.</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="h-64 w-full bg-gradient-purple flex items-center justify-center overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Icon size={64} className="text-primary-foreground/50" />
                )}
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-2">{config.label}</Badge>
                    <h1 className="font-display text-xl font-bold">{item.name}</h1>
                  </div>
                  <ShareProductButton
                    product={{ id: item.id, type: productType, name: item.name, price: item.price, currency: item.currency, image: item.image }}
                    variant="icon"
                  />
                </div>

                {item.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {item.activatesSystem && <Badge className="text-[10px] bg-green-600">Active le MLM</Badge>}
                  {item.isPhysical && <Badge variant="outline" className="text-[10px]"><Truck size={10} className="mr-1" /> Livraison</Badge>}
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
                  <span className="text-xs text-muted-foreground">Prix</span>
                  <span className="font-display text-lg font-black text-primary">{item.price.toLocaleString()} {item.currency}</span>
                </div>

                {ref && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-center text-muted-foreground">
                    Tu es nouveau ? Inscris-toi avec le code d'invitation <strong className="text-primary">{ref}</strong>
                  </div>
                )}

                <Button onClick={handleBuy} className="w-full bg-gradient-purple text-primary-foreground font-display hover:opacity-90 glow-purple">
                  <ShoppingBag size={16} className="mr-2" />
                  {isLoggedIn ? "Acheter maintenant" : "S'inscrire et acheter"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductLanding;
