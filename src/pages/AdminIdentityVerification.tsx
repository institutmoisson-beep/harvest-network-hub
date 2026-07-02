import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ShieldAlert, ArrowLeft } from "lucide-react";
import { getSignedUrl } from "@/utils/imageCompression";
import { toast } from "sonner";

const AdminIdentityVerification = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [signed, setSigned] = useState<Record<string, { avatar?: string; front?: string; back?: string }>>({});
  const [reason, setReason] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("admin_list_identity_submissions");
    if (error) { toast.error(error.message); setLoading(false); return; }
    setRows(data || []);
    const map: Record<string, any> = {};
    for (const r of (data || [])) {
      map[r.user_id] = {
        avatar: r.avatar_url ? await getSignedUrl("avatars", r.avatar_url, 3600) : null,
        front: r.id_photo_front ? await getSignedUrl("identity-docs", r.id_photo_front, 3600) : null,
        back: r.id_photo_back ? await getSignedUrl("identity-docs", r.id_photo_back, 3600) : null,
      };
    }
    setSigned(map); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setVerified = async (id: string, verified: boolean) => {
    const { error } = await (supabase as any).rpc("admin_set_identity_verified", { _user_id: id, _verified: verified, _reason: verified ? null : (reason[id] || null) });
    if (error) { toast.error(error.message); return; }
    toast.success(verified ? "Compte vérifié" : "Vérification refusée");
    load();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <Link to="/admin"><Button variant="outline" size="sm" className="mb-4"><ArrowLeft size={14} className="mr-1" /> Retour</Button></Link>
        <h1 className="font-display text-2xl font-bold mb-6 flex items-center gap-2"><ShieldCheck size={22} className="text-primary" /> Vérification des identités</h1>
        {loading ? <p className="text-sm text-muted-foreground">Chargement…</p> : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune soumission pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {rows.map(r => {
              const s = signed[r.user_id] || {};
              return (
                <Card key={r.user_id} className="p-4">
                  <div className="flex justify-between flex-wrap gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {s.avatar ? <img src={s.avatar} className="w-12 h-12 rounded-full object-cover border" alt="" /> : <div className="w-12 h-12 rounded-full bg-muted" />}
                      <div>
                        <p className="font-bold">{r.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{r.email} · {r.phone || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">Code: {r.referral_code} · N° {r.id_moissonneur}</p>
                      </div>
                    </div>
                    {r.identity_verified
                      ? <Badge className="bg-green-600 text-white h-fit"><ShieldCheck size={12} className="mr-1" /> Vérifié</Badge>
                      : <Badge variant="outline" className="h-fit"><ShieldAlert size={12} className="mr-1" /> En attente</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div><p className="text-xs mb-1">Recto</p>{s.front ? <a href={s.front} target="_blank" rel="noreferrer"><img src={s.front} alt="" className="w-full h-40 object-cover rounded border" /></a> : <p className="text-xs text-muted-foreground">Non fournie</p>}</div>
                    <div><p className="text-xs mb-1">Verso</p>{s.back ? <a href={s.back} target="_blank" rel="noreferrer"><img src={s.back} alt="" className="w-full h-40 object-cover rounded border" /></a> : <p className="text-xs text-muted-foreground">Non fournie</p>}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button size="sm" onClick={() => setVerified(r.user_id, true)} className="bg-green-600 text-white"><ShieldCheck size={14} className="mr-1" /> Activer le compte vérifié</Button>
                    <Input placeholder="Motif du refus (optionnel)" value={reason[r.user_id] || ""} onChange={e => setReason(p => ({ ...p, [r.user_id]: e.target.value }))} className="max-w-xs text-xs" />
                    <Button size="sm" variant="outline" onClick={() => setVerified(r.user_id, false)}>Refuser</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminIdentityVerification;