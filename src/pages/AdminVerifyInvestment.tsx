import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ArrowLeft, Search, Download } from "lucide-react";
import { openInvestmentDoc } from "@/utils/generateInvestmentDoc";

const AdminVerifyInvestment = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);

  const verify = async () => {
    if (!code.trim()) return;
    setLoading(true); setResult(null); setNotFound(false);
    const { data, error } = await (supabase as any).rpc("verify_investment_document", { _operation_id: code.trim() });
    setLoading(false);
    if (error) { setNotFound(true); return; }
    const row = Array.isArray(data) && data.length ? data[0] : null;
    if (!row) { setNotFound(true); return; }
    setResult(row);
  };

  const download = () => {
    if (!result) return;
    openInvestmentDoc({
      operationId: result.operation_id,
      investmentDate: result.investment_date,
      userName: result.user_name?.trim() || "Moissonneur",
      userReferralCode: result.user_referral_code || "",
      userIdMoissonneur: result.id_moissonneur || "",
      userPhone: result.user_phone || "",
      userEmail: result.user_email || "",
      projectTitle: result.project_title,
      projectCategory: result.project_category,
      totalShares: result.total_shares,
      availableBefore: result.available_before ?? result.total_shares,
      sharesPurchased: result.shares_purchased,
      totalAmount: Number(result.total_amount_invested),
      percentageAcquired: Number(result.percentage_acquired),
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/admin"><Button variant="outline" size="sm" className="mb-4"><ArrowLeft size={14} className="mr-1" /> Retour</Button></Link>
        <h1 className="font-display text-2xl font-bold mb-2 flex items-center gap-2"><ShieldCheck size={22} className="text-primary" /> Vérification d'un Titre / Reçu</h1>
        <p className="text-sm text-muted-foreground mb-6">Entrez l'identifiant unique du document (ex : <code>MS-RECP-2026-89412</code>) pour vérifier son authenticité auprès du GIE.</p>

        <Card className="p-5 mb-6">
          <div className="flex gap-2">
            <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && verify()} placeholder="MS-RECP-2026-89412" className="text-sm font-mono" />
            <Button onClick={verify} disabled={loading} className="bg-primary text-primary-foreground">
              <Search size={14} className="mr-1" /> {loading ? "…" : "Vérifier"}
            </Button>
          </div>
        </Card>

        {notFound && (
          <Card className="p-6 border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert size={28} className="text-red-600" />
              <Badge className="bg-red-600 text-white uppercase tracking-widest">Alerte : Document introuvable ou falsifié</Badge>
            </div>
            <p className="text-sm text-red-800 dark:text-red-200">Aucun titre correspondant à cet identifiant n'a été trouvé dans le registre du GIE.</p>
          </Card>
        )}

        {result && (
          <Card className="p-6 border-2 border-green-600 bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={28} className="text-green-600" />
              <Badge className="bg-green-600 text-white uppercase tracking-widest">Document authentique & valide</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div><span className="text-muted-foreground">Identifiant :</span> <code className="font-bold">{result.operation_id}</code></div>
              <div><span className="text-muted-foreground">Date :</span> <strong>{new Date(result.investment_date).toLocaleString("fr-FR")}</strong></div>
              <div><span className="text-muted-foreground">Membre :</span> <strong>{result.user_name}</strong></div>
              <div><span className="text-muted-foreground">Code Moissonneur :</span> <strong>{result.user_referral_code || "—"}</strong></div>
              <div><span className="text-muted-foreground">N° Moissonneur :</span> <strong>{result.id_moissonneur || "—"}</strong></div>
              <div><span className="text-muted-foreground">Téléphone :</span> <strong>{result.user_phone || "—"}</strong></div>
              <div className="sm:col-span-2"><span className="text-muted-foreground">Projet :</span> <strong>{result.project_title}</strong> <span className="text-xs text-muted-foreground">({result.project_category})</span></div>
              <div><span className="text-muted-foreground">Parts acquises :</span> <strong>{result.shares_purchased} / {result.total_shares}</strong></div>
              <div><span className="text-muted-foreground">Quote-part :</span> <strong>{Number(result.percentage_acquired).toFixed(4).replace(/\.?0+$/, "")} %</strong></div>
              <div className="sm:col-span-2"><span className="text-muted-foreground">Montant :</span> <strong className="text-lg text-primary">{Number(result.total_amount_invested).toLocaleString()} FCFA</strong></div>
            </div>
            <div className="mt-4">
              <Button onClick={download} className="bg-gradient-gold text-secondary-foreground text-xs">
                <Download size={14} className="mr-1" /> Ouvrir l'Acte de Propriété
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminVerifyInvestment;