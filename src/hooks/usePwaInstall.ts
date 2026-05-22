import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    __pwaInstallPrompt?: () => BeforeInstallPromptEvent | null;
  }
}

const detectStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

export const usePwaInstall = () => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() =>
    typeof window !== "undefined" ? detectStandalone() : false
  );
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    setIsInstalled(detectStandalone());

    const existingPrompt = window.__pwaInstallPrompt?.() ?? null;
    if (existingPrompt) {
      setPromptEvent(existingPrompt);
    }

    const handleReady = (event: Event) => {
      const customEvent = event as CustomEvent<BeforeInstallPromptEvent>;
      setPromptEvent(customEvent.detail ?? window.__pwaInstallPrompt?.() ?? null);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("pwaInstallReady", handleReady as EventListener);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("pwaInstallReady", handleReady as EventListener);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!promptEvent) return false;

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;

    setPromptEvent(null);

    if (choice.outcome === "accepted") {
      return true;
    }

    return false;
  };

  return {
    canInstall: Boolean(promptEvent),
    isInstalled,
    isIos,
    promptInstall,
  };
};