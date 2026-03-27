import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Building2, Search, MapPin, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const mockCompanies = [
  { id: 1, name: "TechVision Africa", sector: "Technologie", country: "Côte d'Ivoire", products: 12, image: "🏢" },
  { id: 2, name: "GreenHarvest Co.", sector: "Agriculture", country: "Sénégal", products: 8, image: "🌿" },
  { id: 3, name: "DigiPay Solutions", sector: "Fintech", country: "Cameroun", products: 5, image: "💳" },
  { id: 4, name: "SolarWave Energy", sector: "Énergie", country: "Mali", products: 15, image: "☀️" },
  { id: 5, name: "HealthPlus Labs", sector: "Santé", country: "Gabon", products: 20, image: "🏥" },
  { id: 6, name: "EduSpark Academy", sector: "Éducation", country: "Burkina Faso", products: 10, image: "📚" },
];

const Directory = () => {
  const [search, setSearch] = useState("");
  const filtered = mockCompanies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.sector.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary/30 bg-secondary/10 mb-4">
              <Building2 size={14} className="text-secondary" />
              <span className="text-xs font-display uppercase tracking-widest text-secondary">Annuaire</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
              <span className="text-gradient-gold">Stands</span> Entreprises Partenaires
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              Découvrez nos entreprises partenaires et leurs produits. Achetez et activez votre système Moissonneur.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-10 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher une entreprise ou un secteur..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input border-border" />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((company) => (
              <div key={company.id}
                className="glass-card rounded-2xl overflow-hidden hover:glow-purple transition-all duration-500 group cursor-pointer">
                <div className="h-32 bg-gradient-purple flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">
                  {company.image}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-sm font-bold mb-2">{company.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {company.country}</span>
                    <span className="flex items-center gap-1"><ShoppingBag size={12} /> {company.products} produits</span>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-display uppercase tracking-wider bg-primary/20 text-primary">
                    {company.sector}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
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
