import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Ban, CheckCircle2, AlertTriangle } from "lucide-react";

interface Props { countryFilter?: string; allowActions?: boolean; }

const StaffUsersTable = ({ countryFilter, allowActions = false }: Props) => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await (supabase as any).rpc("list_users_for_staff", { _country: countryFilter || null });
    setUsers(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, [countryFilter]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).rpc("set_account_status", { _user_id: id, _status: status });
    if (error) { toast.error(error.message); return; }
    toast.success("Statut mis à jour"); load();
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.first_name?.toLowerCase().includes(q) || u.last_name?.toLowerCase().includes(q) || u.referral_code?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-3">
      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher (nom, code MSN, email)..." className="max-w-md" />
      {loading ? <p>Chargement...</p> : (
        <div className="glass-card rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>MLM</TableHead>
                {allowActions && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.first_name} {u.last_name}<br/><span className="text-xs text-muted-foreground">{u.email}</span></TableCell>
                  <TableCell><Badge variant="outline">{u.referral_code}</Badge></TableCell>
                  <TableCell>{u.country || "—"}</TableCell>
                  <TableCell>{u.phone || "—"}</TableCell>
                  <TableCell>
                    {u.account_status === "active" ? <Badge className="bg-green-600">Actif</Badge>
                      : u.account_status === "suspended" ? <Badge className="bg-yellow-600">Suspendu</Badge>
                      : <Badge className="bg-destructive">Bloqué</Badge>}
                  </TableCell>
                  <TableCell>{u.is_system_active ? "✅" : "—"}</TableCell>
                  {allowActions && (
                    <TableCell className="space-x-1">
                      {u.account_status !== "active" && <Button size="sm" variant="ghost" title="Réactiver" onClick={() => setStatus(u.id, "active")}><CheckCircle2 size={14} className="text-green-600" /></Button>}
                      {u.account_status !== "suspended" && <Button size="sm" variant="ghost" title="Suspendre" onClick={() => setStatus(u.id, "suspended")}><AlertTriangle size={14} className="text-yellow-600" /></Button>}
                      {u.account_status !== "blocked" && <Button size="sm" variant="ghost" title="Bloquer" onClick={() => setStatus(u.id, "blocked")}><Ban size={14} className="text-destructive" /></Button>}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default StaffUsersTable;