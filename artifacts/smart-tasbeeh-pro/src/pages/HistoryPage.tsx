import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/AppLayout";
import { useHistory } from "@/hooks/useHistory";
import { HistoryEntry, SavedSession } from "@/lib/db";
import { Search, Download, Trash2, Copy, CheckCircle2, Target, Calendar, Clock, Timer, MoreVertical, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type FilterTab = "all" | "completed" | "today" | "week";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function HistoryCard({ entry, onDelete }: { entry: HistoryEntry; onDelete: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
      className="glass-card rounded-2xl p-4 border border-primary/10 hover:border-primary/30 transition-all duration-300"
      data-testid={`history-card-${entry.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">{entry.zikrName}</span>
            {entry.targetCompleted && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Target Achieved
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl font-bold font-mono text-primary lcd-display" data-testid={`count-${entry.id}`}>
              {entry.count.toLocaleString()}
            </span>
            {entry.target > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" /> {entry.target.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{entry.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{entry.time}</span>
            {entry.duration > 0 && <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{formatDuration(entry.duration)}</span>}
          </div>
          {entry.notes && (
            <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">"{entry.notes}"</p>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0" data-testid={`delete-history-${entry.id}`}>
              <Trash2 className="w-4 h-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}

function SavedSessionCard({ session, onDelete, onDuplicate, onLoad }: {
  session: SavedSession;
  onDelete: () => void;
  onDuplicate: () => void;
  onLoad: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
      className="glass-card rounded-2xl p-4 border border-primary/20 hover:border-primary/50 transition-all duration-300 cursor-pointer"
      data-testid={`saved-session-${session.id}`}
    >
      <div className="flex items-start justify-between">
        <button className="flex-1 text-left" onClick={onLoad} data-testid={`load-session-${session.id}`}>
          <div className="text-xs text-muted-foreground mb-1">{session.zikrName}</div>
          <div className="text-2xl font-bold font-mono text-primary lcd-display">{session.count.toLocaleString()}</div>
          {session.target > 0 && (
            <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" />{session.target.toLocaleString()}
            </div>
          )}
          {session.notes && <div className="text-xs text-muted-foreground mt-1 italic line-clamp-1">"{session.notes}"</div>}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground p-1 transition-colors" data-testid={`session-menu-${session.id}`}>
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass border-border">
            <DropdownMenuItem onClick={onDuplicate}><Copy className="w-4 h-4 mr-2" />Duplicate</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

export default function HistoryPage() {
  const { history, savedSessions, loading, deleteHistory, clearHistory, deleteSession, duplicateSession, exportHistory } = useHistory();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();

  const filtered = useMemo(() => {
    return history.filter((h) => {
      if (search && !h.zikrName.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "completed") return h.targetCompleted;
      if (filter === "today") return h.date === today;
      if (filter === "week") return h.timestamp >= weekAgo;
      return true;
    });
  }, [history, search, filter, today, weekAgo]);

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "completed", label: "Achieved" },
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
  ];

  const handleLoadSession = (session: SavedSession) => {
    localStorage.setItem("tasbeeh_counter_state", JSON.stringify({
      count: session.count,
      zikrName: session.zikrName,
      target: session.target,
      sessionStart: Date.now(),
      isPaused: false,
      isLocked: false,
      totalLaps: 0,
    }));
    window.location.href = "/";
  };

  return (
    <PageTransition>
        <div className="flex flex-col min-h-[100dvh] pb-24 px-4 max-w-md mx-auto">
          {/* Header */}
          <div className="pt-6 pb-4">
            <h1 className="text-2xl font-bold font-serif text-foreground tracking-wide">History</h1>
            <p className="text-sm text-muted-foreground mt-1">Your dhikr journey</p>
          </div>

          {/* Search & Export */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search zikr..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 glass border-border"
                data-testid="search-history"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="glass border-border" data-testid="history-menu">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border-border">
                <DropdownMenuItem onClick={exportHistory} data-testid="export-history">
                  <Download className="w-4 h-4 mr-2" />Export CSV
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive" data-testid="clear-all">
                      <Trash2 className="w-4 h-4 mr-2" />Clear All
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete all history entries.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearHistory} className="bg-destructive hover:bg-destructive/90">Clear All</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Saved Sessions */}
          {savedSessions.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Saved Sessions</h2>
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {savedSessions.map((s) => (
                    <SavedSessionCard
                      key={s.id}
                      session={s}
                      onDelete={() => deleteSession(s.id!)}
                      onDuplicate={() => duplicateSession(s)}
                      onLoad={() => handleLoadSession(s)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  filter === tab.key
                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.4)]"
                    : "glass text-muted-foreground border border-border hover:border-primary/40"
                }`}
                data-testid={`filter-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* History List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="text-6xl mb-4 opacity-30 text-primary font-serif">✦</div>
              <p className="text-muted-foreground text-sm">No entries found</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Start counting to see your history here</p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((entry) => (
                  <HistoryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={() => deleteHistory(entry.id!)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-4 text-center text-xs text-muted-foreground">
              <BookOpen className="w-3 h-3 inline mr-1" />
              {history.length} total sessions
            </div>
          )}
        </div>
      </PageTransition>
  );
}
