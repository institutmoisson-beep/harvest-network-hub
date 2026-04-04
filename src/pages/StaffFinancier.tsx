import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wallet, CheckCircle, XCircle, TrendingUp, Users } from "lucide-react";
import logo from "@/assets/logo.png";

type Transaction = { id: string; user_id: string; type: string; amount: number; status: string; created_at: string; operator: string | null; transaction_ref: string | null; service: string | null; contact: string | null; notes: string | null };
type Profile = { id: string; first_name: string; last_name: string; email: string };

const StaffFinancier = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => { checkAccess(); }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    const hasAccess = roles?.some(r => r.role === "admin" || r.role === "financier");
    if (!hasAccess) { navigate("/dashboard"); toast.error("Accès refusé"); return; }
    setAuthorized(true); setLoading(false); loadData();
  };

  const loadData = async () => {
    const [txRes, profRes] = await Promise.all([
      supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, first_name, last_name, email"),
    ]);
    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (profRes.data) {
      const m: Record<string, Profile> = {};
      profRes.data.forEach((p: any) => { m[p.id] = p; });
      setProfiles(m);
    }
  };

  const handleTx = async (tx: Transaction, action: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("wallet_transactions").update({ status: action, reviewed_at: new Date().toISOString(), reviewed_by: user?.id }).eq("id", tx.id);
    if (action === "approved") {
      const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", tx.user_id).single();
      if (wallet) {
        const newBal = tx.type === "recharge" ? Number(wallet.balance) + tx.amount : Math.max(0, Number(wallet.balance) - tx.amount);
        await supabase.from("wallets").update({ balance: newBal, updated_at: new Date().toISOString() }).eq("id", wallet.id);
      }
    }
    toast.success(action === "approved" ? "Approuvée" : "Rejetée");
    loadData();
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!authorized) return null;

  const filtered = filter === "all" ? transactions : transactions.filter(t => t.status === filter);
  const pending = transactions.filter(t => t.status === "pending").length;
  const totalApproved = transactions.filter(t => t.status === "approved").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} /> <img src={logo} alt="Logo" className="h-7 w-7" />
        </Link>
        <h1 className="font-display text-sm font-bold text-gradient-gold">💰 Gestion Financière</h1>
        {pending > 0 && <Badge className="ml-auto bg-destructive text-destructive-foreground text-xs">{pending} en attente</Badge>}
      </header>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4 text-center">
            <Wallet size={20} className="mx-auto text-primary mb-1" />
            <p className="text-lg font-display font-black text-gradient-gold">{pending}</p>
            <p className="text-[10px] text-muted-foreground">En attente</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <TrendingUp size={20} className="mx-auto text-green-400 mb-1" />
            <p className="text-lg font-display font-black">{totalApproved.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">FCFA approuvés</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Users size={20} className="mx-auto text-secondary mb-1" />
            <p className="text-lg font-display font-black">{transactions.length}</p>
            <p className="text-[10px] text-muted-foreground">Total transactions</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "approved", "rejected"] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="text-xs" onClick={() => setFilter(f)}>
              {f === "all" ? "Toutes" : f === "pending" ? "En attente" : f === "approved" ? "Approuvées" : "Rejetées"}
            </Button>
          ))}
        </div>

        {filtered.map(tx => {
          const user = profiles[tx.user_id];
          return (
            <div key={tx.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-display text-sm font-bold">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <div className="flex gap-1 mt-1 items-center">
                    <Badge variant="outline" className="text-[10px] capitalize">{tx.type}</Badge>
                    <span className="font-display text-sm font-bold text-primary">{tx.amount.toLocaleString()} FCFA</span>
                  </div>
                  {tx.operator && <p className="text-xs text-muted-foreground mt-1">Opérateur: {tx.operator}</p>}
                  {tx.transaction_ref && <p className="text-xs text-muted-foreground">Réf: {tx.transaction_ref}</p>}
                  {tx.contact && <p className="text-xs text-muted-foreground">Contact: {tx.contact}</p>}
                  {tx.notes && <p className="text-xs text-muted-foreground">Notes: {tx.notes}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(tx.created_at).toLocaleString("fr-FR")}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Badge className={`text-[10px] ${tx.status === "pending" ? "bg-yellow-600" : tx.status === "approved" ? "bg-green-600" : "bg-destructive"}`}>
                    {tx.status === "pending" ? "En attente" : tx.status === "approved" ? "Approuvée" : "Rejetée"}
                  </Badge>
                  {tx.status === "pending" && (
                    <div className="flex gap-1 mt-1">
                      <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700" onClick={() => handleTx(tx, "approved")}>
                        <CheckCircle size={12} className="mr-1" /> Approuver
                      </Button>
                      <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => handleTx(tx, "rejected")}>
                        <XCircle size={12} className="mr-1" /> Rejeter
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Aucune transaction</p>}
      </div>
    </div>
  );
};

export default StaffFinancier;
