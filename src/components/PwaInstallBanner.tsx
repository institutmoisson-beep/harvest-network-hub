import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";

const PwaInstallBanner = () => {
  const [hidden, setHidden] = useState(false);
  const { canInstall, isInstalled, isIos, promptInstall } = usePwaInstall();

  if (hidden || isInstalled || (!canInstall && !isIos)) return null;

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setHidden(true);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70]">
      <div className="mx-auto max-w-md rounded-2xl border border-primary/20 glass-card p-4 shadow-[var(--shadow-elegant)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Smartphone size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold">Installer Institut Moisson</p>
            <p className="text-xs text-muted-foreground">
              {canInstall
                ? "Téléchargez l’application sur cet appareil en un clic."
                : "Sur iPhone, ouvrez Safari puis Partager → Sur l’écran d’accueil."}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {canInstall && (
                <Button size="sm" className="bg-gradient-gold text-secondary-foreground text-xs" onClick={handleInstall}>
                  <Download size={14} className="mr-1" /> Installer
                </Button>
              )}

              <Link to="/telecharger-app">
                <Button size="sm" variant="outline" className="text-xs">
                  Voir le guide
                </Button>
              </Link>
            </div>
          </div>

          <button type="button" onClick={() => setHidden(true)} className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallBanner;