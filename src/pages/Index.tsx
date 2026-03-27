import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroBg from "@/assets/hero-bg.jpg";
import { Wheat, Users, TrendingUp, Shield, Sparkles, Globe, ArrowRight } from "lucide-react";

const careerLevels = [
  { level: 1, name: "Semeur", icon: "🌱", desc: "Inscription et premier achat" },
  { level: 2, name: "Cultivateur", icon: "🌿", desc: "3 filleuls directs actifs" },
  { level: 3, name: "Jardinier", icon: "🌻", desc: "10 filleuls réseau" },
  { level: 4, name: "Récolteur", icon: "🌾", desc: "30 filleuls réseau" },
  { level: 5, name: "Moissonneur", icon: "⚡", desc: "100 filleuls réseau" },
  { level: 6, name: "Maître Moissonneur", icon: "👑", desc: "300 filleuls réseau" },
  { level: 7, name: "Stratège Moisson", icon: "🔮", desc: "700 filleuls réseau" },
  { level: 8, name: "Architecte Moisson", icon: "🏛️", desc: "1500 filleuls réseau" },
  { level: 9, name: "Visionnaire Moisson", icon: "🌟", desc: "3000 filleuls réseau" },
  { level: 10, name: "Guide Moissonneur", icon: "🏆", desc: "5000+ filleuls réseau" },
];

const features = [
  { icon: Users, title: "Réseau Binaire & Unilevel", desc: "Double système de rémunération pour maximiser vos gains." },
  { icon: TrendingUp, title: "10 Niveaux de Carrière", desc: "De Semeur à Guide Moissonneur — votre ascension commence ici." },
  { icon: Shield, title: "Wallet Sécurisé", desc: "Gérez vos fonds en toute sécurité avec recharges et retraits." },
  { icon: Globe, title: "Entreprises Partenaires", desc: "Accédez à un annuaire de stands et produits des partenaires." },
  { icon: Sparkles, title: "Commissions Automatiques", desc: "Activez votre système et gagnez sur chaque vente du réseau." },
  { icon: Wheat, title: "Communauté Moisson", desc: "Rejoignez une famille de visionnaires qui bâtissent ensemble." },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />

        <div className="relative z-10 container mx-auto px-4 text-center pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary/30 bg-secondary/10 mb-6">
            <Wheat size={16} className="text-secondary" />
            <span className="text-xs font-display uppercase tracking-widest text-secondary">Bienvenue chez les Moissonneurs</span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            <span className="text-gradient-gold">Institut</span>{" "}
            <span className="text-gradient-purple">Moisson</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-4 font-body">
            Rejoignez la communauté des Moissonneurs. Ensemble, nous créons, finançons et récoltons le meilleur de demain.
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8">
            Spirituels, scientifiques, penseurs, technocrates, informaticiens — tout le monde peut devenir Moissonneur.
            Nous ne laissons jamais personne derrière, nous bâtissons ensemble.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-gold text-secondary-foreground font-display font-bold text-sm px-8 hover:opacity-90 glow-gold transition-all">
                Devenir Moissonneur <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
            <Link to="/directory">
              <Button size="lg" variant="outline" className="font-display text-sm border-primary/50 text-foreground hover:bg-primary/10">
                Explorer les Stands
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              La Vision des <span className="text-gradient-gold">Moissonneurs</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Les Moissonneurs forment une communauté unie, solidaire et ambitieuse.
              S'inscrire sur Institut Moisson, c'est appartenir à une famille qui s'entraide en toute circonstance,
              crée des projets ensemble et finance des activités pour un avenir meilleur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="glass-card rounded-xl p-6 hover:glow-purple transition-all duration-500 group">
                <div className="w-12 h-12 rounded-lg bg-gradient-purple flex items-center justify-center mb-4 group-hover:glow-purple transition-all">
                  <f.icon size={24} className="text-primary-foreground" />
                </div>
                <h3 className="font-display text-sm font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Path Section */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Plan de <span className="text-gradient-purple">Carrière</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              10 niveaux d'excellence pour atteindre le rang suprême de Guide Moissonneur.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {careerLevels.map((c) => (
              <div key={c.level} className="glass-card rounded-xl p-4 text-center hover:glow-gold transition-all duration-300 group">
                <span className="text-3xl mb-2 block">{c.icon}</span>
                <div className="font-display text-xs font-bold text-secondary mb-1">Niv. {c.level}</div>
                <div className="font-display text-xs font-semibold mb-1">{c.name}</div>
                <div className="text-[10px] text-muted-foreground">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-purple opacity-10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Prêt à <span className="text-gradient-gold">Moissonner</span> ?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Inscrivez-vous maintenant et rejoignez des milliers de Moissonneurs qui construisent l'avenir ensemble.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-gradient-gold text-secondary-foreground font-display font-bold px-10 hover:opacity-90 glow-gold">
              S'inscrire Maintenant <ArrowRight className="ml-2" size={18} />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
