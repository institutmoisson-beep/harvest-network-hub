import { useState, useEffect } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Copy, ExternalLink, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DashboardWallet = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Recharge form
  const [rechargeForm, setRechargeForm] = useState({
    amount: "",
    transactionRef: "",
    transactionDate: "",
    contact: "",
    operator: "",
  });

  // Withdraw form
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    service: "",
    contact: "",
    withdrawalAddress: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [walletRes, txRes, pmRes] = await Promise.all([
      supabase.from("wallets").select("balance").eq("user_id", user.id).single(),
      supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("payment_methods").select("*").eq("is_active", true),
    ]);

    if (walletRes.data) setBalance(Number(walletRes.data.balance));
    if (txRes.data) setTransactions(txRes.data);
    if (pmRes.data) setPaymentMethods(pmRes.data);
    setLoading(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copié !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRecharge = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (!rechargeForm.amount || !rechargeForm.transactionRef || !rechargeForm.contact || !rechargeForm.operator) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      type: "recharge" as const,
      amount: parseFloat(rechargeForm.amount),
      transaction_ref: rechargeForm.transactionRef,
      transaction_date: rechargeForm.transactionDate || null,
      contact: rechargeForm.contact,
      operator: rechargeForm.operator,
      status: "pending" as const,
    });

    setSubmitting(false);
    if (error) {
      toast.error("Erreur: " + error.message);
    } else {
      toast.success("Demande de recharge envoyée ! En attente de validation.");
      setRechargeOpen(false);
      setRechargeForm({ amount: "", transactionRef: "", transactionDate: "", contact: "", operator: "" });
      loadData();
    }
  };

  const handleWithdraw = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (!withdrawForm.amount || !withdrawForm.service || !withdrawForm.contact) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (parseFloat(withdrawForm.amount) > balance) {
      toast.error("Solde insuffisant");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      type: "retrait" as const,
      amount: parseFloat(withdrawForm.amount),
      service: withdrawForm.service,
      contact: withdrawForm.contact,
      withdrawal_address: withdrawForm.withdrawalAddress || null,
      notes: withdrawForm.notes || null,
      status: "pending" as const,
    });

    setSubmitting(false);
    if (error) {
      toast.error("Erreur: " + error.message);
    } else {
      toast.success("Demande de retrait envoyée ! En attente de validation.");
      setWithdrawOpen(false);
      setWithdrawForm({ amount: "", service: "", contact: "", withdrawalAddress: "", notes: "" });
      loadData();
    }
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "text-green-400";
    if (s === "rejected") return "text-red-400";
    return "text-yellow-400";
  };

  const statusLabel = (s: string) => {
    if (s === "approved") return "Approuvé";
    if (s === "rejected") return "Rejeté";
    return "En attente";
  };

  const typeLabel = (t: string) => {
    if (t === "recharge") return "Recharge";
    if (t === "retrait") return "Retrait";
    if (t === "achat") return "Achat";
    if (t === "commission") return "Commission";
    return t;
  };

  return (
    <div className="p-6">
      <h1 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
        <Wallet size={24} className="text-secondary" /> Mon Portefeuille
      </h1>

      {/* Balance */}
      <div className="glass-card rounded-2xl p-8 mb-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-gold opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <p className="text-sm text-muted-foreground mb-2">Solde disponible</p>
        <p className="font-display text-4xl font-black text-gradient-gold">
          {loading ? "..." : `${balance.toLocaleString()} FCFA`}
        </p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button onClick={() => setRechargeOpen(true)}
            className="bg-gradient-purple font-display text-xs hover:opacity-90 glow-purple">
            <ArrowDownLeft size={16} className="mr-1" /> Recharger
          </Button>
          <Button onClick={() => setWithdrawOpen(true)} variant="outline"
            className="font-display text-xs border-secondary/50 text-foreground hover:bg-secondary/10">
            <ArrowUpRight size={16} className="mr-1" /> Retirer
          </Button>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-sm font-bold mb-4 flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" /> Historique des Transactions
        </h3>
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Wallet size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucune transaction pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div>
                  <p className="text-sm font-display font-bold">{typeLabel(tx.type)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString("fr-FR")}
                    {tx.operator && ` • ${tx.operator}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.type === "recharge" || tx.type === "commission" ? "text-green-400" : "text-red-400"}`}>
                    {tx.type === "recharge" || tx.type === "commission" ? "+" : "-"}{Number(tx.amount).toLocaleString()} FCFA
                  </p>
                  <p className={`text-xs font-semibold ${statusColor(tx.status)}`}>{statusLabel(tx.status)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recharge Dialog */}
      <Dialog open={rechargeOpen} onOpenChange={setRechargeOpen}>
        <DialogContent className="max-w-md glass-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-gradient-purple flex items-center gap-2">
              <ArrowDownLeft size={20} /> Recharger mon portefeuille
            </DialogTitle>
            <DialogDescription>
              Effectuez d'abord le paiement via l'un des moyens ci-dessous, puis renseignez les détails.
            </DialogDescription>
          </DialogHeader>

          {/* Payment Methods */}
          {paymentMethods.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-display font-bold text-muted-foreground uppercase">Moyens de paiement</p>
              {paymentMethods.map((pm) => (
                <div key={pm.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold font-display">{pm.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{pm.value}</p>
                  </div>
                  {pm.type === "crypto" || pm.type === "mobile_money" || pm.type === "phone" ? (
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(pm.value, pm.id)}
                      className="ml-2 shrink-0 text-xs">
                      {copiedId === pm.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </Button>
                  ) : pm.type === "link" ? (
                    <a href={pm.value} target="_blank" rel="noopener noreferrer"
                      className="ml-2 shrink-0 p-2 rounded-lg hover:bg-muted/50">
                      <ExternalLink size={14} className="text-primary" />
                    </a>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(pm.value, pm.id)}
                      className="ml-2 shrink-0 text-xs">
                      {copiedId === pm.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Montant (FCFA) *</Label>
              <Input type="number" value={rechargeForm.amount}
                onChange={(e) => setRechargeForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="10000" className="mt-1 bg-input border-border text-sm" />
            </div>
            <div>
              <Label className="text-xs">ID de la transaction *</Label>
              <Input value={rechargeForm.transactionRef}
                onChange={(e) => setRechargeForm(p => ({ ...p, transactionRef: e.target.value }))}
                placeholder="Référence de la transaction" className="mt-1 bg-input border-border text-sm" />
            </div>
            <div>
              <Label className="text-xs">Date de la transaction</Label>
              <Input type="date" value={rechargeForm.transactionDate}
                onChange={(e) => setRechargeForm(p => ({ ...p, transactionDate: e.target.value }))}
                className="mt-1 bg-input border-border text-sm" />
            </div>
            <div>
              <Label className="text-xs">Contact / Numéro utilisé *</Label>
              <Input value={rechargeForm.contact}
                onChange={(e) => setRechargeForm(p => ({ ...p, contact: e.target.value }))}
                placeholder="+225 07..." className="mt-1 bg-input border-border text-sm" />
            </div>
            <div>
              <Label className="text-xs">Opérateur *</Label>
              <Input value={rechargeForm.operator}
                onChange={(e) => setRechargeForm(p => ({ ...p, operator: e.target.value }))}
                placeholder="Orange Money, MTN, Wave, Crypto..." className="mt-1 bg-input border-border text-sm" />
            </div>
            <Button onClick={handleRecharge} disabled={submitting}
              className="w-full bg-gradient-purple font-display font-bold hover:opacity-90 glow-purple">
              {submitting ? "Envoi..." : <><Send size={16} className="mr-2" /> Envoyer la demande</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md glass-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-gradient-purple flex items-center gap-2">
              <ArrowUpRight size={20} /> Retirer des fonds
            </DialogTitle>
            <DialogDescription>
              Indiquez le montant et le moyen par lequel vous souhaitez recevoir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Montant (FCFA) *</Label>
              <Input type="number" value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="5000" className="mt-1 bg-input border-border text-sm" />
              <p className="text-xs text-muted-foreground mt-1">Solde: {balance.toLocaleString()} FCFA</p>
            </div>
            <div>
              <Label className="text-xs">Service de réception *</Label>
              <Input value={withdrawForm.service}
                onChange={(e) => setWithdrawForm(p => ({ ...p, service: e.target.value }))}
                placeholder="Orange Money, MTN, Wave, Bitcoin..." className="mt-1 bg-input border-border text-sm" />
            </div>
            <div>
              <Label className="text-xs">Contact / Numéro *</Label>
              <Input value={withdrawForm.contact}
                onChange={(e) => setWithdrawForm(p => ({ ...p, contact: e.target.value }))}
                placeholder="+225 07... ou email" className="mt-1 bg-input border-border text-sm" />
            </div>
            <div>
              <Label className="text-xs">Adresse crypto (si applicable)</Label>
              <Input value={withdrawForm.withdrawalAddress}
                onChange={(e) => setWithdrawForm(p => ({ ...p, withdrawalAddress: e.target.value }))}
                placeholder="0x... ou bc1..." className="mt-1 bg-input border-border text-sm" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input value={withdrawForm.notes}
                onChange={(e) => setWithdrawForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Informations supplémentaires" className="mt-1 bg-input border-border text-sm" />
            </div>
            <Button onClick={handleWithdraw} disabled={submitting}
              className="w-full bg-gradient-purple font-display font-bold hover:opacity-90 glow-purple">
              {submitting ? "Envoi..." : <><Send size={16} className="mr-2" /> Demander le retrait</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardWallet;
