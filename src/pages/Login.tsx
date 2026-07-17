import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Eye, EyeOff, LogIn } from "lucide-react";
import MathCaptcha from "@/components/MathCaptcha";
import { clearPendingRedirect, getPendingRedirect } from "@/lib/pendingRedirect";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaOk, setCaptchaOk] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaOk) {
      toast.error("Veuillez résoudre le calcul anti-robot");
      return;
    }
    setLoading(true);

    let email = identifier;

    // If identifier looks like a MSN code, find the email
    if (identifier.toUpperCase().startsWith("MSN") && !identifier.includes("@")) {
      const { data: foundEmail } = await supabase.rpc("get_email_by_referral_code", {
        _code: identifier.toUpperCase(),
      });

      if (!foundEmail) {
        toast.error("Code Moissonneur introuvable");
        setLoading(false);
        return;
      }
      email = foundEmail as string;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Identifiants incorrects");
    } else {
      toast.success("Connexion réussie !");
      const redirectTo = searchParams.get("redirect") || getPendingRedirect();
      clearPendingRedirect();
      navigate(redirectTo || "/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-deep/20 via-background to-background" />
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card rounded-2xl p-8">
          <div className="text-center mb-8">
            <Link to="/"><img src={logo} alt="Institut Moisson" className="h-16 w-16 mx-auto mb-4" /></Link>
            <h1 className="font-display text-2xl font-bold text-gradient-gold">Connexion</h1>
            <p className="text-sm text-muted-foreground mt-1">Accédez à votre espace Moissonneur</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="identifier" className="text-sm">Email ou Code Moissonneur</Label>
              <Input id="identifier" value={identifier} onChange={e => setIdentifier(e.target.value)}
                placeholder="votre@email.com ou MSN123456" required className="mt-1 bg-input border-border" />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm">Mot de passe</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  className="bg-input border-border pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <MathCaptcha onValidChange={setCaptchaOk} />

            <Button type="submit" disabled={loading || !captchaOk}
              className="w-full bg-gradient-purple font-display font-bold hover:opacity-90 glow-purple">
              {loading ? "Connexion..." : <><LogIn size={16} className="mr-2" /> Se Connecter</>}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore Moissonneur ?{" "}
            <Link to="/register" className="text-secondary hover:underline font-semibold">S'inscrire</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
