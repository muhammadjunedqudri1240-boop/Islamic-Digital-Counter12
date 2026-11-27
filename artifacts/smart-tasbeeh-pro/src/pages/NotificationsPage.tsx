import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/AppLayout";
import { useHistory } from "@/hooks/useHistory";
import { requestNotificationPermission, scheduleNotification, PRAYER_TIMES } from "@/lib/notifications";
import { db, NotificationEntry } from "@/lib/db";
import { Bell, BellOff, Plus, Trash2, Clock, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function PrayerCard({ prayer, notif, onSave, onToggle }: {
  prayer: { name: string; nameAr: string; defaultTime: string; icon: string };
  notif: NotificationEntry | undefined;
  onSave: (time: string, enabled: boolean) => void;
  onToggle: (enabled: boolean) => void;
}) {
  const [time, setTime] = useState(notif?.time ?? prayer.defaultTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-2xl p-4 border transition-all ${
        notif?.enabled ? "border-primary/30 shadow-[0_0_12px_rgba(var(--primary),0.1)]" : "border-border/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${notif?.enabled ? "bg-primary/20" : "bg-muted/30"}`}>
          {prayer.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{prayer.name}</span>
            <span className="text-xs text-muted-foreground font-serif">{prayer.nameAr}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
            <input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                onSave(e.target.value, notif?.enabled ?? false);
              }}
              className="text-xs bg-transparent text-muted-foreground border-0 outline-none cursor-pointer"
              data-testid={`time-${prayer.name}`}
            />
          </div>
        </div>
        <Switch
          checked={notif?.enabled ?? false}
          onCheckedChange={(v) => {
            onToggle(v);
            if (v) {
              scheduleNotification(
                `${prayer.name} Reminder`,
                `Time for ${prayer.name} dhikr`,
                time,
                "classic"
              );
            }
          }}
          data-testid={`switch-${prayer.name}`}
        />
      </div>
    </motion.div>
  );
}

function CustomReminderCard({ notif, onDelete, onToggle }: {
  notif: NotificationEntry;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className={`glass-card rounded-2xl p-4 border transition-all ${
        notif.enabled ? "border-primary/20" : "border-border/30"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{notif.title}</div>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{notif.time}</span>
            {notif.repeatDaily && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Daily</span>}
            {notif.repeatWeekly && notif.days?.map((d) => (
              <span key={d} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">{DAYS[d]}</span>
            ))}
          </div>
        </div>
        <Switch checked={notif.enabled} onCheckedChange={onToggle} />
        <button
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive transition-colors"
          data-testid={`delete-notif-${notif.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const [permissionGranted, setPermissionGranted] = useState(typeof Notification !== "undefined" && Notification.permission === "granted");
  const [prayerNotifs, setPrayerNotifs] = useState<NotificationEntry[]>([]);
  const [customNotifs, setCustomNotifs] = useState<NotificationEntry[]>([]);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("08:00");
  const [repeatDaily, setRepeatDaily] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const { reload: _reload } = useHistory();

  useEffect(() => {
    db.notifications.getAll().then((notifs) => {
      setPrayerNotifs(notifs.filter((n) => PRAYER_TIMES.some((p) => n.title.includes(p.name))));
      setCustomNotifs(notifs.filter((n) => !PRAYER_TIMES.some((p) => n.title.includes(p.name))));
    });
  }, []);

  const requestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (granted) toast.success("Notifications enabled");
    else toast.error("Permission denied — please enable in browser settings");
  };

  const savePrayerNotif = async (prayer: { name: string; defaultTime: string; icon: string }, time: string, enabled: boolean) => {
    const existing = prayerNotifs.find((n) => n.title.startsWith(prayer.name));
    const entry: Omit<NotificationEntry, "id"> = {
      title: `${prayer.name} Reminder`,
      time,
      sound: "classic",
      repeatDaily: true,
      repeatWeekly: false,
      enabled,
    };
    if (existing?.id) {
      const updated = { ...entry, id: existing.id };
      await db.notifications.update(updated);
      setPrayerNotifs((prev) => prev.map((n) => n.id === existing.id ? updated : n));
    } else {
      const id = await db.notifications.add(entry);
      setPrayerNotifs((prev) => [...prev.filter((n) => !n.title.startsWith(prayer.name)), { ...entry, id }]);
    }
  };

  const addCustomReminder = async () => {
    if (!newTitle.trim()) { toast.error("Please enter a title"); return; }
    const entry: Omit<NotificationEntry, "id"> = {
      title: newTitle.trim(),
      time: newTime,
      sound: "classic",
      repeatDaily,
      repeatWeekly: selectedDays.length > 0,
      enabled: true,
      days: selectedDays,
    };
    const id = await db.notifications.add(entry);
    setCustomNotifs((prev) => [...prev, { ...entry, id }]);
    if (permissionGranted) {
      scheduleNotification(entry.title, "Time for your dhikr reminder", entry.time, entry.sound);
    }
    setNewTitle("");
    setNewTime("08:00");
    setRepeatDaily(true);
    setSelectedDays([]);
    setIsAddSheetOpen(false);
    toast.success("Reminder added");
  };

  const deleteCustomNotif = async (id: number) => {
    await db.notifications.delete(id);
    setCustomNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  const toggleCustomNotif = async (id: number, enabled: boolean) => {
    const notif = customNotifs.find((n) => n.id === id);
    if (!notif) return;
    const updated = { ...notif, enabled };
    await db.notifications.update(updated);
    setCustomNotifs((prev) => prev.map((n) => n.id === id ? updated : n));
    if (enabled && permissionGranted) {
      scheduleNotification(notif.title, "Time for your dhikr reminder", notif.time, notif.sound);
    }
  };

  return (
    <PageTransition>
        <div className="flex flex-col pb-24 px-4 max-w-md mx-auto">
          <div className="pt-6 pb-4">
            <h1 className="text-2xl font-bold font-serif text-foreground tracking-wide">Reminders</h1>
            <p className="text-sm text-muted-foreground mt-1">Never miss your dhikr</p>
          </div>

          {/* Permission Banner */}
          {!permissionGranted && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-4 border border-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.15)] mb-6"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">Enable Notifications</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Allow notifications to receive prayer time reminders</div>
                </div>
              </div>
              <Button
                className="w-full mt-3 bg-primary text-primary-foreground"
                onClick={requestPermission}
                data-testid="button-enable-notifications"
              >
                <Bell className="w-4 h-4 mr-2" />Enable Notifications
              </Button>
            </motion.div>
          )}

          {permissionGranted && (
            <div className="flex items-center gap-2 text-xs text-primary mb-4 glass-card rounded-xl px-3 py-2 border border-primary/20">
              <Check className="w-3.5 h-3.5" />
              <span>Notifications enabled</span>
            </div>
          )}

          {/* Prayer Time Reminders */}
          <div className="mb-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Prayer Times</div>
            <div className="flex flex-col gap-3">
              {PRAYER_TIMES.map((prayer) => (
                <PrayerCard
                  key={prayer.name}
                  prayer={prayer}
                  notif={prayerNotifs.find((n) => n.title.includes(prayer.name))}
                  onSave={(time, enabled) => savePrayerNotif(prayer, time, enabled)}
                  onToggle={(enabled) => savePrayerNotif(prayer, prayer.defaultTime, enabled)}
                />
              ))}
            </div>
          </div>

          {/* Custom Reminders */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Custom Reminders</div>
              <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline" className="glass border-primary/30 text-primary" data-testid="button-add-reminder">
                    <Plus className="w-4 h-4 mr-1" />Add
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="glass border-t border-primary/20 rounded-t-3xl pb-safe">
                  <SheetHeader>
                    <SheetTitle className="font-serif text-foreground">New Reminder</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Reminder Title</label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Morning Dhikr"
                        className="glass border-border"
                        data-testid="input-reminder-title"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Time</label>
                      <Input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="glass border-border"
                        data-testid="input-reminder-time"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-foreground">Repeat Daily</label>
                      <Switch checked={repeatDaily} onCheckedChange={setRepeatDaily} data-testid="switch-repeat-daily" />
                    </div>
                    {!repeatDaily && (
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block">Days of Week</label>
                        <div className="flex gap-2 flex-wrap">
                          {DAYS.map((d, i) => (
                            <button
                              key={d}
                              onClick={() => setSelectedDays((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])}
                              className={`w-9 h-9 rounded-full text-xs font-semibold border transition-all ${
                                selectedDays.includes(i)
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "glass border-border text-muted-foreground"
                              }`}
                              data-testid={`day-${d}`}
                            >{d}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button className="w-full bg-primary text-primary-foreground" onClick={addCustomReminder} data-testid="button-save-reminder">
                      <Bell className="w-4 h-4 mr-2" />Save Reminder
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {customNotifs.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 border border-border/30 flex flex-col items-center text-center">
                <BellOff className="w-8 h-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No custom reminders yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Tap Add to create one</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {customNotifs.map((notif) => (
                    <CustomReminderCard
                      key={notif.id}
                      notif={notif}
                      onDelete={() => deleteCustomNotif(notif.id!)}
                      onToggle={(enabled) => toggleCustomNotif(notif.id!, enabled)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </PageTransition>
  );
}
