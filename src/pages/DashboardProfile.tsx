import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      const u = session.user;
      setUser(u);
      const m = u.user_metadata || {};
      setFirstName(m.first_name || "");
      setLastName(m.last_name || "");
      setPhone(m.phone || "");
      setCountry(m.country || "");

      // Fetch referral code from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", u.id)
        .single();
      if (profile) setReferralCode(profile.referral_code);
    });
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName, phone, country },
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profil mis à jour !");
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success("Mot de passe mis à jour !"); setNewPassword(""); }
  };

  if (!user) return null;

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
          </div>
        </div>

        {/* Referral Section */}
        <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <Label className="text-xs font-bold text-primary">🌾 Code Moissonneur</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input value={referralCode} readOnly className="bg-input border-border text-sm font-mono font-bold" />
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralCode);
                setCopied(true);
                toast.success("Code copié !");
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-2 rounded-md hover:bg-primary/10 text-primary"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <Label className="text-xs font-bold text-primary mt-3 block">🔗 Lien de Parrainage</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={`${window.location.origin}/register?ref=${referralCode}`}
              readOnly
              className="bg-input border-border text-xs"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/register?ref=${referralCode}`);
                toast.success("Lien copié !");
              }}
              className="p-2 rounded-md hover:bg-primary/10 text-primary"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Prénom</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 bg-input border-border text-sm" />
          </div>
          <div>
            <Label className="text-xs">Nom</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)}
              className="mt-1 bg-input border-border text-sm" />
          </div>
          <div>
            <Label className="text-xs">Pays</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)}
              className="mt-1 bg-input border-border text-sm" />
          </div>
          <div>
            <Label className="text-xs">Contact</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="mt-1 bg-input border-border text-sm" />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}
          className="mt-4 bg-gradient-gold text-secondary-foreground font-display font-bold hover:opacity-90">
          <Save size={16} className="mr-2" /> {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-sm font-bold mb-4 flex items-center gap-2">
          <Key size={16} className="text-secondary" /> Changer le mot de passe
        </h3>
        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nouveau mot de passe" className="bg-input border-border text-sm mb-3" />
        <Button onClick={handlePasswordChange} variant="outline" className="border-primary text-foreground hover:bg-primary/10">
          Mettre à jour
        </Button>
      </div>
    </div>
  );
};

export default DashboardProfile;
