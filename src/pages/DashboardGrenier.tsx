import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sprout, TrendingUp, Film, Wheat, Cpu } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Project {
  id: string; title: string; category: string; description: string;
  global_target: number; share_price: number; total_shares: number; shares_sold: number;
  estimated_roi: number; status: string; cover_image: string | null;
}

const categoryIcon = (c: string) => {
  if (c.toLowerCase().includes("ciné")) return <Film size={14} />;
  if (c.toLowerCase().includes("agro")) return <Wheat size={14} />;
  if (c.toLowerCase().includes("tech")) return <Cpu size={14} />;
  return <Sprout size={14} />;
};

const DashboardGrenier = () => {
  const { selectedCurrency, formatConverted } = useCurrency();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("moisson_projects").select("*").order("created_at", { ascending: false });
      setProjects((data as Project[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Sprout className="text-secondary" /> Le Grenier des Moissonneurs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Investissements communautaires opérés par le GIE Institut Moisson. Acquérez des parts de projets à fort impact.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement des projets…</p>
      ) : projects.length === 0 ? (
        <Card className="p-8 text-center glass-card">
          <p className="text-muted-foreground">Aucun projet disponible pour le moment.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(p => {
            const pct = p.total_shares > 0 ? Math.round((p.shares_sold / p.total_shares) * 100) : 0;
            return (
              <Card key={p.id} className="glass-card overflow-hidden hover:scale-[1.02] transition-transform">
                {p.cover_image && (
                  <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${p.cover_image})` }} />
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="flex items-center gap-1">{categoryIcon(p.category)}{p.category}</Badge>
                    <Badge className="bg-secondary text-secondary-foreground flex items-center gap-1"><TrendingUp size={12} />~{p.estimated_roi}% ROI</Badge>
                    <Badge variant="outline" className="capitalize">{p.status}</Badge>
                  </div>
                  <h3 className="font-display font-bold text-base">{p.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{p.shares_sold.toLocaleString()} / {p.total_shares.toLocaleString()} parts</span>
                      <span className="text-primary font-bold">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Part: <strong className="text-foreground">{Number(p.share_price).toLocaleString()} FCFA</strong>
                      {selectedCurrency !== "XOF" && <span className="block text-[10px]">≈ {formatConverted(Number(p.share_price))}</span>}
                    </span>
                    <Link to={`/dashboard/grenier/${p.id}`}>
                      <Button size="sm" className="bg-gradient-purple text-primary-foreground">Soutenir →</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardGrenier;
