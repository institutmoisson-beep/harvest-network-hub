import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Eye, EyeOff, UserPlus } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    country: "",
    phone: "",
    referralCode: searchParams.get("ref") || "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (!form.referralCode.trim()) {
      toast.error("Le code de parrainage est obligatoire");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          country: form.country,
          phone: form.phone,
          referral_code: form.referralCode,
        },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Inscription réussie ! Vérifiez votre email.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-deep/20 via-background to-background" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="glass-card rounded-2xl p-8">
          <div className="text-center mb-6">
            <Link to="/">
              <img src={logo} alt="Institut Moisson" className="h-14 w-14 mx-auto mb-3" />
            </Link>
            <h1 className="font-display text-2xl font-bold text-gradient-gold">Devenir Moissonneur</h1>
            <p className="text-sm text-muted-foreground mt-1">Rejoignez la communauté</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Prénom</Label>
                <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)}
                  placeholder="Prénom" required className="mt-1 bg-input border-border text-sm" />
              </div>
              <div>
                <Label className="text-xs">Nom</Label>
                <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Nom" required className="mt-1 bg-input border-border text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Pays</Label>
                <Input value={form.country} onChange={(e) => update("country", e.target.value)}
                  placeholder="Pays" required className="mt-1 bg-input border-border text-sm" />
              </div>
              <div>
                <Label className="text-xs">Contact</Label>
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)}
                  placeholder="+225 ..." required className="mt-1 bg-input border-border text-sm" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Code de Parrainage <span className="text-destructive">*</span></Label>
              <Input value={form.referralCode} onChange={(e) => update("referralCode", e.target.value)}
                placeholder="Code de votre parrain" required className="mt-1 bg-input border-border text-sm" />
            </div>

            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
                placeholder="votre@email.com" required className="mt-1 bg-input border-border text-sm" />
            </div>

            <div>
              <Label className="text-xs">Mot de passe</Label>
              <div className="relative mt-1">
                <Input type={showPw ? "text" : "password"} value={form.password}
                  onChange={(e) => update("password", e.target.value)} placeholder="••••••••" required
                  className="bg-input border-border text-sm pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-xs">Confirmer le mot de passe</Label>
              <Input type="password" value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)} placeholder="••••••••" required
                className="mt-1 bg-input border-border text-sm" />
            </div>

            <Button type="submit" disabled={loading}
              className="w-full bg-gradient-gold text-secondary-foreground font-display font-bold hover:opacity-90 glow-gold mt-2">
              {loading ? "Inscription..." : <><UserPlus size={16} className="mr-2" /> S'inscrire</>}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Déjà Moissonneur ?{" "}
            <Link to="/login" className="text-secondary hover:underline font-semibold">Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
