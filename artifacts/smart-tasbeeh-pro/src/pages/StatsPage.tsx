import { useMemo } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/AppLayout";
import { useHistory } from "@/hooks/useHistory";
import { useStats } from "@/hooks/useStats";
import { TrendingUp, Award, Clock, Zap, Hash, Flame, Target, BarChart2 } from "lucide-react";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

function StatCard({ icon: Icon, label, value, subtitle, highlight }: {
  icon: typeof TrendingUp;
  label: string;
  value: string | number;
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-2xl p-4 border transition-all ${
        highlight ? "border-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.15)]" : "border-border/50"
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${highlight ? "bg-primary/20" : "bg-muted/50"}`}>
        <Icon className={`w-4 h-4 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className={`text-2xl font-bold font-mono lcd-display ${highlight ? "text-primary" : "text-foreground"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {subtitle && <div className="text-[10px] text-muted-foreground/60 mt-0.5">{subtitle}</div>}
    </motion.div>
  );
}

function MiniBarChart({ data, label }: { data: { date?: string; week?: string; count: number }[]; label: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="glass-card rounded-2xl p-4 border border-border/50">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">{label}</div>
      <div className="flex items-end gap-1 h-20">
        {data.map((d, i) => {
          const height = Math.max((d.count / max) * 100, d.count > 0 ? 8 : 0);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: "easeOut" }}
                className="w-full rounded-sm bg-primary/70 hover:bg-primary transition-colors cursor-pointer relative group"
                data-testid={`bar-${i}`}
              >
                {d.count > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {d.count.toLocaleString()}
                  </div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground/40 mt-2">
        <span>{data[0]?.date?.slice(5) ?? data[0]?.week?.slice(5) ?? ""}</span>
        <span>{data[data.length - 1]?.date?.slice(5) ?? data[data.length - 1]?.week?.slice(5) ?? ""}</span>
      </div>
    </div>
  );
}

function ZikrBreakdownBar({ name, count, maxCount, sessions }: { name: string; count: number; maxCount: number; sessions: number }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="py-2.5 border-b border-border/30 last:border-0">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-foreground font-medium truncate max-w-[60%]">{name}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{sessions} sessions</span>
          <span className="text-sm font-bold font-mono text-primary lcd-display">{count.toLocaleString()}</span>
        </div>
      </div>
      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
        />
      </div>
    </div>
  );
}

function RingProgress({ pct, label, value }: { pct: number; label: string; value: string }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 90 90" className="w-full h-full -rotate-90">
          <circle cx="45" cy="45" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <motion.circle
            cx="45" cy="45" r={r}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-bold text-foreground">{value}</div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { history, loading } = useHistory();
  const stats = useStats(history);

  const last7Days = useMemo(() => stats.dailyActivity.slice(-7), [stats.dailyActivity]);
  const weekGoal = 10000;
  const monthGoal = 50000;
  const weekCount = useMemo(() => last7Days.reduce((sum, d) => sum + d.count, 0), [last7Days]);
  const monthCount = useMemo(() => stats.monthlyActivity[stats.monthlyActivity.length - 1]?.count ?? 0, [stats.monthlyActivity]);
  const maxZikrCount = stats.zikrBreakdown[0]?.count ?? 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80dvh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!stats.totalSessions) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-[80dvh] text-center px-8">
          <div className="text-7xl mb-6 text-primary/30 font-serif">✦</div>
          <h2 className="text-xl font-bold text-foreground mb-2">No Data Yet</h2>
          <p className="text-sm text-muted-foreground">Complete some tasbeeh sessions to see your statistics here.</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
        <div className="flex flex-col pb-24 px-4 max-w-md mx-auto">
          {/* Header */}
          <div className="pt-6 pb-4">
            <h1 className="text-2xl font-bold font-serif text-foreground tracking-wide">Statistics</h1>
            <p className="text-sm text-muted-foreground mt-1">Your progress at a glance</p>
          </div>

          {/* Top Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard icon={Hash} label="Total Count" value={stats.totalCount} highlight />
            <StatCard icon={TrendingUp} label="Total Sessions" value={stats.totalSessions} />
            <StatCard icon={Clock} label="Total Minutes" value={stats.totalMinutes} subtitle="time in dhikr" />
            <StatCard icon={Flame} label="Current Streak" value={`${stats.currentStreak}d`} subtitle="consecutive days" highlight />
          </div>

          {/* Featured: Most Used Zikr */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-5 border border-primary/30 shadow-[0_0_24px_rgba(var(--primary),0.1)] mb-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Most Used Zikr</span>
            </div>
            <div className="text-xl font-bold text-foreground">{stats.mostUsedZikr}</div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-border/30">
              <div>
                <div className="text-xs text-muted-foreground">Avg Daily</div>
                <div className="text-base font-bold font-mono text-primary lcd-display">{stats.averageDailyCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Targets Hit</div>
                <div className="text-base font-bold font-mono text-primary lcd-display">{stats.completedTargets}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Longest</div>
                <div className="text-base font-bold text-foreground">{formatDuration(stats.longestSession)}</div>
              </div>
            </div>
          </motion.div>

          {/* Daily Activity Chart */}
          {last7Days.length > 0 && (
            <div className="mb-6">
              <MiniBarChart data={last7Days} label="Last 7 Days" />
            </div>
          )}

          {/* Weekly / Monthly Progress Rings */}
          {(weekCount > 0 || monthCount > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-5 border border-border/50 mb-6"
            >
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <BarChart2 className="w-3.5 h-3.5" /> Goals Progress
              </div>
              <div className="flex justify-around">
                <RingProgress pct={Math.min((weekCount / weekGoal) * 100, 100)} label="Weekly" value={weekCount.toLocaleString()} />
                <RingProgress pct={Math.min((monthCount / monthGoal) * 100, 100)} label="Monthly" value={monthCount.toLocaleString()} />
                <RingProgress pct={Math.min((stats.completedTargets / Math.max(stats.totalSessions, 1)) * 100, 100)} label="Targets Hit" value={`${stats.completedTargets}/${stats.totalSessions}`} />
              </div>
            </motion.div>
          )}

          {/* Zikr Breakdown */}
          {stats.zikrBreakdown.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-5 border border-border/50 mb-6"
            >
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Target className="w-3.5 h-3.5" /> Zikr Breakdown
              </div>
              {stats.zikrBreakdown.slice(0, 6).map((z) => (
                <ZikrBreakdownBar key={z.name} name={z.name} count={z.count} maxCount={maxZikrCount} sessions={z.sessions} />
              ))}
            </motion.div>
          )}

          {/* All-Time Records */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-5 border border-border/50"
          >
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> All-Time Records
            </div>
            <div className="space-y-3">
              {[
                { label: "Total Count", value: stats.totalCount.toLocaleString() },
                { label: "Total Sessions", value: stats.totalSessions.toLocaleString() },
                { label: "Time in Dhikr", value: `${stats.totalMinutes} mins` },
                { label: "Longest Session", value: formatDuration(stats.longestSession) },
                { label: "Average Daily Count", value: stats.averageDailyCount.toLocaleString() },
                { label: "Completed Targets", value: stats.completedTargets.toLocaleString() },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-1 border-b border-border/20 last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-bold font-mono text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </PageTransition>
  );
}
