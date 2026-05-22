import { useEffect, useState } from "react";
import { Copy, Check, Share2, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserCircle, Save, Key } from "lucide-react";

const DashboardProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState({ fullName: "", phone: "", country: "", city: "", addressLine: "", postalCode: "" });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setUser(session.user);

      const [{ data: prof }, { data: addr }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("shipping_addresses").select("*").eq("user_id", session.user.id).eq("is_default", true).maybeSingle(),
      ]);
      if (prof) {
        setProfile(prof);
        setFirstName(prof.first_name);
        setLastName(prof.last_name);
        setPhone(prof.phone || "");
        setCountry(prof.country || "");
        setReferralCode(prof.referral_code);
      }
      if (addr) {
        setAddressId(addr.id);
        setDeliveryAddress({ fullName: addr.full_name, phone: addr.phone, country: addr.country, city: addr.city, addressLine: addr.address_line, postalCode: addr.postal_code || "" });
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ first_name: firstName, last_name: lastName, phone, country, updated_at: new Date().toISOString() }).eq("id", user.id);
    await supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName, phone, country } });
    setSaving(false);
    toast.success("Profil mis à jour !");
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { toast.error("Minimum 6 caractères"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success("Mot de passe mis à jour !"); setNewPassword(""); }
  };

  const handleAddressSave = async () => {
    if (!user) return;
    if (!deliveryAddress.fullName || !deliveryAddress.phone || !deliveryAddress.country || !deliveryAddress.city || !deliveryAddress.addressLine) {
      toast.error("Remplissez tous les champs obligatoires de livraison");
      return;
    }
    setSavingAddress(true);
    await supabase.from("shipping_addresses").update({ is_default: false }).eq("user_id", user.id);
    const payload = {
      user_id: user.id,
      full_name: deliveryAddress.fullName,
      phone: deliveryAddress.phone,
      country: deliveryAddress.country,
      city: deliveryAddress.city,
      address_line: deliveryAddress.addressLine,
      postal_code: deliveryAddress.postalCode || null,
      is_default: true,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = addressId
      ? await supabase.from("shipping_addresses").update(payload).eq("id", addressId).select("id").single()
      : await supabase.from("shipping_addresses").insert(payload).select("id").single();
    setSavingAddress(false);
    if (error) toast.error(error.message);
    else {
      setAddressId(data.id);
      toast.success("Adresse de livraison enregistrée dans votre profil");
    }
  };

  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Rejoins les Moissonneurs ! Inscris-toi avec mon code ${referralCode} 🌾\n${referralLink}`)}`, "_blank");
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, "_blank");
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Rejoins les Moissonneurs avec mon code ${referralCode} 🌾`)}&url=${encodeURIComponent(referralLink)}`, "_blank");
  };

  const levelLabels: Record<string, string> = {
    semeur: "🌱 Semeur", cultivateur: "🌿 Cultivateur", jardinier: "🌾 Moissonneur",
    recolteur: "🏕 Guide de Champ", fermier: "⚔️ Maître Moissonneur", maitre_fermier: "👑 Grand Moissonneur",
    intendant: "🌟 Intendant", sage_moissonneur: "💎 Sage Moissonneur",
    grand_moissonneur: "🏆 Grand Moissonneur Suprême", guide_moissonneur: "🔱 Guide Moissonneur",
  };

  if (loading || !user) return (
    <div className="p-6 flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
        <UserCircle size={24} className="text-primary" /> Mon Profil
      </h1>

      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-purple flex items-center justify-center text-primary-foreground font-display text-xl font-bold">
            {(firstName[0] || "M").toUpperCase()}
          </div>
          <div>
            <p className="font-display font-bold">{firstName} {lastName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {profile && <p className="text-xs text-primary mt-1">{levelLabels[profile.career_level] || profile.career_level}</p>}
          </div>
        </div>

        {/* Referral Section */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6">
          <Label className="text-xs font-bold text-primary">🌾 Code Moissonneur</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input value={referralCode} readOnly className="bg-input border-border text-sm font-mono font-bold" />
            <button onClick={() => { navigator.clipboard.writeText(referralCode); setCopied(true); toast.success("Code copié !"); setTimeout(() => setCopied(false), 2000); }}
              className="p-2 rounded-md hover:bg-primary/10 text-primary">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <Label className="text-xs font-bold text-primary mt-3 block">🔗 Lien de Parrainage</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input value={referralLink} readOnly className="bg-input border-border text-xs" />
            <button onClick={() => { navigator.clipboard.writeText(referralLink); setCopiedLink(true); toast.success("Lien copié !"); setTimeout(() => setCopiedLink(false), 2000); }}
              className="p-2 rounded-md hover:bg-primary/10 text-primary">
              {copiedLink ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <div className="flex gap-2 mt-3">
            <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700" onClick={shareWhatsApp}>
              <Share2 size={12} className="mr-1" /> WhatsApp
            </Button>
            <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700" onClick={shareFacebook}>
              Facebook
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={shareTwitter}>
              Twitter/X
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label className="text-xs">Prénom</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 bg-input border-border text-sm" /></div>
          <div><Label className="text-xs">Nom</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 bg-input border-border text-sm" /></div>
          <div><Label className="text-xs">Pays</Label><Input value={country} onChange={e => setCountry(e.target.value)} className="mt-1 bg-input border-border text-sm" /></div>
          <div><Label className="text-xs">Contact</Label><Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 bg-input border-border text-sm" /></div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="mt-4 bg-gradient-gold text-secondary-foreground font-display font-bold hover:opacity-90">
          <Save size={16} className="mr-2" /> {saving ? "..." : "Enregistrer"}
        </Button>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-sm font-bold mb-4 flex items-center gap-2">
          <Key size={16} className="text-secondary" /> Changer le mot de passe
        </h3>
        <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nouveau mot de passe" className="bg-input border-border text-sm mb-3" />
        <Button onClick={handlePasswordChange} variant="outline" className="border-primary text-foreground hover:bg-primary/10">Mettre à jour</Button>
      </div>

      <div className="glass-card rounded-xl p-6 mt-6">
        <h3 className="font-display text-sm font-bold mb-4 flex items-center gap-2">
          <Truck size={16} className="text-primary" /> Adresse de livraison par défaut
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label className="text-xs">Nom complet *</Label><Input value={deliveryAddress.fullName} onChange={e => setDeliveryAddress(p => ({ ...p, fullName: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
          <div><Label className="text-xs">Téléphone *</Label><Input value={deliveryAddress.phone} onChange={e => setDeliveryAddress(p => ({ ...p, phone: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
          <div><Label className="text-xs">Pays *</Label><Input value={deliveryAddress.country} onChange={e => setDeliveryAddress(p => ({ ...p, country: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
          <div><Label className="text-xs">Ville *</Label><Input value={deliveryAddress.city} onChange={e => setDeliveryAddress(p => ({ ...p, city: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
          <div className="sm:col-span-2"><Label className="text-xs">Adresse complète *</Label><Input value={deliveryAddress.addressLine} onChange={e => setDeliveryAddress(p => ({ ...p, addressLine: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
          <div><Label className="text-xs">Code postal</Label><Input value={deliveryAddress.postalCode} onChange={e => setDeliveryAddress(p => ({ ...p, postalCode: e.target.value }))} className="mt-1 bg-input border-border text-sm" /></div>
        </div>
        <Button onClick={handleAddressSave} disabled={savingAddress} className="mt-4 bg-gradient-purple text-primary-foreground font-display font-bold hover:opacity-90">
          <Save size={16} className="mr-2" /> {savingAddress ? "Enregistrement..." : "Enregistrer l'adresse"}
        </Button>
      </div>
    </div>
  );
};

export default DashboardProfile;
