import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Radio, Send, Image as ImageIcon, Link as LinkIcon, User, Search, ArrowLeft } from "lucide-react";

const AdminBroadcasts = () => {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [targetCode, setTargetCode] = useState("");
  const [targetUser, setTargetUser] = useState<{ id: string; name: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      const isAdmin = roles?.some(r => r.role === "admin");
      if (!isAdmin) { toast.error("Réservé aux administrateurs"); navigate("/dashboard"); return; }
      setAllowed(true);
      loadHistory();
    })();
  }, [navigate]);

  const loadHistory = async () => {
    const { data } = await (supabase as any).rpc("list_my_broadcasts");
    setHistory(data || []);
  };

  const searchUser = async () => {
    if (!targetCode.trim()) { setTargetUser(null); return; }
    const { data } = await supabase.rpc("find_profile_by_code", { _code: targetCode.trim() });
    if (data && data[0]) setTargetUser({ id: data[0].id, name: `${data[0].first_name} ${data[0].last_name}` });
    else { setTargetUser(null); toast.error("Utilisateur introuvable"); }
  };

  const send = async () => {
    if (!title.trim()) { toast.error("Titre requis"); return; }
    setSending(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const path = `${Date.now()}-${imageFile.name}`;
        const { error: upErr } = await supabase.storage.from("broadcast-media").upload(path, imageFile);
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from("broadcast-media").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await (supabase as any).rpc("create_broadcast", {
        _title: title, _content: content, _image_url: imageUrl,
        _link_url: linkUrl || null, _link_label: linkLabel || null,
        _target_user_id: targetUser?.id || null,
      });
      if (error) throw error;
      toast.success(targetUser ? `Message envoyé à ${targetUser.name}` : "Message diffusé à tous les Moissonneurs");
      setTitle(""); setContent(""); setLinkUrl(""); setLinkLabel(""); setImageFile(null); setTargetCode(""); setTargetUser(null);
      loadHistory();
    } catch (e: any) {
      toast.error(e.message || "Erreur d'envoi");
    }
    setSending(false);
  };

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/admin")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} /> Retour
        </button>
        <h1 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
          <Radio className="text-primary" /> Canal de Diffusion
        </h1>

        <div className="glass-card rounded-xl p-5 mb-6">
          <h2 className="font-display font-bold mb-4">Nouveau message</h2>

          <div className="mb-4">
            <Label className="text-xs">Destinataire</Label>
            <div className="flex gap-2 mt-1">
              <Input value={targetCode} onChange={e => setTargetCode(e.target.value.toUpperCase())} placeholder="Code MSN... (vide = canal général)" className="bg-input border-border text-sm" />
              <Button size="sm" variant="outline" onClick={searchUser}><Search size={14} /></Button>
            </div>
            {targetUser && <p className="text-xs text-primary mt-1 flex items-center gap-1"><User size={12} /> Message direct à : <strong>{targetUser.name}</strong></p>}
            {!targetUser && targetCode === "" && <p className="text-xs text-muted-foreground mt-1">📢 Sera diffusé à tous les Moissonneurs</p>}
          </div>

          <Label className="text-xs">Titre *</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 mb-3 bg-input border-border text-sm" placeholder="Ex: Réunion Zoom samedi" />

          <Label className="text-xs">Message</Label>
          <Textarea value={content} onChange={e => setContent(e.target.value)} rows={5} className="mt-1 mb-3 bg-input border-border text-sm" placeholder="Votre message..." />

          <Label className="text-xs flex items-center gap-1"><ImageIcon size={12} /> Image (optionnel)</Label>
          <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="mt-1 mb-3 text-xs w-full" />

          <Label className="text-xs flex items-center gap-1"><LinkIcon size={12} /> Lien Zoom / URL (optionnel)</Label>
          <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="mt-1 mb-2 bg-input border-border text-sm" placeholder="https://zoom.us/..." />
          <Input value={linkLabel} onChange={e => setLinkLabel(e.target.value)} className="bg-input border-border text-sm" placeholder="Texte du bouton (ex: Rejoindre la réunion)" />

          <Button onClick={send} disabled={sending} className="mt-4 w-full bg-gradient-purple text-primary-foreground font-display font-bold hover:opacity-90">
            <Send size={16} className="mr-2" /> {sending ? "Envoi..." : "Envoyer"}
          </Button>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h2 className="font-display font-bold mb-4">Historique des envois</h2>
          {history.length === 0 ? <p className="text-sm text-muted-foreground">Aucun envoi pour le moment.</p> : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {history.map((m: any) => (
                <div key={m.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex justify-between items-start gap-2">
                    <strong className="text-sm">{m.title}</strong>
                    <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString("fr-FR")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.content}</p>
                  <p className="text-[10px] text-primary mt-1">{m.target_user_id ? "Direct" : "Canal général"}{m.image_url ? " • Image" : ""}{m.link_url ? " • Lien" : ""}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBroadcasts;