import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { uploadPrivateImage, getSignedUrl } from "@/utils/imageCompression";
import { Upload, X, Loader2, PackagePlus, AlertCircle, Sparkles } from "lucide-react";

/** Statuts UI: libellé + classe visuelle */
const STATUS_UI: Record<string, { label: string; cls: string }> = {
  pending:                  { label: "En attente",          cls: "bg-yellow-500/20 text-yellow-600 border-yellow-500/40 animate-pulse" },
  under_review:             { label: "En cours d'examen",   cls: "bg-blue-500/20 text-blue-600 border-blue-500/40" },
  approved_direct_buy:      { label: "Achat direct plateforme", cls: "bg-emerald-700/20 text-emerald-700 border-emerald-700/40" },
  approved_community_sale:  { label: "Vente communautaire", cls: "bg-green-400/20 text-green-600 border-green-500/40" },
  rejected:                 { label: "Refusé",              cls: "bg-red-500/20 text-red-600 border-red-500/40" },
};

const CATEGORIES = ["Alimentaire", "Agricole", "Artisanat", "Cosmétique", "Textile", "Numérique", "Services", "Autre"];
const UNITS = ["pièce", "kg", "g", "litre", "carton", "sac", "paquet", "douzaine"];

type Submission = {
  id: string; title: string; description: string; category: string;
  quantity: number; unit_type: string; regular_price: number; wholesale_price: number;
  images: string[]; additional_info: any; status: string; admin_notes: string | null;
  created_at: string;
};

const DashboardSubmissions = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [items, setItems] = useState<Submission[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState(UNITS[0]);
  const [regularPrice, setRegularPrice] = useState(0);
  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [origin, setOrigin] = useState("");
  const [expiration, setExpiration] = useState("");
  const [packaging, setPackaging] = useState("");
  const [certification, setCertification] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data, error } = await (supabase as any).rpc("list_my_submissions");
    if (error) { toast.error(error.message); return; }
    const list = (data || []) as Submission[];
    setItems(list);
    // resolve signed previews for the first image of each item
    const map: Record<string, string> = {};
    await Promise.all(list.map(async (it) => {
      if (it.images?.[0]) {
        const url = await getSignedUrl("product-submissions", it.images[0], 3600);
        if (url) map[it.id] = url;
      }
    }));
    setPreviewUrls(map);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setUid(session.user.id);
      load();
    });

    const channel = supabase
      .channel("product_submissions_self")
      .on("postgres_changes", { event: "*", schema: "public", table: "product_submissions" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFilesPicked = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).slice(0, 8 - files.length);
    setFiles([...files, ...arr]);
  };

  const removeFile = (idx: number) => setFiles(files.filter((_, i) => i !== idx));

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory(CATEGORIES[0]);
    setQuantity(1); setUnit(UNITS[0]);
    setRegularPrice(0); setWholesalePrice(0);
    setOrigin(""); setExpiration(""); setPackaging(""); setCertification("");
    setFiles([]);
  };

  const submit = async () => {
    if (!uid) { toast.error("Connexion requise"); return; }
    if (!title.trim()) { toast.error("Titre requis"); return; }
    if (quantity < 1) { toast.error("Quantité invalide"); return; }
    if (regularPrice < 0 || wholesalePrice < 0) { toast.error("Prix invalide"); return; }
    setSubmitting(true);
    try {
      setUploading(true);
      const paths: string[] = [];
      for (const f of files) {
        const p = await uploadPrivateImage(f, "product-submissions", uid);
        paths.push(p);
      }
      setUploading(false);
      const additional: any = {};
      if (origin) additional.origin = origin;
      if (expiration) additional.expiration = expiration;
      if (packaging) additional.packaging = packaging;
      if (certification) additional.certification = certification;

      const { error } = await (supabase as any).from("product_submissions").insert({
        user_id: uid,
        title: title.trim(),
        description: description.trim(),
        category, quantity, unit_type: unit,
        regular_price: regularPrice, wholesale_price: wholesalePrice,
        images: paths, additional_info: additional,
      });
      if (error) throw error;
      toast.success("Produit soumis. L'équipe l'examinera très vite ✨");
      resetForm();
      load();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la soumission");
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-purple flex items-center justify-center text-primary-foreground">
          <PackagePlus size={22} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Mise à disposition</h1>
          <p className="text-sm text-muted-foreground">Proposez un produit à la plateforme ou à la communauté</p>
        </div>
      </header>

      {/* Formulaire */}
      <Card className="rounded-2xl p-5 md:p-6 space-y-4 shadow-lg">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Titre du produit *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Miel bio local" />
          </div>
          <div>
            <Label>Catégorie</Label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full h-10 rounded-md border bg-background px-3 text-sm">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez précisément votre produit…" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Quantité</Label>
              <Input type="number" min={1} value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <Label>Unité</Label>
              <select value={unit} onChange={e => setUnit(e.target.value)}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Prix normal (FCFA)</Label>
              <Input type="number" min={0} value={regularPrice} onChange={e => setRegularPrice(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Prix de gros (FCFA)</Label>
              <Input type="number" min={0} value={wholesalePrice} onChange={e => setWholesalePrice(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        {/* Uploader */}
        <div>
          <Label className="mb-2 block">Images du produit ({files.length}/8)</Label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFilesPicked(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-primary/30 rounded-2xl p-6 text-center cursor-pointer hover:bg-primary/5 transition"
          >
            <Upload className="mx-auto mb-2 text-primary" />
            <p className="text-sm">Glissez vos images ici ou cliquez pour parcourir</p>
            <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WEBP — compressées automatiquement</p>
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
              onChange={e => onFilesPicked(e.target.files)} />
          </div>
          {files.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-3">
              {files.map((f, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border">
                  <img src={URL.createObjectURL(f)} className="w-full h-24 object-cover" alt="preview" />
                  <button type="button" onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-90 hover:opacity-100">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spécifications additionnelles */}
        <Accordion type="single" collapsible>
          <AccordionItem value="specs">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2"><Sparkles size={16} className="text-primary" /> Spécifications additionnelles</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-3 pt-2">
                <div><Label>Origine</Label><Input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Pays / Région" /></div>
                <div><Label>Date d'expiration</Label><Input type="date" value={expiration} onChange={e => setExpiration(e.target.value)} /></div>
                <div><Label>Emballage</Label><Input value={packaging} onChange={e => setPackaging(e.target.value)} placeholder="Ex: bocal 500g" /></div>
                <div><Label>Certification</Label><Input value={certification} onChange={e => setCertification(e.target.value)} placeholder="Bio, Halal, ISO…" /></div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button onClick={submit} disabled={submitting || uploading} className="w-full bg-gradient-purple">
          {(submitting || uploading) && <Loader2 className="animate-spin" size={16} />}
          {uploading ? "Envoi des images…" : submitting ? "Enregistrement…" : "Soumettre le produit"}
        </Button>
      </Card>

      {/* Mes soumissions */}
      <section>
        <h2 className="font-display text-lg font-bold mb-3">Mes soumissions</h2>
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune soumission pour le moment.</p>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => {
            const ui = STATUS_UI[it.status] || STATUS_UI.pending;
            return (
              <Card key={it.id} className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition">
                {previewUrls[it.id] ? (
                  <img src={previewUrls[it.id]} alt={it.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center text-muted-foreground text-xs">Aucune image</div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm">{it.title}</h3>
                    <Badge className={`text-[10px] border ${ui.cls}`}>{ui.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{it.description}</p>
                  <div className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>{it.quantity} {it.unit_type}</span>
                    <span>{it.regular_price.toLocaleString()} FCFA</span>
                  </div>
                  {it.status === "rejected" && it.admin_notes && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-xs flex gap-2">
                      <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
                      <span><b>Motif :</b> {it.admin_notes}</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default DashboardSubmissions;