import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Building2, Search, MapPin, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Directory = () => {
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("companies")
        .select("*, products(id)")
        .eq("is_active", true);
      setCompanies(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.sector.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-4">
              <Building2 size={14} className="text-primary" />
              <span className="text-xs font-display uppercase tracking-widest text-primary">Annuaire</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
              <span className="text-gradient-purple">Stands</span> Entreprises Partenaires
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              Découvrez nos entreprises partenaires et leurs produits. Cliquez sur un stand pour voir le profil et les produits.
            </p>
          </div>

          <div className="max-w-md mx-auto mb-10 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher une entreprise ou un secteur..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input border-border" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((company) => (
                <Link key={company.id} to={`/company/${company.id}`}>
                  <div className="glass-card rounded-2xl overflow-hidden hover:glow-purple transition-all duration-500 group cursor-pointer">
                    <div className="h-32 bg-gradient-purple flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : "🏢"}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-sm font-bold mb-2">{company.name}</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {company.country}</span>
                        <span className="flex items-center gap-1"><ShoppingBag size={12} /> {company.products?.length || 0} produits</span>
                      </div>
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-display uppercase tracking-wider bg-primary/15 text-primary">
                        {company.sector}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-display text-sm">Aucune entreprise trouvée</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Directory;
