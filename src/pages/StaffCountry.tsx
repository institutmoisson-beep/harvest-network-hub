import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StaffUsersTable from "@/components/StaffUsersTable";

const StaffCountry = () => {
  const [country, setCountry] = useState<string>("");
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await (supabase as any).from("role_assignments").select("country").eq("user_id", user.id).eq("role", "country_harvester").limit(1).maybeSingle();
      if (data?.country) setCountry(data.country);
    });
  }, []);
  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-6 flex items-center gap-2"><Globe className="text-primary" /> Moissonneur de Pays {country && `— ${country}`}</h1>
      <StaffUsersTable countryFilter={country || undefined} allowActions />
    </div>
  );
};
export default StaffCountry;