import { useEffect, useState } from "react";
import { HeartHandshake, Send, ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CommunityFund = () => {
  const [fundBalance, setFundBalance] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [txs, setTxs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const [fundRes, txRes, walletRes] = await Promise.all([
      supabase.from("community_fund").select("balance").limit(1).maybeSingle(),
      supabase.from("community_fund_transactions").select("*").order("created_at", { ascending: false }).limit(100),
      user ? supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null } as any),
    ]);
    if (fundRes.data) setFundBalance(Number(fundRes.data.balance));
    if (walletRes.data) setWalletBalance(Number(walletRes.data.balance));
    if (txRes.data) {
      setTxs(txRes.data);
      const ids = [...new Set(txRes.data.map((t: any) => t.user_id || t.admin_id).filter(Boolean))];
      if (ids.length) {
        const { data: profs } = await supabase.rpc("get_public_profiles", { _ids: ids });
        const m: Record<string, any> = {};
        profs?.forEach((p: any) => { m[p.id] = p; });
        setProfiles(m);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("community-fund")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_fund_transactions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_fund" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const contribute = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Montant invalide"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("contribute_to_fund", { _amount: amt });
    setSubmitting(false);
    if (error) { toast.error(error.message || "Erreur lors de la contribution"); return; }
    toast.success(`Merci pour votre contribution de ${amt.toLocaleString()} FCFA !`);
    setOpen(false); setAmount("");
    if (data && data[0]) {
      setWalletBalance(Number(data[0].new_wallet_balance));
      setFundBalance(Number(data[0].new_fund_balance));
    }
    load();
  };

  return (
    <div className="p-6">
      <h1 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
        <HeartHandshake size={24} className="text-secondary" /> Fonds Communautaire
      </h1>

      <div className="glass-card rounded-2xl p-8 mb-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-gold opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <p className="text-sm text-muted-foreground mb-2">Solde total du fonds</p>
        <p className="font-display text-4xl font-black text-gradient-gold">
          {loading ? "..." : `${fundBalance.toLocaleString()} FCFA`}
        </p>
        <Button onClick={() => setOpen(true)} className="mt-4 bg-gradient-purple font-display text-xs hover:opacity-90 glow-purple">
          <HeartHandshake size={16} className="mr-1" /> Contribuer
        </Button>
        <p className="text-xs text-muted-foreground mt-2">Votre portefeuille : {walletBalance.toLocaleString()} FCFA</p>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-sm font-bold mb-4 flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" /> Historique public
        </h3>
        {txs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune transaction pour le moment</p>
        ) : (
          <div className="space-y-3">
            {txs.map(tx => {
              const actor = profiles[tx.user_id || tx.admin_id];
              const isContrib = tx.type === "contribution";
              return (
                <div key={tx.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-muted/30">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${isContrib ? "bg-green-500/10" : "bg-red-500/10"}`}>
                      {isContrib ? <ArrowDownLeft size={16} className="text-green-400" /> : <ArrowUpRight size={16} className="text-red-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-display font-bold">
                        {isContrib ? "Contribution" : "Retrait administrateur"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {actor ? `${actor.first_name} ${actor.last_name}` : "Utilisateur"}
                      </p>
                      {!isContrib && tx.reason && (
                        <p className="text-xs text-foreground/80 mt-1 italic">« {tx.reason} »</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(tx.created_at).toLocaleString("fr-FR")}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold shrink-0 ${isContrib ? "text-green-400" : "text-red-400"}`}>
                    {isContrib ? "+" : "-"}{Number(tx.amount).toLocaleString()} FCFA
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md glass-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-gradient-gold flex items-center gap-2">
              <HeartHandshake size={20} /> Contribuer au fonds
            </DialogTitle>
            <DialogDescription>Le montant sera débité de votre portefeuille.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Montant (FCFA) *</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="1000" className="mt-1 bg-input border-border text-sm" />
              <p className="text-xs text-muted-foreground mt-1">Solde : {walletBalance.toLocaleString()} FCFA</p>
            </div>
            <Button onClick={contribute} disabled={submitting} className="w-full bg-gradient-gold text-secondary-foreground font-display font-bold hover:opacity-90 glow-gold">
              {submitting ? "Envoi..." : <><Send size={16} className="mr-2" /> Confirmer</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityFund;