import { useEffect, useState } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import {
  LayoutDashboard, Users, Building2, Wallet, TrendingUp, UserCircle,
  LogOut, Menu, X, ChevronRight, Shield, Package, DollarSign, MessageCircle, Handshake, Download, ShoppingBag, Boxes, PackageCheck, HeartHandshake, Siren, MapPin, Truck, Globe, Globe2, Radio, Trophy, Sprout, IdCard, ScanLine
} from "lucide-react";

const baseMenuItems = [
  { icon: LayoutDashboard, label: "Tableau de Bord", path: "/dashboard" },
  { icon: Package, label: "Packs MLM", path: "/dashboard/packs" },
  { icon: Boxes, label: "Produits en gros", path: "/dashboard/wholesale" },
  { icon: PackageCheck, label: "Distribution", path: "/dashboard/distribution" },
  { icon: ShoppingBag, label: "Mes Commandes", path: "/dashboard/orders" },
  { icon: Users, label: "Mon Réseau", path: "/dashboard/network" },
  { icon: Building2, label: "Annuaire Stands", path: "/directory" },
  { icon: Wallet, label: "Portefeuille", path: "/dashboard/wallet" },
  { icon: HeartHandshake, label: "Fonds Communautaire", path: "/dashboard/fonds" },
  { icon: Siren, label: "Mes Urgences", path: "/dashboard/urgences" },
  { icon: Radio, label: "Canal Communauté", path: "/dashboard/canal" },
  { icon: Sprout, label: "Le Grenier", path: "/dashboard/grenier" },
    { icon: Sprout, label: "Mes Parts", path: "/dashboard/investments" },
  { icon: IdCard, label: "Ma Carte Moissonneur", path: "/dashboard/carte" },
  { icon: ScanLine, label: "Vérificateur Communauté", path: "/dashboard/scanner" },
  { icon: Download, label: "Télécharger l'app", path: "/telecharger-app" },
  { icon: TrendingUp, label: "Commissions", path: "/dashboard/commissions" },
  { icon: UserCircle, label: "Mon Profil", path: "/dashboard/profile" },
];

const roleMenuItems: Record<string, { icon: any; label: string; path: string }[]> = {
  admin: [
    { icon: Shield, label: "Administration", path: "/admin" },
    { icon: Radio, label: "Canal de diffusion", path: "/admin/broadcasts" },
    { icon: Trophy, label: "Plan de Carrière", path: "/admin/career" },
    { icon: Trophy, label: "Attribution Carrière", path: "/staff/career" },
    { icon: Sprout, label: "Orchestration Grenier", path: "/admin/grenier" },
    { icon: Shield, label: "Vérifier Titres GIE", path: "/admin/verify-invest" },
    { icon: Shield, label: "Vérifier Identités", path: "/admin/identities" },
    { icon: Boxes, label: "Gestion Commerce", path: "/staff/commerce" },
    { icon: Siren, label: "Centre d'urgences", path: "/admin/urgences" },
    { icon: Shield, label: "Gestion des rôles", path: "/admin/roles" },
    { icon: MapPin, label: "Points de relais", path: "/admin/relays" },
    { icon: Users, label: "Ressources Humaines", path: "/staff/hr" },
    { icon: Truck, label: "Gestion Livraison", path: "/staff/delivery" },
  ],
  pack_manager: [{ icon: Package, label: "Gestion Packs", path: "/staff/packs" }, { icon: Boxes, label: "Gestion Commerce", path: "/staff/commerce" }],
  financier: [{ icon: DollarSign, label: "Gestion Finance", path: "/staff/finance" }, { icon: Boxes, label: "Gestion Commerce", path: "/staff/commerce" }],
  partner_manager: [{ icon: Handshake, label: "Gestion Partenaires", path: "/staff/partners" }, { icon: Boxes, label: "Gestion Commerce", path: "/staff/commerce" }],
  communication: [{ icon: MessageCircle, label: "Communication", path: "/staff/communication" }],
  zone_harvester: [{ icon: Globe2, label: "Moissonneur de Zone", path: "/staff/zone" }],
  country_harvester: [{ icon: Globe, label: "Moissonneur de Pays", path: "/staff/country" }],
  city_harvester: [{ icon: MapPin, label: "Moissonneur de Ville", path: "/staff/city" }],
  emergency_admin: [{ icon: Siren, label: "Centre d'urgences", path: "/admin/urgences" }],
  hr_manager: [{ icon: Users, label: "Ressources Humaines", path: "/staff/hr" }],
  delivery_manager: [{ icon: Truck, label: "Gestion Livraison", path: "/staff/delivery" }, { icon: MapPin, label: "Points de relais", path: "/admin/relays" }],
  career_manager: [{ icon: Trophy, label: "Plan de Carrière", path: "/staff/career" }],
  identity_verifier: [{ icon: Shield, label: "Vérifier Identités", path: "/admin/identities" }],
  title_verifier: [{ icon: Shield, label: "Vérifier Titres GIE", path: "/admin/verify-invest" }],
  grenier_manager: [{ icon: Sprout, label: "Orchestration Grenier", path: "/admin/grenier" }],
};

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuItems, setMenuItems] = useState(baseMenuItems);
  const [profile, setProfile] = useState<any>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let loadedFor: string | null = null;

    const loadExtras = async (uid: string) => {
      if (loadedFor === uid) return;
      loadedFor = uid;
      const [{ data: roles }, { data: prof }, { data: unreadCount }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("first_name, last_name, career_level, cgu_accepted").eq("id", uid).maybeSingle(),
        (supabase as any).rpc("count_unread_broadcasts"),
      ]);
      if (cancelled) return;
      setUnread(typeof unreadCount === "number" ? unreadCount : 0);
      const extras: typeof baseMenuItems = [];
      roles?.forEach(r => {
        roleMenuItems[r.role]?.forEach(item => {
          if (!extras.some(existing => existing.path === item.path)) extras.push(item);
        });
      });
      setMenuItems([...baseMenuItems, ...extras]);
      if (prof) setProfile(prof);
    };

    const handleSession = (session: any) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      // Defer Supabase calls outside the auth callback to avoid deadlocks
      setTimeout(() => { if (!cancelled) loadExtras(session.user.id); }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => handleSession(session));
    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));
    return () => { cancelled = true; subscription.unsubscribe(); };
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
            const showBadge = item.path === "/dashboard/canal" && unread > 0;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group ${active ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <item.icon size={18} className={active ? "text-primary" : "group-hover:text-primary transition-colors"} />
                {item.label}
                {showBadge && <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">{unread}</span>}
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
