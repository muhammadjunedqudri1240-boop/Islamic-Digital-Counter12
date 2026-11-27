import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/AppLayout";
import { useSettings } from "@/hooks/useSettings";
import { usePWA } from "@/hooks/usePWA";
import { THEMES } from "@/lib/themes";
import { SOUND_NAMES, playSound } from "@/lib/sounds";
import { exportData, importData } from "@/lib/db";
import { Volume2, Vibrate, Palette, Bell, Database, User, Download, Upload, Trash2, Smartphone, Play, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

function SectionHeader({ icon: Icon, title }: { icon: typeof Volume2; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
      <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</span>
    </div>
  );
}

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/20 last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings, loading } = useSettings();
  const { installPrompt, promptInstall } = usePWA();
  const [profileName, setProfileName] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tasbeeh_profile") ?? "{}").name ?? ""; } catch { return ""; }
  });
  const [savingName, setSavingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveProfileName = () => {
    setSavingName(true);
    localStorage.setItem("tasbeeh_profile", JSON.stringify({ name: profileName, savedAt: Date.now() }));
    setTimeout(() => setSavingName(false), 1500);
    toast.success("Profile saved");
  };

  const handleExport = async () => {
    const json = await exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tasbeeh-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importData(text);
      toast.success("Data imported successfully");
    } catch {
      toast.error("Failed to import data — invalid file");
    }
    e.target.value = "";
  };

  const handleReset = () => {
    localStorage.clear();
    indexedDB.deleteDatabase("SmartTasbeehPro");
    window.location.reload();
  };

  const DISPLAY_STYLES = ["Digital", "Arabic", "Dots"];
  const COUNTER_SKINS = ["Metallic", "Classic", "Modern"];
  const BUTTON_STYLES = ["Circular", "Square", "Oval"];

  if (loading) return (
    <div className="flex items-center justify-center h-[80dvh]">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <PageTransition>
        <div className="flex flex-col pb-24 px-4 max-w-md mx-auto">
          <div className="pt-6 pb-4">
            <h1 className="text-2xl font-bold font-serif text-foreground tracking-wide">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Customize your experience</p>
          </div>

          {/* Profile */}
          <SectionHeader icon={User} title="Profile" />
          <div className="glass-card rounded-2xl p-4 border border-border/50">
            <div className="text-xs text-muted-foreground mb-2">Your Name</div>
            <div className="flex gap-2">
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter your name..."
                className="glass border-border"
                data-testid="input-profile-name"
              />
              <Button
                onClick={saveProfileName}
                size="sm"
                className="shrink-0 bg-primary text-primary-foreground"
                data-testid="button-save-profile"
              >
                {savingName ? <Check className="w-4 h-4" /> : "Save"}
              </Button>
            </div>
          </div>

          {/* Theme */}
          <SectionHeader icon={Palette} title="Theme" />
          <div className="glass-card rounded-2xl p-4 border border-border/50">
            <div className="grid grid-cols-1 gap-2">
              {THEMES.map((theme) => (
                <motion.button
                  key={theme.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateSettings({ theme: theme.id })}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    settings.theme === theme.id
                      ? "border-primary bg-primary/10 shadow-[0_0_16px_rgba(var(--primary),0.2)]"
                      : "border-border/30 hover:border-primary/30 glass"
                  }`}
                  data-testid={`theme-${theme.id}`}
                >
                  <div
                    className="w-10 h-10 rounded-lg shrink-0"
                    style={{ background: theme.gradients.button }}
                  />
                  <div className="text-left flex-1">
                    <div className="text-sm font-semibold text-foreground">{theme.name}</div>
                    <div className="text-xs text-muted-foreground">{theme.nameAr}</div>
                  </div>
                  {settings.theme === theme.id && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Sound */}
          <SectionHeader icon={Volume2} title="Sound" />
          <div className="glass-card rounded-2xl p-4 border border-border/50">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {SOUND_NAMES.map((name, i) => (
                <button
                  key={i}
                  onClick={() => updateSettings({ soundType: i })}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-all ${
                    settings.soundType === i
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/30 text-muted-foreground hover:border-primary/30 glass"
                  }`}
                  data-testid={`sound-${i}`}
                >
                  <span className="text-xs truncate">{name}</span>
                  {settings.soundType === i && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-border/20">
              <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <Slider
                min={0} max={100} step={5}
                value={[settings.volume]}
                onValueChange={([v]) => updateSettings({ volume: v })}
                className="flex-1"
                data-testid="slider-volume"
              />
              <span className="text-xs text-muted-foreground w-8 text-right">{settings.volume}%</span>
              <Button
                size="sm"
                variant="outline"
                className="glass border-border shrink-0"
                onClick={() => playSound(settings.soundType, settings.volume)}
                data-testid="button-test-sound"
              >
                <Play className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Counter Settings */}
          <SectionHeader icon={Vibrate} title="Counter" />
          <div className="glass-card rounded-2xl p-4 border border-border/50">
            <SettingsRow label="Vibration Feedback">
              <Switch
                checked={settings.vibration}
                onCheckedChange={(v) => updateSettings({ vibration: v })}
                data-testid="switch-vibration"
              />
            </SettingsRow>
            <SettingsRow label="Auto-Save Count">
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(v) => updateSettings({ autoSave: v })}
                data-testid="switch-autosave"
              />
            </SettingsRow>

            <div className="pt-3 mt-1">
              <div className="text-xs text-muted-foreground mb-2">Display Style</div>
              <div className="flex gap-2">
                {DISPLAY_STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateSettings({ displayStyle: s.toLowerCase() })}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                      settings.displayStyle === s.toLowerCase()
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/30 text-muted-foreground glass"
                    }`}
                    data-testid={`display-${s.toLowerCase()}`}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <div className="text-xs text-muted-foreground mb-2">Counter Skin</div>
              <div className="flex gap-2">
                {COUNTER_SKINS.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateSettings({ counterSkin: s.toLowerCase() })}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                      settings.counterSkin === s.toLowerCase()
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/30 text-muted-foreground glass"
                    }`}
                    data-testid={`skin-${s.toLowerCase()}`}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <div className="text-xs text-muted-foreground mb-2">Button Style</div>
              <div className="flex gap-2">
                {BUTTON_STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateSettings({ buttonStyle: s.toLowerCase() })}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                      settings.buttonStyle === s.toLowerCase()
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/30 text-muted-foreground glass"
                    }`}
                    data-testid={`button-style-${s.toLowerCase()}`}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Data */}
          <SectionHeader icon={Database} title="Data" />
          <div className="glass-card rounded-2xl p-4 border border-border/50 space-y-2">
            <Button
              variant="outline"
              className="w-full glass border-border justify-start gap-2"
              onClick={handleExport}
              data-testid="button-export-data"
            >
              <Download className="w-4 h-4" />Export All Data
            </Button>
            <Button
              variant="outline"
              className="w-full glass border-border justify-start gap-2"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-import-data"
            >
              <Upload className="w-4 h-4" />Import Data
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 justify-start gap-2" data-testid="button-reset-data">
                  <Trash2 className="w-4 h-4" />Reset All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your history, sessions, and settings. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">
                    Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Install PWA */}
          {installPrompt && (
            <>
              <SectionHeader icon={Smartphone} title="Install App" />
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-4 border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Smartphone className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">Install Smart Tasbeeh Pro</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Add to home screen for the best experience</div>
                  </div>
                </div>
                <Button
                  className="w-full mt-3 bg-primary text-primary-foreground"
                  onClick={promptInstall}
                  data-testid="button-install-pwa"
                >
                  <Bell className="w-4 h-4 mr-2" />Install App
                </Button>
              </motion.div>
            </>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground/40">Smart Tasbeeh Pro v1.0</p>
            <p className="text-xs text-primary/40 font-serif mt-1">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          </div>
        </div>
      </PageTransition>
  );
}
