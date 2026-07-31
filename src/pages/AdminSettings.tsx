import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, ArrowLeft, Plus, Trash2, Save, Loader2, CreditCard, Smartphone } from "lucide-react";
import logo from "@/assets/logo.png";

interface PaymentDestination {
  id: string;
  method: string;
  label: string;
  value: string;
  is_active: boolean;
  display_order: number;
}

interface DeviceBrand {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
}

const AdminSettings = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [payments, setPayments] = useState<PaymentDestination[]>([]);
  const [brands, setBrands] = useState<DeviceBrand[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [newPayment, setNewPayment] = useState({ method: "", label: "", value: "" });
  const [addingPayment, setAddingPayment] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [addingBrand, setAddingBrand] = useState(false);

  useEffect(() => { checkAccess(); }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    if (!roles?.some((r) => r.role === "admin")) { navigate("/dashboard"); toast.error("Accès refusé"); return; }
    setAuthorized(true);
    loadAll();
  };

  const loadAll = async () => {
    const [{ data: pay }, { data: br }] = await Promise.all([
      (supabase as any).from("payment_destinations").select("*").order("display_order"),
      supabase.from("device_brands").select("*").order("name"),
    ]);
    setPayments(pay || []);
    setBrands(br || []);
  };

  // ---- Payment destinations ----
  const updatePayment = (id: string, patch: Partial<PaymentDestination>) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const savePayment = async (p: PaymentDestination) => {
    setSavingId(p.id);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await (supabase as any)
      .from("payment_destinations")
      .update({ label: p.label, value: p.value, is_active: p.is_active, updated_by: session?.user.id })
      .eq("id", p.id);
    setSavingId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Enregistré");
  };

  const deletePayment = async (id: string) => {
    const { error } = await (supabase as any).from("payment_destinations").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Supprimé");
    loadAll();
  };

  const addPayment = async () => {
    if (!newPayment.method.trim() || !newPayment.label.trim() || !newPayment.value.trim()) {
      toast.error("Tous les champs sont requis"); return;
    }
    setAddingPayment(true);
    const { error } = await (supabase as any).from("payment_destinations").insert({
      method: newPayment.method.trim().toLowerCase().replace(/\s+/g, "_"),
      label: newPayment.label.trim(),
      value: newPayment.value.trim(),
      display_order: payments.length,
    });
    setAddingPayment(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Moyen de paiement ajouté");
    setNewPayment({ method: "", label: "", value: "" });
    loadAll();
  };

  // ---- Device brands ----
  const toggleBrand = async (id: string, is_active: boolean) => {
    const { error } = await (supabase as any).from("device_brands").update({ is_active }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    loadAll();
  };

  const deleteBrand = async (id: string) => {
    const { error } = await (supabase as any).from("device_brands").delete().eq("id", id);
    if (error) { toast.error("Suppression impossible : des appareils utilisent peut-être cette marque."); return; }
    toast.success("Marque supprimée");
    loadAll();
  };

  const addBrand = async () => {
    if (!newBrand.trim()) return;
    setAddingBrand(true);
    const { error } = await (supabase as any).from("device_brands").insert({ name: newBrand.trim() });
    setAddingBrand(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Marque ajoutée");
    setNewBrand("");
    loadAll();
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}><ArrowLeft size={16} /></Button>
        <img src={logo} alt="" className="h-8" />
        <h1 className="font-display text-xl font-bold flex items-center gap-2"><Settings className="text-primary" /> Paramètres</h1>
      </div>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-6">
          <TabsTrigger value="payments" className="text-xs"><CreditCard size={13} className="mr-1" /> Moyens de paiement</TabsTrigger>
          <TabsTrigger value="brands" className="text-xs"><Smartphone size={13} className="mr-1" /> Marques d'appareils</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Modifiez les numéros ou adresses utilisés lors du paiement à la livraison (Orange Money, Wave, Moov Money, Crypto…). Désactivez ou supprimez un moyen pour le retirer du choix client.
          </p>

          {payments.map((p) => (
            <div key={p.id} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">{p.method}</span>
                <div className="flex items-center gap-2">
                  <Switch checked={p.is_active} onCheckedChange={(v) => updatePayment(p.id, { is_active: v })} />
                  <button onClick={() => deletePayment(p.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Libellé affiché</Label>
                  <Input value={p.label} onChange={(e) => updatePayment(p.id, { label: e.target.value })} className="bg-input border-border" />
                </div>
                <div>
                  <Label className="text-xs">Numéro / Adresse / Lien</Label>
                  <Input value={p.value} onChange={(e) => updatePayment(p.id, { value: e.target.value })} className="bg-input border-border" />
                </div>
              </div>
              <Button size="sm" onClick={() => savePayment(p)} disabled={savingId === p.id} className="bg-gradient-purple font-display text-xs">
                {savingId === p.id ? <Loader2 size={13} className="animate-spin mr-1" /> : <Save size={13} className="mr-1" />} Enregistrer
              </Button>
            </div>
          ))}

          <div className="glass-card rounded-xl p-4 space-y-3 border-2 border-dashed border-primary/30">
            <h3 className="font-display text-sm font-bold">Ajouter un moyen de paiement</h3>
            <div className="grid sm:grid-cols-3 gap-2">
              <Input value={newPayment.method} onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })} placeholder="Identifiant (ex: mtn_money)" className="bg-input border-border" />
              <Input value={newPayment.label} onChange={(e) => setNewPayment({ ...newPayment, label: e.target.value })} placeholder="Libellé (ex: MTN Money)" className="bg-input border-border" />
              <Input value={newPayment.value} onChange={(e) => setNewPayment({ ...newPayment, value: e.target.value })} placeholder="Numéro / adresse / lien" className="bg-input border-border" />
            </div>
            <Button onClick={addPayment} disabled={addingPayment} size="sm" className="bg-gradient-purple font-display text-xs">
              {addingPayment ? <Loader2 size={13} className="animate-spin mr-1" /> : <Plus size={13} className="mr-1" />} Ajouter
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="brands" className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Gérez les marques de téléphone prises en charge par Moisson Care & Swap (Motorola et toute autre marque de votre choix).
          </p>

          <div className="glass-card rounded-xl p-4 space-y-2">
            {brands.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium">{b.name}</span>
                <div className="flex items-center gap-2">
                  <Switch checked={b.is_active} onCheckedChange={(v) => toggleBrand(b.id, v)} />
                  <button onClick={() => deleteBrand(b.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-xl p-4 space-y-3 border-2 border-dashed border-primary/30">
            <h3 className="font-display text-sm font-bold">Ajouter une marque</h3>
            <div className="flex gap-2">
              <Input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="Nom de la marque (ex: Samsung)" className="bg-input border-border" />
              <Button onClick={addBrand} disabled={addingBrand} className="bg-gradient-purple font-display text-xs">
                {addingBrand ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
