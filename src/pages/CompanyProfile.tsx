import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import PurchaseDialog from "@/components/PurchaseDialog";
import { ArrowLeft, MapPin, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CompanyProfile = () => {
  const { id } = useParams();
  const [company, setCompany] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: comp } = await supabase.from("companies").select("*").eq("id", id).single();
      if (comp) {
        setCompany(comp);
        const { data: prods } = await supabase.from("products").select("*").eq("company_id", id).eq("is_active", true);
        setProducts(prods || []);
      }
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <Skeleton className="h-40 w-full rounded-2xl mb-4" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <p className="text-muted-foreground">Entreprise introuvable</p>
          <Link to="/directory">
            <Button variant="outline" className="mt-4">Retour à l'annuaire</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/directory" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft size={16} /> Retour à l'annuaire
          </Link>

          <div className="glass-card rounded-2xl overflow-hidden mb-8">
            <div className="h-40 bg-gradient-purple flex items-center justify-center">
              {company.banner_url ? (
                <img src={company.banner_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">🏢</span>
              )}
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="font-display text-xl font-bold mb-2">{company.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin size={14} /> {company.country}</span>
                    <span className="flex items-center gap-1"><ShoppingBag size={14} /> {products.length} produits</span>
                  </div>
                </div>
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-display uppercase tracking-wider bg-primary/15 text-primary self-start">
                  {company.sector}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-4">{company.description}</p>
            </div>
          </div>

          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary" />
            Produits & Services
          </h2>

          {products.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">Aucun produit disponible pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => (
                <div key={product.id} className="glass-card rounded-xl overflow-hidden hover:glow-purple transition-all duration-300 group">
                  <div className="h-28 bg-gradient-card flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : "📦"}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-sm font-bold mb-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-primary">
                        {Number(product.price).toLocaleString()} {product.currency}
                      </span>
                      <Button size="sm" className="bg-gradient-purple text-primary-foreground text-xs hover:opacity-90"
                        onClick={() => { setSelectedProduct(product); setPurchaseOpen(true); }}>
                        Acheter
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PurchaseDialog
        product={selectedProduct}
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        companyName={company.name}
      />

      <Footer />
    </div>
  );
};

export default CompanyProfile;
