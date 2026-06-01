import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Radio, ExternalLink, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Msg = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  target_user_id: string | null;
  created_at: string;
  is_read: boolean;
};

const DashboardChannel = () => {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await (supabase as any).rpc("list_my_broadcasts");
    setMsgs((data as Msg[]) || []);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await (supabase as any).rpc("mark_broadcast_read", { _message_id: id });
    setMsgs(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("broadcast-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "broadcast_messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
        <Radio size={24} className="text-primary" /> Canal de la Communauté
      </h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : msgs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Bell size={48} className="mx-auto mb-3 opacity-40" /><p>Aucun message pour le moment.</p></div>
      ) : (
        <div className="space-y-4">
          {msgs.map(m => (
            <div key={m.id} onClick={() => !m.is_read && markRead(m.id)}
              className={`glass-card rounded-xl p-4 cursor-pointer transition-all ${!m.is_read ? "border-2 border-destructive shadow-lg" : "opacity-90"}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {!m.is_read && <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />}
                  <h3 className="font-display font-bold text-sm">{m.title}</h3>
                  {m.target_user_id && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">Message direct</span>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(m.created_at), { locale: fr, addSuffix: true })}</span>
              </div>
              {m.image_url && <img src={m.image_url} alt="" className="w-full rounded-lg mb-3 max-h-80 object-cover" loading="lazy" />}
              <p className="text-sm text-foreground whitespace-pre-wrap">{m.content}</p>
              {m.link_url && (
                <a href={m.link_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-gradient-purple text-primary-foreground text-sm font-bold hover:opacity-90">
                  <ExternalLink size={14} /> {m.link_label || "Ouvrir le lien"}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardChannel;