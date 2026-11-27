import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const mqStandalone = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mqStandalone.matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
    const onDisplayModeChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mqStandalone.addEventListener("change", onDisplayModeChange);

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      mqStandalone.removeEventListener("change", onDisplayModeChange);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
    return choice.outcome === "accepted";
  };

  return { installPrompt: !!installPrompt, isInstalled, isOnline, promptInstall };
}
