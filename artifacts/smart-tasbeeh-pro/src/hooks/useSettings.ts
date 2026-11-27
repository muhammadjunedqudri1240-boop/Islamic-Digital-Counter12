import { useState, useEffect, useCallback } from "react";
import { db, AppSettings, defaultSettings } from "@/lib/db";
import { applyTheme } from "@/lib/themes";

function dispatchSettings(s: AppSettings) {
  window.dispatchEvent(new CustomEvent("settings-changed", {
    detail: { soundType: s.soundType, volume: s.volume, vibration: s.vibration },
  }));
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.settings.get().then((s) => {
      setSettings(s);
      applyTheme(s.theme);
      if (s.darkMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      dispatchSettings(s);
      setLoading(false);
    });
  }, []);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      db.settings.save(next);
      if (partial.theme) applyTheme(partial.theme);
      if (partial.darkMode !== undefined) {
        if (partial.darkMode) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
      }
      dispatchSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings, loading };
}
