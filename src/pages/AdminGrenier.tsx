import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, DollarSign, Sprout, Pencil, ScrollText, Activity } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string; title: string; category: string; description: string;
  global_target: number; share_price: number; total_shares: number; shares_sold: number;
  estimated_roi: number; status: string; cover_image: string | null;
}

const empty: Partial<Project> = {
  title: "", category: "Agrobusiness", description: "", global_target: 0,
  share_price: 10000, total_shares: 0, estimated_roi: 0, status: "collecte", cover_image: "",
};

const AdminGrenier = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Project>>(empty);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [active, setActive] = useState<Project | null>(null);
  const [revenue, setRevenue] = useState(0);
  const [payoutNote, setPayoutNote] = useState("");
  const [journal, setJournal] = useState({ title: "", content: "", image_url: "" });

  const load = async () => {
    const { data } = await supabase.from("moisson_projects").select("*").order("created_at", { ascending: false });
    setProjects((data as Project[]) || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title?.trim()) { toast.error("Titre requis"); return; }
    const payload = {
      title: form.title,
      category: form.category || "Autre",
      description: form.description || "",
      global_target: Number(form.global_target) || 0,
      share_price: Number(form.share_price) || 10000,
      total_shares: Number(form.total_shares) || 0,
      estimated_roi: Number(form.estimated_roi) || 0,
      status: form.status || "collecte",
      cover_image: form.cover_image || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = form.id
      ? await supabase.from("moisson_projects").update(payload).eq("id", form.id)
      : await supabase.from("moisson_projects").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Projet enregistré");
    setOpen(false); await load();
  };

  const changeStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("moisson_projects").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Statut mis à jour"); await load(); }
  };

  const distribute = async () => {
    if (!active || revenue <= 0) { toast.error("Montant requis"); return; }
    const { data, error } = await (supabase as any).rpc("distribute_dividends", { _project_id: active.id, _total_revenue: revenue, _note: payoutNote || null });
    if (error) { toast.error(error.message); return; }
    toast.success(`${data?.[0]?.investors_paid || 0} investisseur(s) crédité(s) — ${Number(data?.[0]?.total_paid || 0).toLocaleString()} FCFA`);
    setPayoutOpen(false); setRevenue(0); setPayoutNote(""); await load();
  };

  const addJournal = async () => {
    if (!active || !journal.title.trim()) { toast.error("Titre requis"); return; }
    const { error } = await (supabase as any).rpc("add_project_update", {
      _project_id: active.id, _title: journal.title, _content: journal.content, _image_url: journal.image_url || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Mise à jour publiée");
    setJournalOpen(false); setJournal({ title: "", content: "", image_url: "" }); await load();
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link to="/admin"><Button variant="outline" size="sm"><ArrowLeft size={14} /></Button></Link>
        <h1 className="font-display text-xl font-bold flex items-center gap-2"><Sprout size={22} className="text-secondary" /> Orchestration — Le Grenier</h1>
        <Button className="ml-auto bg-gradient-purple" onClick={() => { setForm(empty); setOpen(true); }}><Plus size={14} className="mr-1" /> Nouveau projet</Button>
      </div>

      <Card className="glass-card p-4">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Projet</TableHead><TableHead>Catégorie</TableHead><TableHead>Parts</TableHead>
            <TableHead>ROI</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {projects.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                <TableCell>{p.shares_sold}/{p.total_shares}</TableCell>
                <TableCell>{p.estimated_roi}%</TableCell>
                <TableCell>
                  <Select value={p.status} onValueChange={v => changeStatus(p.id, v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collecte">Collecte</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="distribution">Distribution</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="flex gap-1 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => { setForm(p); setOpen(true); }}><Pencil size={12} /></Button>
                  <Button size="sm" variant="outline" onClick={() => { setActive(p); setJournalOpen(true); }}><Activity size={12} className="mr-1" /> Journal</Button>
                  <Button size="sm" className="bg-gradient-gold text-secondary-foreground" onClick={() => { setActive(p); setPayoutOpen(true); }}><DollarSign size={12} className="mr-1" /> Distribuer</Button>
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucun projet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      {/* New / Edit project */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card border-border max-w-2xl">
          <DialogHeader><DialogTitle>{form.id ? "Modifier" : "Nouveau"} projet</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-xs">Titre</label><Input value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><label className="text-xs">Catégorie</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cinéma">Cinéma</SelectItem>
                  <SelectItem value="Agrobusiness">Agrobusiness</SelectItem>
                  <SelectItem value="Tech">Tech</SelectItem>
                  <SelectItem value="Immobilier">Immobilier</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs">Image (URL)</label><Input value={form.cover_image || ""} onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))} /></div>
            <div className="col-span-2"><label className="text-xs">Description</label><Textarea rows={4} value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><label className="text-xs">Objectif global (FCFA)</label><Input type="number" value={form.global_target ?? 0} onChange={e => setForm(f => ({ ...f, global_target: Number(e.target.value) }))} /></div>
            <div><label className="text-xs">Prix d'une part (FCFA)</label><Input type="number" value={form.share_price ?? 10000} onChange={e => setForm(f => ({ ...f, share_price: Number(e.target.value) }))} /></div>
            <div><label className="text-xs">Total de parts</label><Input type="number" value={form.total_shares ?? 0} onChange={e => setForm(f => ({ ...f, total_shares: Number(e.target.value) }))} /></div>
            <div><label className="text-xs">ROI estimé (%)</label><Input type="number" value={form.estimated_roi ?? 0} onChange={e => setForm(f => ({ ...f, estimated_roi: Number(e.target.value) }))} /></div>
          </div>
          <Button onClick={save} className="bg-gradient-purple">Enregistrer</Button>
        </DialogContent>
      </Dialog>

      {/* Payout */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle>Distribuer les dividendes — {active?.title}</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Les revenus seront répartis automatiquement au prorata des parts détenues ({active?.shares_sold} parts vendues).</p>
          <div><label className="text-xs">Revenus totaux générés (FCFA)</label><Input type="number" value={revenue} onChange={e => setRevenue(Number(e.target.value))} /></div>
          <div><label className="text-xs">Note (optionnel)</label><Input value={payoutNote} onChange={e => setPayoutNote(e.target.value)} placeholder="Distribution T1 2026..." /></div>
          <Button onClick={distribute} className="bg-gradient-gold text-secondary-foreground"><DollarSign size={14} className="mr-1" /> Lancer la distribution</Button>
        </DialogContent>
      </Dialog>

      {/* Journal */}
      <Dialog open={journalOpen} onOpenChange={setJournalOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle>Mise à jour Journal — {active?.title}</DialogTitle></DialogHeader>
          <div><label className="text-xs">Titre</label><Input value={journal.title} onChange={e => setJournal(j => ({ ...j, title: e.target.value }))} placeholder="Début du tournage à Abidjan" /></div>
          <div><label className="text-xs">Contenu</label><Textarea rows={4} value={journal.content} onChange={e => setJournal(j => ({ ...j, content: e.target.value }))} /></div>
          <div><label className="text-xs">Image (URL, optionnel)</label><Input value={journal.image_url} onChange={e => setJournal(j => ({ ...j, image_url: e.target.value }))} /></div>
          <Button onClick={addJournal} className="bg-gradient-purple"><ScrollText size={14} className="mr-1" /> Publier</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGrenier;