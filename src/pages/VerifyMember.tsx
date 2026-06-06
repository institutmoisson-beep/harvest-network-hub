import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const VerifyMember = () => {
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const token = params.get("token");

  useEffect(() => {
    (async () => {
      if (!token) { setError("Token manquant"); setLoading(false); return; }
      const { data, error: e } = await (supabase as any).rpc("verify_member_token", { _token: token });
      if (e || !data || data.length === 0) { setError("Code inconnu ou invalide"); }
      else setResult(data[0]);
      setLoading(false);
    })();
  }, [token]);

  const ok = result && result.is_system_active && result.account_status === "active";
  const warning = result && !ok;

  return (
    <div className="p-6 max-w-md mx-auto">
      <Link to="/dashboard"><Button variant="outline" size="sm" className="mb-4"><ArrowLeft size={14} /></Button></Link>
      {loading ? (
        <p className="text-sm text-muted-foreground">Vérification…</p>
      ) : error ? (
        <div className="rounded-xl p-6 bg-red-600 text-white text-center animate-pulse">
          <XCircle size={48} className="mx-auto mb-2" />
          <p className="font-display text-lg font-bold">Risque de contrefaçon ❌</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : ok ? (
        <div className="rounded-xl p-6 bg-green-600 text-white text-center">
          {result.avatar_url ? <img src={result.avatar_url} alt="" className="w-24 h-24 rounded-full mx-auto border-4 border-white object-cover mb-3" /> :
            <div className="w-24 h-24 rounded-full mx-auto border-4 border-white bg-white/20 flex items-center justify-center text-3xl font-bold mb-3">{result.first_name[0]}</div>}
          <p className="font-display text-xl font-bold">{result.first_name} {result.last_name}</p>
          <p className="text-xs mt-1 opacity-90">{result.id_moissonneur}</p>
          <p className="text-xs opacity-90 capitalize">{result.career_level} · {result.country}</p>
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-white/20 backdrop-blur font-display font-bold">
            <CheckCircle2 /> VÉRIFIÉ ✅
          </div>
        </div>
      ) : warning && (
        <div className="rounded-xl p-6 bg-orange-500 text-white text-center">
          <AlertTriangle size={48} className="mx-auto mb-2" />
          <p className="font-display text-lg font-bold">{result.first_name} {result.last_name}</p>
          <p className="text-sm mt-2">Adhésion non active ({result.account_status}).</p>
        </div>
      )}
    </div>
  );
};

export default VerifyMember;