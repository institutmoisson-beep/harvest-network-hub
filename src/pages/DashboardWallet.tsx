import { Wallet, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardWallet = () => {
  return (
    <div className="p-6">
      <h1 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
        <Wallet size={24} className="text-secondary" /> Mon Portefeuille
      </h1>

      {/* Balance */}
      <div className="glass-card rounded-2xl p-8 mb-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-gold opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <p className="text-sm text-muted-foreground mb-2">Solde disponible</p>
        <p className="font-display text-4xl font-black text-gradient-gold">0 FCFA</p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button className="bg-gradient-purple font-display text-xs hover:opacity-90 glow-purple">
            <ArrowDownLeft size={16} className="mr-1" /> Recharger
          </Button>
          <Button variant="outline" className="font-display text-xs border-secondary/50 text-foreground hover:bg-secondary/10">
            <ArrowUpRight size={16} className="mr-1" /> Retirer
          </Button>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-sm font-bold mb-4 flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" /> Historique des Transactions
        </h3>
        <div className="text-center py-10 text-muted-foreground">
          <Wallet size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Aucune transaction pour le moment</p>
          <p className="text-xs mt-1">Vos recharges et retraits apparaîtront ici</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardWallet;
