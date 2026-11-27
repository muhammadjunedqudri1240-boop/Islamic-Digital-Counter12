import { useState, useEffect, useCallback } from "react";
import { db, HistoryEntry, SavedSession } from "@/lib/db";

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [h, s] = await Promise.all([db.history.getAll(), db.savedSessions.getAll()]);
    setHistory(h.sort((a, b) => b.timestamp - a.timestamp));
    setSavedSessions(s.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addHistory = useCallback(async (entry: Omit<HistoryEntry, "id">) => {
    await db.history.add(entry);
    reload();
  }, [reload]);

  const deleteHistory = useCallback(async (id: number) => {
    await db.history.delete(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const clearHistory = useCallback(async () => {
    await db.history.clear();
    setHistory([]);
  }, []);

  const saveSession = useCallback(async (session: Omit<SavedSession, "id">) => {
    await db.savedSessions.add(session);
    reload();
  }, [reload]);

  const deleteSession = useCallback(async (id: number) => {
    await db.savedSessions.delete(id);
    setSavedSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const duplicateSession = useCallback(async (session: SavedSession) => {
    const { id: _id, ...rest } = session;
    await db.savedSessions.add({ ...rest, zikrName: `${rest.zikrName} (copy)`, createdAt: Date.now() });
    reload();
  }, [reload]);

  const exportHistory = useCallback(() => {
    const csv = [
      ["Zikr", "Count", "Target", "Completed", "Date", "Time", "Duration (s)", "Notes"].join(","),
      ...history.map((h) =>
        [
          `"${h.zikrName}"`,
          h.count,
          h.target,
          h.targetCompleted ? "Yes" : "No",
          `"${h.date}"`,
          `"${h.time}"`,
          h.duration,
          `"${h.notes}"`,
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tasbeeh-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [history]);

  return {
    history,
    savedSessions,
    loading,
    addHistory,
    deleteHistory,
    clearHistory,
    saveSession,
    deleteSession,
    duplicateSession,
    exportHistory,
    reload,
  };
}
