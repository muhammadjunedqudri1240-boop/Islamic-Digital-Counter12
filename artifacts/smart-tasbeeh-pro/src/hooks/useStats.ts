import { useMemo } from "react";
import { HistoryEntry } from "@/lib/db";

export interface Stats {
  totalCount: number;
  totalSessions: number;
  totalMinutes: number;
  longestSession: number;
  averageDailyCount: number;
  mostUsedZikr: string;
  dailyActivity: { date: string; count: number }[];
  weeklyActivity: { week: string; count: number }[];
  monthlyActivity: { month: string; count: number }[];
  zikrBreakdown: { name: string; count: number; sessions: number }[];
  completedTargets: number;
  currentStreak: number;
}

export function useStats(history: HistoryEntry[]): Stats {
  return useMemo(() => {
    if (!history.length) {
      return {
        totalCount: 0,
        totalSessions: 0,
        totalMinutes: 0,
        longestSession: 0,
        averageDailyCount: 0,
        mostUsedZikr: "—",
        dailyActivity: [],
        weeklyActivity: [],
        monthlyActivity: [],
        zikrBreakdown: [],
        completedTargets: 0,
        currentStreak: 0,
      };
    }

    const totalCount = history.reduce((sum, h) => sum + h.count, 0);
    const totalSessions = history.length;
    const totalSeconds = history.reduce((sum, h) => sum + (h.duration || 0), 0);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const longestSession = Math.max(...history.map((h) => h.duration || 0));
    const completedTargets = history.filter((h) => h.targetCompleted).length;

    const dailyMap = new Map<string, number>();
    history.forEach((h) => {
      const d = h.date || new Date(h.timestamp).toISOString().slice(0, 10);
      dailyMap.set(d, (dailyMap.get(d) ?? 0) + h.count);
    });

    const uniqueDays = dailyMap.size;
    const averageDailyCount = uniqueDays > 0 ? Math.round(totalCount / uniqueDays) : 0;

    const zikrMap = new Map<string, { count: number; sessions: number }>();
    history.forEach((h) => {
      const existing = zikrMap.get(h.zikrName) ?? { count: 0, sessions: 0 };
      zikrMap.set(h.zikrName, { count: existing.count + h.count, sessions: existing.sessions + 1 });
    });

    const zikrBreakdown = Array.from(zikrMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count);

    const mostUsedZikr = zikrBreakdown[0]?.name ?? "—";

    const now = new Date();
    const dailyActivity: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyActivity.push({ date: key, count: dailyMap.get(key) ?? 0 });
    }

    const weeklyMap = new Map<string, number>();
    history.forEach((h) => {
      const d = new Date(h.timestamp);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + h.count);
    });

    const weeklyActivity = Array.from(weeklyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([week, count]) => ({ week, count }));

    const monthlyMap = new Map<string, number>();
    history.forEach((h) => {
      const key = new Date(h.timestamp).toISOString().slice(0, 7);
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + h.count);
    });

    const monthlyActivity = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, count]) => ({ month, count }));

    const sortedDays = Array.from(dailyMap.keys()).sort();
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const key = checkDate.toISOString().slice(0, 10);
      if (dailyMap.has(key)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    void sortedDays;

    return {
      totalCount,
      totalSessions,
      totalMinutes,
      longestSession,
      averageDailyCount,
      mostUsedZikr,
      dailyActivity,
      weeklyActivity,
      monthlyActivity,
      zikrBreakdown,
      completedTargets,
      currentStreak: streak,
    };
  }, [history]);
}
