import { useEffect, useState } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import {
  LayoutDashboard, Users, Building2, Wallet, TrendingUp, UserCircle,
  LogOut, Menu, X, ChevronRight, Shield, Package, DollarSign, MessageCircle, Handshake
} from "lucide-react";

const baseMenuItems = [
  { icon: LayoutDashboard, label: "Tableau de Bord", path: "/dashboard" },
  { icon: Users, label: "Mon Réseau", path: "/dashboard/network" },
  { icon: Building2, label: "Annuaire Stands", path: "/directory" },
  { icon: Wallet, label: "Portefeuille", path: "/dashboard/wallet" },
  { icon: TrendingUp, label: "Commissions", path: "/dashboard/commissions" },
  { icon: UserCircle, label: "Mon Profil", path: "/dashboard/profile" },
];

const roleMenuItems: Record<string, { icon: any; label: string; path: string }> = {
  admin: { icon: Shield, label: "Administration", path: "/admin" },
  pack_manager: { icon: Package, label: "Gestion Packs", path: "/staff/packs" },
  financier: { icon: DollarSign, label: "Gestion Finance", path: "/staff/finance" },
  partner_manager: { icon: Handshake, label: "Gestion Partenaires", path: "/staff/partners" },
  communication: { icon: MessageCircle, label: "Communication", path: "/staff/communication" },
};

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuItems, setMenuItems] = useState(baseMenuItems);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const setupUser = async (session: any) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      // Fetch roles
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      const extras: typeof baseMenuItems = [];
      roles?.forEach(r => {
        const item = roleMenuItems[r.role];
        if (item) extras.push(item);
      });
      setMenuItems([...baseMenuItems, ...extras]);
      // Fetch profile
      const { data: prof } = await supabase.from("profiles").select("first_name, last_name, career_level").eq("id", session.user.id).single();
      if (prof) setProfile(prof);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setupUser(session));
    supabase.auth.getSession().then(({ data: { session } }) => setupUser(session));
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!user) return null;
  const displayName = profile?.first_name || user.user_metadata?.first_name || "Moissonneur";
  const careerLevel = profile?.career_level || "semeur";

  return (
    <div className="min-h-screen flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <img src={logo} alt="Logo" className="h-8 w-8" />
          <span className="font-display text-sm font-bold text-gradient-gold">Institut Moisson</span>
          <button className="lg:hidden ml-auto text-foreground" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group ${active ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <item.icon size={18} className={active ? "text-primary" : "group-hover:text-primary transition-colors"} />
                {item.label}
                <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full transition-colors">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 glass-card border-b border-border/50 px-4 py-3 flex items-center gap-4">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
          <Link to="/dashboard/profile" className="ml-auto flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="text-right">
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-muted-foreground">🌱 {careerLevel}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-purple flex items-center justify-center text-primary-foreground font-display text-xs font-bold">
              {displayName[0]?.toUpperCase() || "M"}
            </div>
          </Link>
        </header>
        <Outlet />
      </main>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-background/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default DashboardLayout;
