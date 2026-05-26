import { useEffect, useState, useRef, useCallback } from "react";
import { Users, GitBranch, ZoomIn, ZoomOut, RotateCcw, ChevronDown, ChevronRight, List, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type TreeNode = {
  id: string;
  first_name: string;
  last_name: string;
  referral_code: string;
  career_level: string;
  is_system_active: boolean;
  position: string;
  depth: number;
  sponsor_id: string;
  children: TreeNode[];
};

const DashboardNetwork = () => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [stats, setStats] = useState({ directs: 0, left: 0, right: 0, total: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [refSearch, setRefSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNetwork();
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    const { data } = await supabase.rpc("list_my_referrals");
    if (data) setReferrals(data);
  };

  const moveReferral = async (memberId: string, newPosition: "left" | "right") => {
    const { error } = await supabase.rpc("move_referral_position", { _member_id: memberId, _new_position: newPosition });
    if (error) return toast.error(error.message);
    toast.success(`Repositionné en branche ${newPosition === "left" ? "gauche" : "droite"}`);
    loadNetwork();
    loadReferrals();
  };

  const loadNetwork = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;

    // Use recursive function to get full downline
    const { data: downline } = await supabase.rpc("get_downline", { _user_id: uid });
    
    if (!downline || downline.length === 0) {
      setStats({ directs: 0, left: 0, right: 0, total: 0 });
      setTree([]);
      setLoading(false);
      return;
    }

    // Get all member profiles
    const memberIds = downline.map((d: any) => d.member_id);
    const { data: profiles } = await supabase.rpc("get_public_profiles", { _ids: memberIds });
    const profileMap: Record<string, any> = {};
    profiles?.forEach((p: any) => { profileMap[p.id] = p; });

    // Build tree structure
    const nodeMap: Record<string, TreeNode> = {};
    const roots: TreeNode[] = [];

    downline.forEach((d: any) => {
      const profile = profileMap[d.member_id];
      if (!profile) return;
      const node: TreeNode = {
        id: d.member_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        referral_code: profile.referral_code,
        career_level: profile.career_level,
        is_system_active: profile.is_system_active,
        position: d.member_position || "left",
        depth: d.tree_depth,
        sponsor_id: d.member_sponsor_id,
        children: [],
      };
      nodeMap[d.member_id] = node;
    });

    // Link children to parents
    downline.forEach((d: any) => {
      const node = nodeMap[d.member_id];
      if (!node) return;
      if (d.member_sponsor_id === uid) {
        roots.push(node);
      } else if (nodeMap[d.member_sponsor_id]) {
        nodeMap[d.member_sponsor_id].children.push(node);
      }
    });

    // Sort: left before right
    const sortChildren = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => a.position === "left" ? -1 : 1);
      nodes.forEach(n => sortChildren(n.children));
    };
    sortChildren(roots);

    // Stats
    const directsLeft = roots.filter(r => r.position === "left").length;
    const directsRight = roots.filter(r => r.position === "right").length;
    setStats({ directs: roots.length, left: directsLeft, right: directsRight, total: downline.length });
    setTree(roots);
    setLoading(false);
  };

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

      <Tabs defaultValue="tree" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tree"><GitBranch size={14} className="mr-2" /> Arbre</TabsTrigger>
          <TabsTrigger value="list"><List size={14} className="mr-2" /> Mes Filleuls ({referrals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tree">
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
          style={{ height: "500px", cursor: dragging ? "grabbing" : "grab" }}
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

            {loading ? (
              <div className="mt-8 text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">Chargement du réseau...</p>
              </div>
            ) : tree.length > 0 ? (
              <>
                <div className="w-px h-8 bg-border" />
                <div className="flex gap-8 flex-wrap justify-center">
                  {tree.map(node => (
                    <TreeNodeComponent key={node.id} node={node} levelLabels={levelLabels} />
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-8 text-center text-muted-foreground">
                <p className="text-sm">Invitez vos premiers filleuls</p>
                <p className="text-xs mt-1">Partagez votre code de parrainage</p>
              </div>
            )}
          </div>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="list">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h3 className="font-display text-sm font-bold flex items-center gap-2">
                <List size={16} className="text-secondary" /> Liste de mes filleuls directs
              </h3>
              <Input value={refSearch} onChange={e => setRefSearch(e.target.value)}
                placeholder="Rechercher nom, code, pays..." className="max-w-xs h-8 text-xs bg-input border-border" />
            </div>
            {referrals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun filleul direct pour l'instant</p>
            ) : (
              <div className="space-y-2">
                {referrals
                  .filter(r => {
                    const q = refSearch.trim().toLowerCase();
                    if (!q) return true;
                    return `${r.first_name} ${r.last_name} ${r.referral_code} ${r.country || ""}`.toLowerCase().includes(q);
                  })
                  .map(r => (
                  <div key={r.member_id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-display font-bold truncate">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.referral_code}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.country || "—"} · {r.phone || "Pas de téléphone"} · {new Date(r.joined_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.is_system_active ? "default" : "outline"} className="text-[10px]">
                        {r.is_system_active ? "Actif" : "Inactif"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {r.branch_position === "left" ? "Gauche" : "Droite"}
                      </Badge>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1"
                        onClick={() => moveReferral(r.member_id, r.branch_position === "left" ? "right" : "left")}>
                        <ArrowLeftRight size={12} /> Repositionner
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TreeNodeComponent = ({ node, levelLabels }: { node: TreeNode; levelLabels: Record<string, string> }) => {
  const [expanded, setExpanded] = useState(node.depth <= 2);

  return (
    <div className="flex flex-col items-center">
      <div className="w-px h-4 bg-border" />
      <div 
        className={`relative w-14 h-14 rounded-full flex items-center justify-center font-display text-xs font-bold border-2 cursor-pointer transition-all ${node.is_system_active ? "bg-green-600/20 border-green-500 text-green-500" : "bg-muted border-border text-muted-foreground"}`}
        onClick={() => setExpanded(!expanded)}
      >
        {levelLabels[node.career_level] || "🌱"}
        {node.children.length > 0 && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
            <span className="text-[8px] text-primary-foreground font-bold">{node.children.length}</span>
          </div>
        )}
      </div>
      <p className="text-[9px] font-display mt-1 text-center max-w-[80px] truncate">{node.first_name}</p>
      <p className="text-[8px] text-muted-foreground font-mono">{node.referral_code}</p>
      <Badge variant="outline" className="text-[7px] mt-0.5 px-1 py-0">
        {node.position === "left" ? "G" : "D"}
      </Badge>

      {expanded && node.children.length > 0 && (
        <>
          <div className="w-px h-4 bg-border" />
          <div className="flex gap-4 justify-center">
            {node.children.map(child => (
              <TreeNodeComponent key={child.id} node={child} levelLabels={levelLabels} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardNetwork;
