import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import {
  LayoutDashboard, Users, Building2, Wallet, TrendingUp, UserCircle,
  LogOut, Menu, X, ChevronRight, Wheat
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de Bord", path: "/dashboard" },
  { icon: Users, label: "Mon Réseau", path: "/dashboard/network" },
  { icon: Building2, label: "Annuaire Stands", path: "/directory" },
  { icon: Wallet, label: "Portefeuille", path: "/dashboard/wallet" },
  { icon: TrendingUp, label: "Commissions", path: "/dashboard/commissions" },
  { icon: UserCircle, label: "Mon Profil", path: "/dashboard/profile" },
];

const statCards = [
  { label: "Filleuls Directs", value: "0", icon: Users, color: "text-secondary" },
  { label: "Réseau Total", value: "0", icon: TrendingUp, color: "text-primary" },
  { label: "Solde Wallet", value: "0 FCFA", icon: Wallet, color: "text-gold" },
  { label: "Niveau Carrière", value: "Semeur", icon: Wheat, color: "text-secondary" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
      else setUser(session.user);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!user) return null;

  const meta = user.user_metadata || {};

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <img src={logo} alt="Logo" className="h-8 w-8" />
          <span className="font-display text-sm font-bold text-gradient-gold">Institut Moisson</span>
          <button className="lg:hidden ml-auto text-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors group">
              <item.icon size={18} className="group-hover:text-primary transition-colors" />
              {item.label}
              <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full transition-colors">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 glass-card border-b border-border/50 px-4 py-3 flex items-center gap-4">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <h1 className="font-display text-lg font-bold">Tableau de Bord</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">{meta.first_name || "Moissonneur"}</p>
              <p className="text-xs text-muted-foreground">🌱 Semeur</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-purple flex items-center justify-center text-primary-foreground font-display text-xs font-bold">
              {(meta.first_name?.[0] || "M").toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Welcome */}
          <div className="glass-card rounded-2xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-purple opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h2 className="font-display text-xl font-bold mb-1">
              Bienvenue, <span className="text-gradient-gold">{meta.first_name || "Moissonneur"}</span> 👋
            </h2>
            <p className="text-sm text-muted-foreground">
              Votre parcours de Moissonneur commence ici. Explorez votre réseau et développez votre activité.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((s, i) => (
              <div key={i} className="glass-card rounded-xl p-5 hover:glow-purple transition-all">
                <div className="flex items-center justify-between mb-3">
                  <s.icon size={20} className={s.color} />
                </div>
                <p className="font-display text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-display text-sm font-bold mb-4">Actions Rapides</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link to="/directory">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 border-border hover:bg-muted">
                  <Building2 size={20} className="text-primary" />
                  <span className="text-xs">Voir les Stands</span>
                </Button>
              </Link>
              <Link to="/dashboard/wallet">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 border-border hover:bg-muted">
                  <Wallet size={20} className="text-secondary" />
                  <span className="text-xs">Mon Wallet</span>
                </Button>
              </Link>
              <Link to="/dashboard/network">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 border-border hover:bg-muted">
                  <Users size={20} className="text-primary" />
                  <span className="text-xs">Mon Réseau</span>
                </Button>
              </Link>
              <Link to="/dashboard/profile">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 border-border hover:bg-muted">
                  <UserCircle size={20} className="text-gold" />
                  <span className="text-xs">Mon Profil</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-background/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default Dashboard;
