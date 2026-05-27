import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";

interface Props {
  country: string;
  city: string;
  value: string | null;
  onChange: (id: string | null) => void;
}

const RelayPointSelector = ({ country, city, value, onChange }: Props) => {
  const [relays, setRelays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!country) { setRelays([]); return; }
    setLoading(true);
    (supabase as any).rpc("list_relay_points", { _country: country, _city: city || null }).then(({ data }: any) => {
      setRelays(data || []);
      setLoading(false);
    });
  }, [country, city]);

  if (!country) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-display">
        <MapPin size={16} className="text-primary" /> Point de relais (optionnel)
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">Chargement...</p>
      ) : relays.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucun point de relais disponible — livraison à domicile.</p>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          <button type="button" onClick={() => onChange(null)}
            className={`w-full text-left p-2 rounded-lg border text-xs transition-all ${!value ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}>
            🏠 Livraison à domicile
          </button>
          {relays.map(r => (
            <button key={r.id} type="button" onClick={() => onChange(r.id)}
              className={`w-full text-left p-2 rounded-lg border text-xs transition-all ${value === r.id ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}>
              <p className="font-display font-bold">{r.name}</p>
              <p className="text-muted-foreground text-[10px]">{r.address} — {r.city}, {r.country}</p>
              {r.phone && <p className="text-muted-foreground text-[10px]">📞 {r.phone}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelayPointSelector;