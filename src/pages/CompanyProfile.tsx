import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, ShoppingBag, Globe, Star } from "lucide-react";

const mockCompanies = [
  { id: 1, name: "TechVision Africa", sector: "Technologie", country: "Côte d'Ivoire", image: "🏢",
    description: "Leader africain en solutions technologiques innovantes pour les entreprises et les particuliers.",
    products: [
      { id: 1, name: "SmartTab Pro", price: 150000, image: "📱", desc: "Tablette haute performance" },
      { id: 2, name: "CloudSync Suite", price: 75000, image: "☁️", desc: "Solution cloud tout-en-un" },
      { id: 3, name: "SecureNet VPN", price: 25000, image: "🔒", desc: "VPN sécurisé pour entreprise" },
    ]},
  { id: 2, name: "GreenHarvest Co.", sector: "Agriculture", country: "Sénégal", image: "🌿",
    description: "Agriculture durable et produits bio pour un avenir vert en Afrique de l'Ouest.",
    products: [
      { id: 4, name: "Pack Bio Premium", price: 45000, image: "🥬", desc: "Panier de légumes bio" },
      { id: 5, name: "Semences Gold", price: 30000, image: "🌱", desc: "Semences certifiées" },
    ]},
  { id: 3, name: "DigiPay Solutions", sector: "Fintech", country: "Cameroun", image: "💳",
    description: "Solutions de paiement digital pour l'Afrique centrale et au-delà.",
    products: [
      { id: 6, name: "DigiWallet Pro", price: 50000, image: "💰", desc: "Portefeuille numérique" },
      { id: 7, name: "MerchantPay", price: 100000, image: "🏪", desc: "Terminal de paiement virtuel" },
    ]},
  { id: 4, name: "SolarWave Energy", sector: "Énergie", country: "Mali", image: "☀️",
    description: "Énergie solaire accessible pour les communautés africaines.",
    products: [
      { id: 8, name: "SolarKit Home", price: 200000, image: "🔋", desc: "Kit solaire domestique" },
      { id: 9, name: "SunLamp Pro", price: 35000, image: "💡", desc: "Lampe solaire rechargeable" },
    ]},
  { id: 5, name: "HealthPlus Labs", sector: "Santé", country: "Gabon", image: "🏥",
    description: "Produits de santé et bien-être certifiés pour toute la famille.",
    products: [
      { id: 10, name: "VitaBoost Complex", price: 18000, image: "💊", desc: "Complément alimentaire" },
      { id: 11, name: "PureSkin Care", price: 22000, image: "🧴", desc: "Soin de peau naturel" },
    ]},
  { id: 6, name: "EduSpark Academy", sector: "Éducation", country: "Burkina Faso", image: "📚",
    description: "Formation en ligne et développement de compétences pour la jeunesse africaine.",
    products: [
      { id: 12, name: "MasterClass Digital", price: 60000, image: "🎓", desc: "Formation complète en ligne" },
      { id: 13, name: "CertifPro Pack", price: 95000, image: "📜", desc: "Pack certification pro" },
    ]},
];

const CompanyProfile = () => {
  const { id } = useParams();
  const company = mockCompanies.find((c) => c.id === Number(id));

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

          {/* Company Header */}
          <div className="glass-card rounded-2xl overflow-hidden mb-8">
            <div className="h-40 bg-gradient-purple flex items-center justify-center text-6xl">
              {company.image}
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="font-display text-xl font-bold mb-2">{company.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin size={14} /> {company.country}</span>
                    <span className="flex items-center gap-1"><ShoppingBag size={14} /> {company.products.length} produits</span>
                  </div>
                </div>
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-display uppercase tracking-wider bg-primary/15 text-primary self-start">
                  {company.sector}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-4">{company.description}</p>
            </div>
          </div>

          {/* Products */}
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary" />
            Produits & Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {company.products.map((product) => (
              <div key={product.id} className="glass-card rounded-xl overflow-hidden hover:glow-purple transition-all duration-300 group">
                <div className="h-28 bg-gradient-card flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                  {product.image}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-sm font-bold mb-1">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{product.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-primary">{product.price.toLocaleString()} FCFA</span>
                    <Button size="sm" className="bg-gradient-purple text-primary-foreground text-xs hover:opacity-90">
                      Acheter
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CompanyProfile;
