import { TrendingUp, DollarSign } from "lucide-react";

const DashboardCommissions = () => {
  return (
    <div className="p-6">
      <h1 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
        <TrendingUp size={24} className="text-secondary" /> Mes Commissions
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Commissions", value: "0 FCFA" },
          { label: "Commissions Binaire", value: "0 FCFA" },
          { label: "Commissions Unilevel", value: "0 FCFA" },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-xl p-5">
            <DollarSign size={18} className="text-secondary mb-2" />
            <p className="font-display text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-sm font-bold mb-4">Historique des Commissions</h3>
        <div className="text-center py-10 text-muted-foreground">
          <TrendingUp size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Aucune commission pour le moment</p>
          <p className="text-xs mt-1">Vos commissions binaires et unilevel apparaîtront ici</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardCommissions;
