import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getSignedUrl } from "@/utils/imageCompression";
import { PackageSearch, Eye, Check, XCircle, ShoppingCart, Store, ClipboardCheck, ChevronLeft, ChevronRight, Search, Download } from "lucide-react";
import { downloadCsv, inPeriod, PERIOD_OPTIONS, PeriodFilter } from "@/utils/exportCsv";

const STATUS_UI: Record<string, { label: string; cls: string }> = {
  pending:                  { label: "En attente",          cls: "bg-yellow-500/20 text-yellow-700 border-yellow-500/40" },
  under_review:             { label: "En examen",           cls: "bg-blue-500/20 text-blue-700 border-blue-500/40" },
  approved_direct_buy:      { label: "Achat direct",        cls: "bg-emerald-700/20 text-emerald-700 border-emerald-700/40" },
  approved_community_sale:  { label: "Vente communautaire", cls: "bg-green-400/20 text-green-700 border-green-500/40" },
  rejected:                 { label: "Refusé",              cls: "bg-red-500/20 text-red-700 border-red-500/40" },
};

const FILTERS = ["all", "pending", "under_review", "approved_direct_buy", "approved_community_sale", "rejected"];

const AdminSubmissions = () => {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [signedUrls, setSignedUrls] = useState<string[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [userFilter, setUserFilter] = useState("");

  const load = async () => {
    const { data, error } = await (supabase as any).rpc("admin_list_submissions", {
      _status: filter === "all" ? null : filter,
    });
    if (error) { toast.error(error.message); return; }
    setItems(data || []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  useEffect(() => {
    const channel = supabase.channel("product_submissions_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "product_submissions" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line
  }, [filter]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    const u = userFilter.toLowerCase();
    return items.filter((i: any) => {
      if (!inPeriod(i.created_at, period)) return false;
      if (u && !(`${i.first_name} ${i.last_name} ${i.referral_code} ${i.user_id}`.toLowerCase().includes(u))) return false;
      if (!search) return true;
      return (
        i.title?.toLowerCase().includes(s) ||
        i.first_name?.toLowerCase().includes(s) ||
        i.last_name?.toLowerCase().includes(s) ||
        i.referral_code?.toLowerCase().includes(s)
      );
    });
  }, [items, search, period, userFilter]);

  const exportCsv = () => {
    downloadCsv(
      `mises-a-disposition-${period}`,
      ["Date", "Moissonneur", "Code", "Titre", "Catégorie", "Quantité", "Unité", "Prix normal", "Prix gros", "Statut"],
      filtered.map((i: any) => [
        new Date(i.created_at).toLocaleString("fr-FR"),
        `${i.first_name || ""} ${i.last_name || ""}`.trim(),
        i.referral_code,
        i.title,
        i.category,
        i.quantity,
        i.unit_type,
        i.regular_price,
        i.wholesale_price,
        i.status,
      ]),
    );
  };

  const openDetail = async (row: any) => {
    setSelected(row);
    setCarouselIdx(0);
    setRejectMode(false);
    setRejectNote("");
    const urls: string[] = [];
    for (const p of row.images || []) {
      const u = await getSignedUrl("product-submissions", p, 3600);
      if (u) urls.push(u);
    }
    setSignedUrls(urls);
  };

  const updateStatus = async (status: string, notes?: string) => {
    if (!selected) return;
    const { error } = await (supabase as any).rpc("admin_update_submission_status", {
      _id: selected.id, _status: status, _notes: notes || null,
    });
    if (error) { toast.error(error.message); return; }
    const msg: Record<string, string> = {
      under_review: "Marqué comme en examen",
      approved_direct_buy: "Achat direct approuvé — le moissonneur sera contacté",
      approved_community_sale: "Produit publié pour la communauté",
      rejected: "Soumission refusée avec motif",
    };
    toast.success(msg[status] || "Statut mis à jour");
    setSelected(null);
    load();
  };

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-purple flex items-center justify-center text-primary-foreground">
          <PackageSearch size={22} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Mises à disposition</h1>
          <p className="text-sm text-muted-foreground">Validez, publiez ou refusez les soumissions des moissonneurs</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
              {f === "all" ? "Tous" : STATUS_UI[f]?.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-8" />
        </div>
      </div>

      {/* Barre d'export */}
      <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-display font-bold flex items-center gap-1"><Download size={12} /> Export</span>
        <select value={period} onChange={e => setPeriod(e.target.value as PeriodFilter)} className="text-xs rounded-md bg-input border border-border p-1">
          {PERIOD_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <Input placeholder="Filtrer par utilisateur / code" value={userFilter} onChange={e => setUserFilter(e.target.value)} className="h-7 text-xs w-56" />
        <Button size="sm" className="text-xs bg-gradient-gold text-secondary-foreground" onClick={exportCsv}>
          <Download size={12} className="mr-1" /> Télécharger CSV ({filtered.length})
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">Aucune soumission.</p>}
        {filtered.map((it) => {
          const ui = STATUS_UI[it.status] || STATUS_UI.pending;
          return (
            <Card key={it.id} className="rounded-2xl p-4 space-y-2 shadow-md hover:shadow-lg transition">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{it.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{it.first_name} {it.last_name} • {it.referral_code}</p>
                </div>
                <Badge className={`text-[10px] border ${ui.cls}`}>{ui.label}</Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>{it.quantity} {it.unit_type}</span>
                <span>{Number(it.regular_price).toLocaleString()} FCFA</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Gros: <b>{Number(it.wholesale_price).toLocaleString()} FCFA</b> • {it.category}
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={() => openDetail(it)}>
                <Eye size={14} /> Examiner
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.title}
                  <Badge className={`text-[10px] border ${(STATUS_UI[selected.status] || STATUS_UI.pending).cls}`}>
                    {(STATUS_UI[selected.status] || STATUS_UI.pending).label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              {/* Carousel */}
              {signedUrls.length > 0 ? (
                <div className="relative rounded-xl overflow-hidden bg-muted">
                  <img src={signedUrls[carouselIdx]} alt="" className="w-full h-64 object-contain bg-black/5" />
                  {signedUrls.length > 1 && (
                    <>
                      <button onClick={() => setCarouselIdx((i) => (i - 1 + signedUrls.length) % signedUrls.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1"><ChevronLeft size={18} /></button>
                      <button onClick={() => setCarouselIdx((i) => (i + 1) % signedUrls.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1"><ChevronRight size={18} /></button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] bg-background/80 rounded-full px-2 py-0.5">
                        {carouselIdx + 1} / {signedUrls.length}
                      </div>
                    </>
                  )}
                </div>
              ) : <div className="h-40 bg-muted rounded-xl flex items-center justify-center text-xs text-muted-foreground">Aucune image</div>}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><b>Moissonneur:</b><br />{selected.first_name} {selected.last_name}</div>
                <div><b>Code:</b><br />{selected.referral_code}</div>
                <div><b>Téléphone:</b><br />{selected.phone || "—"}</div>
                <div><b>Pays:</b><br />{selected.country || "—"}</div>
                <div><b>Catégorie:</b><br />{selected.category}</div>
                <div><b>Quantité:</b><br />{selected.quantity} {selected.unit_type}</div>
                <div><b>Prix normal:</b><br />{Number(selected.regular_price).toLocaleString()} FCFA</div>
                <div><b>Prix de gros:</b><br />{Number(selected.wholesale_price).toLocaleString()} FCFA</div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-1">Description</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.description || "—"}</p>
              </div>

              {selected.additional_info && Object.keys(selected.additional_info).length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-1">Spécifications</p>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/50 rounded-lg p-3">
                    {Object.entries(selected.additional_info).map(([k, v]) => (
                      <div key={k}><b className="capitalize">{k}:</b> {String(v)}</div>
                    ))}
                  </div>
                </div>
              )}

              {selected.admin_notes && (
                <div className="text-xs bg-yellow-500/10 border border-yellow-500/30 p-2 rounded-lg">
                  <b>Notes précédentes :</b> {selected.admin_notes}
                </div>
              )}

              {rejectMode ? (
                <div className="space-y-2">
                  <Label>Motif du refus *</Label>
                  <Textarea rows={3} value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                    placeholder="Expliquez la raison du refus…" />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setRejectMode(false)}>Annuler</Button>
                    <Button variant="destructive" className="flex-1"
                      onClick={() => rejectNote.trim() ? updateStatus("rejected", rejectNote.trim()) : toast.error("Motif requis")}>
                      <XCircle size={14} /> Confirmer le refus
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => updateStatus("under_review")}>
                    <ClipboardCheck size={14} /> Marquer en examen
                  </Button>
                  <Button className="bg-emerald-700 hover:bg-emerald-800 text-white"
                    onClick={() => updateStatus("approved_direct_buy")}>
                    <ShoppingCart size={14} /> Achat direct
                  </Button>
                  <Button className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => updateStatus("approved_community_sale")}>
                    <Store size={14} /> Vente communautaire
                  </Button>
                  <Button variant="destructive" onClick={() => setRejectMode(true)}>
                    <XCircle size={14} /> Refuser
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubmissions;