import { Download, Globe, Monitor, Share2, Smartphone, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import logo from "@/assets/logo.png";

const InstallApp = () => {
  const { canInstall, isInstalled, isIos, promptInstall } = usePwaInstall();

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[2rem] border border-primary/20 glass-card p-6 md:p-8">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
                  <Download size={14} className="text-primary" />
                  <span className="text-xs font-display uppercase tracking-[0.2em] text-primary">Télécharger l'application</span>
                </div>

                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <img src={logo} alt="Logo sacré Institut Moisson" className="h-28 w-28 rounded-3xl border border-border bg-card p-3 shadow-[var(--shadow-elegant)]" loading="lazy" width={1024} height={1024} />

                  <div>
                    <h1 className="font-display text-3xl font-black leading-tight md:text-4xl">
                      Installez <span className="text-gradient-gold">Institut Moisson</span>
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                      L’app est maintenant prête pour ordinateur, Android et iPhone, avec son logo sacré et ses nouvelles icônes officielles.
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl bg-muted/40 p-4">
                  {isInstalled ? (
                    <div className="flex items-start gap-3 text-sm">
                      <CheckCircle2 size={18} className="mt-0.5 text-primary" />
                      <div>
                        <p className="font-display font-bold">Application déjà installée</p>
                        <p className="text-muted-foreground">Vous pouvez l’ouvrir depuis votre écran d’accueil ou votre bureau.</p>
                      </div>
                    </div>
                  ) : canInstall ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Votre appareil autorise l’installation directe maintenant.</p>
                      <Button onClick={() => void promptInstall()} className="bg-gradient-gold text-secondary-foreground font-display text-sm hover:opacity-90">
                        <Download size={16} className="mr-2" /> Installer l'application
                      </Button>
                    </div>
                  ) : isIos ? (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="font-display font-bold text-foreground">Installation sur iPhone</p>
                      <p>Ouvrez cette page dans Safari, touchez <strong>Partager</strong>, puis <strong>Sur l’écran d’accueil</strong>.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="font-display font-bold text-foreground">Installation disponible sur la version publiée</p>
                      <p>Si vous êtes dans l’aperçu de l’éditeur, ouvrez la version publiée du site pour voir l’installation PWA fonctionner.</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-card/70 p-4 text-xs text-muted-foreground">
                  <Globe size={14} className="mt-0.5 text-primary" />
                  <p>L’installation PWA ne fonctionne pas dans l’aperçu technique de l’éditeur. Elle fonctionne sur le site publié.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card/80 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Monitor size={18} className="text-primary" />
                    <h2 className="font-display text-sm font-bold">Ordinateur</h2>
                  </div>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Ouvrez le site publié dans Chrome ou Edge.</li>
                    <li>2. Cliquez sur l’icône d’installation dans la barre d’adresse.</li>
                    <li>3. Validez pour l’avoir sur le bureau.</li>
                  </ol>
                </div>

                <div className="rounded-2xl border border-border bg-card/80 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Smartphone size={18} className="text-primary" />
                    <h2 className="font-display text-sm font-bold">Android</h2>
                  </div>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Ouvrez le site publié dans Chrome.</li>
                    <li>2. Touchez <strong>Installer l'application</strong> quand la proposition apparaît.</li>
                    <li>3. Sinon, utilisez le menu Chrome puis <strong>Installer l'application</strong>.</li>
                  </ol>
                </div>

                <div className="rounded-2xl border border-border bg-card/80 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Share2 size={18} className="text-primary" />
                    <h2 className="font-display text-sm font-bold">iPhone</h2>
                  </div>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Ouvrez le site publié dans Safari.</li>
                    <li>2. Touchez <strong>Partager</strong>.</li>
                    <li>3. Choisissez <strong>Sur l’écran d’accueil</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default InstallApp;