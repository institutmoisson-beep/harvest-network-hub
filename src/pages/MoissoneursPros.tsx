import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, Search, MessageCircle, Mail, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const MoissoneursPros = () => {
  const [search, setSearch] = useState("");
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.rpc("list_pros_directory");
      setPros(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = pros.filter((p) =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.career_level.toLowerCase().includes(search.toLowerCase()) ||
    (p.country || "").toLowerCase().includes(search.toLowerCase())
  );

  const careerLabel = (level: string) => {
    const map: Record<string, string> = {
      semeur: "Semeur", cultivateur: "Cultivateur", jardinier: "Jardinier",
      recolteur: "Récolteur", fermier: "Fermier", maitre_fermier: "Maître Fermier",
      intendant: "Intendant", sage_moissonneur: "Sage Moissonneur",
      grand_moissonneur: "Grand Moissonneur", guide_moissonneur: "Guide Moissonneur",
    };
    return map[level] || level;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-4">
              <Users size={14} className="text-primary" />
              <span className="text-xs font-display uppercase tracking-widest text-primary">Annuaire</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
              <span className="text-gradient-gold">Moissonneurs</span> Pros
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              Découvrez les Moissonneurs certifiés, disponibles pour vos projets et collaborations.
            </p>
          </div>

          <div className="max-w-md mx-auto mb-10 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher un moissonneur..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input border-border" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((pro) => (
                <div key={pro.id} className="glass-card rounded-2xl p-6 hover:glow-gold transition-all duration-500">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-gold flex items-center justify-center text-2xl shrink-0">
                      {pro.avatar_url ? (
                        <img src={pro.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={24} className="text-background" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-bold truncate">{pro.first_name} {pro.last_name}</h3>
                      <Badge variant="outline" className="text-[10px] mt-1">{careerLabel(pro.career_level)}</Badge>
                      {pro.country && <p className="text-xs text-muted-foreground mt-1">📍 {pro.country}</p>}
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">{pro.referral_code}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4 flex-wrap">
                    {pro.phone && (
                      <a href={`https://wa.me/${pro.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-500 hover:underline">
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                    )}
                    {pro.email && (
                      <a href={`mailto:${pro.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:underline">
                        <Mail size={14} /> Email
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Users size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-display text-sm">Aucun moissonneur pro trouvé</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MoissoneursPros;
