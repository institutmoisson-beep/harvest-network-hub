import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Package, Plus, Edit2, Save, X, Trash2, Upload, ImagePlus } from "lucide-react";
import logo from "@/assets/logo.png";

type Product = { id: string; name: string; price: number; company_id: string; description: string | null; image_url: string | null; is_active: boolean; is_physical: boolean; activates_system: boolean; currency: string; sector: string | null; images: string[] | null };
type Company = { id: string; name: string };

const StaffPackManager = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", price: "", company_id: "", description: "", image_url: "", is_physical: true, activates_system: true, currency: "FCFA", sector: "", images: [] as string[] });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { checkAccess(); }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    const hasAccess = roles?.some(r => r.role === "admin" || r.role === "pack_manager");
    if (!hasAccess) { navigate("/dashboard"); toast.error("Accès refusé"); return; }
    setAuthorized(true);
    setLoading(false);
    loadData();
  };

  const loadData = async () => {
    const [prodRes, compRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("companies").select("id, name"),
    ]);
    if (prodRes.data) setProducts(prodRes.data as Product[]);
    if (compRes.data) setCompanies(compRes.data as Company[]);
  };

  const openForm = (p?: Product) => {
    if (p) {
      setEditing(p);
      setForm({ name: p.name, price: String(p.price), company_id: p.company_id, description: p.description || "", image_url: p.image_url || "", is_physical: p.is_physical, activates_system: p.activates_system, currency: p.currency, sector: p.sector || "", images: Array.isArray(p.images) ? p.images : [] });
    } else {
      setEditing(null);
      setForm({ name: "", price: "", company_id: companies[0]?.id || "", description: "", image_url: "", is_physical: true, activates_system: true, currency: "FCFA", sector: "", images: [] });
    }
    setShowForm(true);
  };

  const uploadImages = async (files: FileList) => {
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `packs/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("pack-images").upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) { toast.error(`Erreur upload: ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("pack-images").getPublicUrl(path);
      newUrls.push(urlData.publicUrl);
    }
    setForm(p => {
      const updated = [...p.images, ...newUrls];
      return { ...p, images: updated, image_url: p.image_url || updated[0] || "" };
    });
    setUploading(false);
    if (newUrls.length > 0) toast.success(`${newUrls.length} image(s) ajoutée(s)`);
  };

  const removeImage = (index: number) => {
    setForm(p => {
      const updated = p.images.filter((_, i) => i !== index);
      const removedUrl = p.images[index];
      return { ...p, images: updated, image_url: p.image_url === removedUrl ? (updated[0] || "") : p.image_url };
    });
  };

  const save = async () => {
    if (!form.name.trim() || !form.price || !form.company_id) { toast.error("Nom, prix et entreprise requis"); return; }
    const payload = { name: form.name, price: parseFloat(form.price), company_id: form.company_id, description: form.description, image_url: form.image_url || (form.images[0] || null), is_physical: form.is_physical, activates_system: form.activates_system, currency: form.currency, sector: form.sector, images: form.images, updated_at: new Date().toISOString() };
    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) toast.error(error.message);
      else { toast.success("Pack mis à jour"); setShowForm(false); loadData(); }
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) toast.error(error.message);
      else { toast.success("Pack ajouté"); setShowForm(false); loadData(); }
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce pack ?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Supprimé"); loadData();
  };

  const toggle = async (p: Product) => {
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    loadData();
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} /> <img src={logo} alt="Logo" className="h-7 w-7" />
        </Link>
        <h1 className="font-display text-sm font-bold text-gradient-gold">📦 Gestion des Packs</h1>
      </header>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{products.length} packs</p>
          <Button size="sm" className="bg-gradient-gold text-secondary-foreground font-display text-xs" onClick={() => openForm()}>
            <Plus size={14} className="mr-1" /> Ajouter un pack
          </Button>
        </div>

        {showForm && (
          <div className="glass-card rounded-xl p-4 border-2 border-primary/30">
            <h3 className="font-display text-sm font-bold mb-3">{editing ? "Modifier" : "Nouveau"} Pack</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Nom *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
              <div><Label className="text-xs">Prix *</Label><Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
              <div>
                <Label className="text-xs">Entreprise *</Label>
                <select value={form.company_id} onChange={e => setForm(p => ({ ...p, company_id: e.target.value }))} className="mt-1 w-full rounded-md bg-input border border-border text-sm p-2">
                  <option value="">Sélectionner...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><Label className="text-xs">Devise</Label><Input value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
              <div className="flex items-center gap-4 mt-4">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={form.is_physical} onChange={e => setForm(p => ({ ...p, is_physical: e.target.checked }))} /> Physique
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={form.activates_system} onChange={e => setForm(p => ({ ...p, activates_system: e.target.checked }))} /> MLM
                </label>
              </div>
            </div>
            <div className="mt-3"><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1 bg-input border-border text-sm" rows={3} /></div>

            {/* Multi-image upload */}
            <div className="mt-4">
              <Label className="text-xs font-bold">Images du pack (produits)</Label>
              <p className="text-[10px] text-muted-foreground mb-2">Ajoutez une image par produit du pack. Sélectionnez plusieurs fichiers à la fois.</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && uploadImages(e.target.files)} />
              <Button size="sm" variant="outline" className="text-xs mb-3" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <><div className="animate-spin w-3 h-3 border border-primary border-t-transparent rounded-full mr-2" /> Upload...</> : <><ImagePlus size={14} className="mr-1" /> Ajouter des images</>}
              </Button>
              {form.images.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`Produit ${i + 1}`} className="w-full h-16 object-cover rounded-lg border border-border" />
                      <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={10} />
                      </button>
                      {form.image_url === url && <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] text-center text-primary-foreground rounded-b-lg">Principal</span>}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2">
                <Label className="text-xs">Ou URL image principale</Label>
                <Input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." className="mt-1 bg-input border-border text-sm" />
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button size="sm" className="bg-gradient-gold text-secondary-foreground font-display text-xs" onClick={save}><Save size={14} className="mr-1" /> Enregistrer</Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowForm(false)}><X size={14} className="mr-1" /> Annuler</Button>
            </div>
          </div>
        )}

        {products.map(p => {
          const comp = companies.find(c => c.id === p.company_id);
          const imgCount = (Array.isArray(p.images) ? p.images.length : 0) + (p.image_url ? 1 : 0);
          return (
            <div key={p.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" loading="lazy" /> : <Package size={24} className="text-primary" />}
                  <div>
                    <p className="font-display text-sm font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{comp?.name || "?"} • {Number(p.price).toLocaleString()} {p.currency}</p>
                    <div className="flex gap-1 mt-1">
                      {p.is_physical && <Badge variant="outline" className="text-[10px]">Physique</Badge>}
                      {p.activates_system && <Badge variant="outline" className="text-[10px]">MLM</Badge>}
                      {imgCount > 0 && <Badge variant="outline" className="text-[10px]">{imgCount} 📷</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Badge className={`text-[10px] ${p.is_active ? "bg-green-600" : "bg-destructive"}`}>{p.is_active ? "Actif" : "Inactif"}</Badge>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openForm(p)}><Edit2 size={12} /></Button>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toggle(p)}>{p.is_active ? "Désactiver" : "Activer"}</Button>
                  <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => remove(p.id)}><Trash2 size={12} /></Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StaffPackManager;
