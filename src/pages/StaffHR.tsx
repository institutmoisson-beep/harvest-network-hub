import { Users } from "lucide-react";
import StaffUsersTable from "@/components/StaffUsersTable";

const StaffHR = () => (
  <div className="min-h-screen p-6 max-w-7xl mx-auto">
    <h1 className="font-display text-2xl font-bold mb-6 flex items-center gap-2"><Users className="text-primary" /> Ressources Humaines</h1>
    <p className="text-sm text-muted-foreground mb-4">Gestion globale des membres : suspendre, bloquer ou réactiver un compte.</p>
    <StaffUsersTable allowActions />
  </div>
);
export default StaffHR;