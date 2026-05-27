import { MapPin } from "lucide-react";
import StaffUsersTable from "@/components/StaffUsersTable";

const StaffCity = () => (
  <div className="min-h-screen p-6 max-w-7xl mx-auto">
    <h1 className="font-display text-2xl font-bold mb-6 flex items-center gap-2"><MapPin className="text-primary" /> Moissonneur de Ville</h1>
    <p className="text-sm text-muted-foreground mb-4">Membres et activité de votre ville assignée.</p>
    <StaffUsersTable />
  </div>
);
export default StaffCity;