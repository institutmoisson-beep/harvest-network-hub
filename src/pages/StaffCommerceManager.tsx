import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Boxes, Edit2, ImagePlus, PackageCheck, Plus, Save, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { uploadOptimizedImages } from "@/utils/imageCompression";
import CountriesPicker from "@/components/CountriesPicker";
import { downloadCsv, inPeriod, PERIOD_OPTIONS, PeriodFilter } from "@/utils/exportCsv";
import { Download } from "lucide-react";

type Kind = "wholesale" | "distribution";
type Product = { id: string; kind: Kind; name: string; description: string; price: number; currency: string; min_quantity: number; available_quantity: number | null; commission_percentage: number; partner_name: string; images: string[]; is_active: boolean; countries: string[] | null };

const emptyForm = { kind: "wholesale" as Kind, name: "", description: "", price: "", currency: "FCFA", min_quantity: "1", available_quantity: "", commission_percentage: "0", partner_name: "", images: [] as string[], is_active: true, countries: null as string[] | null };

const StaffCommerceManager = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [userFilter, setUserFilter] = useState("");

  useEffect(() => { void checkAccess(); }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    const ok = roles?.some(r => ["admin", "pack_manager", "partner_manager", "financier"].includes(r.role));
    if (!ok) { toast.error("Accès refusé"); navigate("/dashboard"); return; }
    setAuthorized(true); setLoading(false); void loadData();
  };

  const loadData = async () => {
    const [prodRes, orderRes] = await Promise.all([
      supabase.from("commerce_products").select("*").order("created_at", { ascending: false }),
      supabase.from("commerce_orders").select("*").order("created_at", { ascending: false }).limit(80),
    ]);
    if (prodRes.data) setProducts(prodRes.data.map((p: any) => ({ ...p, images: Array.isArray(p.images) ? p.images : [] })));
    if (orderRes.data) setOrders(orderRes.data);
  };

  const openForm = (product?: Product, kind: Kind = "wholesale") => {
    if (product) { setEditing(product); setForm({ ...product, price: String(product.price), min_quantity: String(product.min_quantity), available_quantity: product.available_quantity == null ? "" : String(product.available_quantity), commission_percentage: String(product.commission_percentage), images: product.images || [], countries: product.countries || null }); }
    else { setEditing(null); setForm({ ...emptyForm, kind }); }
    setShowForm(true);
  };

  const uploadImages = async (files: FileList) => {
    setUploading(true);
    try {
      const urls = await uploadOptimizedImages(files, "pack-images", "commerce");
      setForm(p => ({ ...p, images: [...p.images, ...urls] }));
      if (urls.length) toast.success(`${urls.length} image(s) optimisée(s) et ajoutée(s)`);
    } catch (error: any) {
      toast.error(error?.message || "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name || !form.price) { toast.error("Nom et prix requis"); return; }
    const payload: any = { kind: form.kind, name: form.name, description: form.description, price: Number(form.price), currency: form.currency, min_quantity: Number(form.min_quantity || 1), available_quantity: form.available_quantity ? Number(form.available_quantity) : null, commission_percentage: Number(form.commission_percentage || 0), partner_name: form.partner_name, images: form.images, is_active: form.is_active, countries: form.countries, updated_at: new Date().toISOString() };
    const { error } = editing ? await supabase.from("commerce_products").update(payload).eq("id", editing.id) : await supabase.from("commerce_products").insert(payload);
    if (error) toast.error(error.message); else { toast.success("Produit enregistré"); setShowForm(false); void loadData(); }
  };

  const toggle = async (p: Product) => { await supabase.from("commerce_products").update({ is_active: !p.is_active }).eq("id", p.id); void loadData(); };
  const remove = async (id: string) => { if (confirm("Supprimer ce produit ?")) { await supabase.from("commerce_products").delete().eq("id", id); void loadData(); } };

  const renderList = (kind: Kind) => products.filter(p => p.kind === kind).map(p => (
    <div key={p.id} className="glass-card rounded-xl p-4 flex items-start justify-between gap-3">
      <div className="flex gap-3 min-w-0">{p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-14 w-14 rounded-lg object-cover" /> : <Boxes className="mt-2 text-primary" />}<div><p className="font-display text-sm font-bold">{p.name}</p><p className="text-xs text-muted-foreground">{Number(p.price).toLocaleString()} {p.currency} • Min {p.min_quantity} • Commission {p.commission_percentage}%</p><Badge className={`mt-1 text-[10px] ${p.is_active ? "bg-green-600" : "bg-destructive"}`}>{p.is_active ? "Actif" : "Inactif"}</Badge></div></div>
      <div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => openForm(p)}><Edit2 size={12} /></Button><Button size="sm" variant="outline" onClick={() => toggle(p)}>{p.is_active ? "Off" : "On"}</Button><Button size="sm" variant="destructive" onClick={() => remove(p.id)}><Trash2 size={12} /></Button></div>
    </div>
  ));

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!authorized) return null;

  const filteredOrders = orders.filter(o => inPeriod(o.created_at, period) && (!userFilter || String(o.user_id).includes(userFilter)));
  const exportOrders = () => {
    downloadCsv(
      `commandes-commerce-${period}`,
      ["Date", "Utilisateur", "Produit", "Quantité", "Total", "Statut", "Paiement"],
      filteredOrders.map(o => {
        const p = products.find(pr => pr.id === o.product_id);
        return [new Date(o.created_at).toLocaleString("fr-FR"), o.user_id, p?.name || "—", o.quantity, o.total_price, o.status, o.payment_method];
      }),
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /><img src={logo} alt="Logo" className="h-7 w-7" /></Link>
        <h1 className="font-display text-sm font-bold text-gradient-gold">Commerce gros & distribution</h1>
      </header>
      <main className="p-4 max-w-5xl mx-auto space-y-4">
        <Tabs defaultValue="wholesale">
          <TabsList><TabsTrigger value="wholesale">Produits en gros</TabsTrigger><TabsTrigger value="distribution">Distribution</TabsTrigger><TabsTrigger value="orders">Commandes</TabsTrigger></TabsList>
          <TabsContent value="wholesale" className="space-y-3"><Button size="sm" onClick={() => openForm(undefined, "wholesale")} className="bg-gradient-gold text-secondary-foreground"><Plus size={14} className="mr-1" /> Ajouter</Button>{renderList("wholesale")}</TabsContent>
          <TabsContent value="distribution" className="space-y-3"><Button size="sm" onClick={() => openForm(undefined, "distribution")} className="bg-gradient-gold text-secondary-foreground"><Plus size={14} className="mr-1" /> Ajouter</Button>{renderList("distribution")}</TabsContent>
          <TabsContent value="orders" className="space-y-3">
            <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-display font-bold flex items-center gap-1"><Download size={12} /> Export</span>
              <select value={period} onChange={e => setPeriod(e.target.value as PeriodFilter)} className="text-xs rounded-md bg-input border border-border p-1">
                {PERIOD_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <Input placeholder="ID utilisateur" value={userFilter} onChange={e => setUserFilter(e.target.value)} className="h-7 text-xs w-52" />
              <Button size="sm" className="text-xs bg-gradient-gold text-secondary-foreground" onClick={exportOrders}><Download size={12} className="mr-1" /> CSV ({filteredOrders.length})</Button>
            </div>
            {filteredOrders.map(o => <div key={o.id} className="glass-card rounded-xl p-4"><p className="font-display text-sm font-bold">Commande {o.status}</p><p className="text-xs text-muted-foreground">{Number(o.total_price).toLocaleString()} FCFA • Quantité {o.quantity} • {new Date(o.created_at).toLocaleDateString("fr-FR")}</p></div>)}
          </TabsContent>
        </Tabs>
        {showForm && (
          <div className="glass-card rounded-xl p-4 border-2 border-primary/30">
            <h2 className="font-display text-sm font-bold mb-3">{editing ? "Modifier" : "Nouveau produit"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Nom *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label className="text-xs">Prix *</Label><Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} /></div>
              <div><Label className="text-xs">Quantité minimale</Label><Input type="number" value={form.min_quantity} onChange={e => setForm(p => ({ ...p, min_quantity: e.target.value }))} /></div>
              <div><Label className="text-xs">Commission %</Label><Input type="number" value={form.commission_percentage} onChange={e => setForm(p => ({ ...p, commission_percentage: e.target.value }))} /></div>
              <div><Label className="text-xs">Partenaire</Label><Input value={form.partner_name} onChange={e => setForm(p => ({ ...p, partner_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Stock</Label><Input type="number" value={form.available_quantity} onChange={e => setForm(p => ({ ...p, available_quantity: e.target.value }))} /></div>
            </div>
            <div className="mt-3"><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="mt-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
              <CountriesPicker value={form.countries} onChange={c => setForm(p => ({ ...p, countries: c }))} label="Pays où ce produit est disponible" />
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && uploadImages(e.target.files)} />
            <Button size="sm" variant="outline" className="mt-3" onClick={() => fileRef.current?.click()} disabled={uploading}><ImagePlus size={14} className="mr-1" /> {uploading ? "Upload..." : "Ajouter images"}</Button>
            <div className="mt-3 flex flex-wrap gap-2">{form.images.map((url, i) => <div key={url} className="relative"><img src={url} alt="Produit" className="h-16 w-16 rounded-lg object-cover" /><button className="absolute -right-1 -top-1 bg-destructive rounded-full p-1" onClick={() => setForm(p => ({ ...p, images: p.images.filter((_, index) => index !== i) }))}><X size={10} /></button></div>)}</div>
            <div className="mt-4 flex gap-2"><Button size="sm" onClick={save} className="bg-gradient-gold text-secondary-foreground"><Save size={14} className="mr-1" /> Enregistrer</Button><Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button></div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffCommerceManager;