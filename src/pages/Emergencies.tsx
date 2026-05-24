import { useEffect, useState } from "react";
import { Siren, Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EmergencyChat from "@/components/EmergencyChat";

const FREQS = [
  { v: "ponctuelle", l: "Ponctuelle" },
  { v: "recurrente", l: "Récurrente" },
  { v: "quotidienne", l: "Quotidienne" },
  { v: "hebdomadaire", l: "Hebdomadaire" },
  { v: "urgente_critique", l: "Urgente critique" },
];

const statusColor = (s: string) => s === "resolved" ? "text-green-400" : s === "rejected" ? "text-red-400" : s === "in_progress" ? "text-yellow-400" : "text-primary";
const statusLabel = (s: string) => ({ open: "Ouverte", in_progress: "En cours", resolved: "Résolue", rejected: "Rejetée" }[s] || s);

const Emergencies = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", frequency: "ponctuelle", amount_requested: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data } = await supabase.from("emergencies").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setList(data || []);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!userId) return;
    if (!form.title.trim() || !form.description.trim()) { toast.error("Titre et description requis"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("emergencies").insert({
      user_id: userId, title: form.title, description: form.description,
      frequency: form.frequency as any,
      amount_requested: form.amount_requested ? parseFloat(form.amount_requested) : null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Urgence enregistrée. L'administrateur sera notifié.");
    setOpen(false);
    setForm({ title: "", description: "", frequency: "ponctuelle", amount_requested: "" });
    load();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-bold flex items-center gap-2">
          <Siren size={24} className="text-destructive" /> Mes Urgences
        </h1>
        <Button onClick={() => setOpen(true)} className="bg-gradient-purple text-xs">
          <Plus size={14} className="mr-1" /> Nouvelle
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center text-muted-foreground">
          <Siren size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Aucune urgence signalée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(e => (
            <div key={e.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm">{e.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted">{FREQS.find(f => f.v === e.frequency)?.l}</span>
                    {e.amount_requested && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">{Number(e.amount_requested).toLocaleString()} FCFA</span>}
                    <span className={`text-[10px] font-bold ${statusColor(e.status)}`}>● {statusLabel(e.status)}</span>
                  </div>
                  {e.admin_note && <p className="text-xs italic text-foreground/80 mt-2 p-2 rounded bg-muted/40">Admin : {e.admin_note}</p>}
                </div>
                <Button size="sm" variant="outline" onClick={() => setChatId(e.id)} className="text-xs shrink-0">
                  <MessageCircle size={12} className="mr-1" /> Discuter
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{new Date(e.created_at).toLocaleString("fr-FR")}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md glass-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><Siren size={20} className="text-destructive" /> Nouvelle urgence</DialogTitle>
            <DialogDescription>Décrivez votre situation. L'administrateur vous contactera.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Titre *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="mt-1 bg-input text-sm" /></div>
            <div><Label className="text-xs">Description *</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1 bg-input text-sm" rows={4} /></div>
            <div>
              <Label className="text-xs">Fréquence *</Label>
              <select value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}
                className="mt-1 w-full bg-input border border-border rounded-md text-sm p-2">
                {FREQS.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
              </select>
            </div>
            <div><Label className="text-xs">Montant souhaité (FCFA, optionnel)</Label><Input type="number" value={form.amount_requested} onChange={e => setForm(p => ({ ...p, amount_requested: e.target.value }))} className="mt-1 bg-input text-sm" /></div>
            <Button onClick={submit} disabled={submitting} className="w-full bg-gradient-purple font-display font-bold">
              {submitting ? "Envoi..." : "Soumettre l'urgence"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!chatId} onOpenChange={(o) => !o && setChatId(null)}>
        <DialogContent className="max-w-lg glass-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><MessageCircle size={18} /> Discussion avec l'admin</DialogTitle>
            <DialogDescription>Échangez en temps réel à propos de votre urgence.</DialogDescription>
          </DialogHeader>
          {chatId && userId && <EmergencyChat emergencyId={chatId} currentUserId={userId} isAdmin={false} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Emergencies;