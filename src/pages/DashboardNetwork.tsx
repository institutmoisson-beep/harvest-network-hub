import { Users, GitBranch } from "lucide-react";

const DashboardNetwork = () => {
  return (
    <div className="p-6">
      <h1 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
        <Users size={24} className="text-primary" /> Mon Réseau
      </h1>

      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Filleuls Directs", value: "0" },
            { label: "Réseau Total", value: "0" },
            { label: "Branche Gauche", value: "0" },
            { label: "Branche Droite", value: "0" },
          ].map((s, i) => (
            <div key={i} className="text-center p-4 rounded-lg bg-muted/50">
              <p className="font-display text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tree Placeholder */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-sm font-bold mb-4 flex items-center gap-2">
          <GitBranch size={16} className="text-secondary" /> Arbre Généalogique
        </h3>
        <div className="text-center py-16 text-muted-foreground">
          <GitBranch size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Votre arbre généalogique apparaîtra ici</p>
          <p className="text-xs mt-1">Invitez vos premiers filleuls pour commencer à construire votre réseau</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardNetwork;
