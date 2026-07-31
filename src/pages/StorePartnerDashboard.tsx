import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Store, QrCode, ScanLine, ArrowLeft, Loader2, PackageCheck, Smartphone,
} from "lucide-react";
import logo from "@/assets/logo.png";
import CareSwapNotificationsBell from "@/components/CareSwapNotificationsBell";
import CareSwapQRScanner from "@/components/CareSwapQRScanner";
import WarrantyClaimForm from "@/components/WarrantyClaimForm";
import { claimStatusConfig, claimTypeConfig, type WarrantyClaim } from "@/lib/careSwapTypes";

const StorePartnerDashboard = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);

  const [saleScannerOpen, setSaleScannerOpen] = useState(false);
  const [saleSerial, setSaleSerial] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("12");
  const [registering, setRegistering] = useState(false);

  const [swapScannerOpen, setSwapScannerOpen] = useState(false);
  const [swapQrHash, setSwapQrHash] = useState<string | null>(null);

  useEffect(() => { checkAccess(); }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    const hasAccess = roles?.some((r) => r.role === "store_partner" || r.role === "admin");
    if (!hasAccess) { navigate("/dashboard"); toast.error("Accès réservé aux magasins partenaires"); return; }
    setUserId(session.user.id);
    setAuthorized(true);
    loadClaims(session.user.id);
  };

  const loadClaims = async (uid: string) => {
    const { data } = await (supabase as any)
      .from("warranty_claims")
      .select("*")
      .eq("store_id", uid)
      .order("created_at", { ascending: false });
    setClaims(data || []);
  };

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`store-claims-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "warranty_claims", filter: `store_id=eq.${userId}` }, () => loadClaims(userId))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const registerSale = async () => {
    if (!saleSerial.trim() || !buyerPhone.trim()) { toast.error("Numéro de série et téléphone client requis"); return; }
    setRegistering(true);
    const { error } = await (supabase as any).rpc("register_device_sale", {
      _serial_number: saleSerial.trim(),
      _buyer_name: buyerName || null,
      _buyer_phone: buyerPhone,
      _warranty_months: Number(warrantyMonths) || 12,
    });
    setRegistering(false);
    if (error) { toast.error(error.message || "Échec de l'enregistrement"); return; }
    toast.success("Vente enregistrée ! Garantie activée.");
    setSaleSerial(""); setBuyerName(""); setBuyerPhone("");
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft size={16} /></Button>
          <img src={logo} alt="" className="h-8" />
          <h1 className="font-display text-xl font-bold flex items-center gap-2"><Store className="text-primary" /> Magasin Partenaire</h1>
        </div>
        <CareSwapNotificationsBell />
      </div>

      <Tabs defaultValue="sale" className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="sale" className="text-xs">Enregistrer une vente</TabsTrigger>
          <TabsTrigger value="swap" className="text-xs">Swap 48H / Réparation</TabsTrigger>
          <TabsTrigger value="claims" className="text-xs">Mes demandes</TabsTrigger>
        </TabsList>

        <TabsContent value="sale">
          <div className="glass-card rounded-xl p-4 space-y-4">
            <p className="text-xs text-muted-foreground">Scannez ou saisissez le numéro de série (IMEI) de l'appareil vendu, puis liez-le au client.</p>
            <div className="flex gap-2">
              <Input value={saleSerial} onChange={(e) => setSaleSerial(e.target.value)} placeholder="Numéro de série / IMEI" className="bg-input border-border" />
              <Button type="button" variant="outline" onClick={() => setSaleScannerOpen(true)}><ScanLine size={16} /></Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nom du client</Label>
                <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="bg-input border-border" />
              </div>
              <div>
                <Label className="text-xs">Téléphone du client *</Label>
                <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className="bg-input border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Durée de garantie (mois)</Label>
              <Input type="number" value={warrantyMonths} onChange={(e) => setWarrantyMonths(e.target.value)} className="bg-input border-border w-32" />
            </div>
            <Button onClick={registerSale} disabled={registering} className="w-full bg-gradient-purple text-primary-foreground glow-purple">
              {registering ? <Loader2 size={16} className="animate-spin mr-1" /> : <PackageCheck size={16} className="mr-1" />}
              Confirmer la vente
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="swap">
          <div className="glass-card rounded-xl p-4 space-y-4">
            <p className="text-xs text-muted-foreground">Scannez le QR code de l'appareil défectueux apporté par le client pour lancer une demande.</p>
            {!swapQrHash ? (
              <Button onClick={() => setSwapScannerOpen(true)} className="w-full bg-gradient-purple text-primary-foreground glow-purple">
                <QrCode size={16} className="mr-2" /> Scanner l'appareil défectueux
              </Button>
            ) : (
              <WarrantyClaimForm qrHash={swapQrHash} onSubmitted={() => setTimeout(() => { setSwapQrHash(null); if (userId) loadClaims(userId); }, 2000)} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="claims">
          {claims.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground glass-card rounded-xl">
              <Smartphone size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-display text-sm">Aucune demande pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((c) => (
                <div key={c.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Badge className={`text-[10px] ${claimTypeConfig[c.claim_type].color} text-white`}>{claimTypeConfig[c.claim_type].label}</Badge>
                    <Badge className={`text-[10px] ${claimStatusConfig[c.status].color} text-white`}>{claimStatusConfig[c.status].label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.issue_description}</p>
                  {c.admin_notes && <p className="text-xs text-primary mt-1">Note admin : {c.admin_notes}</p>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={saleScannerOpen} onOpenChange={setSaleScannerOpen}>
        <DialogContent className="max-w-sm glass-card border-border">
          <DialogHeader><DialogTitle className="font-display text-gradient-gold">Scanner l'appareil</DialogTitle></DialogHeader>
          <CareSwapQRScanner
            regionId="sale-scanner"
            onDecoded={(hash) => {
              setSaleSerial(hash);
              setSaleScannerOpen(false);
              toast.info("QR scanné — vérifiez le numéro de série avant de confirmer.");
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={swapScannerOpen} onOpenChange={setSwapScannerOpen}>
        <DialogContent className="max-w-sm glass-card border-border">
          <DialogHeader><DialogTitle className="font-display text-gradient-gold">Scanner l'appareil</DialogTitle></DialogHeader>
          <CareSwapQRScanner
            regionId="swap-scanner"
            onDecoded={(hash) => { setSwapQrHash(hash); setSwapScannerOpen(false); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StorePartnerDashboard;
