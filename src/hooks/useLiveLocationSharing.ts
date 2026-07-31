import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Toggle-controlled live GPS broadcaster. While `sharing` is true, watches
 * the device position and pushes updates to Supabase (throttled) so the
 * other party in an active delivery can track it in real time.
 */
export function useLiveLocationSharing(role: "client" | "courier") {
  const [sharing, setSharing] = useState(false);
  const [lastPosition, setLastPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!sharing) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!("geolocation" in navigator)) {
      toast.error("La géolocalisation n'est pas disponible sur cet appareil");
      setSharing(false);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLastPosition({ latitude, longitude });
        const now = Date.now();
        if (now - lastSentRef.current < 4000) return; // throttle to ~1 update / 4s
        lastSentRef.current = now;
        await (supabase as any).rpc("set_live_location", {
          _latitude: latitude,
          _longitude: longitude,
          _role: role,
          _is_sharing: true,
        });
      },
      (err) => {
        toast.error("Impossible d'accéder à votre position : " + err.message);
        setSharing(false);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [sharing, role]);

  const toggle = async (next: boolean) => {
    setSharing(next);
    if (!next && lastPosition) {
      await (supabase as any).rpc("set_live_location", {
        _latitude: lastPosition.latitude,
        _longitude: lastPosition.longitude,
        _role: role,
        _is_sharing: false,
      });
    }
  };

  return { sharing, toggle, lastPosition };
}
