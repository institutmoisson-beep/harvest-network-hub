import { Globe2 } from "lucide-react";
import StaffUsersTable from "@/components/StaffUsersTable";

const StaffZone = () => (
  <div className="min-h-screen p-6 max-w-7xl mx-auto">
    <h1 className="font-display text-2xl font-bold mb-6 flex items-center gap-2"><Globe2 className="text-primary" /> Moissonneur de Zone</h1>
    <p className="text-sm text-muted-foreground mb-4">Vue agrégée des membres de votre zone d'intervention.</p>
    <StaffUsersTable />
  </div>
);
export default StaffZone;