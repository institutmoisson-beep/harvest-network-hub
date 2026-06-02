import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trophy, DollarSign, Award } from "lucide-react";
import { toast } from "sonner";

interface Row {
  user_id: string;
  first_name: string;
  last_name: string;
  referral_code: string;
  country: string | null;
  total_revenue: number;
  active_referrals: number;
  downline_size: number;
  grade_id: string | null;
  grade_name: string | null;
  weekly_bonus: number;
  monthly_bonus: number;
}

interface Grade { id: string; name: string; weekly_bonus: number; monthly_bonus: number; }

const StaffCareer = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [gradeOpen, setGradeOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [target, setTarget] = useState<Row | null>(null);
  const [gradeId, setGradeId] = useState<string>("");
  const [weekly, setWeekly] = useState<number>(0);
  const [monthly, setMonthly] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payPeriod, setPayPeriod] = useState<"weekly" | "monthly">("weekly");

  const load = async () => {
    setLoading(true);
    const [{ data: u }, { data: g }] = await Promise.all([
      (supabase as any).rpc("list_users_for_career"),
      supabase.from("career_grades").select("id, name, weekly_bonus, monthly_bonus").eq("is_active", true).order("display_order"),
    ]);
    setRows((u as Row[]) || []);
    setGrades((g as Grade[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openGrade = (r: Row) => {
    setTarget(r); setGradeId(r.grade_id || ""); setWeekly(Number(r.weekly_bonus) || 0);
    setMonthly(Number(r.monthly_bonus) || 0); setNotes(""); setGradeOpen(true);
  };
  const openPay = (r: Row) => {
    setTarget(r); setPayAmount(Number(r.weekly_bonus) || 0); setPayPeriod("weekly"); setNotes(""); setPayOpen(true);
  };

  const saveGrade = async () => {
    if (!target) return;
    const { error } = await (supabase as any).rpc("admin_set_user_grade", {
      _user_id: target.user_id,
      _grade_id: gradeId || null,
      _weekly: weekly,
      _monthly: monthly,
      _notes: notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Grade attribué"); setGradeOpen(false); await load();
  };

  const pay = async () => {
    if (!target || !payAmount) { toast.error("Montant requis"); return; }
    const { error } = await (supabase as any).rpc("admin_pay_career_bonus", {
      _user_id: target.user_id, _amount: payAmount, _period: payPeriod, _notes: notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Bonus payé sur le portefeuille"); setPayOpen(false); await load();
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return !q || `${r.first_name} ${r.last_name} ${r.referral_code} ${r.country || ""}`.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard"><Button variant="outline" size="sm"><ArrowLeft size={14} /></Button></Link>
        <h1 className="font-display text-xl font-bold flex items-center gap-2"><Trophy size={22} className="text-secondary" /> Gestion Plan de Carrière</h1>
        <Link to="/admin/career" className="ml-auto"><Button variant="outline" size="sm">Gérer les grades</Button></Link>
      </div>

      <div className="glass-card rounded-xl p-4 mb-4">
        <Input placeholder="Rechercher par nom, code MSN, pays…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="glass-card rounded-xl p-4">
        {loading ? <p className="text-sm text-muted-foreground">Chargement…</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>MSN</TableHead>
                <TableHead>CA</TableHead>
                <TableHead>Filleuls actifs</TableHead>
                <TableHead>Réseau</TableHead>
                <TableHead>Grade actuel</TableHead>
                <TableHead>Bonus hebdo</TableHead>
                <TableHead>Bonus mensuel</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.user_id}>
                  <TableCell className="font-medium">{r.first_name} {r.last_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.referral_code}</TableCell>
                  <TableCell>{Number(r.total_revenue).toLocaleString()}</TableCell>
                  <TableCell>{r.active_referrals}</TableCell>
                  <TableCell>{r.downline_size}</TableCell>
                  <TableCell>{r.grade_name || <span className="text-muted-foreground italic">—</span>}</TableCell>
                  <TableCell>{Number(r.weekly_bonus).toLocaleString()}</TableCell>
                  <TableCell>{Number(r.monthly_bonus).toLocaleString()}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => openGrade(r)}><Award size={14} className="mr-1" /> Grade</Button>
                    <Button size="sm" className="bg-gradient-purple" onClick={() => openPay(r)}><DollarSign size={14} className="mr-1" /> Payer</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Aucun utilisateur</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle>Attribuer un grade — {target?.first_name} {target?.last_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Grade</label>
              <Select value={gradeId || "none"} onValueChange={v => {
                const id = v === "none" ? "" : v;
                setGradeId(id);
                const sel = grades.find(g => g.id === id);
                if (sel) { setWeekly(Number(sel.weekly_bonus)); setMonthly(Number(sel.monthly_bonus)); }
              }}>
                <SelectTrigger><SelectValue placeholder="Choisir un grade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucun (auto) —</SelectItem>
                  {grades.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Bonus hebdo</label>
                <Input type="number" value={weekly} onChange={e => setWeekly(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Bonus mensuel</label>
                <Input type="number" value={monthly} onChange={e => setMonthly(Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Notes</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <Button className="w-full bg-gradient-purple" onClick={saveGrade}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle>Payer un bonus — {target?.first_name} {target?.last_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Période</label>
              <Select value={payPeriod} onValueChange={v => setPayPeriod(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Montant (FCFA)</label>
              <Input type="number" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Notes</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <Button className="w-full bg-gradient-purple" onClick={pay}><DollarSign size={14} className="mr-1" /> Créditer le portefeuille</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffCareer;