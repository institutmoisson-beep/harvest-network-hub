import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sprout, Download, ArrowLeft, Search } from "lucide-react";
import { openInvestmentDoc } from "@/utils/generateInvestmentDoc";

const DashboardInvestments = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      const { data: prof } = await supabase.from("profiles")
        .select("first_name,last_name,referral_code,phone,id_moissonneur").eq("id", session.user.id).maybeSingle();
      setProfile({ ...prof, email: session.user.email });
      const { data } = await supabase
        .from("moisson_community_investments")
        .select("id, operation_id, investment_date, shares_purchased, total_amount_invested, available_before, moisson_projects(id,title,category,total_shares,share_price)")
        .eq("user_id", session.user.id)
        .order("investment_date", { ascending: false });
      setRows((data as any[]) || []);
      setLoading(false);
    })();
  }, [navigate]);

  const download = (r: any) => {
    const proj = r.moisson_projects;
    const pct = proj?.total_shares ? (r.shares_purchased / proj.total_shares) * 100 : 0;
    openInvestmentDoc({
      operationId: r.operation_id,
      investmentDate: r.investment_date,
      userName: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Moissonneur",
      userReferralCode: profile?.referral_code || "",
      userIdMoissonneur: profile?.id_moissonneur || "",
      userPhone: profile?.phone || "",
      userEmail: profile?.email || "",
      projectTitle: proj?.title || "—",
      projectCategory: proj?.category,
      totalShares: proj?.total_shares || 0,
      availableBefore: r.available_before ?? (proj?.total_shares || 0),
      sharesPurchased: r.shares_purchased,
      totalAmount: Number(r.total_amount_invested),
      percentageAcquired: pct,
    });
  };

  const filtered = rows.filter(r => {
    const s = q.toLowerCase();
    if (!s) return true;
    return (r.operation_id || "").toLowerCase().includes(s)
      || (r.moisson_projects?.title || "").toLowerCase().includes(s);
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link to="/dashboard/grenier"><Button variant="outline" size="sm" className="mb-4"><ArrowLeft size={14} className="mr-1" /> Retour au Grenier</Button></Link>
      <h1 className="font-display text-2xl font-bold mb-2 flex items-center gap-2"><Sprout size={22} className="text-primary" /> Historique de mes parts</h1>
      <p className="text-sm text-muted-foreground mb-6">Téléchargez à tout moment le reçu de paiement et le titre d'action de propriété communautaire pour chacun de vos investissements.</p>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher par projet ou identifiant (MS-RECP-...)" className="pl-9 bg-input border-border text-sm" />
      </div>

      <Card className="glass-card p-0 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Aucune part achetée pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Projet</th>
                  <th className="text-right p-3">Parts</th>
                  <th className="text-right p-3">Montant</th>
                  <th className="text-right p-3">% acquis</th>
                  <th className="text-left p-3">Identifiant</th>
                  <th className="text-right p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const proj = r.moisson_projects;
                  const pct = proj?.total_shares ? ((r.shares_purchased / proj.total_shares) * 100) : 0;
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/10">
                      <td className="p-3 text-xs">{new Date(r.investment_date).toLocaleString("fr-FR")}</td>
                      <td className="p-3">{proj?.title || "—"}</td>
                      <td className="p-3 text-right font-mono">{r.shares_purchased}</td>
                      <td className="p-3 text-right font-mono">{Number(r.total_amount_invested).toLocaleString()} FCFA</td>
                      <td className="p-3 text-right font-mono">{pct.toFixed(3).replace(/\.?0+$/, "")}%</td>
                      <td className="p-3"><code className="text-xs">{r.operation_id}</code></td>
                      <td className="p-3 text-right">
                        <Button size="sm" onClick={() => download(r)} className="bg-gradient-gold text-secondary-foreground text-xs">
                          <Download size={12} className="mr-1" /> Titre & Reçu
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DashboardInvestments;