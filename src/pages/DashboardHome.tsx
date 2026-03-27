import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Wallet, Wheat, Building2, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const statCards = [
  { label: "Filleuls Directs", value: "0", icon: Users, color: "text-secondary" },
  { label: "Réseau Total", value: "0", icon: TrendingUp, color: "text-primary" },
  { label: "Solde Wallet", value: "0 FCFA", icon: Wallet, color: "text-gold" },
  { label: "Niveau Carrière", value: "Semeur", icon: Wheat, color: "text-secondary" },
];

const DashboardHome = () => {
  const [meta, setMeta] = useState<any>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setMeta(session.user.user_metadata || {});
    });
  }, []);

  return (
    <div className="p-6">
      <div className="glass-card rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-purple opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <h2 className="font-display text-xl font-bold mb-1">
          Bienvenue, <span className="text-gradient-gold">{meta.first_name || "Moissonneur"}</span> 👋
        </h2>
        <p className="text-sm text-muted-foreground">
          Votre parcours de Moissonneur commence ici. Explorez votre réseau et développez votre activité.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <div key={i} className="glass-card rounded-xl p-5 hover:glow-purple transition-all">
            <s.icon size={20} className={s.color} />
            <p className="font-display text-xl font-bold mt-3">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-sm font-bold mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: "/directory", icon: Building2, label: "Voir les Stands", color: "text-primary" },
            { to: "/dashboard/wallet", icon: Wallet, label: "Mon Wallet", color: "text-secondary" },
            { to: "/dashboard/network", icon: Users, label: "Mon Réseau", color: "text-primary" },
            { to: "/dashboard/profile", icon: UserCircle, label: "Mon Profil", color: "text-gold" },
          ].map((a) => (
            <Link key={a.to} to={a.to}>
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 border-border hover:bg-muted">
                <a.icon size={20} className={a.color} />
                <span className="text-xs">{a.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
