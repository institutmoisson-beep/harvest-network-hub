import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CarteIdentiteMoissonneur from "@/components/CarteIdentiteMoissonneur";
import { Button } from "@/components/ui/button";
import { ArrowLeft, IdCard, ScanLine } from "lucide-react";

const DashboardCard = () => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(data);
    })();
  }, []);

  if (!profile) return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link to="/dashboard"><Button variant="outline" size="sm"><ArrowLeft size={14} /></Button></Link>
        <h1 className="font-display text-xl font-bold flex items-center gap-2"><IdCard size={22} className="text-secondary" /> Ma Carte Moissonneur</h1>
        <Link to="/dashboard/scanner" className="ml-auto"><Button variant="outline" size="sm"><ScanLine size={14} className="mr-1" /> Vérificateur</Button></Link>
      </div>
      <CarteIdentiteMoissonneur profile={profile} />
    </div>
  );
};

export default DashboardCard;