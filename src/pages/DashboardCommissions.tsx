import { useEffect, useState } from "react";
import { TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";

const DashboardCommissions = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const { selectedCurrency, formatConverted } = useCurrency();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      // Commissions issues des packs
      const { data: packComm } = await supabase.from("commissions").select("*").eq("user_id", uid).order("created_at", { ascending: false });

      // Commissions issues des commandes hors-catalogue (historique multi-niveaux MLM)
      const { data: customComm } = await supabase
        .from("custom_order_commissions")
        .select("*, custom_orders(product_name)")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      const merged = [
        ...(packComm || []).map(c => ({ ...c, source: "pack" as const })),
        ...(customComm || []).map(c => ({
          id: c.id,
          created_at: c.created_at,
          level: c.level_depth,
          amount: c.amount,
          description: c.custom_orders?.product_name ? `Commande hors-catalogue: ${c.custom_orders.product_name}` : "Commande hors-catalogue",
          source: "custom_order" as const,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setCommissions(merged);
      setTotal(merged.reduce((s, c) => s + Number(c.amount), 0));

      const sourceIds = [...new Set((packComm || []).map(c => c.source_user_id).filter(Boolean))];
      if (sourceIds.length > 0) {
        const { data: profs } = await supabase.rpc("get_public_profiles", { _ids: sourceIds });
        const pMap: Record<string, any> = {};
        profs?.forEach(p => { pMap[p.id] = p; });
        setProfiles(pMap);
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
        {selectedCurrency !== "XOF" && <p className="text-xs text-muted-foreground">≈ {formatConverted(total)}</p>}
        <p className="text-xs text-muted-foreground mt-1">Total des commissions reçues (packs + commandes hors-catalogue)</p>
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
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-500">+{Number(c.amount).toLocaleString()} FCFA</p>
                    {selectedCurrency !== "XOF" && (
                      <p className="text-[10px] text-muted-foreground">≈ {formatConverted(Number(c.amount))}</p>
                    )}
                  </div>
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
