import { useState, useEffect, useCallback, useRef } from "react";
import { playSound, playCompletionChime, vibrateDevice } from "@/lib/sounds";

export interface CounterState {
  count: number;
  zikrName: string;
  target: number;
  sessionStart: number;
  isPaused: boolean;
  isLocked: boolean;
  totalLaps: number;
}

const STORAGE_KEY = "tasbeeh_counter_state";

function loadState(): CounterState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CounterState;
  } catch {}
  return {
    count: 0,
    zikrName: "SubhanAllah",
    target: 0,
    sessionStart: Date.now(),
    isPaused: false,
    isLocked: false,
    totalLaps: 0,
  };
}

function saveState(state: CounterState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useCounter() {
  const [state, setState] = useState<CounterState>(loadState);
  const [isAnimating, setIsAnimating] = useState(false);
  const [targetJustCompleted, setTargetJustCompleted] = useState(false);
  // All-time total of taps, kept across sessions
  const [lifetimeTotal, setLifetimeTotal] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("tasbeeh-lifetime-total") || "0", 10) || 0; } catch { return 0; }
  });
  const settingsRef = useRef({ soundType: 0, volume: 70, vibration: true });

  useEffect(() => {
    const onSettings = (e: CustomEvent) => {
      settingsRef.current = e.detail;
    };
    window.addEventListener("settings-changed" as never, onSettings as EventListener);
    return () => window.removeEventListener("settings-changed" as never, onSettings as EventListener);
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const increment = useCallback(() => {
    if (state.isLocked || state.isPaused) return;

    setState((prev) => {
      const newCount = prev.count + 1;
      const wasCompleted = prev.target > 0 && prev.count >= prev.target;
      const isCompleted = prev.target > 0 && newCount >= prev.target;
      const justCompleted = isCompleted && !wasCompleted;

      if (justCompleted) {
        setTimeout(() => {
          playCompletionChime(settingsRef.current.volume);
          setTargetJustCompleted(true);
          setTimeout(() => setTargetJustCompleted(false), 4000);
        }, 0);
      }

      return { ...prev, count: newCount, totalLaps: isCompleted && newCount % (prev.target || 1) === 0 ? prev.totalLaps + 1 : prev.totalLaps };
    });

    setLifetimeTotal((t) => {
      const next = t + 1;
      try { localStorage.setItem("tasbeeh-lifetime-total", String(next)); } catch {}
      return next;
    });

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);

    playSound(settingsRef.current.soundType, settingsRef.current.volume);
    vibrateDevice(settingsRef.current.vibration);
  }, [state.isLocked, state.isPaused]);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      count: 0,
      sessionStart: Date.now(),
      totalLaps: 0,
    }));
    setTargetJustCompleted(false);
  }, []);

  const setZikrName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, zikrName: name }));
  }, []);

  const setTarget = useCallback((target: number) => {
    setState((prev) => ({ ...prev, target }));
  }, []);

  const togglePause = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const toggleLock = useCallback(() => {
    setState((prev) => ({ ...prev, isLocked: !prev.isLocked }));
  }, []);

  const setCount = useCallback((count: number) => {
    setState((prev) => ({ ...prev, count: Math.max(0, count) }));
  }, []);

  const getProgress = useCallback(() => {
    if (!state.target) return 0;
    return Math.min((state.count / state.target) * 100, 100);
  }, [state.count, state.target]);

  const getRemaining = useCallback(() => {
    if (!state.target) return 0;
    return Math.max(state.target - state.count, 0);
  }, [state.count, state.target]);

  const getSessionDuration = useCallback(() => {
    return Math.floor((Date.now() - state.sessionStart) / 1000);
  }, [state.sessionStart]);

  const updateSettings = useCallback((soundType: number, volume: number, vibration: boolean) => {
    settingsRef.current = { soundType, volume, vibration };
  }, []);

  return {
    ...state,
    isAnimating,
    lifetimeTotal,
    targetJustCompleted,
    increment,
    reset,
    setZikrName,
    setTarget,
    togglePause,
    toggleLock,
    setCount,
    getProgress,
    getRemaining,
    getSessionDuration,
    updateSettings,
  };
}
