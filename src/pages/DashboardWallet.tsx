import { useState, useEffect } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Copy, ExternalLink, Check, Send, Globe, UserCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrencyRates } from "@/hooks/useCurrencyRates";

const DashboardWallet = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { selectedCurrency, setSelectedCurrency, formatConverted, currencies } = useCurrencyRates();
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  const [rechargeForm, setRechargeForm] = useState({ amount: "", transactionRef: "", transactionDate: "", contact: "", operator: "" });
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", service: "", contact: "", withdrawalAddress: "", notes: "" });
  const [transferForm, setTransferForm] = useState({ amount: "", recipientCode: "", notes: "" });
  const [recipientFound, setRecipientFound] = useState<any>(null);
  const [searchingRecipient, setSearchingRecipient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    let active = true;
    let channel: any;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      await loadData();
      channel = supabase
        .channel(`wallet-${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` },
            () => { loadData(); })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${user.id}` },
            () => { loadData(); })
        .subscribe();
    })();
    return () => { active = false; if (channel) supabase.removeChannel(channel); };
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
    if (txRes.data) {
      setTransactions(txRes.data);
      // Load profiles for transfer recipients
      const recipientIds = [...new Set(txRes.data.map((t: any) => t.recipient_id).filter(Boolean))];
      const senderIds = [...new Set(txRes.data.filter((t: any) => t.type === "transfert").map((t: any) => t.user_id))];
      const allIds = [...new Set([...recipientIds, ...senderIds])];
      if (allIds.length > 0) {
        const { data: profs } = await supabase.rpc("get_public_profiles", { _ids: allIds });
        const pMap: Record<string, any> = {};
        profs?.forEach((p: any) => { pMap[p.id] = p; });
        setProfiles(pMap);
      }
    }
    if (pmRes.data) setPaymentMethods(pmRes.data);
    setLoading(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copié !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const searchRecipient = async (code: string) => {
    setTransferForm(p => ({ ...p, recipientCode: code }));
    setRecipientFound(null);
    if (code.length < 4) return;
    setSearchingRecipient(true);
    const { data } = await supabase.rpc("find_profile_by_code", { _code: code.toUpperCase() });
    setRecipientFound(Array.isArray(data) && data.length > 0 ? data[0] : null);
    setSearchingRecipient(false);
  };

  const handleTransfer = async () => {
    if (!recipientFound) { toast.error("Destinataire introuvable"); return; }
    const amount = parseFloat(transferForm.amount);
    if (!amount || amount <= 0) { toast.error("Montant invalide"); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("transfer_to_user", {
        _recipient_code: recipientFound.referral_code,
        _amount: amount,
        _note: transferForm.notes || null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.new_balance != null) setBalance(Number(row.new_balance));
      toast.success(`${amount.toLocaleString()} FCFA envoyés à ${recipientFound.first_name}`);
      setTransferOpen(false);
      setTransferForm({ amount: "", recipientCode: "", notes: "" });
      setRecipientFound(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du transfert");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecharge = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (!rechargeForm.amount || !rechargeForm.transactionRef || !rechargeForm.contact || !rechargeForm.operator) {
      toast.error("Veuillez remplir tous les champs obligatoires"); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("wallet_transactions").insert({
      user_id: user.id, type: "recharge" as const, amount: parseFloat(rechargeForm.amount),
      transaction_ref: rechargeForm.transactionRef, transaction_date: rechargeForm.transactionDate || null,
      contact: rechargeForm.contact, operator: rechargeForm.operator, status: "pending" as const,
    });
    setSubmitting(false);
    if (error) toast.error("Erreur: " + error.message);
    else { toast.success("Demande envoyée !"); setRechargeOpen(false); setRechargeForm({ amount: "", transactionRef: "", transactionDate: "", contact: "", operator: "" }); loadData(); }
  };

  const handleWithdraw = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (!withdrawForm.amount || !withdrawForm.service || !withdrawForm.contact) { toast.error("Champs obligatoires"); return; }
    if (parseFloat(withdrawForm.amount) > balance) { toast.error("Solde insuffisant"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("wallet_transactions").insert({
      user_id: user.id, type: "retrait" as const, amount: parseFloat(withdrawForm.amount),
      service: withdrawForm.service, contact: withdrawForm.contact,
      withdrawal_address: withdrawForm.withdrawalAddress || null, notes: withdrawForm.notes || null, status: "pending" as const,
    });
    setSubmitting(false);
    if (error) toast.error("Erreur: " + error.message);
    else { toast.success("Demande envoyée !"); setWithdrawOpen(false); setWithdrawForm({ amount: "", service: "", contact: "", withdrawalAddress: "", notes: "" }); loadData(); }
  };

  const statusColor = (s: string) => s === "approved" ? "text-green-400" : s === "rejected" ? "text-red-400" : "text-yellow-400";
  const statusLabel = (s: string) => s === "approved" ? "Approuvé" : s === "rejected" ? "Rejeté" : "En attente";
  const typeLabel = (t: string) => t === "recharge" ? "Recharge" : t === "retrait" ? "Retrait" : t === "achat" ? "Achat" : t === "commission" ? "Commission" : t === "transfert" ? "Transfert" : t;

  return (
    <div className="p-6">
      <h1 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
        <Wallet size={24} className="text-secondary" /> Mon Portefeuille
      </h1>

      {/* Balance with currency selector */}
      <div className="glass-card rounded-2xl p-8 mb-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-gold opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <p className="text-sm text-muted-foreground mb-2">Solde disponible</p>
        <p className="font-display text-4xl font-black text-gradient-gold">
          {loading ? "..." : `${balance.toLocaleString()} FCFA`}
        </p>
        {selectedCurrency !== "XOF" && !loading && (
          <p className="text-lg font-display font-bold text-primary mt-1">
            ≈ {formatConverted(balance, selectedCurrency)}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 mt-3">
          <Globe size={14} className="text-muted-foreground" />
          <select value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value)}
            className="bg-input border border-border rounded-lg text-xs p-1.5 text-foreground">
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          <Button onClick={() => setRechargeOpen(true)} className="bg-gradient-purple font-display text-xs hover:opacity-90 glow-purple">
            <ArrowDownLeft size={16} className="mr-1" /> Recharger
          </Button>
          <Button onClick={() => setTransferOpen(true)} className="bg-gradient-gold text-secondary-foreground font-display text-xs hover:opacity-90 glow-gold">
            <UserCheck size={16} className="mr-1" /> Transférer
          </Button>
          <Button onClick={() => setWithdrawOpen(true)} variant="outline" className="font-display text-xs border-secondary/50 text-foreground hover:bg-secondary/10">
            <ArrowUpRight size={16} className="mr-1" /> Retirer
          </Button>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-sm font-bold mb-4 flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" /> Historique
        </h3>
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Wallet size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucune transaction</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => {
              const isIncomingTransfer = tx.type === "transfert" && tx.notes?.startsWith("Transfert reçu");
              const recipientProfile = tx.recipient_id ? profiles[tx.recipient_id] : null;
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div>
                    <p className="text-sm font-display font-bold">{typeLabel(tx.type)}</p>
                    {tx.type === "transfert" && (
                      <p className="text-xs text-muted-foreground">
                        {isIncomingTransfer
                          ? `De: ${recipientProfile ? `${recipientProfile.first_name} ${recipientProfile.last_name}` : "Utilisateur"}`
                          : `À: ${recipientProfile ? `${recipientProfile.first_name} ${recipientProfile.last_name}` : "Utilisateur"}`}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("fr-FR")}{tx.operator && ` • ${tx.operator}`}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === "recharge" || tx.type === "commission" || isIncomingTransfer ? "text-green-400" : "text-red-400"}`}>
                      {tx.type === "recharge" || tx.type === "commission" || isIncomingTransfer ? "+" : "-"}{Number(tx.amount).toLocaleString()} FCFA
                    </p>
                    {selectedCurrency !== "XOF" && (
                      <p className="text-[10px] text-muted-foreground">≈ {formatConverted(Number(tx.amount), selectedCurrency)}</p>
                    )}
                    <p className={`text-xs font-semibold ${statusColor(tx.status)}`}>{statusLabel(tx.status)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-md glass-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-gradient-gold flex items-center gap-2"><UserCheck size={20} /> Transférer</DialogTitle>
            <DialogDescription>Envoyez de l'argent à un autre Moissonneur via son code.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Code Moissonneur du destinataire *</Label>
              <Input value={transferForm.recipientCode} onChange={e => searchRecipient(e.target.value)}
                placeholder="MSN123456" className="mt-1 bg-input border-border text-sm font-mono uppercase" />
              {searchingRecipient && <p className="text-xs text-muted-foreground mt-1">Recherche...</p>}
              {recipientFound && (
                <div className="mt-2 p-2 rounded-lg bg-green-600/10 border border-green-600/30">
                  <p className="text-xs font-bold text-green-400">✅ {recipientFound.first_name} {recipientFound.last_name}</p>
                  <p className="text-[10px] text-muted-foreground">{recipientFound.referral_code}</p>
                </div>
              )}
              {transferForm.recipientCode.length >= 4 && !searchingRecipient && !recipientFound && (
                <p className="text-xs text-destructive mt-1">Aucun utilisateur trouvé avec ce code</p>
              )}
            </div>
            <div>
              <Label className="text-xs">Montant (FCFA) *</Label>
              <Input type="number" value={transferForm.amount} onChange={e => setTransferForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="5000" className="mt-1 bg-input border-border text-sm" />
              <p className="text-xs text-muted-foreground mt-1">Solde: {balance.toLocaleString()} FCFA</p>
            </div>
            <div>
              <Label className="text-xs">Notes (optionnel)</Label>
              <Input value={transferForm.notes} onChange={e => setTransferForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Motif du transfert" className="mt-1 bg-input border-border text-sm" />
            </div>
            <Button onClick={handleTransfer} disabled={submitting || !recipientFound} className="w-full bg-gradient-gold text-secondary-foreground font-display font-bold hover:opacity-90 glow-gold">
              {submitting ? "Envoi..." : <><Send size={16} className="mr-2" /> Envoyer</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recharge Dialog */}
      <Dialog open={rechargeOpen} onOpenChange={setRechargeOpen}>
        <DialogContent className="max-w-md glass-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-gradient-purple flex items-center gap-2"><ArrowDownLeft size={20} /> Recharger</DialogTitle>
            <DialogDescription>Effectuez le paiement puis renseignez les détails.</DialogDescription>
          </DialogHeader>
          {paymentMethods.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-display font-bold text-muted-foreground uppercase">Moyens de paiement</p>
              {paymentMethods.map(pm => (
                <div key={pm.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold font-display">{pm.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{pm.value}</p>
                  </div>
                  {pm.type === "link" ? (
                    <a href={pm.value} target="_blank" rel="noopener noreferrer" className="ml-2 shrink-0 p-2 rounded-lg hover:bg-muted/50"><ExternalLink size={14} className="text-primary" /></a>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(pm.value, pm.id)} className="ml-2 shrink-0 text-xs">
                      {copiedId === pm.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3">
            <div><Label className="text-xs">Montant (FCFA) *</Label><Input type="number" value={rechargeForm.amount} onChange={e => setRechargeForm(p => ({ ...p, amount: e.target.value }))} placeholder="10000" className="mt-1 bg-input border-border text-sm" /></div>
            <div><Label className="text-xs">ID transaction *</Label><Input value={rechargeForm.transactionRef} onChange={e => setRechargeForm(p => ({ ...p, transactionRef: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
            <div><Label className="text-xs">Date transaction</Label><Input type="date" value={rechargeForm.transactionDate} onChange={e => setRechargeForm(p => ({ ...p, transactionDate: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
            <div><Label className="text-xs">Contact *</Label><Input value={rechargeForm.contact} onChange={e => setRechargeForm(p => ({ ...p, contact: e.target.value }))} placeholder="+225 07..." className="mt-1 bg-input border-border text-sm" /></div>
            <div><Label className="text-xs">Opérateur *</Label><Input value={rechargeForm.operator} onChange={e => setRechargeForm(p => ({ ...p, operator: e.target.value }))} placeholder="Orange Money, MTN..." className="mt-1 bg-input border-border text-sm" /></div>
            <Button onClick={handleRecharge} disabled={submitting} className="w-full bg-gradient-purple font-display font-bold hover:opacity-90 glow-purple">
              {submitting ? "Envoi..." : <><Send size={16} className="mr-2" /> Envoyer</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md glass-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-gradient-purple flex items-center gap-2"><ArrowUpRight size={20} /> Retirer</DialogTitle>
            <DialogDescription>Indiquez le montant et le moyen de réception.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Montant (FCFA) *</Label><Input type="number" value={withdrawForm.amount} onChange={e => setWithdrawForm(p => ({ ...p, amount: e.target.value }))} className="mt-1 bg-input border-border text-sm" /><p className="text-xs text-muted-foreground mt-1">Solde: {balance.toLocaleString()} FCFA</p></div>
            <div><Label className="text-xs">Service *</Label><Input value={withdrawForm.service} onChange={e => setWithdrawForm(p => ({ ...p, service: e.target.value }))} placeholder="Orange Money, Bitcoin..." className="mt-1 bg-input border-border text-sm" /></div>
            <div><Label className="text-xs">Contact *</Label><Input value={withdrawForm.contact} onChange={e => setWithdrawForm(p => ({ ...p, contact: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
            <div><Label className="text-xs">Adresse crypto</Label><Input value={withdrawForm.withdrawalAddress} onChange={e => setWithdrawForm(p => ({ ...p, withdrawalAddress: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
            <div><Label className="text-xs">Notes</Label><Input value={withdrawForm.notes} onChange={e => setWithdrawForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
            <Button onClick={handleWithdraw} disabled={submitting} className="w-full bg-gradient-purple font-display font-bold hover:opacity-90 glow-purple">
              {submitting ? "Envoi..." : <><Send size={16} className="mr-2" /> Demander</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardWallet;
