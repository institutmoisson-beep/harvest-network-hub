import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroBg from "@/assets/hero-bg.jpg";
import { Wheat, Users, TrendingUp, Shield, Sparkles, Globe, ArrowRight, Heart, Handshake, Lightbulb } from "lucide-react";

const values = [
  { icon: Handshake, title: "Solidarité Africaine", desc: "Nous sommes une famille. Les Moissonneurs s'entraident en toute circonstance et ne laissent jamais personne derrière." },
  { icon: Users, title: "Réseau Puissant", desc: "Double système binaire & unilevel pour maximiser vos gains à travers un réseau solide et infini." },
  { icon: Heart, title: "Communauté Unie", desc: "Spirituels, scientifiques, penseurs, informaticiens — tous unis pour créer et financer ensemble." },
  { icon: Lightbulb, title: "Innovation & Vision", desc: "Nous finançons des projets ambitieux, créons des activités ensemble pour un avenir meilleur." },
  { icon: Shield, title: "Wallet Sécurisé", desc: "Gérez vos fonds en toute sécurité avec recharges, retraits et historique complet." },
  { icon: Globe, title: "Stands Partenaires", desc: "Accédez aux entreprises partenaires, achetez leurs produits et activez votre système." },
];

const testimonials = [
  { name: "Aminata K.", country: "Côte d'Ivoire", text: "Les Moissonneurs m'ont donné la force de créer mon avenir. Une famille extraordinaire !", icon: "🌍" },
  { name: "Ousmane D.", country: "Sénégal", text: "Grâce à l'Institut Moisson, j'ai pu développer mon réseau et générer des revenus stables.", icon: "🌾" },
  { name: "Fatou B.", country: "Cameroun", text: "L'entraide ici est réelle. On ne marche jamais seul quand on est Moissonneur.", icon: "✨" },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />

        <div className="relative z-10 container mx-auto px-4 text-center pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-6">
            <Wheat size={16} className="text-primary" />
            <span className="text-xs font-display uppercase tracking-widest text-primary">Bienvenue chez les Moissonneurs</span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            <span className="text-gradient-gold">Institut</span>{" "}
            <span className="text-gradient-purple">Moisson</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-4 font-body">
            Rejoignez la communauté des Moissonneurs. Ensemble, nous créons, finançons et récoltons le meilleur de demain.
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8">
            Une grande famille africaine de visionnaires — spirituels, scientifiques, penseurs, informaticiens.
            Nous bâtissons ensemble, nous n'abandonnons jamais l'autre.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-purple text-primary-foreground font-display font-bold text-sm px-8 hover:opacity-90 glow-purple transition-all">
                Devenir Moissonneur <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
            <Link to="/directory">
              <Button size="lg" variant="outline" className="font-display text-sm border-primary/40 text-foreground hover:bg-primary/10">
                Explorer les Stands
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Vision Section with African pattern */}
      <section className="py-24 relative african-pattern">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-4">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-display uppercase tracking-widest text-primary">Notre Vision</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              L'Esprit des <span className="text-gradient-purple">Moissonneurs</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Les Moissonneurs forment une communauté panafricaine unie, solidaire et ambitieuse.
              S'inscrire sur Institut Moisson, c'est appartenir à une famille qui s'entraide,
              crée des projets ensemble et finance un avenir meilleur pour tous.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 hover:glow-purple transition-all duration-500 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-purple flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon size={24} className="text-primary-foreground" />
                </div>
                <h3 className="font-display text-sm font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* African Proverb / Community Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-purple opacity-5" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <span className="text-5xl mb-6 block">🌾</span>
            <blockquote className="font-display text-xl md:text-2xl font-bold mb-4 italic text-foreground/90">
              "Seul on va vite, ensemble on va loin."
            </blockquote>
            <p className="text-muted-foreground text-sm">
              — Proverbe africain qui guide chaque Moissonneur
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 african-pattern">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Paroles de <span className="text-gradient-gold">Moissonneurs</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 hover:glow-gold transition-all duration-300">
                <span className="text-3xl mb-3 block">{t.icon}</span>
                <p className="text-sm text-foreground/80 italic mb-4">"{t.text}"</p>
                <div>
                  <p className="font-display text-xs font-bold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.country}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-purple opacity-5" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="text-4xl mb-4 block">🤝</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Prêt à <span className="text-gradient-purple">Moissonner</span> ?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Inscrivez-vous maintenant et rejoignez des milliers de Moissonneurs qui construisent l'avenir ensemble.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-gradient-purple text-primary-foreground font-display font-bold px-10 hover:opacity-90 glow-purple">
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
