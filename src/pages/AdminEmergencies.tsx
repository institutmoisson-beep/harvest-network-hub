import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Siren, MessageCircle, ArrowUpRight, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EmergencyChat from "@/components/EmergencyChat";

const STATUSES = [
  { v: "open", l: "Ouverte" },
  { v: "in_progress", l: "En cours" },
  { v: "resolved", l: "Résolue" },
  { v: "rejected", l: "Rejetée" },
];

const AdminEmergencies = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [list, setList] = useState<any[]>([]);
  const [fundBalance, setFundBalance] = useState(0);
  const [chatId, setChatId] = useState<string | null>(null);
  const [withdrawFor, setWithdrawFor] = useState<any>(null);
  const [withdraw, setWithdraw] = useState({ amount: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUserId(user.id);
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const admin = roles?.some(r => r.role === "admin") || false;
      setIsAdmin(admin);
      setChecking(false);
      if (!admin) return;
      load();
    })();
  }, [navigate]);

  const load = async () => {
    const [eRes, fRes] = await Promise.all([
      supabase.rpc("list_emergencies_for_admin"),
      supabase.from("community_fund").select("balance").limit(1).maybeSingle(),
    ]);
    if (eRes.data) setList(eRes.data);
    if (fRes.data) setFundBalance(Number(fRes.data.balance));
  };

  const updateStatus = async (id: string, status: string, note?: string) => {
    const { error } = await supabase.from("emergencies").update({ status: status as any, admin_note: note ?? undefined, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Mis à jour");
    load();
  };

  const executeWithdraw = async () => {
    const amt = parseFloat(withdraw.amount);
    if (!amt || amt <= 0) { toast.error("Montant invalide"); return; }
    if (!withdraw.reason.trim()) { toast.error("Motif requis"); return; }
    setSubmitting(true);
    const { error } = await supabase.rpc("withdraw_from_fund", { _amount: amt, _reason: withdraw.reason, _emergency_id: withdrawFor?.id });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Retrait de ${amt.toLocaleString()} FCFA effectué`);
    setWithdrawFor(null); setWithdraw({ amount: "", reason: "" });
    load();
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Vérification...</div>;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-destructive">Accès refusé</div>;

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
        <Siren size={28} className="text-destructive" /> Centre d'urgences
      </h1>

      <div className="glass-card rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HeartHandshake size={24} className="text-secondary" />
          <div>
            <p className="text-xs text-muted-foreground">Fonds disponible</p>
            <p className="font-display text-xl font-bold text-gradient-gold">{fundBalance.toLocaleString()} FCFA</p>
          </div>
        </div>
        <Button onClick={() => setWithdrawFor({ id: null })} className="bg-gradient-purple text-xs">
          <ArrowUpRight size={14} className="mr-1" /> Retrait du fonds
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center text-muted-foreground">
          <p className="text-sm">Aucune urgence à traiter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(e => (
            <div key={e.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-sm">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.first_name} {e.last_name} ({e.referral_code})
                  </p>
                  <p className="text-xs mt-2 whitespace-pre-wrap">{e.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted">{e.frequency}</span>
                    {e.amount_requested && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">{Number(e.amount_requested).toLocaleString()} FCFA</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <select value={e.status} onChange={ev => updateStatus(e.id, ev.target.value)}
                    className="bg-input border border-border rounded-md text-xs p-1.5">
                    {STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                  <Button size="sm" variant="outline" onClick={() => setChatId(e.id)} className="text-xs">
                    <MessageCircle size={12} className="mr-1" /> Chat
                  </Button>
                  <Button size="sm" onClick={() => setWithdrawFor(e)} className="bg-gradient-gold text-secondary-foreground text-xs">
                    <HeartHandshake size={12} className="mr-1" /> Aider
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{new Date(e.created_at).toLocaleString("fr-FR")}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!chatId} onOpenChange={(o) => !o && setChatId(null)}>
        <DialogContent className="max-w-lg glass-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><MessageCircle size={18} /> Discussion</DialogTitle>
            <DialogDescription>Échange en temps réel avec l'utilisateur.</DialogDescription>
          </DialogHeader>
          {chatId && userId && <EmergencyChat emergencyId={chatId} currentUserId={userId} isAdmin={true} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!withdrawFor} onOpenChange={(o) => !o && setWithdrawFor(null)}>
        <DialogContent className="max-w-md glass-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><ArrowUpRight size={18} /> Retrait du fonds</DialogTitle>
            <DialogDescription>
              Le motif sera visible publiquement par tous les utilisateurs.
              {withdrawFor?.title && <> Lié à : « {withdrawFor.title} »</>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Montant (FCFA) *</Label><Input type="number" value={withdraw.amount} onChange={e => setWithdraw(p => ({ ...p, amount: e.target.value }))} className="mt-1 bg-input text-sm" /><p className="text-[10px] text-muted-foreground mt-1">Solde : {fundBalance.toLocaleString()} FCFA</p></div>
            <div><Label className="text-xs">Motif (public) *</Label><Textarea value={withdraw.reason} onChange={e => setWithdraw(p => ({ ...p, reason: e.target.value }))} rows={3} className="mt-1 bg-input text-sm" placeholder="Ex: Aide médicale d'urgence pour..." /></div>
            <Button onClick={executeWithdraw} disabled={submitting} className="w-full bg-gradient-purple font-display font-bold">
              {submitting ? "Traitement..." : "Confirmer le retrait"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmergencies;