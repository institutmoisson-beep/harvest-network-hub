import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Pencil, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";

interface Grade {
  id: string;
  name: string;
  description: string | null;
  min_revenue: number;
  min_active_referrals: number;
  min_downline_size: number;
  weekly_bonus: number;
  monthly_bonus: number;
  weekly_revenue_percentage: number;
  min_weekly_revenue: number;
  rewards_description: string | null;
  display_order: number;
  is_active: boolean;
}

const emptyGrade: Partial<Grade> = {
  name: "", description: "", min_revenue: 0, min_active_referrals: 0,
  min_downline_size: 0, weekly_bonus: 0, monthly_bonus: 0,
  weekly_revenue_percentage: 0, min_weekly_revenue: 0, rewards_description: "",
  display_order: 0, is_active: true,
};

const AdminCareer = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Grade>>(emptyGrade);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("career_grades").select("*").order("display_order");
    setGrades((data as Grade[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(emptyGrade); setOpen(true); };
  const openEdit = (g: Grade) => { setForm(g); setOpen(true); };

  const save = async () => {
    if (!form.name?.trim()) { toast.error("Le nom est requis"); return; }
    const { error } = await (supabase as any).rpc("admin_upsert_grade_v2", {
      _id: form.id || null,
      _name: form.name,
      _description: form.description || "",
      _min_revenue: Number(form.min_revenue) || 0,
      _min_active_referrals: Number(form.min_active_referrals) || 0,
      _min_downline_size: Number(form.min_downline_size) || 0,
      _weekly_bonus: Number(form.weekly_bonus) || 0,
      _monthly_bonus: Number(form.monthly_bonus) || 0,
      _weekly_revenue_percentage: Number(form.weekly_revenue_percentage) || 0,
      _min_weekly_revenue: Number(form.min_weekly_revenue) || 0,
      _rewards_description: form.rewards_description || "",
      _display_order: Number(form.display_order) || 0,
      _is_active: form.is_active ?? true,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Grade enregistré");
    setOpen(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce grade ?")) return;
    const { error } = await (supabase as any).rpc("admin_delete_grade", { _id: id });
    if (error) { toast.error(error.message); return; }
    toast.success("Supprimé");
    await load();
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin"><Button variant="outline" size="sm"><ArrowLeft size={14} /></Button></Link>
        <h1 className="font-display text-xl font-bold flex items-center gap-2"><Trophy size={22} className="text-secondary" /> Plan de Carrière — Grades</h1>
        <Button className="ml-auto bg-gradient-purple" onClick={openNew}><Plus size={14} className="mr-1" /> Nouveau grade</Button>
      </div>

      <div className="glass-card rounded-xl p-4">
        {loading ? <p className="text-sm text-muted-foreground">Chargement…</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordre</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>CA min</TableHead>
                <TableHead>Filleuls actifs</TableHead>
                <TableHead>Réseau</TableHead>
                <TableHead>Bonus hebdo</TableHead>
                <TableHead>Bonus mensuel</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map(g => (
                <TableRow key={g.id}>
                  <TableCell>{g.display_order}</TableCell>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell>{Number(g.min_revenue).toLocaleString()}</TableCell>
                  <TableCell>{g.min_active_referrals}</TableCell>
                  <TableCell>{g.min_downline_size}</TableCell>
                  <TableCell>{Number(g.weekly_bonus).toLocaleString()}</TableCell>
                  <TableCell>{Number(g.monthly_bonus).toLocaleString()}</TableCell>
                  <TableCell>{g.is_active ? <Badge className="bg-green-600">Oui</Badge> : <Badge variant="outline">Non</Badge>}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(g)}><Pencil size={14} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(g.id)}><Trash2 size={14} className="text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {grades.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Aucun grade défini</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl glass-card border-border">
          <DialogHeader><DialogTitle>{form.id ? "Modifier le grade" : "Nouveau grade"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Nom</label>
              <Input value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Description</label>
              <Textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">CA minimum (FCFA)</label>
              <Input type="number" value={form.min_revenue ?? 0} onChange={e => setForm(f => ({ ...f, min_revenue: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Filleuls actifs min</label>
              <Input type="number" value={form.min_active_referrals ?? 0} onChange={e => setForm(f => ({ ...f, min_active_referrals: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Taille réseau min</label>
              <Input type="number" value={form.min_downline_size ?? 0} onChange={e => setForm(f => ({ ...f, min_downline_size: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ordre d'affichage</label>
              <Input type="number" value={form.display_order ?? 0} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Bonus hebdomadaire (FCFA)</label>
              <Input type="number" value={form.weekly_bonus ?? 0} onChange={e => setForm(f => ({ ...f, weekly_bonus: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Bonus mensuel (FCFA)</label>
              <Input type="number" value={form.monthly_bonus ?? 0} onChange={e => setForm(f => ({ ...f, monthly_bonus: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">% sur CA hebdomadaire</label>
              <Input type="number" step="0.1" value={form.weekly_revenue_percentage ?? 0} onChange={e => setForm(f => ({ ...f, weekly_revenue_percentage: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">CA hebdo min requis (FCFA)</label>
              <Input type="number" value={form.min_weekly_revenue ?? 0} onChange={e => setForm(f => ({ ...f, min_weekly_revenue: Number(e.target.value) }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Cadeaux & récompenses (voiture, maison, assurance…)</label>
              <Textarea value={form.rewards_description || ""} onChange={e => setForm(f => ({ ...f, rewards_description: e.target.value }))} placeholder="Ex: Voiture neuve, assurance santé, vacances…" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch checked={form.is_active ?? true} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <span className="text-sm">Grade actif</span>
            </div>
          </div>
          <Button className="bg-gradient-purple" onClick={save}>Enregistrer</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCareer;