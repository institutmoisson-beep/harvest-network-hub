import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wrench, ArrowLeft, Loader2, PackageCheck, ListChecks } from "lucide-react";
import logo from "@/assets/logo.png";
import CareSwapNotificationsBell from "@/components/CareSwapNotificationsBell";
import {
  claimStatusConfig, claimTypeConfig,
  type WarrantyClaim, type RepairOrder, type SparePart,
} from "@/lib/careSwapTypes";

interface RepairWithClaim extends RepairOrder {
  claim?: WarrantyClaim;
}

const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [queue, setQueue] = useState<WarrantyClaim[]>([]);
  const [myRepairs, setMyRepairs] = useState<RepairWithClaim[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [activeRepair, setActiveRepair] = useState<RepairWithClaim | null>(null);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { checkAccess(); }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    const hasAccess = roles?.some((r) => r.role === "technician" || r.role === "admin");
    if (!hasAccess) { navigate("/dashboard"); toast.error("Accès réservé aux techniciens"); return; }
    setUserId(session.user.id);
    setAuthorized(true);
    loadAll(session.user.id);
  };

  const loadAll = async (uid: string) => {
    const [{ data: claims }, { data: repairs }, { data: parts }] = await Promise.all([
      (supabase as any).from("warranty_claims").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("repair_orders").select("*").eq("technician_id", uid).order("created_at", { ascending: false }),
      (supabase as any).from("spare_parts").select("*").order("name"),
    ]);
    setQueue((claims || []).filter((c: WarrantyClaim) => !c.technician_id));
    const claimMap: Record<string, WarrantyClaim> = {};
    (claims || []).forEach((c: WarrantyClaim) => { claimMap[c.id] = c; });
    setMyRepairs((repairs || []).map((r: RepairOrder) => ({ ...r, claim: claimMap[r.claim_id] })));
    setSpareParts(parts || []);
  };

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`technician-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "warranty_claims" }, () => loadAll(userId))
      .on("postgres_changes", { event: "*", schema: "public", table: "repair_orders", filter: `technician_id=eq.${userId}` }, () => loadAll(userId))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const openRepair = (r: RepairWithClaim) => {
    setActiveRepair(r);
    setSelectedParts(r.parts_used || []);
    setNotes("");
  };

  const togglePart = (id: string) => {
    setSelectedParts((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const updateRepair = async (status: "in_progress" | "completed") => {
    if (!activeRepair) return;
    setSaving(true);
    const { error } = await (supabase as any).rpc("technician_update_repair", {
      _repair_id: activeRepair.id,
      _status: status,
      _parts_used: selectedParts,
      _technician_notes: notes || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message || "Échec de la mise à jour"); return; }
    toast.success(status === "completed" ? "Réparation terminée !" : "Réparation en cours");
    setActiveRepair(null);
    if (userId) loadAll(userId);
  };

  if (!authorized) return null;

  const sortedQueue = [...queue].sort((a, b) => (a.claim_type === "swap_48h" ? -1 : 1) - (b.claim_type === "swap_48h" ? -1 : 1));

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft size={16} /></Button>
          <img src={logo} alt="" className="h-8" />
          <h1 className="font-display text-xl font-bold flex items-center gap-2"><Wrench className="text-primary" /> Moisson Repair Hub</h1>
        </div>
        <CareSwapNotificationsBell />
      </div>

      <h2 className="font-display font-bold mb-3">Mes réparations assignées ({myRepairs.filter(r => r.repair_status !== "completed").length})</h2>
      {myRepairs.filter(r => r.repair_status !== "completed").length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8 glass-card rounded-xl mb-8">Aucune réparation assignée pour le moment.</p>
      ) : (
        <div className="space-y-3 mb-8">
          {myRepairs.filter(r => r.repair_status !== "completed").map((r) => (
            <div key={r.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  {r.claim && <Badge className={`text-[10px] mr-1 ${claimTypeConfig[r.claim.claim_type].color} text-white`}>{claimTypeConfig[r.claim.claim_type].label}</Badge>}
                  <p className="text-sm mt-1">{r.claim?.issue_description}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{r.repair_status === "assigned" ? "À démarrer" : "En cours"}</Badge>
              </div>
              <Button size="sm" onClick={() => openRepair(r)} className="bg-gradient-purple font-display text-xs">
                <ListChecks size={13} className="mr-1" /> Gérer la réparation
              </Button>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-display font-bold mb-3 text-muted-foreground">File d'attente globale ({sortedQueue.length})</h2>
      <p className="text-xs text-muted-foreground mb-3">Ces demandes attendent une assignation par l'administrateur.</p>
      <div className="space-y-2">
        {sortedQueue.map((c) => (
          <div key={c.id} className="rounded-lg border border-border p-3 flex items-center justify-between opacity-80">
            <div>
              <Badge className={`text-[10px] mr-1 ${claimTypeConfig[c.claim_type].color} text-white`}>{claimTypeConfig[c.claim_type].label}</Badge>
              <span className="text-xs text-muted-foreground ml-1">{c.issue_description}</span>
            </div>
            <Badge className={`text-[10px] ${claimStatusConfig[c.status].color} text-white`}>{claimStatusConfig[c.status].label}</Badge>
          </div>
        ))}
      </div>

      <Dialog open={!!activeRepair} onOpenChange={(o) => !o && setActiveRepair(null)}>
        <DialogContent className="max-w-md glass-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-gradient-gold">Diagnostic & Réparation</DialogTitle></DialogHeader>
          {activeRepair && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{activeRepair.claim?.issue_description}</p>

              <div>
                <p className="text-xs font-bold mb-2">Pièces détachées utilisées</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {spareParts.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-muted/40 cursor-pointer">
                      <Checkbox checked={selectedParts.includes(p.id)} onCheckedChange={() => togglePart(p.id)} />
                      <span className="flex-1">{p.name} {p.model_compatibility ? `(${p.model_compatibility})` : ""}</span>
                      <span className={p.stock_quantity <= p.low_stock_threshold ? "text-destructive font-bold" : "text-muted-foreground"}>
                        {p.stock_quantity} en stock
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold mb-1">Notes techniques</p>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="bg-input border-border" />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" disabled={saving} onClick={() => updateRepair("in_progress")} className="flex-1 font-display text-xs">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : "Marquer en cours"}
                </Button>
                <Button disabled={saving} onClick={() => updateRepair("completed")} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-display text-xs">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <><PackageCheck size={14} className="mr-1" /> Terminer</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TechnicianDashboard;
