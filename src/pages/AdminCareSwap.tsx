import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wrench, ArrowLeft, Loader2, CheckCircle2, XCircle, RefreshCcw,
  Package, AlertTriangle, TrendingUp, Plus, Trash2, ScanLine,
} from "lucide-react";
import logo from "@/assets/logo.png";
import CareSwapNotificationsBell from "@/components/CareSwapNotificationsBell";
import CareSwapQRScanner from "@/components/CareSwapQRScanner";
import {
  claimStatusConfig, claimTypeConfig,
  type WarrantyClaim, type SparePart, type DeviceBrand, type Device,
} from "@/lib/careSwapTypes";

interface Person { id: string; first_name: string; last_name: string; }

const AdminCareSwap = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [technicians, setTechnicians] = useState<Person[]>([]);
  const [storePartners, setStorePartners] = useState<Person[]>([]);
  const [brands, setBrands] = useState<DeviceBrand[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [assignTech, setAssignTech] = useState<Record<string, string>>({});

  const [newSerial, setNewSerial] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newStore, setNewStore] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [registeringDevice, setRegisteringDevice] = useState(false);

  const [newPart, setNewPart] = useState({ name: "", model_compatibility: "", stock_quantity: "0", unit_price: "0", supplier_ref: "", low_stock_threshold: "5" });
  const [savingPart, setSavingPart] = useState(false);

  useEffect(() => { checkAccess(); }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    const hasAccess = roles?.some((r) => r.role === "admin");
    if (!hasAccess) { navigate("/dashboard"); toast.error("Accès refusé"); return; }
    setAuthorized(true);
    loadAll();
  };

  const loadAll = async () => {
    const [
      { data: claimsData }, { data: techData }, { data: storeData },
      { data: brandsData }, { data: devicesData }, { data: partsData },
    ] = await Promise.all([
      (supabase as any).from("warranty_claims").select("*").order("created_at", { ascending: false }).limit(300),
      (supabase as any).rpc("list_technicians"),
      (supabase as any).rpc("list_store_partners"),
      supabase.from("device_brands").select("*").order("name"),
      (supabase as any).from("devices").select("*").order("created_at", { ascending: false }).limit(300),
      (supabase as any).from("spare_parts").select("*").order("name"),
    ]);
    setClaims(claimsData || []);
    setTechnicians(techData || []);
    setStorePartners(storeData || []);
    setBrands(brandsData || []);
    setDevices(devicesData || []);
    setSpareParts(partsData || []);
    if (!newBrand && brandsData?.[0]) setNewBrand(brandsData[0].id);
  };

  useEffect(() => {
    const channel = supabase
      .channel("admin-care-swap-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "warranty_claims" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "devices" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const personName = (list: Person[], id: string | null) => {
    if (!id) return "—";
    const p = list.find((x) => x.id === id);
    return p ? `${p.first_name} ${p.last_name}` : id.slice(0, 8);
  };

  const review = async (claimId: string, decision: "swap_approved" | "redirect_repair" | "rejected") => {
    setReviewing(claimId);
    const { error } = await (supabase as any).rpc("admin_review_swap_claim", { _claim_id: claimId, _decision: decision });
    setReviewing(null);
    if (error) { toast.error(error.message || "Échec"); return; }
    toast.success("Décision enregistrée");
    loadAll();
  };

  const assign = async (claimId: string) => {
    const techId = assignTech[claimId];
    if (!techId) { toast.error("Choisissez un technicien"); return; }
    const { error } = await (supabase as any).rpc("technician_assign_claim", { _claim_id: claimId, _technician_id: techId });
    if (error) { toast.error(error.message); return; }
    toast.success("Technicien assigné");
    loadAll();
  };

  const registerDevice = async () => {
    if (!newSerial.trim() || !newBrand || !newModel.trim() || !newStore) { toast.error("Tous les champs sont requis"); return; }
    setRegisteringDevice(true);
    const { error } = await (supabase as any).rpc("admin_register_device_stock", {
      _serial_number: newSerial.trim(), _brand_id: newBrand, _model: newModel.trim(), _store_id: newStore,
    });
    setRegisteringDevice(false);
    if (error) { toast.error(error.message || "Échec de l'enregistrement"); return; }
    toast.success("Appareil ajouté au stock !");
    setNewSerial(""); setNewModel("");
    loadAll();
  };

  const savePart = async () => {
    if (!newPart.name.trim()) { toast.error("Nom de la pièce requis"); return; }
    setSavingPart(true);
    const { error } = await (supabase as any).from("spare_parts").insert({
      name: newPart.name, model_compatibility: newPart.model_compatibility || null,
      stock_quantity: Number(newPart.stock_quantity) || 0, unit_price: Number(newPart.unit_price) || 0,
      supplier_ref: newPart.supplier_ref || null, low_stock_threshold: Number(newPart.low_stock_threshold) || 5,
    });
    setSavingPart(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pièce ajoutée");
    setNewPart({ name: "", model_compatibility: "", stock_quantity: "0", unit_price: "0", supplier_ref: "", low_stock_threshold: "5" });
    loadAll();
  };

  const deletePart = async (id: string) => {
    const { error } = await (supabase as any).from("spare_parts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Pièce supprimée");
    loadAll();
  };

  const pendingClaims = useMemo(() => claims.filter((c) => c.status === "claimed"), [claims]);
  const lowStockParts = useMemo(() => spareParts.filter((p) => p.stock_quantity <= p.low_stock_threshold), [spareParts]);

  const analytics = useMemo(() => {
    const byStatus: Record<string, number> = {};
    claims.forEach((c) => { byStatus[c.status] = (byStatus[c.status] || 0) + 1; });
    const byModel: Record<string, number> = {};
    claims.forEach((c) => {
      const d = devices.find((dv) => dv.id === c.device_id);
      const key = d?.model || "Inconnu";
      byModel[key] = (byModel[key] || 0) + 1;
    });
    return { byStatus, byModel, total: claims.length };
  }, [claims, devices]);

  if (!authorized) return null;

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin")}><ArrowLeft size={16} /></Button>
          <img src={logo} alt="" className="h-8" />
          <h1 className="font-display text-xl font-bold flex items-center gap-2"><Wrench className="text-primary" /> Moisson Care & Swap</h1>
        </div>
        <CareSwapNotificationsBell />
      </div>

      <Tabs defaultValue="claims" className="w-full">
        <TabsList className="grid grid-cols-4 w-full mb-6">
          <TabsTrigger value="claims" className="text-xs">Demandes ({pendingClaims.length})</TabsTrigger>
          <TabsTrigger value="devices" className="text-xs">Stock Appareils</TabsTrigger>
          <TabsTrigger value="parts" className="text-xs">Pièces détachées</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="claims" className="space-y-3">
          {claims.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Aucune demande pour le moment.</p>
          ) : (
            claims.map((c) => (
              <div key={c.id} className="glass-card rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex gap-1 mb-1">
                      <Badge className={`text-[10px] ${claimTypeConfig[c.claim_type].color} text-white`}>{claimTypeConfig[c.claim_type].label}</Badge>
                      <Badge className={`text-[10px] ${claimStatusConfig[c.status].color} text-white`}>{claimStatusConfig[c.status].label}</Badge>
                    </div>
                    <p className="text-sm">{c.issue_description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.claimant_name || "Client"} · {c.claimant_phone} · Magasin : {personName(storePartners, c.store_id)} · Technicien : {personName(technicians, c.technician_id)}
                    </p>
                  </div>
                </div>

                {c.media_urls?.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {c.media_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-lg overflow-hidden border border-border block">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {c.status === "claimed" && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={reviewing === c.id} onClick={() => review(c.id, "swap_approved")} className="bg-green-600 hover:bg-green-700 text-white font-display text-xs">
                      {reviewing === c.id ? <Loader2 size={13} className="animate-spin" /> : <><CheckCircle2 size={13} className="mr-1" /> Approuver l'Échange</>}
                    </Button>
                    <Button size="sm" disabled={reviewing === c.id} onClick={() => review(c.id, "redirect_repair")} variant="outline" className="font-display text-xs">
                      <RefreshCcw size={13} className="mr-1" /> Rediriger vers Réparation
                    </Button>
                    <Button size="sm" disabled={reviewing === c.id} onClick={() => review(c.id, "rejected")} variant="destructive" className="font-display text-xs">
                      <XCircle size={13} className="mr-1" /> Refuser
                    </Button>
                  </div>
                )}

                {c.status === "under_review" && !c.technician_id && (
                  <div className="flex gap-2">
                    <select
                      value={assignTech[c.id] || ""}
                      onChange={(e) => setAssignTech((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      className="flex-1 h-9 rounded-md border bg-background px-2 text-xs"
                    >
                      <option value="">Assigner un technicien…</option>
                      {technicians.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                    </select>
                    <Button size="sm" onClick={() => assign(c.id)} className="bg-gradient-purple font-display text-xs">Assigner</Button>
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h3 className="font-display font-bold text-sm">Ajouter un appareil en stock</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex gap-2">
                <Input value={newSerial} onChange={(e) => setNewSerial(e.target.value)} placeholder="N° de série / IMEI" className="bg-input border-border" />
                <Button type="button" variant="outline" onClick={() => setScannerOpen(true)}><ScanLine size={16} /></Button>
              </div>
              <select value={newBrand} onChange={(e) => setNewBrand(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <Input value={newModel} onChange={(e) => setNewModel(e.target.value)} placeholder="Modèle (ex: Moto G54)" className="bg-input border-border" />
              <select value={newStore} onChange={(e) => setNewStore(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Magasin partenaire…</option>
                {storePartners.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
            </div>
            <Button onClick={registerDevice} disabled={registeringDevice} className="bg-gradient-purple text-primary-foreground font-display text-xs">
              {registeringDevice ? <Loader2 size={14} className="animate-spin mr-1" /> : <Plus size={14} className="mr-1" />} Ajouter au stock
            </Button>
          </div>

          <div className="glass-card rounded-xl p-4">
            <h3 className="font-display font-bold text-sm mb-3">Appareils ({devices.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {devices.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-xs">
                  <div>
                    <p className="font-mono">{d.serial_number}</p>
                    <p className="text-muted-foreground">{d.model} · {personName(storePartners, d.store_id)}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{d.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="parts" className="space-y-6">
          {lowStockParts.length > 0 && (
            <div className="rounded-xl border-2 border-destructive/40 bg-destructive/5 p-4">
              <p className="font-display text-sm font-bold text-destructive flex items-center gap-2 mb-2">
                <AlertTriangle size={16} /> Stock faible — commande à prévoir
              </p>
              <div className="flex flex-wrap gap-2">
                {lowStockParts.map((p) => (
                  <Badge key={p.id} variant="outline" className="text-[10px] border-destructive text-destructive">
                    {p.name} : {p.stock_quantity} restant(s)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card rounded-xl p-4 space-y-3">
            <h3 className="font-display font-bold text-sm">Ajouter une pièce détachée</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <Input value={newPart.name} onChange={(e) => setNewPart({ ...newPart, name: e.target.value })} placeholder="Nom (ex: Écran)" className="bg-input border-border" />
              <Input value={newPart.model_compatibility} onChange={(e) => setNewPart({ ...newPart, model_compatibility: e.target.value })} placeholder="Compatibilité modèle" className="bg-input border-border" />
              <Input value={newPart.supplier_ref} onChange={(e) => setNewPart({ ...newPart, supplier_ref: e.target.value })} placeholder="Réf. fournisseur" className="bg-input border-border" />
              <div><Label className="text-xs">Quantité en stock</Label><Input type="number" value={newPart.stock_quantity} onChange={(e) => setNewPart({ ...newPart, stock_quantity: e.target.value })} className="bg-input border-border" /></div>
              <div><Label className="text-xs">Prix unitaire</Label><Input type="number" value={newPart.unit_price} onChange={(e) => setNewPart({ ...newPart, unit_price: e.target.value })} className="bg-input border-border" /></div>
              <div><Label className="text-xs">Seuil stock faible</Label><Input type="number" value={newPart.low_stock_threshold} onChange={(e) => setNewPart({ ...newPart, low_stock_threshold: e.target.value })} className="bg-input border-border" /></div>
            </div>
            <Button onClick={savePart} disabled={savingPart} className="bg-gradient-purple text-primary-foreground font-display text-xs">
              {savingPart ? <Loader2 size={14} className="animate-spin mr-1" /> : <Plus size={14} className="mr-1" />} Ajouter
            </Button>
          </div>

          <div className="glass-card rounded-xl p-4">
            <h3 className="font-display font-bold text-sm mb-3">Inventaire ({spareParts.length})</h3>
            <div className="space-y-2">
              {spareParts.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-xs">
                  <div>
                    <p className="font-medium">{p.name} {p.model_compatibility ? `(${p.model_compatibility})` : ""}</p>
                    <p className="text-muted-foreground">{p.unit_price.toLocaleString()} FCFA · Réf: {p.supplier_ref || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={p.stock_quantity <= p.low_stock_threshold ? "text-destructive font-bold" : ""}>{p.stock_quantity} en stock</span>
                    <button onClick={() => deletePart(p.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-display font-black text-primary">{analytics.total}</p>
              <p className="text-xs text-muted-foreground">Demandes totales</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-display font-black text-green-500">{analytics.byStatus.repaired || 0}</p>
              <p className="text-xs text-muted-foreground">Réparations terminées</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-display font-black text-red-500">{analytics.byStatus.swap_approved || 0}</p>
              <p className="text-xs text-muted-foreground">Échanges 48H approuvés</p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-primary" /> Taux de panne par modèle</h3>
            <div className="space-y-2">
              {Object.entries(analytics.byModel).sort((a, b) => b[1] - a[1]).map(([model, count]) => (
                <div key={model} className="flex items-center gap-3">
                  <span className="text-xs w-32 truncate">{model}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(count / analytics.total) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <CareSwapQRScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onDecoded={(hash) => { setNewSerial(hash); setScannerOpen(false); }} />
    </div>
  );
};

// Small wrapper to keep the JSX above tidy.
const CareSwapQRScannerDialog = ({ open, onOpenChange, onDecoded }: { open: boolean; onOpenChange: (o: boolean) => void; onDecoded: (hash: string) => void }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
      <div className="bg-card rounded-2xl p-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <p className="font-display font-bold text-sm flex items-center gap-2"><Package size={16} /> Scanner l'appareil</p>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground">✕</button>
        </div>
        <CareSwapQRScanner regionId="admin-device-scanner" onDecoded={onDecoded} />
      </div>
    </div>
  );
};

export default AdminCareSwap;
