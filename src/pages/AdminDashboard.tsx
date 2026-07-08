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
  Eye, DollarSign, Star, Tags, Shield, Search, ChevronDown, ChevronUp
} from "lucide-react";
import logo from "@/assets/logo.png";
import { uploadOptimizedImage } from "@/utils/imageCompression";
import { downloadCsv, inPeriod, PERIOD_OPTIONS, PeriodFilter } from "@/utils/exportCsv";
import { Download } from "lucide-react";
import CountriesPicker from "@/components/CountriesPicker";

type Profile = { id: string; first_name: string; last_name: string; email: string; phone: string; country: string; referral_code: string; career_level: string; account_status: string; is_system_active: boolean; created_at: string };
type Transaction = { id: string; user_id: string; type: string; amount: number; status: string; created_at: string; operator: string | null; transaction_ref: string | null; service: string | null; contact: string | null; withdrawal_address: string | null; notes: string | null; transaction_date: string | null; recipient_id?: string | null };
type Company = { id: string; name: string; sector: string; country: string; description: string | null; logo_url: string | null; banner_url: string | null; website_url: string | null; is_active: boolean; contact_whatsapp?: string; contact_facebook?: string; contact_email?: string; image_url_2?: string };
type Order = { id: string; user_id: string; product_id: string; company_id: string; quantity: number; total_price: number; status: string; created_at: string; shipping_address_id: string | null };
type Product = { id: string; name: string; price: number; profit_amount: number; level1_commission_percentage: number; company_id: string; description: string | null; image_url: string | null; is_active: boolean; is_physical: boolean; activates_system: boolean; currency: string; sector?: string | null; images?: string[] | null; countries?: string[] | null };
type PaymentMethod = { id: string; label: string; type: string; value: string; is_active: boolean };
type CommissionRate = { id: string; level: number; percentage: number };
type Sector = { id: string; name: string };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("users");
  const [ordersPeriod, setOrdersPeriod] = useState<PeriodFilter>("all");
  const [ordersUserFilter, setOrdersUserFilter] = useState("");

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
  const [packRates, setPackRates] = useState<Record<string, { id?: string; level: number; percentage: number }[]>>({});
  const [selectedPackForRates, setSelectedPackForRates] = useState<string>("");
  const [newRateLevel, setNewRateLevel] = useState("");
  const [newRatePct, setNewRatePct] = useState("");
  const [userRolesMap, setUserRolesMap] = useState<Record<string, string[]>>({});
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [roleDialogUser, setRoleDialogUser] = useState<Profile | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [txSearch, setTxSearch] = useState("");
  const [usersCollapsed, setUsersCollapsed] = useState(false);
  const [transactionsCollapsed, setTransactionsCollapsed] = useState(false);

  const STAFF_ROLES = [
    { value: "pack_manager", label: "📦 Gestion Packs" },
    { value: "financier", label: "💰 Financier" },
    { value: "partner_manager", label: "🤝 Gestion Partenaires" },
    { value: "communication", label: "📢 Communication" },
    { value: "moderator", label: "🛡️ Modérateur" },
  ];

  // Forms
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState({ name: "", sector: "", country: "", description: "", logo_url: "", banner_url: "", website_url: "", contact_whatsapp: "", contact_facebook: "", contact_email: "", image_url_2: "" });

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: "", price: "", profit_amount: "", level1_commission_percentage: "", company_id: "", description: "", image_url: "", is_physical: true, activates_system: true, currency: "FCFA", sector: "", images: [] as string[], countries: null as string[] | null });
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
    const [usersRes, txRes, compRes, ordersRes, addrRes, prodRes, pmRes, crRes, walRes, secRes, rolesRes] = await Promise.all([
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
      supabase.from("user_roles").select("*"),
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
    if (rolesRes.data) {
      const rMap: Record<string, string[]> = {};
      rolesRes.data.forEach((r: any) => {
        if (!rMap[r.user_id]) rMap[r.user_id] = [];
        rMap[r.user_id].push(r.role);
      });
      setUserRolesMap(rMap);
    }
  };

  const toggleUserRole = async (userId: string, role: string) => {
    const currentRoles = userRolesMap[userId] || [];
    if (currentRoles.includes(role)) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
      toast.success(`Rôle "${role}" retiré`);
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
      toast.success(`Rôle "${role}" attribué`);
    }
    loadAll();
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
      setProductForm({ name: product.name, price: String(product.price), profit_amount: String(product.profit_amount ?? 0), level1_commission_percentage: String(product.level1_commission_percentage ?? 0), company_id: product.company_id, description: product.description || "", image_url: product.image_url || "", is_physical: product.is_physical, activates_system: product.activates_system, currency: product.currency, sector: (product as any).sector || "", images: Array.isArray((product as any).images) ? (product as any).images : [], countries: (product as any).countries || null });
    } else {
      setEditingProduct(null);
      setProductForm({ name: "", price: "", profit_amount: "", level1_commission_percentage: "", company_id: companies[0]?.id || "", description: "", image_url: "", is_physical: true, activates_system: true, currency: "FCFA", sector: "", images: [], countries: null });
    }
    setImageUrlInput("");
    setShowProductForm(true);
  };

  const saveProduct = async () => {
    if (!productForm.name.trim() || !productForm.price || !productForm.company_id) { toast.error("Nom, prix et entreprise requis"); return; }
    if (productForm.activates_system && (!productForm.profit_amount || !productForm.level1_commission_percentage)) { toast.error("Pour un pack MLM, indiquez le bénéfice du pack et la commission niveau 1"); return; }
    const payload = { name: productForm.name, price: parseFloat(productForm.price), profit_amount: parseFloat(productForm.profit_amount || "0"), level1_commission_percentage: parseFloat(productForm.level1_commission_percentage || "0"), company_id: productForm.company_id, description: productForm.description, image_url: productForm.image_url || null, is_physical: productForm.is_physical, activates_system: productForm.activates_system, currency: productForm.currency, sector: productForm.sector, images: productForm.images, countries: productForm.countries, updated_at: new Date().toISOString() };
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

  const updatePackMlmSettings = async (productId: string, field: "profit_amount" | "level1_commission_percentage", value: number) => {
    if (isNaN(value) || value < 0) { toast.error("Valeur invalide"); return; }
    const payload = field === "profit_amount"
      ? { profit_amount: value, updated_at: new Date().toISOString() }
      : { level1_commission_percentage: value, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("products").update(payload).eq("id", productId);
    if (error) toast.error(error.message);
    else { toast.success(field === "profit_amount" ? "Bénéfice du pack mis à jour" : "Commission niveau 1 mise à jour"); loadAll(); }
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
  const normalize = (value: unknown) => String(value ?? "").toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const query = userSearch.toLowerCase();
    const roles = (userRolesMap[u.id] || []).join(" ");
    return normalize(`${u.first_name} ${u.last_name} ${u.email} ${u.phone} ${u.country} ${u.referral_code} ${roles}`).includes(query);
  });
  const filteredTransactions = transactions.filter((tx) => {
    if (!txSearch.trim()) return true;
    const query = txSearch.toLowerCase();
    const owner = profiles[tx.user_id];
    const counterparty = tx.recipient_id ? profiles[tx.recipient_id] : null;
    return normalize([
      tx.type,
      tx.status,
      tx.notes,
      tx.contact,
      tx.operator,
      tx.transaction_ref,
      tx.service,
      owner?.first_name,
      owner?.last_name,
      owner?.email,
      owner?.referral_code,
      counterparty?.first_name,
      counterparty?.last_name,
      counterparty?.email,
      counterparty?.referral_code,
    ].join(" ")).includes(query);
  });

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
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-muted-foreground">{filteredUsers.length} / {users.length} utilisateurs</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative min-w-[240px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Rechercher un utilisateur..." className="w-full pl-9 bg-input border-border text-sm" />
                  </div>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setUsersCollapsed(v => !v)}>
                    {usersCollapsed ? <><ChevronDown size={12} className="mr-1" /> Déplier</> : <><ChevronUp size={12} className="mr-1" /> Réduire</>}
                  </Button>
                </div>
              </div>

              {usersCollapsed ? (
                <div className="glass-card rounded-xl p-4 text-sm text-muted-foreground">
                  Liste des utilisateurs réduite.
                </div>
              ) : filteredUsers.map(u => (
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
                        {(userRolesMap[u.id] || []).filter(r => r !== "user").map(role => (
                          <Badge key={role} className="text-[10px] bg-primary/80">{role}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => viewUserDetail(u.id)}><Eye size={12} className="mr-1" /> Détails</Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setRoleDialogUser(u); setShowRoleDialog(true); }}>
                        <Shield size={12} className="mr-1" /> Rôles
                      </Button>
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
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-muted-foreground">{filteredTransactions.length} / {transactions.length} transactions • {pendingTx.length} en attente</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative min-w-[240px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={txSearch} onChange={e => setTxSearch(e.target.value)} placeholder="Rechercher une transaction..." className="w-full pl-9 bg-input border-border text-sm" />
                  </div>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setTransactionsCollapsed(v => !v)}>
                    {transactionsCollapsed ? <><ChevronDown size={12} className="mr-1" /> Déplier</> : <><ChevronUp size={12} className="mr-1" /> Réduire</>}
                  </Button>
                </div>
              </div>

              {transactionsCollapsed ? (
                <div className="glass-card rounded-xl p-4 text-sm text-muted-foreground">
                  Liste des transactions réduite.
                </div>
              ) : filteredTransactions.map(tx => {
                const user = profiles[tx.user_id];
                const counterparty = tx.recipient_id ? profiles[tx.recipient_id] : null;
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
                        {tx.type === "transfert" && counterparty && <p className="text-xs text-muted-foreground">Contrepartie: {counterparty.first_name} {counterparty.last_name} • {counterparty.referral_code}</p>}
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
              {!transactionsCollapsed && filteredTransactions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Aucune transaction</p>}
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
                    <div>
                      <Label className="text-xs">Secteur</Label>
                      <select value={companyForm.sector} onChange={e => setCompanyForm(p => ({ ...p, sector: e.target.value }))}
                        className="mt-1 w-full rounded-md bg-input border border-border text-sm p-2">
                        <option value="">Sélectionner...</option>
                        {sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div><Label className="text-xs">Pays</Label><Input value={companyForm.country} onChange={e => setCompanyForm(p => ({ ...p, country: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">Site Web</Label><Input value={companyForm.website_url} onChange={e => setCompanyForm(p => ({ ...p, website_url: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">WhatsApp</Label><Input value={companyForm.contact_whatsapp} onChange={e => setCompanyForm(p => ({ ...p, contact_whatsapp: e.target.value }))} placeholder="+225..." className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">Facebook</Label><Input value={companyForm.contact_facebook} onChange={e => setCompanyForm(p => ({ ...p, contact_facebook: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">Email contact</Label><Input value={companyForm.contact_email} onChange={e => setCompanyForm(p => ({ ...p, contact_email: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                  </div>

                  {/* Image uploads */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    {[
                      { label: "Logo", field: "logo_url" as const },
                      { label: "Bannière", field: "banner_url" as const },
                      { label: "Image 2", field: "image_url_2" as const },
                    ].map(({ label, field }) => (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs">{label}</Label>
                        {companyForm[field] && <img src={companyForm[field]} alt={label} className="w-full h-20 rounded-lg object-cover border border-border" />}
                        <Input value={companyForm[field]} onChange={e => setCompanyForm(p => ({ ...p, [field]: e.target.value }))} placeholder="URL..." className="bg-input border-border text-xs" />
                        <input type="file" accept="image/*" className="text-[10px] w-full" onChange={async (e) => {
                          const raw = e.target.files?.[0];
                          if (!raw) return;
                          try {
                            const url = await uploadOptimizedImage(raw, "company-images", "companies");
                            setCompanyForm(p => ({ ...p, [field]: url }));
                            toast.success(`${label} optimisé et téléchargé !`);
                          } catch (error: any) {
                            toast.error(`Erreur upload: ${error?.message || "image non envoyée"}`);
                          }
                          e.target.value = "";
                        }} />
                      </div>
                    ))}
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
                  <p className="text-[10px] text-muted-foreground mb-3">💡 Définissez le <strong>bénéfice réel</strong> du pack et la commission du niveau 1. Exemple : prix 10 000 FCFA, bénéfice 2 000 FCFA, niveau 1 à 30 % = 600 FCFA pour le parrain direct. Les niveaux suivants sont divisés par 2 jusqu'à 0,01 %.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label className="text-xs">Nom *</Label><Input value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">Prix *</Label><Input type="number" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">Bénéfice du pack *</Label><Input type="number" value={productForm.profit_amount} onChange={e => setProductForm(p => ({ ...p, profit_amount: e.target.value }))} placeholder="Ex: 2000" className="mt-1 bg-input border-border text-sm" /></div>
                    <div><Label className="text-xs">Commission niveau 1 (%) *</Label><Input type="number" step="0.01" value={productForm.level1_commission_percentage} onChange={e => setProductForm(p => ({ ...p, level1_commission_percentage: e.target.value }))} placeholder="Ex: 30" className="mt-1 bg-input border-border text-sm" /></div>
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

                  {/* Ciblage géographique du pack MLM */}
                  <div className="mt-3">
                    <CountriesPicker
                      value={productForm.countries}
                      onChange={c => setProductForm(p => ({ ...p, countries: c }))}
                      label="Pays où ce pack est disponible"
                    />
                  </div>
                  
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
                        for (const raw of Array.from(files)) {
                          try {
                            const url = await uploadOptimizedImage(raw, "pack-images", "packs");
                            setProductForm(p => ({ ...p, images: [...p.images, url] }));
                          } catch (error: any) {
                            toast.error(`Erreur upload: ${error?.message || raw.name}`);
                          }
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
                          <p className="text-[10px] text-primary mt-0.5">Bénéfice: {Number(p.profit_amount || 0).toLocaleString()} {p.currency} • Niv.1: {Number(p.level1_commission_percentage || 0)}% = {Math.round(Number(p.profit_amount || 0) * Number(p.level1_commission_percentage || 0) / 100).toLocaleString()} {p.currency}</p>
                          <div className="flex gap-1 mt-1">
                            {p.is_physical && <Badge variant="outline" className="text-[10px]">Physique</Badge>}
                            {p.activates_system && <Badge variant="outline" className="text-[10px]">Pack MLM</Badge>}
                            <Badge variant="outline" className="text-[10px]">
                              🌍 {p.countries && p.countries.length > 0
                                ? (p.countries.length > 2 ? `${p.countries.slice(0, 2).join(", ")} +${p.countries.length - 2}` : p.countries.join(", "))
                                : "Universel"}
                            </Badge>
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
              {/* Export commandes par période */}
              <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-display font-bold flex items-center gap-1"><Download size={12} /> Export commandes</span>
                <select value={ordersPeriod} onChange={e => setOrdersPeriod(e.target.value as PeriodFilter)} className="text-xs rounded-md bg-input border border-border p-1">
                  {PERIOD_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <Input placeholder="Recherche utilisateur (nom, email, code)" value={ordersUserFilter} onChange={e => setOrdersUserFilter(e.target.value)} className="h-7 text-xs w-64" />
                <Button
                  size="sm"
                  className="text-xs bg-gradient-gold text-secondary-foreground"
                  onClick={() => {
                    const q = ordersUserFilter.trim().toLowerCase();
                    const rows = orders
                      .filter(o => inPeriod(o.created_at, ordersPeriod))
                      .filter(o => {
                        if (!q) return true;
                        const u = profiles[o.user_id];
                        return (
                          u?.first_name?.toLowerCase().includes(q) ||
                          u?.last_name?.toLowerCase().includes(q) ||
                          u?.email?.toLowerCase().includes(q) ||
                          u?.referral_code?.toLowerCase().includes(q) ||
                          o.user_id.toLowerCase().includes(q)
                        );
                      });
                    downloadCsv(
                      `commandes-${ordersPeriod}`,
                      ["Date", "Utilisateur", "Email", "Code MSN", "Pays", "Produit", "Quantité", "Montant (FCFA)", "Statut"],
                      rows.map(o => {
                        const u = profiles[o.user_id];
                        const pr = productsMap[o.product_id];
                        return [
                          new Date(o.created_at).toLocaleString("fr-FR"),
                          `${u?.first_name || ""} ${u?.last_name || ""}`.trim() || o.user_id,
                          u?.email || "",
                          u?.referral_code || "",
                          u?.country || "",
                          pr?.name || o.product_id,
                          o.quantity,
                          o.total_price,
                          o.status,
                        ];
                      }),
                    );
                  }}
                >
                  <Download size={12} className="mr-1" /> Télécharger CSV
                </Button>
              </div>

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
              <p className="text-sm text-muted-foreground">Configurez le <strong>bénéfice</strong> et le <strong>taux niveau 1</strong> de chaque pack. Le système calcule ensuite automatiquement les niveaux infinis par décroissance.</p>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                Le calcul actif utilise le bénéfice du pack et le taux niveau 1 enregistrés dans le pack. Exemple : bénéfice 2 000 FCFA × 30 % = 600 FCFA au parrain direct, puis 15 %, 7,5 %, 3,75 %… jusqu'à 0,01 %.
              </div>
              
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
                    Configuration MLM — {productsList.find(p => p.id === selectedPackForRates)?.name}
                  </h3>
                  {(() => {
                    const selected = productsList.find(p => p.id === selectedPackForRates);
                    if (!selected) return null;
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl bg-muted/30 p-3">
                        <div><Label className="text-[10px]">Bénéfice du pack</Label><Input type="number" defaultValue={selected.profit_amount || 0} onBlur={e => updatePackMlmSettings(selected.id, "profit_amount", parseFloat(e.target.value))} className="mt-1 bg-input border-border text-sm" /></div>
                        <div><Label className="text-[10px]">Commission niveau 1 (%)</Label><Input type="number" step="0.01" defaultValue={selected.level1_commission_percentage || 0} onBlur={e => updatePackMlmSettings(selected.id, "level1_commission_percentage", parseFloat(e.target.value))} className="mt-1 bg-input border-border text-sm" /></div>
                        <div className="rounded-lg bg-background/60 p-2"><p className="text-[10px] text-muted-foreground">Montant niveau 1</p><p className="text-sm font-display font-bold text-primary">{Math.round(Number(selected.profit_amount || 0) * Number(selected.level1_commission_percentage || 0) / 100).toLocaleString()} {selected.currency}</p></div>
                      </div>
                    );
                  })()}
                  
                  {(() => {
                    const selected = productsList.find(p => p.id === selectedPackForRates);
                    const profit = Number(selected?.profit_amount || 0);
                    const basePct = Number(selected?.level1_commission_percentage || 0);
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-border">
                        {[1, 2, 3, 4].map(level => {
                          const pct = basePct / Math.pow(2, level - 1);
                          return <div key={level} className="rounded-lg bg-muted/30 p-2 text-center"><p className="text-[10px] text-muted-foreground">Niveau {level}</p><p className="text-xs font-bold">{pct.toFixed(level === 1 ? 0 : 2)}%</p><p className="text-[10px] text-primary">{Math.round(profit * pct / 100).toLocaleString()} FCFA</p></div>;
                        })}
                      </div>
                    );
                  })()}
                  <p className="text-xs text-muted-foreground mt-2">💡 La décroissance continue automatiquement au-delà du niveau 4 jusqu'à 0,01 %.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ---- SECTORS ---- */}
          <TabsContent value="sectors">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{sectors.length} secteurs</p>
              <div className="glass-card rounded-xl p-4 flex items-center gap-3">
                <Input value={newSectorName} onChange={e => setNewSectorName(e.target.value)} placeholder="Nom du secteur..." className="bg-input border-border text-sm flex-1"
                  onKeyDown={e => { if (e.key === "Enter") addSector(); }} />
                <Button size="sm" className="bg-gradient-gold text-secondary-foreground font-display text-xs" onClick={addSector}>
                  <Plus size={14} className="mr-1" /> Ajouter
                </Button>
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

      {/* Role Management Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-sm glass-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-sm flex items-center gap-2">
              <Shield size={16} /> Gérer les rôles
            </DialogTitle>
            <DialogDescription>
              {roleDialogUser?.first_name} {roleDialogUser?.last_name} — {roleDialogUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {STAFF_ROLES.map(role => {
              const hasRole = (userRolesMap[roleDialogUser?.id || ""] || []).includes(role.value);
              return (
                <button key={role.value} onClick={() => roleDialogUser && toggleUserRole(roleDialogUser.id, role.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-sm ${hasRole ? "bg-primary/20 border-primary/50 text-foreground" : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"}`}>
                  <span className="font-display font-bold text-xs">{role.label}</span>
                  <Badge className={`text-[10px] ${hasRole ? "bg-green-600" : "bg-muted text-muted-foreground"}`}>
                    {hasRole ? "Actif" : "Inactif"}
                  </Badge>
                </button>
              );
            })}
            <p className="text-[10px] text-muted-foreground mt-2">
              💡 Cliquez sur un rôle pour l'attribuer ou le retirer. L'utilisateur verra automatiquement son tableau de bord correspondant.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
