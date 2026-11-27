export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function showNotificationNow(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const notif = new Notification(title, {
      body,
      icon: "/favicon.svg",
      tag: `tasbeeh-${title}-${Date.now()}`,
      requireInteraction: false,
    });
    notif.onclick = () => { window.focus(); notif.close(); };
  } catch {}
}

export function scheduleNotification(title: string, body: string, time: string, _sound: string) {
  const [hoursStr, minutesStr] = time.split(":");
  const hours = parseInt(hoursStr ?? "0");
  const minutes = parseInt(minutesStr ?? "0");

  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const delay = target.getTime() - now.getTime();

  setTimeout(() => {
    showNotificationNow(title, body);
  }, delay);
}

export function cancelNotification(_tag: string) {}

export const PRAYER_TIMES = [
  { name: "Fajr",    nameAr: "الفجر",   defaultTime: "05:00", icon: "🌅" },
  { name: "Dhuhr",   nameAr: "الظهر",   defaultTime: "12:30", icon: "☀️" },
  { name: "Asr",     nameAr: "العصر",   defaultTime: "15:45", icon: "🌤️" },
  { name: "Maghrib", nameAr: "المغرب",  defaultTime: "18:30", icon: "🌆" },
  { name: "Isha",    nameAr: "العشاء",  defaultTime: "20:00", icon: "🌙" },
];
