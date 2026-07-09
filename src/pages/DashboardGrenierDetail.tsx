import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Sprout, TrendingUp, Calendar, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import { openInvestmentDoc } from "@/utils/generateInvestmentDoc";

const DashboardGrenierDetail = () => {
  const { selectedCurrency, formatConverted } = useCurrency();
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [shares, setShares] = useState(1);
  const [payOpen, setPayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cguAccepted, setCguAccepted] = useState<boolean | null>(null);

  const load = async () => {
    const [{ data }, { data: { user } }] = await Promise.all([
      supabase.from("moisson_projects").select("*").eq("id", id).maybeSingle(),
      supabase.auth.getUser(),
    ]);
    setProject(data);
    if (user) {
      const { data: prof } = await supabase.from("profiles").select("cgu_accepted").eq("id", user.id).maybeSingle();
      setCguAccepted(!!prof?.cgu_accepted);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (!project) return <div className="p-6"><p className="text-sm text-muted-foreground">Chargement…</p></div>;

  const remaining = project.total_shares - project.shares_sold;
  const pct = project.total_shares > 0 ? Math.round((project.shares_sold / project.total_shares) * 100) : 0;
  const total = shares * Number(project.share_price);
  const estGain = total * (Number(project.estimated_roi) / 100);

  const invest = async () => {
    if (cguAccepted === false) {
      toast.error("Veuillez accepter les CGU dans votre profil avant d'investir dans Le Grenier.");
      navigate("/dashboard/profile");
      return;
    }
    setSubmitting(true);
    const availableBefore = project.total_shares - project.shares_sold;
    const { data: rpcData, error } = await (supabase as any).rpc("invest_in_project", {
      _project_id: id, _shares: shares, _payment_method: "wallet",
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const operationId = row?.operation_id;
    toast.success(`Investissement validé ! Reçu ${operationId || ""}`);
    setPayOpen(false);
    await load();

    // Auto-generate combined receipt + property title
    if (operationId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase.from("profiles")
          .select("first_name,last_name,referral_code,phone,id_moissonneur").eq("id", user.id).maybeSingle();
        openInvestmentDoc({
          operationId,
          investmentDate: new Date().toISOString(),
          userName: `${prof?.first_name || ""} ${prof?.last_name || ""}`.trim() || "Moissonneur",
          userReferralCode: prof?.referral_code || "",
          userIdMoissonneur: (prof as any)?.id_moissonneur || "",
          userPhone: prof?.phone || user.email || "",
          userEmail: user.email || "",
          projectTitle: project.title,
          projectCategory: project.category,
          totalShares: project.total_shares,
          availableBefore,
          sharesPurchased: shares,
          totalAmount: total,
          percentageAcquired: (shares / project.total_shares) * 100,
        });
      }
    }
  };

  const feed: any[] = Array.isArray(project.update_feed) ? project.update_feed : [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/dashboard/grenier"><Button variant="outline" size="sm" className="mb-4"><ArrowLeft size={14} className="mr-1" /> Retour au Grenier</Button></Link>

      {project.cover_image && (
        <div className="h-64 rounded-xl bg-cover bg-center mb-6" style={{ backgroundImage: `url(${project.cover_image})` }} />
      )}
      {Array.isArray(project.gallery_images) && project.gallery_images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {project.gallery_images.map((url: string, i: number) => (
            <a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} alt="" className="h-24 w-full object-cover rounded-md border border-border" /></a>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <Badge variant="secondary">{project.category}</Badge>
        <Badge className="bg-secondary text-secondary-foreground flex items-center gap-1"><TrendingUp size={12} />~{project.estimated_roi}% ROI estimé</Badge>
        <Badge variant="outline" className="capitalize">{project.status}</Badge>
      </div>
      <h1 className="font-display text-2xl font-bold mb-3">{project.title}</h1>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-6">{project.description}</p>

      <Card className="glass-card p-5 mb-6">
        <div className="flex justify-between text-xs mb-2">
          <span>{project.shares_sold.toLocaleString()} / {project.total_shares.toLocaleString()} parts vendues</span>
          <span className="text-primary font-bold">{pct}%</span>
        </div>
        <Progress value={pct} className="h-3" />
        <p className="text-xs text-muted-foreground mt-2">Objectif global : <strong className="text-foreground">{Number(project.global_target).toLocaleString()} FCFA</strong></p>
      </Card>

      {project.status === "collecte" && remaining > 0 && (
        <Card className="glass-card p-5 mb-6">
          <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Sprout size={16} className="text-secondary" /> Simulateur d'investissement</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span>Nombre de parts</span>
                <span className="font-bold text-primary">{shares} part{shares > 1 ? "s" : ""}</span>
              </div>
              <Slider value={[shares]} onValueChange={(v) => setShares(v[0])} min={1} max={Math.min(remaining, 500)} step={1} />
              <Input type="number" min={1} max={remaining} value={shares} onChange={e => setShares(Math.min(remaining, Math.max(1, Number(e.target.value) || 1)))} className="mt-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground">Montant total</p>
                <p className="font-display font-bold text-lg">{total.toLocaleString()} FCFA</p>
                {selectedCurrency !== "XOF" && <p className="text-[10px] text-muted-foreground">≈ {formatConverted(total)}</p>}
              </div>
              <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/30">
                <p className="text-xs text-muted-foreground">Gain estimé</p>
                <p className="font-display font-bold text-lg text-secondary">+{estGain.toLocaleString()} FCFA</p>
              </div>
            </div>
            {cguAccepted === false && (
              <p className="text-xs rounded-lg border border-primary/20 bg-primary/5 p-3 text-muted-foreground">Acceptez les CGU dans votre profil pour activer l’investissement dans Le Grenier.</p>
            )}
            <Button onClick={() => cguAccepted === false ? navigate("/dashboard/profile") : setPayOpen(true)} className="w-full bg-gradient-purple text-primary-foreground font-display font-bold">
              <Wallet size={16} className="mr-2" /> Soutenir ce projet via le GIE
            </Button>
          </div>
        </Card>
      )}

      <Card className="glass-card p-5">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Calendar size={16} className="text-primary" /> Journal de Bord</h3>
        {feed.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune mise à jour pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {feed.slice().reverse().map((u, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border">
                <div className="flex justify-between items-start mb-1">
                  <strong className="text-sm">{u.title || (u.type === "payout" ? "Distribution de dividendes" : "Mise à jour")}</strong>
                  <span className="text-[10px] text-muted-foreground">{u.date ? new Date(u.date).toLocaleDateString("fr-FR") : ""}</span>
                </div>
                {u.image && <img src={u.image} alt="" className="rounded-md max-h-40 mb-2" />}
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{u.content || u.note || (u.revenue && `Revenus distribués : ${Number(u.revenue).toLocaleString()} FCFA à ${u.investors} investisseur(s)`) || ""}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle>Confirmer l'investissement</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p>Vous allez acquérir <strong>{shares} part{shares > 1 ? "s" : ""}</strong> du projet <strong>{project.title}</strong> pour un total de <strong className="text-primary">{total.toLocaleString()} FCFA</strong>{selectedCurrency !== "XOF" && <span className="text-muted-foreground"> (≈ {formatConverted(total)})</span>}.</p>
          <p className="text-xs rounded-lg bg-muted/30 border border-border p-3">Paiement uniquement via votre <strong>Portefeuille interne</strong>. Rechargez votre wallet si nécessaire.</p>
            <Button onClick={invest} disabled={submitting} className="w-full bg-gradient-gold text-secondary-foreground font-display font-bold">
              {submitting ? "Traitement…" : "Confirmer & investir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardGrenierDetail;
