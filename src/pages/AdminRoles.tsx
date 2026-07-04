import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ROLES = [
  { value: "admin", label: "Administrateur" },
  { value: "pack_manager", label: "Gestion Packs" },
  { value: "financier", label: "Financier" },
  { value: "partner_manager", label: "Gestion Partenaires" },
  { value: "communication", label: "Communication" },
  { value: "zone_harvester", label: "Moissonneur de Zone" },
  { value: "country_harvester", label: "Moissonneur de Pays" },
  { value: "city_harvester", label: "Moissonneur de Ville" },
  { value: "emergency_admin", label: "Admin Urgences" },
  { value: "hr_manager", label: "Ressources Humaines" },
  { value: "delivery_manager", label: "Gestion Livraison" },
  { value: "identity_verifier", label: "Vérificateur d'identité" },
  { value: "title_verifier", label: "Vérificateur de titres" },
  { value: "grenier_manager", label: "Gestionnaire du Grenier" },
];

const AdminRoles = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [role, setRole] = useState("zone_harvester");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  const load = async () => {
    const { data } = await (supabase as any).rpc("list_role_assignments");
    setAssignments(data || []);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      load();
    });
  }, [navigate]);

  const assign = async () => {
    if (!code) { toast.error("Code MSN requis"); return; }
    const { data: prof } = await (supabase as any).rpc("find_profile_by_code", { _code: code });
    if (!prof || prof.length === 0) { toast.error("Utilisateur introuvable"); return; }
    const { error } = await (supabase as any).rpc("assign_role", {
      _user_id: prof[0].id, _role: role, _country: country || null, _city: city || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Rôle attribué");
    setCode(""); setCountry(""); setCity("");
    load();
  };

  const revoke = async (user_id: string, role: string) => {
    if (!confirm("Retirer ce rôle ?")) return;
    const { error } = await (supabase as any).rpc("revoke_role", { _user_id: user_id, _role: role });
    if (error) { toast.error(error.message); return; }
    toast.success("Rôle retiré"); load();
  };

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-6 flex items-center gap-2"><Shield className="text-primary" /> Gestion des rôles</h1>

      <div className="glass-card rounded-xl p-4 mb-6 space-y-3">
        <h2 className="font-display font-bold">Attribuer un rôle</h2>
        <div className="grid md:grid-cols-5 gap-2">
          <div><Label className="text-xs">Code MSN</Label><Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="MSN123456" /></div>
          <div><Label className="text-xs">Rôle</Label>
            <select value={role} onChange={e => setRole(e.target.value)} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Pays (scope)</Label><Input value={country} onChange={e => setCountry(e.target.value)} placeholder="Optionnel" /></div>
          <div><Label className="text-xs">Ville (scope)</Label><Input value={city} onChange={e => setCity(e.target.value)} placeholder="Optionnel" /></div>
          <div className="flex items-end"><Button onClick={assign} className="w-full bg-gradient-purple">Attribuer</Button></div>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membre</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Attribué le</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map(a => (
              <TableRow key={a.id}>
                <TableCell>{a.first_name} {a.last_name}</TableCell>
                <TableCell><Badge variant="outline">{a.referral_code}</Badge></TableCell>
                <TableCell><Badge>{ROLES.find(r => r.value === a.role)?.label || a.role}</Badge></TableCell>
                <TableCell className="text-xs">{a.country || "—"} {a.city ? `/ ${a.city}` : ""}</TableCell>
                <TableCell className="text-xs">{new Date(a.assigned_at).toLocaleDateString("fr-FR")}</TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={() => revoke(a.user_id, a.role)}><X size={14} className="text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminRoles;