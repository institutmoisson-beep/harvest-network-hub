import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import PurchaseDialog from "@/components/PurchaseDialog";
import { ArrowLeft, MapPin, ShoppingBag, Globe, MessageCircle, Facebook, Mail, Clock } from "lucide-react";
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

  if (loading) return (
    <div className="min-h-screen"><Navbar /><div className="pt-24 pb-16 container mx-auto px-4"><Skeleton className="h-40 w-full rounded-2xl mb-4" /><Skeleton className="h-8 w-64 mb-2" /></div><Footer /></div>
  );

  if (!company) return (
    <div className="min-h-screen"><Navbar /><div className="pt-24 pb-16 text-center"><p className="text-muted-foreground">Entreprise introuvable</p><Link to="/directory"><Button variant="outline" className="mt-4">Retour</Button></Link></div><Footer /></div>
  );

  const partnerSince = Math.ceil((Date.now() - new Date(company.created_at).getTime()) / (1000 * 60 * 60 * 24));

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
              {company.banner_url ? <img src={company.banner_url} alt="" className="w-full h-full object-cover" /> : <span className="text-6xl">🏢</span>}
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  {company.logo_url && <img src={company.logo_url} alt={company.name} className="w-16 h-16 rounded-xl object-cover border-2 border-border -mt-12 bg-background" />}
                  <div>
                    <h1 className="font-display text-xl font-bold mb-2">{company.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><MapPin size={14} /> {company.country}</span>
                      <span className="flex items-center gap-1"><ShoppingBag size={14} /> {products.length} produits</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> Partenaire depuis {partnerSince} jours</span>
                    </div>
                  </div>
                </div>
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-display uppercase tracking-wider bg-primary/15 text-primary self-start">
                  {company.sector}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-4">{company.description}</p>

              {/* Contact links */}
              <div className="flex gap-3 mt-4 flex-wrap">
                {company.website_url && (
                  <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Globe size={14} /> Site Web
                  </a>
                )}
                {company.contact_whatsapp && (
                  <a href={`https://wa.me/${company.contact_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-green-500 hover:underline">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
                {company.contact_facebook && (
                  <a href={company.contact_facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                    <Facebook size={14} /> Facebook
                  </a>
                )}
                {company.contact_email && (
                  <a href={`mailto:${company.contact_email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:underline">
                    <Mail size={14} /> {company.contact_email}
                  </a>
                )}
              </div>

              {/* Extra images */}
              {company.image_url_2 && (
                <div className="mt-4">
                  <img src={company.image_url_2} alt="Présentation" className="rounded-xl max-h-48 object-cover" />
                </div>
              )}
            </div>
          </div>

          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary" /> Produits & Packs
          </h2>

          {products.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">Aucun produit disponible.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map(product => (
                <div key={product.id} className="glass-card rounded-xl overflow-hidden hover:glow-purple transition-all duration-300 group">
                  <div className="h-28 bg-gradient-card flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                    {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : "📦"}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-sm font-bold mb-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{product.description}</p>
                    {product.activates_system && <p className="text-[10px] text-green-500 mb-2">✅ Pack d'activation MLM</p>}
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-primary">{Number(product.price).toLocaleString()} {product.currency}</span>
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

      <PurchaseDialog product={selectedProduct} open={purchaseOpen} onOpenChange={setPurchaseOpen} companyName={company.name} />
      <Footer />
    </div>
  );
};

export default CompanyProfile;
