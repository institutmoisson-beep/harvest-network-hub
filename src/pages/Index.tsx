import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroBg from "@/assets/hero-bg.jpg";
import storyUnity from "@/assets/story-unity.jpg";
import storyCollab from "@/assets/story-collab.jpg";
import storyHands from "@/assets/story-hands.jpg";
import storySuccess from "@/assets/story-success.jpg";
import { Wheat, Users, Shield, Sparkles, Globe, ArrowRight, Heart, Handshake, Lightbulb, HeartHandshake, Siren } from "lucide-react";

const values = [
  { icon: Handshake, title: "Solidarité Universelle", desc: "Nous sommes une famille. Les Moissonneurs s'entraident en toute circonstance et ne laissent jamais personne derrière." },
  { icon: Users, title: "Alliance Mondiale", desc: "Des membres connectés partout dans le monde pour partager des ressources, ouvrir des portes et bâtir ensemble." },
  { icon: Heart, title: "Communauté Unie", desc: "Spirituels, scientifiques, penseurs, entrepreneurs et informaticiens — tous rassemblés autour d'une même vision." },
  { icon: Lightbulb, title: "Opportunités Partagées", desc: "Nous transformons les idées en actions concrètes grâce à la mutualisation des talents, des moyens et des contacts." },
  { icon: Shield, title: "Wallet Sécurisé", desc: "Gérez vos fonds en toute sécurité avec recharges, retraits et historique complet." },
  { icon: Globe, title: "Écosystème Vivant", desc: "Découvrez des partenaires, des services, des projets et des opportunités pensés pour faire rayonner les membres." },
];

const testimonials = [
  { name: "Aminata K.", country: "Moissonneuse du monde", text: "Les Moissonneurs m'ont donné la force de créer mon avenir. Une famille extraordinaire !", icon: "🌍" },
  { name: "Ousmane D.", country: "Moissonneur du monde", text: "Grâce à l'Institut Moisson, j'ai rencontré des personnes fiables et découvert de nouvelles opportunités.", icon: "🌾" },
  { name: "Fatou B.", country: "Moissonneuse du monde", text: "L'entraide ici est réelle. On ne marche jamais seul quand on est Moissonneur.", icon: "✨" },
];

const stories = [
  {
    img: storyHands,
    tag: "Solidarité",
    title: "Quand un Moissonneur tombe, dix le relèvent",
    text: "Marie a perdu son emploi du jour au lendemain. En 48h, la communauté a mobilisé le Fonds Communautaire pour couvrir le loyer de sa famille. Aujourd'hui, elle dirige son propre stand.",
  },
  {
    img: storyCollab,
    tag: "Mutualisation",
    title: "Cinq idées, un seul projet financé ensemble",
    text: "Aux quatre coins du monde, des Moissonneurs mettent en commun leurs compétences et leurs portefeuilles pour lancer des projets qui créent de la valeur.",
  },
  {
    img: storyUnity,
    tag: "Opportunités",
    title: "Une famille universelle, sans frontières",
    text: "Les Moissonneurs du monde entier créent des ponts, échangent des contacts, partagent des contrats et ouvrent les portes les uns aux autres.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/55 to-background" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 container mx-auto px-4 text-center pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-6">
            <Wheat size={16} className="text-primary" />
            <span className="text-xs font-display uppercase tracking-widest text-primary">Bienvenue chez les Moissonneurs</span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight animate-float">
            <span className="text-gradient-gold">Institut</span>{" "}
            <span className="text-gradient-purple">Moisson</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-4 font-body">
            Rejoignez la communauté des Moissonneurs. Ensemble, nous créons, finançons et récoltons le meilleur de demain.
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8">
            Une grande famille universelle de visionnaires — créateurs, bâtisseurs, penseurs et professionnels.
            Ici, la solidarité devient une force concrète et personne n'avance seul.
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
              Les Moissonneurs forment une communauté universelle unie, solidaire et ambitieuse.
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

      {/* Stories of mutual aid */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary/30 bg-secondary/10 mb-4">
              <HeartHandshake size={14} className="text-secondary" />
              <span className="text-xs font-display uppercase tracking-widest text-secondary">Élans de Solidarité</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Personne n'est laissé <span className="text-gradient-gold">pour compte</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Chaque jour, des Moissonneurs s'entraident, mutualisent leurs ressources et créent des opportunités ensemble. C'est une culture vivante, visible et inspirante.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stories.map((s, i) => (
              <article key={i} className="group relative glass-card rounded-3xl overflow-hidden hover:glow-purple transition-all duration-500 hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={s.img} alt={s.title} loading="lazy" width={1280} height={832}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-display uppercase tracking-widest bg-secondary/90 text-secondary-foreground">
                    {s.tag}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg font-bold mb-2 leading-snug">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Mutual aid pillars */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-purple opacity-[0.07]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-gold opacity-20 blur-3xl rounded-full" />
              <img src={storySuccess} alt="Moissonneuse" loading="lazy" width={1024} height={1024}
                className="relative rounded-3xl shadow-2xl w-full object-cover" />
              <div className="absolute -bottom-6 -right-6 glass-card rounded-2xl p-4 max-w-[220px] hidden md:block">
                <p className="font-display text-2xl font-black text-gradient-gold">+12 000</p>
                <p className="text-xs text-muted-foreground">Moissonneurs unis à travers le monde</p>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-4">
                <Sparkles size={14} className="text-primary" />
                <span className="text-xs font-display uppercase tracking-widest text-primary">Notre Promesse</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6 leading-tight">
                On fait <span className="text-gradient-purple">rayonner</span> nos membres
              </h2>
              <div className="space-y-5">
                {[
                  { icon: HeartHandshake, t: "Fonds Communautaire", d: "Chaque Moissonneur contribue selon ses moyens. Le fonds soutient ceux qui en ont besoin, en toute transparence." },
                  { icon: Siren, t: "Cellule d'Urgence", d: "Un problème ? Décris ton urgence. Un administrateur discute avec toi et débloque une aide directement depuis le fonds." },
                  { icon: Sparkles, t: "Rayonnement Collectif", d: "Chaque membre apporte sa lumière, reçoit du soutien et participe à une dynamique qui valorise les talents de tous." },
                ].map((p, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-purple flex items-center justify-center group-hover:scale-110 transition-transform glow-purple">
                      <p.icon size={20} className="text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold mb-1">{p.t}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{p.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/register" className="inline-block mt-8">
                <Button size="lg" className="bg-gradient-gold text-secondary-foreground font-display font-bold hover:opacity-90 glow-gold">
                  Rejoindre la famille <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
            </div>
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
