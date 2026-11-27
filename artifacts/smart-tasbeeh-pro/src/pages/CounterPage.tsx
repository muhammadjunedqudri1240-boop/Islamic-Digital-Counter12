import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/AppLayout";
import { useCounter } from "@/hooks/useCounter";
import { useHistory } from "@/hooks/useHistory";
import { getFormattedDateTime } from "@/lib/hijri";
import { shareReceipt } from "@/lib/receipt";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { RotateCcw, Play, Pause, Save, Share2, ChevronDown, Check, Lock } from "lucide-react";
import { toast } from "sonner";

const ZIKR_PRESETS = [
  { name: "SubhanAllah",              ar: "سبحان الله",         target: 33  },
  { name: "Alhamdulillah",            ar: "الحمد لله",           target: 33  },
  { name: "Allahu Akbar",             ar: "الله أكبر",           target: 34  },
  { name: "La ilaha illallah",        ar: "لا إله إلا الله",     target: 100 },
  { name: "Astaghfirullah",           ar: "أستغفر الله",         target: 100 },
  { name: "Subhana Rabbiyal Azeem",   ar: "سبحان ربي العظيم",   target: 33  },
  { name: "Subhana Rabbiyal A'la",    ar: "سبحان ربي الأعلى",   target: 33  },
  { name: "Darood Sharif",            ar: "صلى الله على محمد",   target: 100 },
  { name: "Ayatul Kursi",             ar: "آية الكرسي",          target: 7   },
];

/* ─── Bead Ring ────────────────────────────────────────────────── */
interface BeadRingProps {
  count: number;
  zikrName: string;
  beadCount: number;
  justTapped: boolean;
  onTouchStart: (e: React.TouchEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  isLocked: boolean;
}

function BeadRing({ count, zikrName, beadCount, justTapped, onTouchStart, onClick, isLocked }: BeadRingProps) {
  const filled = count % beadCount;
  const laps   = Math.floor(count / beadCount);
  const S      = 300;
  const cx     = S / 2;
  const cy     = S / 2;
  const R      = 118;
  const beadR  = Math.max(5.5, Math.min(12, (R * Math.PI) / beadCount * 0.95));

  const beads = useMemo(() => Array.from({ length: beadCount }, (_, i) => {
    const angle = (i / beadCount) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  }), [beadCount]);

  return (
    <div
      className="relative select-none w-full"
      style={{ touchAction: "none", cursor: isLocked ? "not-allowed" : "pointer" }}
      onTouchStart={onTouchStart}
      onClick={onClick}
      data-testid="bead-ring"
    >
      <svg viewBox={`0 0 ${S} ${S}`} className="w-full h-full" style={{ filter: `drop-shadow(0 0 24px var(--theme-glow, rgba(212,160,23,0.4)))` }}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="hsl(var(--primary)/0.08)" strokeWidth="1.5" />

        {beads.map(({ x, y }, i) => {
          const isFilled  = i < filled;
          const isCurrent = i === filled;
          const justThis  = justTapped && i === (filled === 0 ? beadCount - 1 : filled - 1);

          return (
            <g key={i}>
              {isFilled && (
                <circle cx={x} cy={y} r={beadR + 5} fill="hsl(var(--primary)/0.14)" />
              )}
              {isCurrent && !isLocked && (
                <circle cx={x} cy={y} r={beadR + 3} fill="none" stroke="hsl(var(--primary)/0.45)" strokeWidth="1.5">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="r" values={`${beadR + 2};${beadR + 4};${beadR + 2}`} dur="2.2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={x} cy={y}
                r={justThis ? beadR + 2 : beadR}
                fill={isFilled ? "hsl(var(--primary))" : "hsl(var(--primary)/0.06)"}
                stroke={isFilled ? "hsl(var(--primary)/0.85)" : "hsl(var(--primary)/0.22)"}
                strokeWidth="1.5"
                style={{ transition: "fill 0.15s, r 0.12s" }}
              />
            </g>
          );
        })}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <motion.div
          key={count}
          initial={{ scale: 1.15, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="text-[72px] font-bold tabular-nums leading-none"
          style={{ color: "hsl(var(--primary))", fontFamily: "'JetBrains Mono', monospace", textShadow: "0 0 30px hsl(var(--primary)/0.5)" }}
        >
          {filled}
        </motion.div>
        <div className="text-sm mt-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          Bead {filled} / {beadCount}
        </div>
        <div className="text-sm font-semibold mt-1" style={{ color: "hsl(var(--primary))" }}>
          {zikrName}
        </div>
        {laps > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs mt-1 px-2 py-0.5 rounded-full"
            style={{ background: "hsl(var(--primary)/0.15)", color: "hsl(var(--primary))" }}
          >
            {laps}× complete
          </motion.div>
        )}
        {isLocked && (
          <Lock className="mt-2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
        )}
      </div>
    </div>
  );
}

/* ─── Main Counter Page ────────────────────────────────────────── */
export default function CounterPage() {
  const counter  = useCounter();
  const history  = useHistory();

  const [time, setTime]               = useState(getFormattedDateTime());
  const [isSaveOpen, setIsSaveOpen]   = useState(false);
  const [saveNotes, setSaveNotes]     = useState("");
  const [customZikr, setCustomZikr]   = useState("");
  const [customTarget, setCustomTarget] = useState("");
  const [justTapped, setJustTapped]   = useState(false);
  const [isZikrSheetOpen, setIsZikrSheetOpen] = useState(false);
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [zikrInput, setZikrInput] = useState("");

  // Flag set on touchstart; blocks the synthetic click that fires ~300ms later
  const touchBlockRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setTime(getFormattedDateTime()), 1000);
    return () => clearInterval(t);
  }, []);

  // Derived bead count: target up to 100 uses target; above 100 the ring uses a 100-bead cycle
  const beadCount = useMemo(() => {
    if (counter.target > 0) return Math.min(counter.target, 100);
    return 33;
  }, [counter.target]);

  const doIncrement = useCallback(() => {
    if (counter.isLocked || counter.isPaused) return;
    counter.increment();
    setJustTapped(true);
    setTimeout(() => setJustTapped(false), 180);
  }, [counter]);

  // Touch devices: touchstart fires first — set the block flag, then count.
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Mark that a real touch happened; the synthetic click fired ~300ms later
    // will be suppressed by this flag.
    touchBlockRef.current = true;
    // Clear the flag after 1.5s: a long press can delay the synthetic click well past 600ms.
    setTimeout(() => { touchBlockRef.current = false; }, 1500);
    doIncrement();
  }, [doIncrement]);

  // Desktop / mouse: only fires on actual mouse clicks. On touch devices the
  // flag above is already set, so we bail out immediately.
  const handleClick = useCallback((_e: React.MouseEvent) => {
    if (touchBlockRef.current) return; // synthetic click after touch — ignore
    doIncrement();
  }, [doIncrement]);

  const handleReset = () => {
    if (confirm("Reset current count to 0?")) counter.reset();
  };

  const handleSaveSession = async () => {
    if (counter.count === 0) {
      toast.error("Count is 0 — start counting first.");
      return;
    }
    try {
      const dt = getFormattedDateTime();
      await history.saveSession({
        zikrName: counter.zikrName,
        count: counter.count,
        target: counter.target,
        notes: saveNotes,
        createdAt: Date.now(),
      });
      await history.addHistory({
        zikrName: counter.zikrName,
        count: counter.count,
        target: counter.target,
        targetCompleted: counter.target > 0 && counter.count >= counter.target,
        date: dt.date,
        time: dt.time24,
        duration: counter.getSessionDuration(),
        notes: saveNotes,
        timestamp: Date.now(),
      });
      toast.success(`Saved ${counter.count}× ${counter.zikrName}`);
      setIsSaveOpen(false);
      setSaveNotes("");
      counter.reset();
    } catch {
      toast.error("Failed to save session");
    }
  };

  const handleShare = () => {
    if (counter.count === 0) { toast.error("Start counting first."); return; }
    db.settings.get().then((s) => {
      const dt = getFormattedDateTime();
      shareReceipt({
        userName: (JSON.parse(localStorage.getItem("tasbeeh_profile") ?? "{}") as { name?: string }).name ?? "User",
        zikrName: counter.zikrName,
        count: counter.count,
        target: counter.target,
        targetCompleted: counter.target > 0 && counter.count >= counter.target,
        date: dt.date,
        time: dt.time24,
        duration: counter.getSessionDuration(),
        themeId: s.theme ?? "golden",
      });
    });
  };

  const profileName = useMemo(() => {
    try { return (JSON.parse(localStorage.getItem("tasbeeh_profile") ?? "{}") as { name?: string }).name ?? ""; } catch { return ""; }
  }, []);

  const currentPreset = ZIKR_PRESETS.find((p) => p.name === counter.zikrName);

  return (
    <PageTransition className="flex flex-col min-h-[100dvh]">

      {/* ── Celebration Overlay ── */}
      <AnimatePresence>
        {counter.targetJustCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
            style={{ background: "hsl(var(--primary)/0.07)", backdropFilter: "blur(6px)" }}
          >
            {[80, 140, 200].map((r, idx) => (
              <div
                key={idx}
                className="absolute rounded-full border-2 celebration-ring"
                style={{
                  width: r * 2, height: r * 2,
                  borderColor: `hsl(var(--primary)/${0.6 - idx * 0.15})`,
                  animationDelay: `${idx * 0.15}s`,
                }}
              />
            ))}
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 30 }}
              animate={{ scale: 1,   opacity: 1, y: 0  }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="rounded-3xl p-8 text-center"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--primary)/0.35)", boxShadow: "0 0 60px hsl(var(--primary)/0.3)" }}
            >
              <div className="text-4xl font-serif mb-2" style={{ color: "hsl(var(--primary))" }}>Congratulations!</div>
              <div className="text-lg opacity-70">MashaAllah · {counter.count}× {counter.zikrName}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Bar ── */}
      <div className="flex items-start justify-start gap-3 px-5 pt-5 pb-2">
          <div
            className="px-4 py-1 rounded-full text-xs font-semibold tracking-wide"
            style={{ background: "hsl(var(--primary)/0.12)", border: "1px solid hsl(var(--primary)/0.3)", color: "hsl(var(--primary))" }}
            data-testid="lifetime-total"
          >
            Total since start: {counter.lifetimeTotal.toLocaleString()}
          </div>
      </div>

      {/* ── Time Display ── */}
      <div className="text-center px-4 pb-1">
        <div
          className="text-4xl font-bold tabular-nums tracking-tight"
          style={{ color: "hsl(var(--foreground))", fontFamily: "'JetBrains Mono', monospace" }}
        >
          {time.time12}
        </div>
      </div>

      {/* ── Zikr Selector ── */}
      <div className="flex justify-center mb-1 px-4">
        <Sheet open={isZikrSheetOpen} onOpenChange={setIsZikrSheetOpen}>
          <SheetTrigger asChild>
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-full transition-all"
              style={{ background: "hsl(var(--primary)/0.1)", border: "1px solid hsl(var(--primary)/0.2)" }}
              data-testid="zikr-selector"
            >
              {currentPreset && (
                <span className="font-serif text-base" style={{ color: "hsl(var(--foreground))" }}>
                  {currentPreset.ar}
                </span>
              )}
              <span className="text-sm font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                {counter.zikrName}
              </span>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-3xl"
            style={{ background: "hsl(var(--card))", borderTop: "1px solid hsl(var(--primary)/0.2)" }}
          >
            <div className="overflow-y-auto pb-safe space-y-2 max-h-[60vh] px-1">
              {ZIKR_PRESETS.slice(0, 0).map((preset) => {
                const active = counter.zikrName === preset.name;
                return (
                  <button
                    key={preset.name}
                    onClick={() => {
                      counter.setZikrName(preset.name);
                      counter.setTarget(preset.target);
                      setIsZikrSheetOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl transition-all"
                    style={{
                      background: active ? "hsl(var(--primary)/0.12)" : "hsl(var(--muted)/0.5)",
                      border: `1px solid ${active ? "hsl(var(--primary)/0.4)" : "transparent"}`,
                    }}
                    data-testid={`preset-${preset.name}`}
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm" style={{ color: "hsl(var(--foreground))" }}>{preset.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "hsl(var(--primary)/0.65)" }}>Target: {preset.target}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg" style={{ color: "hsl(var(--foreground))" }}>{preset.ar}</span>
                      {active && <Check className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />}
                    </div>
                  </button>
                );
              })}
              {/* Custom Zikr */}
              <div
                className="p-4 rounded-2xl"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border)/0.5)" }}
              >
                <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Custom Zikr
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Zikr name..."
                    value={customZikr}
                    onChange={(e) => setCustomZikr(e.target.value)}
                    className="bg-black/20 border-white/10"
                  />
                  <Input
                    type="number"
                    placeholder="Target count..."
                    value={customTarget}
                    onChange={(e) => setCustomTarget(e.target.value)}
                    className="bg-black/20 border-white/10"
                  />
                  <Button
                    className="w-full"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                    onClick={() => {
                      if (customZikr.trim()) {
                        counter.setZikrName(customZikr.trim());
                        counter.setTarget(parseInt(customTarget) || 0);
                        setIsZikrSheetOpen(false);
                      }
                    }}
                  >
                    Set Custom
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Bead Ring (main tap area) ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-2">
        <div className="w-full max-w-[340px] aspect-square">
          <BeadRing
            count={counter.count}
            zikrName={counter.zikrName}
            beadCount={beadCount}
            justTapped={justTapped}
            onTouchStart={handleTouchStart}
            onClick={handleClick}
            isLocked={counter.isLocked}
          />
        </div>
      </div>

      {/* ── Target setter ── */}
      <div className="flex justify-center mb-2 px-4">
        {showTargetInput ? (
          <div className="flex flex-col gap-2 w-full max-w-[260px]">
            <Input
              placeholder="Zikr name"
              value={zikrInput}
              onChange={(e) => setZikrInput(e.target.value)}
              className="bg-black/20 border-white/10"
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Target count"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="flex-1 bg-black/20 border-white/10"
              />
              <Button
                size="sm"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                onClick={() => {
                  if (zikrInput.trim()) counter.setZikrName(zikrInput.trim());
                  counter.setTarget(parseInt(targetInput) || 0);
                  setShowTargetInput(false);
                  setTargetInput("");
                  setZikrInput("");
                }}
              >
                Set
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowTargetInput(true)}
            className="text-xs px-4 py-1.5 rounded-full"
            style={{ background: "hsl(var(--primary)/0.1)", border: "1px solid hsl(var(--primary)/0.25)", color: "hsl(var(--primary))" }}
          >
            {counter.target > 0 ? `${counter.zikrName} · Target: ${counter.target} · Change` : "Set target"}
          </button>
        )}
      </div>

      {/* ── Progress bar (if target set) ── */}
      {counter.target > 0 && (
        <div className="px-6 pb-2">
          <div className="flex justify-between items-center text-sm font-semibold mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span />
            <span style={{ color: "hsl(var(--primary))" }}>{Math.round(counter.getProgress())}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted)/0.6)", border: "1px solid hsl(var(--primary)/0.25)", boxShadow: "inset 0 1px 4px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.3)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 55%), linear-gradient(90deg, hsl(var(--primary)/0.55), hsl(var(--primary)))", boxShadow: "0 0 18px hsl(var(--primary)/0.8), 0 0 4px hsl(var(--primary))" }}
              animate={{ width: `${counter.getProgress()}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div className="px-4 pb-4 space-y-3">
        {/* Pause / Lock / Reset row */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={counter.togglePause}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
            data-testid="button-pause"
          >
            {counter.isPaused
              ? <Play  className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
              : <Pause className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />}
          </button>
          <button
            onClick={handleReset}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
            data-testid="button-reset"
          >
            <RotateCcw className="w-5 h-5" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
          <button
            onClick={counter.toggleLock}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{
              background: counter.isLocked ? "hsl(var(--primary)/0.15)" : "hsl(var(--muted))",
              border: counter.isLocked ? "1px solid hsl(var(--primary)/0.4)" : "1px solid hsl(var(--border))",
            }}
            data-testid="button-lock"
          >
            <Lock
              className="w-5 h-5"
              style={{ color: counter.isLocked ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
            />
          </button>
        </div>

        {/* Save / Share row */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12 rounded-2xl font-semibold"
            style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--muted)/0.5)" }}
            onClick={() => setIsSaveOpen(true)}
            data-testid="button-save"
          >
            <Save className="w-4 h-4 mr-2" style={{ color: "hsl(var(--primary))" }} />
            Save
          </Button>
          <Button
            className="h-12 rounded-2xl font-semibold"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            onClick={handleShare}
            data-testid="button-share"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* ── Save Dialog ── */}
      <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
        <DialogContent
          className="w-[90vw] max-w-sm rounded-3xl"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--primary)/0.2)" }}
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-center" style={{ color: "hsl(var(--primary))" }}>
              Save Session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div
              className="rounded-2xl p-4 text-center"
              style={{ background: "hsl(var(--muted)/0.5)" }}
            >
              <p className="text-xs mb-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Zikr</p>
              <p className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>{counter.zikrName}</p>
              <div className="mt-2 pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                <p className="text-xs mb-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Count</p>
                <p className="text-4xl font-bold font-mono tabular-nums" style={{ color: "hsl(var(--primary))" }}>
                  {counter.count}
                </p>
              </div>
            </div>
            <Input
              placeholder="Notes (optional)..."
              value={saveNotes}
              onChange={(e) => setSaveNotes(e.target.value)}
              className="bg-black/20 border-white/10"
            />
          </div>
          <DialogFooter>
            <Button
              className="w-full h-12 rounded-xl font-semibold"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
              onClick={handleSaveSession}
            >
              Save & Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
