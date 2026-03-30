import { useEffect, useState, useRef } from "react";
import { Users, GitBranch, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Member = { id: string; first_name: string; last_name: string; referral_code: string; career_level: string; is_system_active: boolean };

const DashboardNetwork = () => {
  const [directs, setDirects] = useState<Member[]>([]);
  const [stats, setStats] = useState({ directs: 0, left: 0, right: 0, total: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const { data: networkData } = await supabase.from("network").select("user_id, position").eq("sponsor_id", uid);
      const userIds = networkData?.map(n => n.user_id) || [];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name, referral_code, career_level, is_system_active").in("id", userIds);
        setDirects(profiles as Member[] || []);
      }

      const left = networkData?.filter(n => n.position === "left").length || 0;
      const right = networkData?.filter(n => n.position === "right").length || 0;
      setStats({ directs: userIds.length, left, right, total: userIds.length });
    };
    load();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => { setDragging(true); setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); };
  const handleMouseMove = (e: React.MouseEvent) => { if (dragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp = () => setDragging(false);

  const levelLabels: Record<string, string> = {
    semeur: "🌱", cultivateur: "🌿", jardinier: "🌾", recolteur: "🏕", fermier: "⚔️",
    maitre_fermier: "👑", intendant: "🌟", sage_moissonneur: "💎", grand_moissonneur: "🏆", guide_moissonneur: "🔱",
  };

  return (
    <div className="p-6">
      <h1 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
        <Users size={24} className="text-primary" /> Mon Réseau
      </h1>

      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Filleuls Directs", value: stats.directs },
            { label: "Réseau Total", value: stats.total },
            { label: "Branche Gauche", value: stats.left },
            { label: "Branche Droite", value: stats.right },
          ].map((s, i) => (
            <div key={i} className="text-center p-4 rounded-lg bg-muted/50">
              <p className="font-display text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Zoomable Tree */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm font-bold flex items-center gap-2">
            <GitBranch size={16} className="text-secondary" /> Arbre Généalogique
          </h3>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.min(z + 0.2, 3))}><ZoomIn size={14} /></Button>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))}><ZoomOut size={14} /></Button>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><RotateCcw size={14} /></Button>
          </div>
        </div>

        <div ref={containerRef} className="overflow-hidden rounded-lg bg-muted/20 border border-border"
          style={{ height: "400px", cursor: dragging ? "grabbing" : "grab" }}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center top", transition: dragging ? "none" : "transform 0.2s" }}
            className="flex flex-col items-center pt-8 min-h-full">

            {/* Root (You) */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-purple flex items-center justify-center text-primary-foreground font-display font-bold text-lg border-2 border-primary shadow-lg">
                Vous
              </div>
              <p className="text-[10px] font-display mt-1 text-center">Moi</p>
            </div>

            {directs.length > 0 && (
              <>
                <div className="w-px h-8 bg-border" />
                <div className="flex gap-4 flex-wrap justify-center">
                  {directs.map(m => (
                    <div key={m.id} className="flex flex-col items-center">
                      <div className="w-px h-4 bg-border" />
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-display text-xs font-bold border-2 ${m.is_system_active ? "bg-green-600/20 border-green-500 text-green-500" : "bg-muted border-border text-muted-foreground"}`}>
                        {levelLabels[m.career_level] || "🌱"}
                      </div>
                      <p className="text-[9px] font-display mt-1 text-center max-w-[80px] truncate">{m.first_name}</p>
                      <p className="text-[8px] text-muted-foreground font-mono">{m.referral_code}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {directs.length === 0 && (
              <div className="mt-8 text-center text-muted-foreground">
                <p className="text-sm">Invitez vos premiers filleuls</p>
                <p className="text-xs mt-1">Partagez votre code de parrainage</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNetwork;
