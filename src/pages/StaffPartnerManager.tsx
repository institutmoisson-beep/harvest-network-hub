import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2, Plus, Edit2, Save, X, Trash2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { uploadOptimizedImage } from "@/utils/imageCompression";

type Company = { id: string; name: string; sector: string; country: string; description: string | null; logo_url: string | null; banner_url: string | null; website_url: string | null; is_active: boolean; contact_whatsapp?: string; contact_facebook?: string; contact_email?: string; image_url_2?: string };
type Sector = { id: string; name: string };

const StaffPartnerManager = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: "", sector: "", country: "", description: "", logo_url: "", banner_url: "", website_url: "", contact_whatsapp: "", contact_facebook: "", contact_email: "", image_url_2: "" });

  useEffect(() => { checkAccess(); }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    const hasAccess = roles?.some(r => r.role === "admin" || r.role === "partner_manager");
    if (!hasAccess) { navigate("/dashboard"); toast.error("Accès refusé"); return; }
    setAuthorized(true); setLoading(false); loadData();
  };

  const loadData = async () => {
    const [compRes, secRes] = await Promise.all([
      supabase.from("companies").select("*").order("created_at", { ascending: false }),
      supabase.from("sectors").select("*").order("name"),
    ]);
    if (compRes.data) setCompanies(compRes.data as Company[]);
    if (secRes.data) setSectors(secRes.data as Sector[]);
  };

  const openForm = (c?: Company) => {
    if (c) {
      setEditing(c);
      setForm({ name: c.name, sector: c.sector, country: c.country, description: c.description || "", logo_url: c.logo_url || "", banner_url: c.banner_url || "", website_url: c.website_url || "", contact_whatsapp: c.contact_whatsapp || "", contact_facebook: c.contact_facebook || "", contact_email: c.contact_email || "", image_url_2: c.image_url_2 || "" });
    } else {
      setEditing(null);
      setForm({ name: "", sector: "", country: "", description: "", logo_url: "", banner_url: "", website_url: "", contact_whatsapp: "", contact_facebook: "", contact_email: "", image_url_2: "" });
    }
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Nom requis"); return; }
    const payload = { ...form, updated_at: new Date().toISOString() };
    if (editing) {
      const { error } = await supabase.from("companies").update(payload as any).eq("id", editing.id);
      if (error) toast.error(error.message); else { toast.success("Mise à jour"); setShowForm(false); loadData(); }
    } else {
      const { error } = await supabase.from("companies").insert(payload as any);
      if (error) toast.error(error.message); else { toast.success("Ajoutée"); setShowForm(false); loadData(); }
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("companies").delete().eq("id", id);
    toast.success("Supprimée"); loadData();
  };

  const toggleActive = async (c: Company) => {
    await supabase.from("companies").update({ is_active: !c.is_active }).eq("id", c.id);
    toast.success(c.is_active ? "Désactivée" : "Activée"); loadData();
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} /> <img src={logo} alt="Logo" className="h-7 w-7" />
        </Link>
        <h1 className="font-display text-sm font-bold text-gradient-gold">🤝 Gestion Partenaires</h1>
      </header>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{companies.length} entreprises partenaires</p>
          <Button size="sm" className="bg-gradient-gold text-secondary-foreground font-display text-xs" onClick={() => openForm()}>
            <Plus size={14} className="mr-1" /> Ajouter
          </Button>
        </div>

        {showForm && (
          <div className="glass-card rounded-xl p-4 border-2 border-primary/30">
            <h3 className="font-display text-sm font-bold mb-3">{editing ? "Modifier" : "Nouvelle"} Entreprise</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Nom *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
              <div>
                <Label className="text-xs">Secteur</Label>
                <select value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))} className="mt-1 w-full rounded-md bg-input border border-border text-sm p-2">
                  <option value="">Sélectionner...</option>
                  {sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div><Label className="text-xs">Pays</Label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
              <div><Label className="text-xs">Site Web</Label><Input value={form.website_url} onChange={e => setForm(p => ({ ...p, website_url: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
              <div><Label className="text-xs">WhatsApp</Label><Input value={form.contact_whatsapp} onChange={e => setForm(p => ({ ...p, contact_whatsapp: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
              <div><Label className="text-xs">Email</Label><Input value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
            </div>
            {/* Image uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {([{ label: "Logo", field: "logo_url" as const }, { label: "Bannière", field: "banner_url" as const }, { label: "Image 2", field: "image_url_2" as const }]).map(({ label, field }) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  {form[field] && <img src={form[field]} alt={label} className="w-full h-20 rounded-lg object-cover border border-border" />}
                  <input type="file" accept="image/*" className="text-[10px] w-full" onChange={async (e) => {
                    const raw = e.target.files?.[0]; if (!raw) return;
                    try {
                      const url = await uploadOptimizedImage(raw, "company-images", "companies");
                      setForm(p => ({ ...p, [field]: url }));
                      toast.success(`${label} optimisé et téléchargé !`);
                    } catch (error: any) {
                      toast.error(error?.message || "Erreur upload");
                    }
                  }} />
                </div>
              ))}
            </div>
            <div className="mt-3"><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1 bg-input border-border text-sm" rows={3} /></div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="bg-gradient-gold text-secondary-foreground font-display text-xs" onClick={save}><Save size={14} className="mr-1" /> Enregistrer</Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowForm(false)}><X size={14} className="mr-1" /> Annuler</Button>
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
                </div>
              </div>
              <div className="flex gap-1">
                <Badge className={`text-[10px] ${c.is_active ? "bg-green-600" : "bg-destructive"}`}>{c.is_active ? "Active" : "Inactive"}</Badge>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openForm(c)}><Edit2 size={12} /></Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toggleActive(c)}>{c.is_active ? "Désactiver" : "Activer"}</Button>
                <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => remove(c.id)}><Trash2 size={12} /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffPartnerManager;
