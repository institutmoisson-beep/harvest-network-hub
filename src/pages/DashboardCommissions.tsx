import { useEffect, useState } from "react";
import { TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DashboardCommissions = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const { data } = await supabase.from("commissions").select("*").eq("user_id", uid).order("created_at", { ascending: false });
      if (data) {
        setCommissions(data);
        setTotal(data.reduce((s, c) => s + Number(c.amount), 0));

        const sourceIds = [...new Set(data.map(c => c.source_user_id).filter(Boolean))];
        if (sourceIds.length > 0) {
          const { data: profs } = await supabase.from("profiles").select("id, first_name, last_name, referral_code").in("id", sourceIds);
          const pMap: Record<string, any> = {};
          profs?.forEach(p => { pMap[p.id] = p; });
          setProfiles(pMap);
        }
      }
    };
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
        <TrendingUp size={24} className="text-secondary" /> Mes Commissions
      </h1>

      <div className="glass-card rounded-xl p-6 mb-6">
        <DollarSign size={24} className="text-green-500 mb-2" />
        <p className="font-display text-3xl font-bold text-gradient-gold">{total.toLocaleString()} FCFA</p>
        <p className="text-xs text-muted-foreground mt-1">Total des commissions reçues</p>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-sm font-bold mb-4">Historique des Commissions</h3>
        {commissions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <TrendingUp size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucune commission pour le moment</p>
            <p className="text-xs mt-1">Invitez des filleuls qui achètent un pack pour gagner des commissions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {commissions.map(c => {
              const source = c.source_user_id ? profiles[c.source_user_id] : null;
              return (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div>
                    <p className="text-sm font-display font-bold">Commission Niveau {c.level}</p>
                    <p className="text-xs text-muted-foreground">
                      {source ? `De: ${source.first_name} ${source.last_name} (${source.referral_code})` : "Filleul"}
                      {" • "}{new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                  </div>
                  <p className="text-sm font-bold text-green-500">+{Number(c.amount).toLocaleString()} FCFA</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCommissions;
