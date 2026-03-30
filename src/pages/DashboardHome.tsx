import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Wallet, Wheat, Building2, UserCircle, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DashboardHome = () => {
  const [meta, setMeta] = useState<any>({});
  const [stats, setStats] = useState({ directs: 0, network: 0, balance: 0, level: "semeur", commissions: 0 });

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setMeta(session.user.user_metadata || {});
      const uid = session.user.id;

      const [walletRes, directsRes, profileRes, commRes] = await Promise.all([
        supabase.from("wallets").select("balance").eq("user_id", uid).single(),
        supabase.from("network").select("id").eq("sponsor_id", uid),
        supabase.from("profiles").select("career_level").eq("id", uid).single(),
        supabase.from("commissions").select("amount").eq("user_id", uid),
      ]);

      const totalComm = commRes.data?.reduce((s, c) => s + Number(c.amount), 0) || 0;

      setStats({
        balance: Number(walletRes.data?.balance || 0),
        directs: directsRes.data?.length || 0,
        network: directsRes.data?.length || 0,
        level: profileRes.data?.career_level || "semeur",
        commissions: totalComm,
      });
    };
    load();
  }, []);

  const levelLabels: Record<string, string> = {
    semeur: "🌱 Semeur", cultivateur: "🌿 Cultivateur", jardinier: "🌾 Moissonneur",
    recolteur: "🏕 Guide de Champ", fermier: "⚔️ Maître Moissonneur", maitre_fermier: "👑 Grand Moissonneur",
    intendant: "🌟 Intendant", sage_moissonneur: "💎 Sage Moissonneur",
    grand_moissonneur: "🏆 Grand Moissonneur Suprême", guide_moissonneur: "🔱 Guide Moissonneur",
  };

  return (
    <div className="p-6">
      <div className="glass-card rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-purple opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <h2 className="font-display text-xl font-bold mb-1">
          Bienvenue, <span className="text-gradient-gold">{meta.first_name || "Moissonneur"}</span> 👋
        </h2>
        <p className="text-sm text-muted-foreground">Unis pour prospérer & protéger</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Filleuls Directs", value: String(stats.directs), icon: Users, color: "text-secondary" },
          { label: "Solde Wallet", value: `${stats.balance.toLocaleString()} FCFA`, icon: Wallet, color: "text-primary" },
          { label: "Total Commissions", value: `${stats.commissions.toLocaleString()} FCFA`, icon: TrendingUp, color: "text-green-500" },
          { label: "Niveau Carrière", value: levelLabels[stats.level] || stats.level, icon: Wheat, color: "text-primary" },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-xl p-4 hover:glow-purple transition-all">
            <s.icon size={18} className={s.color} />
            <p className="font-display text-lg font-bold mt-2">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-sm font-bold mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: "/directory", icon: Building2, label: "Stands", color: "text-primary" },
            { to: "/dashboard/wallet", icon: Wallet, label: "Portefeuille", color: "text-secondary" },
            { to: "/dashboard/network", icon: Users, label: "Mon Réseau", color: "text-primary" },
            { to: "/dashboard/profile", icon: UserCircle, label: "Mon Profil", color: "text-primary" },
          ].map(a => (
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
