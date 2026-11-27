export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthNameAr: string;
}

const HIJRI_MONTH_NAMES_EN = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
];

const HIJRI_MONTH_NAMES_AR = [
  "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
  "جمادى الأولى", "جمادى الثانية", "رجب", "شعبان",
  "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
];

export function toHijri(date: Date): HijriDate {
  try {
    const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    const parts = formatter.formatToParts(date);
    const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
    const month = get("month");
    const day = get("day");
    const year = get("year");
    return {
      day,
      month,
      year,
      monthName: HIJRI_MONTH_NAMES_EN[month - 1] ?? "",
      monthNameAr: HIJRI_MONTH_NAMES_AR[month - 1] ?? "",
    };
  } catch {
    return { day: 1, month: 1, year: 1447, monthName: "Muharram", monthNameAr: "محرم" };
  }
}

export function formatHijriDate(h: HijriDate): string {
  return `${h.day} ${h.monthName} ${h.year} AH`;
}

export function formatHijriDateAr(h: HijriDate): string {
  return `${h.day} ${h.monthNameAr} ${h.year} هـ`;
}

export function getFormattedDateTime() {
  const now = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, "0");
  const secs = String(now.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;

  const hijri = toHijri(now);

  return {
    time12: `${h12}:${mins}:${secs} ${ampm}`,
    time24: `${String(hours).padStart(2, "0")}:${mins}:${secs}`,
    date: `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`,
    dayName: days[now.getDay()],
    hijri: formatHijriDate(hijri),
    hijriAr: formatHijriDateAr(hijri),
    hijriObj: hijri,
  };
}
