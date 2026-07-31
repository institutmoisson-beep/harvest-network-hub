import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "lucide-react";

// Default Leaflet marker icons reference bundler-broken asset paths; rebuild them manually.
const courierIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:#7c3aed;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"><div style="transform:rotate(45deg);color:white;font-size:16px">🛵</div></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});
const clientIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:#16a34a;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"><div style="color:white;font-size:14px">📍</div></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

interface LocationPoint {
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface LiveDeliveryMapProps {
  /** The other party's user id whose position should be displayed (courier for a client, client for a courier). */
  watchUserId: string;
  watchLabel: string;
  /** Optional: also show the current device's own position (if sharing) as a second marker. */
  ownPosition?: { latitude: number; longitude: number } | null;
  ownLabel?: string;
  heightClass?: string;
}

const Recenter = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 15);
    else if (points.length > 1) map.fitBounds(points as any, { padding: [40, 40] });
  }, [JSON.stringify(points)]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
};

const LiveDeliveryMap = ({ watchUserId, watchLabel, ownPosition, ownLabel, heightClass = "h-72" }: LiveDeliveryMapProps) => {
  const [watched, setWatched] = useState<LocationPoint | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("live_locations")
        .select("latitude, longitude, updated_at, is_sharing")
        .eq("user_id", watchUserId)
        .maybeSingle();
      if (!cancelled && data?.is_sharing) setWatched(data);
    };
    load();

    const channel = supabase
      .channel(`live-location-${watchUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_locations", filter: `user_id=eq.${watchUserId}` },
        (payload) => {
          const row = payload.new as any;
          if (row && row.is_sharing) setWatched(row);
          else setWatched(null);
        }
      )
      .subscribe();
    channelRef.current = channel;

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [watchUserId]);

  const points: [number, number][] = [];
  if (watched) points.push([watched.latitude, watched.longitude]);
  if (ownPosition) points.push([ownPosition.latitude, ownPosition.longitude]);

  if (points.length === 0) {
    return (
      <div className={`${heightClass} rounded-xl bg-muted/30 flex flex-col items-center justify-center text-center p-4`}>
        <Navigation size={32} className="text-muted-foreground mb-2 opacity-40" />
        <p className="text-xs text-muted-foreground">
          En attente de la position GPS de {watchLabel.toLowerCase()}…
        </p>
      </div>
    );
  }

  return (
    <div className={`${heightClass} rounded-xl overflow-hidden border border-border`}>
      <MapContainer center={points[0]} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {watched && (
          <Marker position={[watched.latitude, watched.longitude]} icon={courierIcon}>
            <Popup>{watchLabel}</Popup>
          </Marker>
        )}
        {ownPosition && (
          <Marker position={[ownPosition.latitude, ownPosition.longitude]} icon={clientIcon}>
            <Popup>{ownLabel || "Ma position"}</Popup>
          </Marker>
        )}
        <Recenter points={points} />
      </MapContainer>
    </div>
  );
};

export default LiveDeliveryMap;
