import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  emergencyId: string;
  currentUserId: string;
  isAdmin: boolean;
}

const EmergencyChat = ({ emergencyId, currentUserId, isAdmin }: Props) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("emergency_messages")
      .select("*")
      .eq("emergency_id", emergencyId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`emergency-${emergencyId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "emergency_messages", filter: `emergency_id=eq.${emergencyId}` },
        (payload) => setMessages(m => [...m, payload.new])
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [emergencyId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    const { error } = await supabase.from("emergency_messages").insert({
      emergency_id: emergencyId,
      sender_id: currentUserId,
      is_admin: isAdmin,
      content: text.trim(),
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setText("");
  };

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-2 p-2 rounded-lg bg-muted/20 border border-border">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle size={32} className="opacity-30 mb-2" />
            <p className="text-xs">Aucun message. Commencez la conversation.</p>
          </div>
        ) : messages.map(m => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-2 rounded-xl text-xs ${mine ? "bg-gradient-purple text-primary-foreground" : "bg-card border border-border"}`}>
                <p className="text-[10px] opacity-70 font-bold">{m.is_admin ? "Admin" : "Utilisateur"}</p>
                <p className="whitespace-pre-wrap">{m.content}</p>
                <p className="text-[9px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 mt-2">
        <Textarea value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Écrire un message..." className="text-xs min-h-[40px] resize-none" />
        <Button onClick={send} disabled={sending || !text.trim()} className="bg-gradient-purple shrink-0">
          <Send size={14} />
        </Button>
      </div>
    </div>
  );
};

export default EmergencyChat;