import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

const emptyForm = { name: "", type: "boutique", country: "", city: "", address: "", phone: "", responsible_name: "", is_active: true };

const AdminRelays = () => {
  const navigate = useNavigate();
  const [relays, setRelays] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await (supabase as any).from("relay_points").select("*").order("country").order("city");
    setRelays(data || []);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      load();
    });
  }, [navigate]);

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...r }); setOpen(true); };

  const save = async () => {
    if (!form.name || !form.country || !form.city || !form.address) {
      toast.error("Nom, pays, ville et adresse requis"); return;
    }
    if (editing) {
      const { error } = await (supabase as any).from("relay_points").update(form).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Relais mis à jour");
    } else {
      const { error } = await (supabase as any).from("relay_points").insert(form);
      if (error) { toast.error(error.message); return; }
      toast.success("Relais créé");
    }
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce relais ?")) return;
    const { error } = await (supabase as any).from("relay_points").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Supprimé"); load();
  };

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><MapPin className="text-primary" /> Points de relais</h1>
        <Button onClick={openNew} className="bg-gradient-purple"><Plus size={16} /> Nouveau</Button>
      </div>

      {loading ? <p>Chargement...</p> : (
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pays/Ville</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relays.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}<br/><span className="text-xs text-muted-foreground">{r.address}</span></TableCell>
                  <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                  <TableCell>{r.country} / {r.city}</TableCell>
                  <TableCell>{r.phone || "-"}</TableCell>
                  <TableCell>{r.is_active ? <Badge className="bg-green-600">Actif</Badge> : <Badge variant="outline">Inactif</Badge>}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Edit size={14} /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 size={14} className="text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouveau"} point de relais</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Type</Label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="boutique">Boutique</option>
                  <option value="maquis">Maquis</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div><Label>Téléphone</Label><Input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Pays *</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
              <div><Label>Ville *</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            </div>
            <div><Label>Adresse *</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>Responsable</Label><Input value={form.responsible_name || ""} onChange={e => setForm({ ...form, responsible_name: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Actif
            </label>
            <Button onClick={save} className="w-full bg-gradient-purple">Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRelays;