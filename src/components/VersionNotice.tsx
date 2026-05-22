import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const VersionNotice = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    const isHosted = host === "moisson-collective.lovable.app";
    const isTechnicalPreview = host.includes("id-preview--") || host.includes("localhost") || host.includes("127.0.0.1");
    const dismissed = sessionStorage.getItem("version-notice-dismissed") === "true";
    setShow(!dismissed && isTechnicalPreview && !isHosted);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 top-20 z-[75] mx-auto max-w-xl rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-[var(--shadow-elegant)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <AlertTriangle size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold">Cette version n’est pas la version hébergée</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vous consultez une prévisualisation technique. Les fonctions PWA et certaines mises à jour sont totalement stables sur le site publié après synchronisation.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={() => { sessionStorage.setItem("version-notice-dismissed", "true"); setShow(false); }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default VersionNotice;