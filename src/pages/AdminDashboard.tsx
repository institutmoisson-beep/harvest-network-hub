import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Users, Wallet, Building2, ShoppingCart, Plus, Edit2, Save, X,
  CheckCircle, XCircle, ArrowLeft, Eye, Trash2
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

type Profile = { id: string; first_name: string; last_name: string; email: string; phone: string; country: string; referral_code: string; career_level: string; account_status: string; is_system_active: boolean; created_at: string };
type Transaction = { id: string; user_id: string; type: string; amount: number; status: string; created_at: string; operator: string | null; transaction_ref: string | null; service: string | null; contact: string | null; withdrawal_address: string | null; notes: string | null; transaction_date: string | null };
type Company = { id: string; name: string; sector: string; country: string; description: string | null; logo_url: string | null; banner_url: string | null; website_url: string | null; is_active: boolean };
type Order = { id: string; user_id: string; product_id: string; company_id: string; quantity: number; total_price: number; status: string; created_at: string; shipping_address_id: string | null };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("users");

  // Data states
  const [users, setUsers] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [addresses, setAddresses] = useState<Record<string, any>>({});
  const [products, setProducts] = useState<Record<string, any>>({});

  // Company form
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState({ name: "", sector: "", country: "", description: "", logo_url: "", banner_url: "", website_url: "" });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    const admin = roles?.some(r => r.role === "admin");
    if (!admin) { navigate("/dashboard"); toast.error("Accès refusé"); return; }
    setIsAdmin(true);
    setLoading(false);
    loadAll();
  };

  const loadAll = async () => {
    const [usersRes, txRes, compRes, ordersRes, addrRes, prodRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("companies").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("shipping_addresses").select("*"),
      supabase.from("products").select("*"),
    ]);
    if (usersRes.data) {
      setUsers(usersRes.data as Profile[]);
      const pMap: Record<string, Profile> = {};
      usersRes.data.forEach((p: any) => { pMap[p.id] = p; });
      setProfiles(pMap);
    }
    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (compRes.data) setCompanies(compRes.data as Company[]);
    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    if (addrRes.data) {
      const aMap: Record<string, any> = {};
      addrRes.data.forEach((a: any) => { aMap[a.id] = a; });
      setAddresses(aMap);
    }
    if (prodRes.data) {
      const pMap: Record<string, any> = {};
      prodRes.data.forEach((p: any) => { pMap[p.id] = p; });
      setProducts(pMap);
    }
  };

  const handleTransaction = async (tx: Transaction, action: "approved" | "rejected") => {
    const { error } = await supabase.from("wallet_transactions").update({
      status: action,
      reviewed_at: new Date().toISOString(),
      reviewed_by: (await supabase.auth.getUser()).data.user?.id,
    }).eq("id", tx.id);

    if (error) { toast.error(error.message); return; }

    if (action === "approved") {
      if (tx.type === "recharge") {
        // Credit wallet
        const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", tx.user_id).single();
        if (wallet) {
          await supabase.from("wallets").update({ balance: wallet.balance + tx.amount, updated_at: new Date().toISOString() }).eq("id", wallet.id);
        }
      } else if (tx.type === "retrait") {
        // Debit wallet
        const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", tx.user_id).single();
        if (wallet) {
          const newBalance = Math.max(0, wallet.balance - tx.amount);
          await supabase.from("wallets").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("id", wallet.id);
        }
      }
    }

    toast.success(action === "approved" ? "Transaction approuvée !" : "Transaction rejetée !");
    loadAll();
  };

  const handleUpdateStatus = async (userId: string, status: "active" | "suspended" | "paused") => {
    const { error } = await supabase.from("profiles").update({ account_status: status }).eq("id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Statut mis à jour"); loadAll(); }
  };

  const handleOrderStatus = async (orderId: string, status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled") => {
    const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (error) toast.error(error.message);
    else { toast.success("Commande mise à jour"); loadAll(); }
  };

  const openCompanyForm = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setCompanyForm({ name: company.name, sector: company.sector, country: company.country, description: company.description || "", logo_url: company.logo_url || "", banner_url: company.banner_url || "", website_url: company.website_url || "" });
    } else {
      setEditingCompany(null);
      setCompanyForm({ name: "", sector: "", country: "", description: "", logo_url: "", banner_url: "", website_url: "" });
    }
    setShowCompanyForm(true);
  };

  const saveCompany = async () => {
    if (!companyForm.name.trim()) { toast.error("Nom requis"); return; }
    if (editingCompany) {
      const { error } = await supabase.from("companies").update({ ...companyForm, updated_at: new Date().toISOString() }).eq("id", editingCompany.id);
      if (error) toast.error(error.message);
      else { toast.success("Entreprise mise à jour"); setShowCompanyForm(false); loadAll(); }
    } else {
      const { error } = await supabase.from("companies").insert(companyForm);
      if (error) toast.error(error.message);
      else { toast.success("Entreprise ajoutée"); setShowCompanyForm(false); loadAll(); }
    }
  };

  const toggleCompanyActive = async (company: Company) => {
    const { error } = await supabase.from("companies").update({ is_active: !company.is_active }).eq("id", company.id);
    if (error) toast.error(error.message);
    else { toast.success(company.is_active ? "Entreprise désactivée" : "Entreprise activée"); loadAll(); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!isAdmin) return null;

  const pendingTx = transactions.filter(t => t.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} /> <img src={logo} alt="Logo" className="h-7 w-7" />
        </Link>
        <h1 className="font-display text-sm font-bold text-gradient-gold">Administration</h1>
        <div className="ml-auto flex items-center gap-2">
          {pendingTx.length > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-xs">{pendingTx.length} en attente</Badge>
          )}
        </div>
      </header>

      <div className="p-4 max-w-6xl mx-auto">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="users" className="text-xs gap-1"><Users size={14} /> Utilisateurs</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs gap-1"><Wallet size={14} /> Transactions</TabsTrigger>
            <TabsTrigger value="companies" className="text-xs gap-1"><Building2 size={14} /> Entreprises</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs gap-1"><ShoppingCart size={14} /> Commandes</TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{users.length} utilisateurs inscrits</p>
              {users.map(u => (
                <div key={u.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-display text-sm font-bold">{u.first_name} {u.last_name}</p>
                      <p className="text-xs text-muted-foreground">{u.email} • {u.phone}</p>
                      <p className="text-xs text-muted-foreground">{u.country} • Code: <span className="font-mono font-bold text-primary">{u.referral_code}</span></p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-[10px]">{u.career_level}</Badge>
                        <Badge className={`text-[10px] ${u.account_status === "active" ? "bg-green-600" : u.account_status === "suspended" ? "bg-destructive" : "bg-yellow-600"}`}>{u.account_status}</Badge>
                        <Badge variant={u.is_system_active ? "default" : "outline"} className="text-[10px]">{u.is_system_active ? "Système actif" : "Inactif"}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {u.account_status !== "active" && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleUpdateStatus(u.id, "active")}>Activer</Button>
                      )}
                      {u.account_status !== "suspended" && (
                        <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => handleUpdateStatus(u.id, "suspended")}>Suspendre</Button>
                      )}
                      {u.account_status !== "paused" && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleUpdateStatus(u.id, "paused")}>Pause</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TRANSACTIONS TAB */}
          <TabsContent value="transactions">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{transactions.length} transactions • {pendingTx.length} en attente</p>
              {transactions.map(tx => {
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
                        {tx.service && <p className="text-xs text-muted-foreground">Service: {tx.service}</p>}
                        {tx.contact && <p className="text-xs text-muted-foreground">Contact: {tx.contact}</p>}
                        {tx.withdrawal_address && <p className="text-xs text-muted-foreground">Adresse: {tx.withdrawal_address}</p>}
                        {tx.transaction_date && <p className="text-xs text-muted-foreground">Date: {new Date(tx.transaction_date).toLocaleDateString("fr-FR")}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(tx.created_at).toLocaleString("fr-FR")}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge className={`text-[10px] ${tx.status === "pending" ? "bg-yellow-600" : tx.status === "approved" ? "bg-green-600" : "bg-destructive"}`}>{tx.status === "pending" ? "En attente" : tx.status === "approved" ? "Approuvé" : "Rejeté"}</Badge>
                        {tx.status === "pending" && (
                          <div className="flex gap-1 mt-1">
                            <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700" onClick={() => handleTransaction(tx, "approved")}>
                              <CheckCircle size={12} className="mr-1" /> Accepter
                            </Button>
                            <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => handleTransaction(tx, "rejected")}>
                              <XCircle size={12} className="mr-1" /> Rejeter
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {transactions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Aucune transaction</p>}
            </div>
          </TabsContent>

          {/* COMPANIES TAB */}
          <TabsContent value="companies">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{companies.length} entreprises</p>
                <Button size="sm" className="bg-gradient-gold text-secondary-foreground font-display text-xs" onClick={() => openCompanyForm()}>
                  <Plus size={14} className="mr-1" /> Ajouter
                </Button>
              </div>

              {showCompanyForm && (
                <div className="glass-card rounded-xl p-4 border-2 border-primary/30">
                  <h3 className="font-display text-sm font-bold mb-3">{editingCompany ? "Modifier" : "Nouvelle"} Entreprise</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label className="text-xs">Nom *</Label><Input value={companyForm.name} onChange={e => setCompanyForm(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">Secteur</Label><Input value={companyForm.sector} onChange={e => setCompanyForm(p => ({ ...p, sector: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">Pays</Label><Input value={companyForm.country} onChange={e => setCompanyForm(p => ({ ...p, country: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">Site Web</Label><Input value={companyForm.website_url} onChange={e => setCompanyForm(p => ({ ...p, website_url: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">Logo URL</Label><Input value={companyForm.logo_url} onChange={e => setCompanyForm(p => ({ ...p, logo_url: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">Bannière URL</Label><Input value={companyForm.banner_url} onChange={e => setCompanyForm(p => ({ ...p, banner_url: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                  </div>
                  <div className="mt-3"><Label className="text-xs">Description</Label><Input value={companyForm.description} onChange={e => setCompanyForm(p => ({ ...p, description: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="bg-gradient-gold text-secondary-foreground font-display text-xs" onClick={saveCompany}><Save size={14} className="mr-1" /> Enregistrer</Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowCompanyForm(false)}><X size={14} className="mr-1" /> Annuler</Button>
                  </div>
                </div>
              )}

              {companies.map(c => (
                <div key={c.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3">
                      {c.logo_url ? <img src={c.logo_url} alt={c.name} className="w-10 h-10 rounded-lg object-cover" /> : <Building2 size={24} className="text-primary" />}
                      <div>
                        <p className="font-display text-sm font-bold">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.sector} • {c.country}</p>
                        {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Badge className={`text-[10px] ${c.is_active ? "bg-green-600" : "bg-destructive"}`}>{c.is_active ? "Active" : "Inactive"}</Badge>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openCompanyForm(c)}><Edit2 size={12} /></Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toggleCompanyActive(c)}>{c.is_active ? "Désactiver" : "Activer"}</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ORDERS TAB */}
          <TabsContent value="orders">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{orders.length} commandes</p>
              {orders.map(o => {
                const user = profiles[o.user_id];
                const product = products[o.product_id];
                const addr = o.shipping_address_id ? addresses[o.shipping_address_id] : null;
                return (
                  <div key={o.id} className="glass-card rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-display text-sm font-bold">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email} • {user?.phone}</p>
                        <p className="text-xs mt-1"><span className="font-semibold">Produit:</span> {product?.name || o.product_id}</p>
                        <p className="text-xs"><span className="font-semibold">Quantité:</span> {o.quantity} • <span className="font-semibold">Total:</span> {o.total_price.toLocaleString()} FCFA</p>
                        {addr && (
                          <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                            <p className="text-xs font-bold text-primary">📦 Livraison</p>
                            <p className="text-xs">{addr.full_name} • {addr.phone}</p>
                            <p className="text-xs">{addr.address_line}, {addr.city}, {addr.country}</p>
                            {addr.postal_code && <p className="text-xs">Code postal: {addr.postal_code}</p>}
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(o.created_at).toLocaleString("fr-FR")}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge className={`text-[10px] ${o.status === "pending" ? "bg-yellow-600" : o.status === "confirmed" ? "bg-blue-600" : o.status === "shipped" ? "bg-purple-600" : o.status === "delivered" ? "bg-green-600" : "bg-destructive"}`}>
                          {o.status === "pending" ? "En attente" : o.status === "confirmed" ? "Confirmé" : o.status === "shipped" ? "Expédié" : o.status === "delivered" ? "Livré" : "Annulé"}
                        </Badge>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {o.status === "pending" && <Button size="sm" className="text-xs h-6 bg-blue-600 hover:bg-blue-700" onClick={() => handleOrderStatus(o.id, "confirmed")}>Confirmer</Button>}
                          {o.status === "confirmed" && <Button size="sm" className="text-xs h-6 bg-purple-600 hover:bg-purple-700" onClick={() => handleOrderStatus(o.id, "shipped")}>Expédier</Button>}
                          {o.status === "shipped" && <Button size="sm" className="text-xs h-6 bg-green-600 hover:bg-green-700" onClick={() => handleOrderStatus(o.id, "delivered")}>Livré</Button>}
                          {o.status !== "cancelled" && o.status !== "delivered" && (
                            <Button size="sm" variant="destructive" className="text-xs h-6" onClick={() => handleOrderStatus(o.id, "cancelled")}>Annuler</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {orders.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Aucune commande</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
