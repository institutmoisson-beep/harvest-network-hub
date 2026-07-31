import { useEffect, useState } from "react";
import { Bell, CheckCheck, Wrench, PackageCheck, XCircle, RefreshCcw, PackagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface CareSwapNotification {
  id: string;
  claim_id: string | null;
  type: "new_claim" | "assigned" | "swap_approved" | "redirect_repair" | "rejected" | "repaired";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const iconFor: Record<CareSwapNotification["type"], any> = {
  new_claim: PackagePlus,
  assigned: Wrench,
  swap_approved: PackageCheck,
  redirect_repair: RefreshCcw,
  rejected: XCircle,
  repaired: PackageCheck,
};

const CareSwapNotificationsBell = () => {
  const [notifications, setNotifications] = useState<CareSwapNotification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data } = await (supabase as any)
        .from("care_swap_notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setNotifications(data || []);

      channel = supabase
        .channel(`care-swap-notifs-${session.user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "care_swap_notifications", filter: `user_id=eq.${session.user.id}` },
          (payload) => setNotifications((prev) => [payload.new as CareSwapNotification, ...prev])
        )
        .subscribe();
    };
    init();

    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await (supabase as any).rpc("mark_care_swap_notification_read", { _id: id });
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await Promise.all(unread.map((n) => (supabase as any).rpc("mark_care_swap_notification_read", { _id: n.id })));
  };

  if (!userId) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-96 overflow-y-auto">
        <div className="p-3 flex items-center justify-between border-b border-border">
          <span className="font-display text-sm font-bold">Notifications Care & Swap</span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary flex items-center gap-1 hover:underline">
              <CheckCheck size={12} /> Tout marquer lu
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Aucune notification pour le moment.</p>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => {
              const Icon = iconFor[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`w-full text-left p-3 flex gap-2 hover:bg-muted/40 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                >
                  <Icon size={16} className="text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default CareSwapNotificationsBell;
