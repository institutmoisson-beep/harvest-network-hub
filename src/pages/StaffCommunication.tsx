import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Users, Star, Eye } from "lucide-react";
import logo from "@/assets/logo.png";

type Profile = { id: string; first_name: string; last_name: string; email: string; phone: string; country: string; referral_code: string; career_level: string; is_pro_visible: boolean };

const StaffCommunication = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [stats, setStats] = useState({ total: 0, pros: 0, countries: 0 });

  useEffect(() => { checkAccess(); }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    const hasAccess = roles?.some(r => r.role === "admin" || r.role === "communication");
    if (!hasAccess) { navigate("/dashboard"); toast.error("Accès refusé"); return; }
    setAuthorized(true); setLoading(false); loadData();
  };

  const loadData = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) {
      setUsers(data as Profile[]);
      const countries = new Set(data.map((u: any) => u.country).filter(Boolean));
      setStats({ total: data.length, pros: data.filter((u: any) => u.is_pro_visible).length, countries: countries.size });
    }
  };

  const togglePro = async (u: Profile) => {
    await supabase.from("profiles").update({ is_pro_visible: !u.is_pro_visible } as any).eq("id", u.id);
    toast.success(u.is_pro_visible ? "Retiré de l'annuaire" : "Ajouté à l'annuaire");
    loadData();
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} /> <img src={logo} alt="Logo" className="h-7 w-7" />
        </Link>
        <h1 className="font-display text-sm font-bold text-gradient-gold">📢 Communication</h1>
      </header>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4 text-center">
            <Users size={20} className="mx-auto text-primary mb-1" />
            <p className="text-lg font-display font-black">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Membres</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Star size={20} className="mx-auto text-secondary mb-1" />
            <p className="text-lg font-display font-black">{stats.pros}</p>
            <p className="text-[10px] text-muted-foreground">Pros visibles</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <MessageCircle size={20} className="mx-auto text-green-400 mb-1" />
            <p className="text-lg font-display font-black">{stats.countries}</p>
            <p className="text-[10px] text-muted-foreground">Pays</p>
          </div>
        </div>

        <h3 className="font-display text-sm font-bold">Gestion Annuaire Pros & Communication</h3>
        <p className="text-xs text-muted-foreground">Gérez la visibilité des membres dans l'annuaire professionnel et les communications.</p>

        {users.map(u => (
          <div key={u.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="font-display text-sm font-bold">{u.first_name} {u.last_name}</p>
              <p className="text-xs text-muted-foreground">{u.email} • {u.phone}</p>
              <p className="text-xs text-muted-foreground">{u.country} • {u.referral_code}</p>
              <Badge variant="outline" className="text-[10px] mt-1">{u.career_level}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`text-[10px] ${u.is_pro_visible ? "bg-green-600" : "bg-muted text-muted-foreground"}`}>
                {u.is_pro_visible ? "Visible" : "Masqué"}
              </Badge>
              <Button size="sm" variant={u.is_pro_visible ? "destructive" : "default"} className="text-xs h-7" onClick={() => togglePro(u)}>
                <Eye size={12} className="mr-1" /> {u.is_pro_visible ? "Masquer" : "Afficher"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffCommunication;
