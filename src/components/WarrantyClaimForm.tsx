import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Upload, X, Zap, Wrench, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadOptimizedImages } from "@/utils/imageCompression";
import type { ClaimType } from "@/lib/careSwapTypes";

interface WarrantyClaimFormProps {
  qrHash: string;
  onSubmitted?: (claimId: string) => void;
}

const WarrantyClaimForm = ({ qrHash, onSubmitted }: WarrantyClaimFormProps) => {
  const [claimType, setClaimType] = useState<ClaimType>("swap_48h");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, 4));
  };

  const submit = async () => {
    if (!phone.trim()) { toast.error("Indiquez un numéro de téléphone"); return; }
    if (!description.trim()) { toast.error("Décrivez la panne"); return; }
    setSubmitting(true);
    try {
      let mediaUrls: string[] = [];
      if (files.length > 0) {
        mediaUrls = await uploadOptimizedImages(files, "care-swap-media", "claims");
      }
      const { data, error } = await (supabase as any).rpc("submit_warranty_claim", {
        _qr_hash: qrHash,
        _claimant_name: name || null,
        _claimant_phone: phone,
        _claim_type: claimType,
        _issue_description: description,
        _media_urls: mediaUrls,
      });
      if (error) throw error;
      setDone(true);
      toast.success("Demande envoyée avec succès !");
      onSubmitted?.(data as string);
    } catch (e: any) {
      toast.error(e?.message || "Échec de l'envoi de la demande");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
        <p className="font-display font-bold">Demande envoyée !</p>
        <p className="text-xs text-muted-foreground mt-1">
          Notre équipe va analyser votre demande. Vous serez notifié de la décision.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs mb-2 block">Type de demande</Label>
        <RadioGroup value={claimType} onValueChange={(v) => setClaimType(v as ClaimType)} className="grid grid-cols-1 gap-2">
          <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${claimType === "swap_48h" ? "border-primary bg-primary/5" : "border-border"}`}>
            <RadioGroupItem value="swap_48h" />
            <Zap size={16} className="text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-bold">Échange Immédiat (Swap 48H)</p>
              <p className="text-[11px] text-muted-foreground">Remplacement à neuf sous 48h après validation.</p>
            </div>
          </label>
          <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${claimType === "standard_repair" ? "border-primary bg-primary/5" : "border-border"}`}>
            <RadioGroupItem value="standard_repair" />
            <Wrench size={16} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold">Réparation Standard</p>
              <p className="text-[11px] text-muted-foreground">Diagnostic et réparation par nos techniciens.</p>
            </div>
          </label>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Nom (optionnel)</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-input border-border" />
        </div>
        <div>
          <Label className="text-xs">Téléphone *</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-input border-border" placeholder="+225 …" />
        </div>
      </div>

      <div>
        <Label className="text-xs">Description de la panne *</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-input border-border" rows={3} />
      </div>

      <div>
        <Label className="text-xs mb-2 block">Photos / vidéo de la panne</Label>
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5">
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
          {files.length < 4 && (
            <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary">
              <Upload size={16} className="text-muted-foreground" />
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          )}
        </div>
      </div>

      <Button onClick={submit} disabled={submitting} className="w-full bg-gradient-purple text-primary-foreground glow-purple">
        {submitting ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
        Envoyer la demande
      </Button>
    </div>
  );
};

export default WarrantyClaimForm;
