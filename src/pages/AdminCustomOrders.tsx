import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, MapPin, Truck, CheckCircle2, XCircle, Clock, Settings, Plus, Trash2, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadCsv, inPeriod, PERIOD_OPTIONS, PeriodFilter } from "@/utils/exportCsv";

// ============= Admin — Commandes hors-catalogue =============

const STATUS_STYLE: Record<string, { label: string; className: string; icon: any }> = {
  pending:    { label: "En attente", className: "bg-orange-500/20 text-orange-300 border-orange-500/40", icon: Clock },
  in_transit: { label: "En cours",   className: "bg-blue-500/20 text-blue-300 border-blue-500/40",       icon: Truck },
  delivered:  { label: "Livré",       className: "bg-green-500/20 text-green-300 border-green-500/40",    icon: CheckCircle2 },
  cancelled:  { label: "Annulé",      className: "bg-muted text-muted-foreground border-border",          icon: XCircle },
};

const FREQ_LABEL: Record<string, string> = {
  once: "Unique", daily: "Journalier", weekly: "Hebdomadaire", monthly: "Mensuel",
};

const AdminCustomOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const emptyForm = { id: null as string | null, rule_name: "", criteria_type: "base", criteria_value: "", percentage: 5, is_active: true };
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [userFilter, setUserFilter] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: ords }, { data: cfgs }] = await Promise.all([
      (supabase as any).rpc("admin_list_custom_orders"),
      (supabase as any).from("mlm_commission_configs").select("*").order("criteria_type").order("updated_at", { ascending: false }),
    ]);
    setOrders(ords || []);
    setConfigs(cfgs || []);
    setLoading(false);
  };

  const changeStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).rpc("admin_update_custom_order_status", { _id: id, _status: status });
    if (error) return toast.error(error.message);
    toast.success(status === "delivered" ? "Livré — commissions distribuées" : "Statut mis à jour");
    load();
  };

  const openConfig = (c: any | null) => {
    setEditing(c);
    setForm(c ? { id: c.id, rule_name: c.rule_name, criteria_type: c.criteria_type, criteria_value: c.criteria_value || "", percentage: Number(c.percentage), is_active: c.is_active } : emptyForm);
    setConfigOpen(true);
  };

  const saveConfig = async () => {
    const { error } = await (supabase as any).rpc("admin_upsert_commission_config", {
      _id: form.id,
      _rule_name: form.rule_name.trim(),
      _criteria_type: form.criteria_type,
      _criteria_value: form.criteria_value.trim() || null,
      _percentage: form.percentage,
      _is_active: form.is_active,
    });
    if (error) return toast.error(error.message);
    toast.success("Règle enregistrée");
    setConfigOpen(false); setEditing(null);
    load();
  };

  const deleteConfig = async (id: string) => {
    if (!confirm("Supprimer cette règle ?")) return;
    const { error } = await (supabase as any).rpc("admin_delete_commission_config", { _id: id });
    if (error) return toast.error(error.message);
    toast.success("Règle supprimée");
    load();
  };

  const filtered = orders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (!inPeriod(o.created_at, period)) return false;
    if (userFilter) {
      const u = userFilter.toLowerCase();
      if (!(`${o.first_name || ""} ${o.last_name || ""} ${o.referral_code || ""} ${o.user_id || ""}`.toLowerCase().includes(u))) return false;
    }
    return true;
  });
  const baseRate = configs.find(c => c.criteria_type === "base" && c.is_active)?.percentage ?? 0;

  const exportCsv = () => {
    downloadCsv(
      `commandes-hors-catalogue-${period}`,
      ["Date", "Moissonneur", "Code", "Produit", "Quantité", "Prix unitaire", "Total", "Commission", "Fréquence", "Statut", "Latitude", "Longitude"],
      filtered.map((o: any) => [
        new Date(o.created_at).toLocaleString("fr-FR"),
        `${o.first_name || ""} ${o.last_name || ""}`.trim(),
        o.referral_code,
        o.product_name,
        o.quantity,
        o.unit_price,
        o.total_amount,
        o.calculated_commission,
        FREQ_LABEL[o.delivery_frequency] || o.delivery_frequency,
        o.status,
        o.delivery_latitude,
        o.delivery_longitude,
      ]),
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display text-xl font-bold flex items-center gap-2">
          <Package size={22} className="text-secondary" /> Commandes hors-catalogue
        </h1>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Taux de base actif :</span>
          <span className="font-display font-bold text-secondary">{baseRate}%</span>
          <Button size="sm" variant="outline" onClick={() => openConfig(null)}>
            <Settings size={14} className="mr-1" /> Configurer taux
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {[
          { v: "all", l: "Toutes" }, { v: "pending", l: "En attente" }, { v: "in_transit", l: "En cours" },
          { v: "delivered", l: "Livrées" }, { v: "cancelled", l: "Annulées" },
        ].map(f => (
          <button key={f.v} onClick={() => setStatusFilter(f.v)}
            className={`px-3 py-1.5 rounded-lg border text-xs ${statusFilter === f.v ? "border-primary bg-primary/15 font-bold" : "border-border bg-muted/30 text-muted-foreground"}`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Barre d'export */}
      <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-display font-bold flex items-center gap-1"><Download size={12} /> Export</span>
        <select value={period} onChange={e => setPeriod(e.target.value as PeriodFilter)} className="text-xs rounded-md bg-input border border-border p-1">
          {PERIOD_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <Input placeholder="Filtrer par utilisateur / code" value={userFilter} onChange={e => setUserFilter(e.target.value)} className="h-7 text-xs w-56" />
        <Button size="sm" className="text-xs bg-gradient-gold text-secondary-foreground" onClick={exportCsv}>
          <Download size={12} className="mr-1" /> CSV ({filtered.length})
        </Button>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-6">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Aucune commande.</p>
        ) : filtered.map(o => {
          const s = STATUS_STYLE[o.status] || STATUS_STYLE.pending;
          const Icon = s.icon;
          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${o.delivery_latitude},${o.delivery_longitude}`;
          return (
            <div key={o.id} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-sm">{o.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Par <span className="font-bold text-foreground">{o.first_name} {o.last_name}</span>
                    {o.referral_code && <> • <span className="font-mono">{o.referral_code}</span></>}
                    {o.phone && <> • {o.phone}</>}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(o.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    {" • Fréquence: "}<span className="text-foreground">{FREQ_LABEL[o.delivery_frequency] || o.delivery_frequency}</span>
                    {o.delivery_details && Object.keys(o.delivery_details).length > 0 && (
                      <> ({JSON.stringify(o.delivery_details)})</>
                    )}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold ${s.className}`}>
                  <Icon size={10} /> {s.label}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">Quantité</p>
                  <p className="font-bold">{o.quantity}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">Prix unitaire</p>
                  <p className="font-bold">{Number(o.unit_price).toLocaleString()} FCFA</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">Total</p>
                  <p className="font-bold text-secondary">{Number(o.total_amount).toLocaleString()} FCFA</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">Commission</p>
                  <p className="font-bold text-green-400">{Number(o.calculated_commission).toLocaleString()} FCFA</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs bg-muted/30 rounded-lg p-2">
                <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px]">{Number(o.delivery_latitude).toFixed(5)}, {Number(o.delivery_longitude).toFixed(5)}</p>
                  {o.delivery_address_text && <p className="text-[10px] text-muted-foreground">{o.delivery_address_text}</p>}
                </div>
                <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/15 text-primary text-[10px] font-bold hover:bg-primary/25">
                  🗺️ Voir <ExternalLink size={10} />
                </a>
              </div>

              {(o.status === "pending" || o.status === "in_transit") && (
                <div className="flex flex-wrap gap-2">
                  {o.status === "pending" && (
                    <Button size="sm" onClick={() => changeStatus(o.id, "in_transit")}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs">
                      <Truck size={12} className="mr-1" /> En cours de livraison
                    </Button>
                  )}
                  <Button size="sm" onClick={() => changeStatus(o.id, "delivered")}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs">
                    <CheckCircle2 size={12} className="mr-1" /> Marquer comme livré
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => changeStatus(o.id, "cancelled")}
                    className="text-xs border-destructive/50 text-destructive hover:bg-destructive/10">
                    <XCircle size={12} className="mr-1" /> Annuler
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Panneau config des taux */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold flex items-center gap-2">
            <Settings size={16} /> Règles de commission
          </h2>
          <Button size="sm" onClick={() => openConfig(null)}>
            <Plus size={14} className="mr-1" /> Nouvelle règle
          </Button>
        </div>
        {configs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune règle définie.</p>
        ) : (
          <div className="space-y-2">
            {configs.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold">{c.rule_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Type: {c.criteria_type}{c.criteria_value && ` = ${c.criteria_value}`} • {c.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
                <span className="text-sm font-display font-black text-secondary">{c.percentage}%</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openConfig(c)} className="text-xs">Modifier</Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteConfig(c.id)}
                    className="text-xs text-destructive hover:bg-destructive/10">
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog édition config */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-md glass-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Modifier la règle" : "Nouvelle règle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nom de la règle *</Label>
              <Input value={form.rule_name} onChange={e => setForm({ ...form, rule_name: e.target.value })}
                placeholder="Ex: Taux hebdomadaire premium" className="mt-1 bg-input border-border text-sm" />
            </div>
            <div>
              <Label className="text-xs">Type de critère</Label>
              <select value={form.criteria_type} onChange={e => setForm({ ...form, criteria_type: e.target.value })}
                className="w-full mt-1 bg-input border border-border rounded-lg p-2 text-sm">
                <option value="base">Taux de base (appliqué par défaut)</option>
                <option value="frequency">Par fréquence de livraison</option>
                <option value="zone">Par zone géographique</option>
                <option value="amount">Par montant seuil</option>
              </select>
            </div>
            {form.criteria_type !== "base" && (
              <div>
                <Label className="text-xs">Valeur du critère</Label>
                {form.criteria_type === "frequency" ? (
                  <select value={form.criteria_value} onChange={e => setForm({ ...form, criteria_value: e.target.value })}
                    className="w-full mt-1 bg-input border border-border rounded-lg p-2 text-sm">
                    <option value="">— Choisir —</option>
                    <option value="once">Unique</option>
                    <option value="daily">Journalier</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuel</option>
                  </select>
                ) : (
                  <Input value={form.criteria_value} onChange={e => setForm({ ...form, criteria_value: e.target.value })}
                    placeholder={form.criteria_type === "zone" ? "Ex: Côte d'Ivoire" : "Ex: 100000"}
                    className="mt-1 bg-input border-border text-sm" />
                )}
              </div>
            )}
            <div>
              <Label className="text-xs">Pourcentage (0-100) *</Label>
              <Input type="number" step={0.1} min={0} max={100} value={form.percentage}
                onChange={e => setForm({ ...form, percentage: parseFloat(e.target.value) || 0 })}
                className="mt-1 bg-input border-border text-sm" />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              Règle active
            </label>
            <Button onClick={saveConfig} className="w-full bg-gradient-gold text-secondary-foreground font-display font-bold">
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomOrders;