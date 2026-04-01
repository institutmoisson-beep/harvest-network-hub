import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Users, Wallet, Building2, ShoppingCart, Plus, Edit2, Save, X,
  CheckCircle, XCircle, ArrowLeft, Trash2, CreditCard, Package, Percent,
  Eye, DollarSign, Star, Tags
} from "lucide-react";
import logo from "@/assets/logo.png";

type Profile = { id: string; first_name: string; last_name: string; email: string; phone: string; country: string; referral_code: string; career_level: string; account_status: string; is_system_active: boolean; created_at: string };
type Transaction = { id: string; user_id: string; type: string; amount: number; status: string; created_at: string; operator: string | null; transaction_ref: string | null; service: string | null; contact: string | null; withdrawal_address: string | null; notes: string | null; transaction_date: string | null };
type Company = { id: string; name: string; sector: string; country: string; description: string | null; logo_url: string | null; banner_url: string | null; website_url: string | null; is_active: boolean; contact_whatsapp?: string; contact_facebook?: string; contact_email?: string; image_url_2?: string };
type Order = { id: string; user_id: string; product_id: string; company_id: string; quantity: number; total_price: number; status: string; created_at: string; shipping_address_id: string | null };
type Product = { id: string; name: string; price: number; company_id: string; description: string | null; image_url: string | null; is_active: boolean; is_physical: boolean; activates_system: boolean; currency: string };
type PaymentMethod = { id: string; label: string; type: string; value: string; is_active: boolean };
type CommissionRate = { id: string; level: number; percentage: number };
type Sector = { id: string; name: string };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("users");

  const [users, setUsers] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [addresses, setAddresses] = useState<Record<string, any>>({});
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([]);
  const [walletsMap, setWalletsMap] = useState<Record<string, number>>({});
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [newSectorName, setNewSectorName] = useState("");

  // Forms
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState({ name: "", sector: "", country: "", description: "", logo_url: "", banner_url: "", website_url: "", contact_whatsapp: "", contact_facebook: "", contact_email: "", image_url_2: "" });

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: "", price: "", company_id: "", description: "", image_url: "", is_physical: true, activates_system: true, currency: "FCFA", sector: "", images: [] as string[] });
  const [imageUrlInput, setImageUrlInput] = useState("");

  const [showPmForm, setShowPmForm] = useState(false);
  const [pmForm, setPmForm] = useState({ label: "", type: "mobile_money", value: "" });

  const [showWalletAction, setShowWalletAction] = useState(false);
  const [walletActionUser, setWalletActionUser] = useState<Profile | null>(null);
  const [walletAction, setWalletAction] = useState<"credit" | "debit">("credit");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletMotif, setWalletMotif] = useState("");

  const [userDetailId, setUserDetailId] = useState<string | null>(null);
  const [userTx, setUserTx] = useState<Transaction[]>([]);
  const [userNetwork, setUserNetwork] = useState<any[]>([]);

  useEffect(() => { checkAdmin(); }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    if (!roles?.some(r => r.role === "admin")) { navigate("/dashboard"); toast.error("Accès refusé"); return; }
    setIsAdmin(true);
    setLoading(false);
    loadAll();
  };

  const loadAll = async () => {
    const [usersRes, txRes, compRes, ordersRes, addrRes, prodRes, pmRes, crRes, walRes, secRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("companies").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("shipping_addresses").select("*"),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("payment_methods").select("*").order("created_at", { ascending: false }),
      supabase.from("commission_rates").select("*").order("level", { ascending: true }),
      supabase.from("wallets").select("*"),
      supabase.from("sectors").select("*").order("name", { ascending: true }),
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
      setProductsList(prodRes.data as Product[]);
      const pMap: Record<string, Product> = {};
      prodRes.data.forEach((p: any) => { pMap[p.id] = p; });
      setProductsMap(pMap);
    }
    if (pmRes.data) setPaymentMethods(pmRes.data as PaymentMethod[]);
    if (crRes.data) setCommissionRates(crRes.data as CommissionRate[]);
    if (walRes.data) {
      const wMap: Record<string, number> = {};
      walRes.data.forEach((w: any) => { wMap[w.user_id] = Number(w.balance); });
      setWalletsMap(wMap);
    }
    if (secRes.data) setSectors(secRes.data as Sector[]);
  };

  // Transaction handling
  const handleTransaction = async (tx: Transaction, action: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("wallet_transactions").update({
      status: action, reviewed_at: new Date().toISOString(), reviewed_by: user?.id,
    }).eq("id", tx.id);
    if (error) { toast.error(error.message); return; }

    if (action === "approved") {
      const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", tx.user_id).single();
      if (wallet) {
        const newBal = tx.type === "recharge"
          ? Number(wallet.balance) + tx.amount
          : Math.max(0, Number(wallet.balance) - tx.amount);
        await supabase.from("wallets").update({ balance: newBal, updated_at: new Date().toISOString() }).eq("id", wallet.id);
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

  // Company CRUD
  const openCompanyForm = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setCompanyForm({ name: company.name, sector: company.sector, country: company.country, description: company.description || "", logo_url: company.logo_url || "", banner_url: company.banner_url || "", website_url: company.website_url || "", contact_whatsapp: (company as any).contact_whatsapp || "", contact_facebook: (company as any).contact_facebook || "", contact_email: (company as any).contact_email || "", image_url_2: (company as any).image_url_2 || "" });
    } else {
      setEditingCompany(null);
      setCompanyForm({ name: "", sector: "", country: "", description: "", logo_url: "", banner_url: "", website_url: "", contact_whatsapp: "", contact_facebook: "", contact_email: "", image_url_2: "" });
    }
    setShowCompanyForm(true);
  };

  const saveCompany = async () => {
    if (!companyForm.name.trim()) { toast.error("Nom requis"); return; }
    const payload = { ...companyForm, updated_at: new Date().toISOString() };
    if (editingCompany) {
      const { error } = await supabase.from("companies").update(payload as any).eq("id", editingCompany.id);
      if (error) toast.error(error.message);
      else { toast.success("Entreprise mise à jour"); setShowCompanyForm(false); loadAll(); }
    } else {
      const { error } = await supabase.from("companies").insert(payload as any);
      if (error) toast.error(error.message);
      else { toast.success("Entreprise ajoutée"); setShowCompanyForm(false); loadAll(); }
    }
  };

  const deleteCompany = async (id: string) => {
    if (!confirm("Supprimer cette entreprise ?")) return;
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Entreprise supprimée"); loadAll(); }
  };

  const toggleCompanyActive = async (c: Company) => {
    await supabase.from("companies").update({ is_active: !c.is_active }).eq("id", c.id);
    toast.success(c.is_active ? "Désactivée" : "Activée");
    loadAll();
  };

  // Product CRUD
  const openProductForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({ name: product.name, price: String(product.price), company_id: product.company_id, description: product.description || "", image_url: product.image_url || "", is_physical: product.is_physical, activates_system: product.activates_system, currency: product.currency, sector: (product as any).sector || "", images: Array.isArray((product as any).images) ? (product as any).images : [] });
    } else {
      setEditingProduct(null);
      setProductForm({ name: "", price: "", company_id: companies[0]?.id || "", description: "", image_url: "", is_physical: true, activates_system: true, currency: "FCFA", sector: "", images: [] });
    }
    setImageUrlInput("");
    setShowProductForm(true);
  };

  const saveProduct = async () => {
    if (!productForm.name.trim() || !productForm.price || !productForm.company_id) { toast.error("Nom, prix et entreprise requis"); return; }
    const payload = { name: productForm.name, price: parseFloat(productForm.price), company_id: productForm.company_id, description: productForm.description, image_url: productForm.image_url || null, is_physical: productForm.is_physical, activates_system: productForm.activates_system, currency: productForm.currency, sector: productForm.sector, images: productForm.images, updated_at: new Date().toISOString() };
    if (editingProduct) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
      if (error) toast.error(error.message);
      else { toast.success("Produit mis à jour"); setShowProductForm(false); loadAll(); }
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) toast.error(error.message);
      else { toast.success("Produit ajouté"); setShowProductForm(false); loadAll(); }
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Produit supprimé"); loadAll();
  };

  const toggleProductActive = async (p: Product) => {
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    loadAll();
  };

  // Payment Method CRUD
  const savePm = async () => {
    if (!pmForm.label || !pmForm.value) { toast.error("Label et valeur requis"); return; }
    const { error } = await supabase.from("payment_methods").insert({ label: pmForm.label, type: pmForm.type, value: pmForm.value });
    if (error) toast.error(error.message);
    else { toast.success("Moyen ajouté"); setShowPmForm(false); setPmForm({ label: "", type: "mobile_money", value: "" }); loadAll(); }
  };

  const deletePm = async (id: string) => {
    await supabase.from("payment_methods").delete().eq("id", id);
    toast.success("Supprimé"); loadAll();
  };

  const togglePm = async (pm: PaymentMethod) => {
    await supabase.from("payment_methods").update({ is_active: !pm.is_active }).eq("id", pm.id);
    loadAll();
  };

  // Sector add
  const addSector = async () => {
    if (!newSectorName.trim()) { toast.error("Nom du secteur requis"); return; }
    const { error } = await supabase.from("sectors").insert({ name: newSectorName.trim() });
    if (error) { toast.error(error.message); return; }
    toast.success("Secteur ajouté");
    setNewSectorName("");
    loadAll();
  };

  // Pack commission rates
  const [packRates, setPackRates] = useState<Record<string, { id?: string; level: number; percentage: number }[]>>({});
  const [selectedPackForRates, setSelectedPackForRates] = useState<string>("");
  const [newRateLevel, setNewRateLevel] = useState("");
  const [newRatePct, setNewRatePct] = useState("");

  const loadPackRates = async (productId: string) => {
    const { data } = await supabase.from("pack_commission_rates").select("*").eq("product_id", productId).order("level", { ascending: true });
    if (data) setPackRates(prev => ({ ...prev, [productId]: data }));
  };

  const savePackRate = async (productId: string, level: number, percentage: number) => {
    const { error } = await supabase.from("pack_commission_rates").upsert(
      { product_id: productId, level, percentage },
      { onConflict: "product_id,level" }
    );
    if (error) toast.error(error.message);
    else { toast.success(`Niveau ${level}: ${percentage}%`); loadPackRates(productId); }
  };

  const deletePackRate = async (id: string, productId: string) => {
    await supabase.from("pack_commission_rates").delete().eq("id", id);
    toast.success("Niveau supprimé");
    loadPackRates(productId);
  };

  const addNewPackRate = async (productId: string) => {
    const level = parseInt(newRateLevel);
    const pct = parseFloat(newRatePct);
    if (isNaN(level) || level < 1) { toast.error("Niveau invalide"); return; }
    if (isNaN(pct) || pct < 0) { toast.error("Pourcentage invalide"); return; }
    await savePackRate(productId, level, pct);
    setNewRateLevel("");
    setNewRatePct("");
  };

  // Wallet credit/debit
  const handleWalletAction = async () => {
    if (!walletActionUser || !walletAmount) return;
    const amt = parseFloat(walletAmount);
    if (isNaN(amt) || amt <= 0) { toast.error("Montant invalide"); return; }

    const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", walletActionUser.id).single();
    if (!wallet) { toast.error("Wallet introuvable"); return; }

    const newBal = walletAction === "credit" ? Number(wallet.balance) + amt : Math.max(0, Number(wallet.balance) - amt);
    await supabase.from("wallets").update({ balance: newBal, updated_at: new Date().toISOString() }).eq("id", wallet.id);

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("wallet_transactions").insert({
      user_id: walletActionUser.id,
      type: walletAction === "credit" ? "recharge" as const : "retrait" as const,
      amount: amt,
      status: "approved" as const,
      notes: `Admin: ${walletMotif || (walletAction === "credit" ? "Crédit manuel" : "Débit manuel")}`,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    });

    toast.success(`Portefeuille ${walletAction === "credit" ? "crédité" : "débité"} de ${amt.toLocaleString()} FCFA`);
    setShowWalletAction(false);
    setWalletAmount("");
    setWalletMotif("");
    loadAll();
  };

  // User detail
  const viewUserDetail = async (userId: string) => {
    setUserDetailId(userId);
    const [txRes, netRes] = await Promise.all([
      supabase.from("wallet_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("network").select("*").eq("sponsor_id", userId),
    ]);
    setUserTx(txRes.data as Transaction[] || []);
    setUserNetwork(netRes.data || []);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!isAdmin) return null;

  const pendingTx = transactions.filter(t => t.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} /> <img src={logo} alt="Logo" className="h-7 w-7" />
        </Link>
        <h1 className="font-display text-sm font-bold text-gradient-gold">Administration</h1>
        {pendingTx.length > 0 && <Badge className="ml-auto bg-destructive text-destructive-foreground text-xs">{pendingTx.length} en attente</Badge>}
      </header>

      <div className="p-4 max-w-6xl mx-auto">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 sm:grid-cols-9 mb-6 h-auto">
            <TabsTrigger value="users" className="text-[10px] gap-1"><Users size={12} /> Utilisateurs</TabsTrigger>
            <TabsTrigger value="transactions" className="text-[10px] gap-1"><Wallet size={12} /> Transactions</TabsTrigger>
            <TabsTrigger value="companies" className="text-[10px] gap-1"><Building2 size={12} /> Entreprises</TabsTrigger>
            <TabsTrigger value="products" className="text-[10px] gap-1"><Package size={12} /> Packs</TabsTrigger>
            <TabsTrigger value="sectors" className="text-[10px] gap-1"><Tags size={12} /> Secteurs</TabsTrigger>
            <TabsTrigger value="orders" className="text-[10px] gap-1"><ShoppingCart size={12} /> Commandes</TabsTrigger>
            <TabsTrigger value="payments" className="text-[10px] gap-1"><CreditCard size={12} /> Paiements</TabsTrigger>
            <TabsTrigger value="commissions" className="text-[10px] gap-1"><Percent size={12} /> Commissions</TabsTrigger>
            <TabsTrigger value="pros" className="text-[10px] gap-1"><Star size={12} /> Pros</TabsTrigger>
          </TabsList>

          {/* ---- USERS ---- */}
          <TabsContent value="users">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{users.length} utilisateurs</p>
              {users.map(u => (
                <div key={u.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-display text-sm font-bold">{u.first_name} {u.last_name}</p>
                      <p className="text-xs text-muted-foreground">{u.email} • {u.phone}</p>
                      <p className="text-xs text-muted-foreground">{u.country} • Code: <span className="font-mono font-bold text-primary">{u.referral_code}</span></p>
                      <p className="text-xs text-muted-foreground">💰 Solde: <span className="font-bold">{(walletsMap[u.id] || 0).toLocaleString()} FCFA</span></p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{u.career_level}</Badge>
                        <Badge className={`text-[10px] ${u.account_status === "active" ? "bg-green-600" : u.account_status === "suspended" ? "bg-destructive" : "bg-yellow-600"}`}>{u.account_status}</Badge>
                        <Badge variant={u.is_system_active ? "default" : "outline"} className="text-[10px]">{u.is_system_active ? "Système actif" : "Inactif"}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => viewUserDetail(u.id)}><Eye size={12} className="mr-1" /> Détails</Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setWalletActionUser(u); setWalletAction("credit"); setShowWalletAction(true); }}>
                        <DollarSign size={12} className="mr-1" /> Créditer
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setWalletActionUser(u); setWalletAction("debit"); setShowWalletAction(true); }}>
                        Débiter
                      </Button>
                      {u.account_status !== "active" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleUpdateStatus(u.id, "active")}>Activer</Button>}
                      {u.account_status !== "suspended" && <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => handleUpdateStatus(u.id, "suspended")}>Suspendre</Button>}
                    </div>
                  </div>

                  {userDetailId === u.id && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/30 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold">Détails de {u.first_name}</p>
                        <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => setUserDetailId(null)}><X size={12} /></Button>
                      </div>
                      <div>
                        <p className="text-xs font-bold mb-1">Réseau ({userNetwork.length} filleuls directs)</p>
                        {userNetwork.map((n: any) => (
                          <p key={n.id} className="text-xs text-muted-foreground">{profiles[n.user_id]?.first_name} {profiles[n.user_id]?.last_name} — {profiles[n.user_id]?.referral_code}</p>
                        ))}
                        {userNetwork.length === 0 && <p className="text-xs text-muted-foreground">Aucun filleul</p>}
                      </div>
                      <div>
                        <p className="text-xs font-bold mb-1">Transactions récentes</p>
                        {userTx.slice(0, 5).map(tx => (
                          <div key={tx.id} className="flex justify-between text-xs">
                            <span>{tx.type} — {new Date(tx.created_at).toLocaleDateString("fr-FR")}</span>
                            <span className={tx.type === "recharge" || tx.type === "commission" ? "text-green-500" : "text-red-500"}>{tx.amount.toLocaleString()} FCFA ({tx.status})</span>
                          </div>
                        ))}
                        {userTx.length === 0 && <p className="text-xs text-muted-foreground">Aucune</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ---- TRANSACTIONS ---- */}
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
                        {tx.notes && <p className="text-xs text-muted-foreground">Notes: {tx.notes}</p>}
                        {tx.transaction_date && <p className="text-xs text-muted-foreground">Date tx: {new Date(tx.transaction_date).toLocaleDateString("fr-FR")}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(tx.created_at).toLocaleString("fr-FR")}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge className={`text-[10px] ${tx.status === "pending" ? "bg-yellow-600" : tx.status === "approved" ? "bg-green-600" : "bg-destructive"}`}>
                          {tx.status === "pending" ? "En attente" : tx.status === "approved" ? "Approuvé" : "Rejeté"}
                        </Badge>
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

          {/* ---- COMPANIES ---- */}
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
                    <div><Label className="text-xs">Image 2 URL</Label><Input value={companyForm.image_url_2} onChange={e => setCompanyForm(p => ({ ...p, image_url_2: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">WhatsApp</Label><Input value={companyForm.contact_whatsapp} onChange={e => setCompanyForm(p => ({ ...p, contact_whatsapp: e.target.value }))} placeholder="+225..." className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">Facebook</Label><Input value={companyForm.contact_facebook} onChange={e => setCompanyForm(p => ({ ...p, contact_facebook: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">Email contact</Label><Input value={companyForm.contact_email} onChange={e => setCompanyForm(p => ({ ...p, contact_email: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                  </div>
                  <div className="mt-3"><Label className="text-xs">Description</Label><Textarea value={companyForm.description} onChange={e => setCompanyForm(p => ({ ...p, description: e.target.value }))} className="mt-1 bg-input border-border text-sm" rows={3} /></div>
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
                        <p className="text-xs text-muted-foreground">{productsList.filter(p => p.company_id === c.id).length} packs</p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Badge className={`text-[10px] ${c.is_active ? "bg-green-600" : "bg-destructive"}`}>{c.is_active ? "Active" : "Inactive"}</Badge>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openCompanyForm(c)}><Edit2 size={12} /></Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toggleCompanyActive(c)}>{c.is_active ? "Désactiver" : "Activer"}</Button>
                      <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => deleteCompany(c.id)}><Trash2 size={12} /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ---- PACKS ---- */}
          <TabsContent value="products">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{productsList.length} packs</p>
                <Button size="sm" className="bg-gradient-gold text-secondary-foreground font-display text-xs" onClick={() => openProductForm()}>
                  <Plus size={14} className="mr-1" /> Ajouter un pack
                </Button>
              </div>

              {showProductForm && (
                <div className="glass-card rounded-xl p-4 border-2 border-primary/30">
                  <h3 className="font-display text-sm font-bold mb-3">{editingProduct ? "Modifier" : "Nouveau"} Pack</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label className="text-xs">Nom *</Label><Input value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">Prix *</Label><Input type="number" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div>
                      <Label className="text-xs">Entreprise *</Label>
                      <select value={productForm.company_id} onChange={e => setProductForm(p => ({ ...p, company_id: e.target.value }))}
                        className="mt-1 w-full rounded-md bg-input border border-border text-sm p-2">
                        <option value="">Sélectionner...</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div><Label className="text-xs">Devise</Label><Input value={productForm.currency} onChange={e => setProductForm(p => ({ ...p, currency: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div>
                      <Label className="text-xs">Secteur</Label>
                      <select value={productForm.sector} onChange={e => setProductForm(p => ({ ...p, sector: e.target.value }))}
                        className="mt-1 w-full rounded-md bg-input border border-border text-sm p-2">
                        <option value="">Aucun secteur</option>
                        {sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div><Label className="text-xs">Image principale (URL)</Label><Input value={productForm.image_url} onChange={e => setProductForm(p => ({ ...p, image_url: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div className="flex items-center gap-4 mt-4">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={productForm.is_physical} onChange={e => setProductForm(p => ({ ...p, is_physical: e.target.checked }))} /> Produit physique
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={productForm.activates_system} onChange={e => setProductForm(p => ({ ...p, activates_system: e.target.checked }))} /> Active le système MLM
                      </label>
                    </div>
                  </div>
                  <div className="mt-3"><Label className="text-xs">Description</Label><Textarea value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} className="mt-1 bg-input border-border text-sm" rows={3} /></div>
                  
                  {/* Multi-image section */}
                  <div className="mt-3 space-y-2">
                    <Label className="text-xs font-bold">Images supplémentaires</Label>
                    {productForm.images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {productForm.images.map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={img} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                            <button type="button" className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setProductForm(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} placeholder="URL de l'image..." className="bg-input border-border text-sm flex-1" />
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                        if (imageUrlInput.trim()) {
                          setProductForm(p => ({ ...p, images: [...p.images, imageUrlInput.trim()] }));
                          setImageUrlInput("");
                        }
                      }}><Plus size={12} className="mr-1" /> URL</Button>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Ou télécharger depuis votre appareil :</Label>
                      <input type="file" accept="image/*" multiple className="mt-1 text-xs" onChange={async (e) => {
                        const files = e.target.files;
                        if (!files) return;
                        for (const file of Array.from(files)) {
                          const ext = file.name.split('.').pop();
                          const path = `packs/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                          const { error } = await supabase.storage.from("pack-images").upload(path, file);
                          if (error) { toast.error(`Erreur upload: ${error.message}`); continue; }
                          const { data: urlData } = supabase.storage.from("pack-images").getPublicUrl(path);
                          setProductForm(p => ({ ...p, images: [...p.images, urlData.publicUrl] }));
                        }
                        toast.success("Images téléchargées !");
                        e.target.value = "";
                      }} />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="bg-gradient-gold text-secondary-foreground font-display text-xs" onClick={saveProduct}><Save size={14} className="mr-1" /> Enregistrer</Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowProductForm(false)}><X size={14} className="mr-1" /> Annuler</Button>
                  </div>
                </div>
              )}

              {productsList.map(p => {
                const comp = companies.find(c => c.id === p.company_id);
                return (
                  <div key={p.id} className="glass-card rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-3">
                        {p.image_url ? <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" /> : <Package size={24} className="text-primary" />}
                        <div>
                          <p className="font-display text-sm font-bold">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{comp?.name || "?"} • {Number(p.price).toLocaleString()} {p.currency}</p>
                          <div className="flex gap-1 mt-1">
                            {p.is_physical && <Badge variant="outline" className="text-[10px]">Physique</Badge>}
                            {p.activates_system && <Badge variant="outline" className="text-[10px]">Pack MLM</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Badge className={`text-[10px] ${p.is_active ? "bg-green-600" : "bg-destructive"}`}>{p.is_active ? "Actif" : "Inactif"}</Badge>
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openProductForm(p)}><Edit2 size={12} /></Button>
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toggleProductActive(p)}>{p.is_active ? "Désactiver" : "Activer"}</Button>
                        <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => deleteProduct(p.id)}><Trash2 size={12} /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ---- ORDERS ---- */}
          <TabsContent value="orders">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{orders.length} commandes</p>
              {orders.map(o => {
                const user = profiles[o.user_id];
                const product = productsMap[o.product_id];
                const addr = o.shipping_address_id ? addresses[o.shipping_address_id] : null;
                return (
                  <div key={o.id} className="glass-card rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-display text-sm font-bold">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email} • {user?.phone}</p>
                        <p className="text-xs mt-1"><span className="font-semibold">Produit:</span> {product?.name || o.product_id}</p>
                        <p className="text-xs"><span className="font-semibold">Qté:</span> {o.quantity} • <span className="font-semibold">Total:</span> {o.total_price.toLocaleString()} FCFA</p>
                        {addr && (
                          <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                            <p className="text-xs font-bold text-primary">📦 Livraison</p>
                            <p className="text-xs">{addr.full_name} • {addr.phone}</p>
                            <p className="text-xs">{addr.address_line}, {addr.city}, {addr.country}</p>
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

          {/* ---- PAYMENT METHODS ---- */}
          <TabsContent value="payments">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{paymentMethods.length} moyens de paiement</p>
                <Button size="sm" className="bg-gradient-gold text-secondary-foreground font-display text-xs" onClick={() => setShowPmForm(true)}>
                  <Plus size={14} className="mr-1" /> Ajouter
                </Button>
              </div>

              {showPmForm && (
                <div className="glass-card rounded-xl p-4 border-2 border-primary/30">
                  <h3 className="font-display text-sm font-bold mb-3">Nouveau Moyen de Paiement</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label className="text-xs">Nom / Label *</Label><Input value={pmForm.label} onChange={e => setPmForm(p => ({ ...p, label: e.target.value }))} placeholder="Bitcoin, Orange Money..." className="mt-1 bg-input border-border text-sm" /></div>
                    <div>
                      <Label className="text-xs">Type *</Label>
                      <select value={pmForm.type} onChange={e => setPmForm(p => ({ ...p, type: e.target.value }))}
                        className="mt-1 w-full rounded-md bg-input border border-border text-sm p-2">
                        <option value="mobile_money">Mobile Money (bouton copie)</option>
                        <option value="crypto">Crypto (bouton copie)</option>
                        <option value="link">Lien cliquable</option>
                        <option value="phone">Téléphone (bouton copie)</option>
                        <option value="email">Email (bouton copie)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Valeur * (numéro, adresse crypto, lien, email...)</Label>
                      <Input value={pmForm.value} onChange={e => setPmForm(p => ({ ...p, value: e.target.value }))}
                        placeholder={pmForm.type === "link" ? "https://..." : pmForm.type === "crypto" ? "0x... ou bc1..." : "+225..."}
                        className="mt-1 bg-input border-border text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="bg-gradient-gold text-secondary-foreground font-display text-xs" onClick={savePm}><Save size={14} className="mr-1" /> Enregistrer</Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowPmForm(false)}><X size={14} className="mr-1" /> Annuler</Button>
                  </div>
                </div>
              )}

              {paymentMethods.map(pm => (
                <div key={pm.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-display text-sm font-bold">{pm.label}</p>
                    <p className="text-xs text-muted-foreground">{pm.type} • {pm.value}</p>
                  </div>
                  <div className="flex gap-1">
                    <Badge className={`text-[10px] ${pm.is_active ? "bg-green-600" : "bg-destructive"}`}>{pm.is_active ? "Actif" : "Inactif"}</Badge>
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => togglePm(pm)}>{pm.is_active ? "Désactiver" : "Activer"}</Button>
                    <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => deletePm(pm.id)}><Trash2 size={12} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ---- COMMISSION RATES PER PACK ---- */}
          <TabsContent value="commissions">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Configurez les commissions <strong>par pack</strong>. Sélectionnez un pack puis définissez les taux par niveau. Au-delà des niveaux configurés, le système applique une décroissance automatique.</p>
              
              <div className="glass-card rounded-xl p-4">
                <Label className="text-xs font-bold">Sélectionner un pack</Label>
                <select value={selectedPackForRates} onChange={e => {
                  const pid = e.target.value;
                  setSelectedPackForRates(pid);
                  if (pid) loadPackRates(pid);
                }} className="mt-1 w-full rounded-md bg-input border border-border text-sm p-2">
                  <option value="">-- Choisir un pack --</option>
                  {productsList.filter(p => p.activates_system).map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {Number(p.price).toLocaleString()} {p.currency}</option>
                  ))}
                </select>
              </div>

              {selectedPackForRates && (
                <div className="glass-card rounded-xl p-4 space-y-3">
                  <h3 className="font-display text-sm font-bold">
                    Taux de commission — {productsList.find(p => p.id === selectedPackForRates)?.name}
                  </h3>
                  
                  {(packRates[selectedPackForRates] || []).map(r => (
                    <div key={r.id || r.level} className="flex items-center justify-between gap-3">
                      <p className="text-sm font-display font-bold min-w-[100px]">Niveau {r.level}</p>
                      <div className="flex items-center gap-2">
                        <Input type="number" step="0.1" defaultValue={r.percentage} className="w-20 bg-input border-border text-sm text-center"
                          onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v !== r.percentage) savePackRate(selectedPackForRates, r.level, v); }} />
                        <span className="text-xs text-muted-foreground">%</span>
                        {r.id && <Button size="sm" variant="destructive" className="text-xs h-6 w-6 p-0" onClick={() => deletePackRate(r.id!, selectedPackForRates)}><Trash2 size={10} /></Button>}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Input type="number" placeholder="Niveau" value={newRateLevel} onChange={e => setNewRateLevel(e.target.value)} className="w-20 bg-input border-border text-sm text-center" />
                    <Input type="number" step="0.1" placeholder="%" value={newRatePct} onChange={e => setNewRatePct(e.target.value)} className="w-20 bg-input border-border text-sm text-center" />
                    <Button size="sm" className="bg-gradient-gold text-secondary-foreground font-display text-xs" onClick={() => addNewPackRate(selectedPackForRates)}>
                      <Plus size={12} className="mr-1" /> Ajouter niveau
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Au-delà du dernier niveau configuré, le système applique automatiquement une décroissance (÷2 par niveau supplémentaire) jusqu'à un minimum de 0.01%.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ---- SECTORS ---- */}
          <TabsContent value="sectors">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{sectors.length} secteurs</p>
              <div className="glass-card rounded-xl p-4 flex items-center gap-3">
                <Input value={newSectorName} onChange={e => setNewSectorName(e.target.value)} placeholder="Nom du secteur..." className="bg-input border-border text-sm flex-1" />
                <Button size="sm" className="bg-gradient-gold text-secondary-foreground font-display text-xs" onClick={async () => {
                  if (!newSectorName.trim()) return;
                  const { error } = await supabase.from("sectors").insert({ name: newSectorName.trim() });
                  if (error) toast.error(error.message);
                  else { toast.success("Secteur ajouté"); setNewSectorName(""); loadAll(); }
                }}><Plus size={14} className="mr-1" /> Ajouter</Button>
              </div>
              {sectors.map(s => (
                <div key={s.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <p className="font-display text-sm font-bold">{s.name}</p>
                  <Button size="sm" variant="destructive" className="text-xs h-7" onClick={async () => {
                    await supabase.from("sectors").delete().eq("id", s.id);
                    toast.success("Secteur supprimé"); loadAll();
                  }}><Trash2 size={12} /></Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ---- MOISSONNEURS PROS ---- */}
          <TabsContent value="pros">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Gérez la visibilité des utilisateurs dans l'annuaire "Moissonneurs Pros"</p>
              {users.map(u => (
                <div key={u.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-display text-sm font-bold">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email} • {u.referral_code}</p>
                    <Badge variant="outline" className="text-[10px] mt-1">{u.career_level}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${(u as any).is_pro_visible ? "bg-green-600" : "bg-muted text-muted-foreground"}`}>
                      {(u as any).is_pro_visible ? "Visible" : "Masqué"}
                    </Badge>
                    <Button size="sm" variant={(u as any).is_pro_visible ? "destructive" : "default"} className="text-xs h-7"
                      onClick={async () => {
                        await supabase.from("profiles").update({ is_pro_visible: !(u as any).is_pro_visible } as any).eq("id", u.id);
                        toast.success((u as any).is_pro_visible ? "Retiré de l'annuaire" : "Ajouté à l'annuaire");
                        loadAll();
                      }}>
                      <Star size={12} className="mr-1" />
                      {(u as any).is_pro_visible ? "Retirer" : "Afficher"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Wallet Credit/Debit Dialog */}
      <Dialog open={showWalletAction} onOpenChange={setShowWalletAction}>
        <DialogContent className="max-w-sm glass-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-sm">
              {walletAction === "credit" ? "Créditer" : "Débiter"} le portefeuille
            </DialogTitle>
            <DialogDescription>
              {walletActionUser?.first_name} {walletActionUser?.last_name} — Solde: {(walletsMap[walletActionUser?.id || ""] || 0).toLocaleString()} FCFA
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Montant (FCFA)</Label><Input type="number" value={walletAmount} onChange={e => setWalletAmount(e.target.value)} className="mt-1 bg-input border-border text-sm" /></div>
            <div><Label className="text-xs">Motif</Label><Input value={walletMotif} onChange={e => setWalletMotif(e.target.value)} placeholder="Raison..." className="mt-1 bg-input border-border text-sm" /></div>
            <Button className={`w-full font-display text-xs ${walletAction === "credit" ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"}`} onClick={handleWalletAction}>
              {walletAction === "credit" ? "Créditer" : "Débiter"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
