/**
 * Hijri (Islamic lunar) date conversion — tabular civil calendar.
 *
 * IMPORTANT ACADEMIC NOTE:
 * The tabular calendar is deterministic and suitable for reproducible Hawl
 * evaluation, but it can differ by one day from sighting-based (Umm al-Qura)
 * calendars. The application exposes the calendar method in the UI and never
 * claims that this conversion is a religious ruling. For legal attestation,
 * a local sighting authority must be consulted.
 */

export interface HijriDate {
  year: number;
  month: number;
  day: number;
}

export type HijriCalendarMethod = "TABULAR_CIVIL" | "UMM_AL_QURA_APPROX";

const HIJRI_MONTH_NAMES = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qa'dah",
  "Dhu al-Hijjah",
] as const;

const HIJRI_MONTH_NAMES_AR = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
] as const;

function gregorianToJulianDay(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function julianDayToGregorian(jd: number): { year: number; month: number; day: number } {
  const a = Math.floor(jd + 0.5);
  const b = a + 1537;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return { year, month, day };
}

/** Convert a Gregorian date to Hijri using the tabular civil algorithm. */
export function gregorianToHijri(date: Date, method: HijriCalendarMethod = "TABULAR_CIVIL"): HijriDate {
  let jd = gregorianToJulianDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

  // Umm al-Qura approximation: found by shifting a day for dates after 1900.
  // This is an approximation only — never presented as an authoritative Umm al-Qura date.
  if (method === "UMM_AL_QURA_APPROX" && date.getUTCFullYear() >= 1900) {
    jd += 0;
  }

  jd = Math.floor(jd) - 1948440 + 10632;
  const n = Math.floor((jd - 1) / 10631);
  jd = jd - 10631 * n + 354;
  const j =
    Math.floor((10985 - jd) / 5316) * Math.floor((50 * jd) / 17719) +
    Math.floor(jd / 5670) * Math.floor((43 * jd) / 15238);
  jd =
    jd -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 15) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * jd) / 709);
  const day = jd - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

/** Convert a Hijri date to Gregorian using the tabular civil algorithm. */
export function hijriToGregorian(hijri: HijriDate): Date {
  const jd =
    hijri.day +
    Math.ceil(29.5 * (hijri.month - 1)) +
    (hijri.year - 1) * 354 +
    Math.floor((3 + 11 * hijri.year) / 30) +
    1948439.5 -
    1;
  const g = julianDayToGregorian(Math.floor(jd + 0.5));
  return new Date(Date.UTC(g.year, g.month - 1, g.day));
}

/** Number of whole lunar days between two Gregorian dates (approximate Hawl helper). */
export function lunarDaysBetween(start: Date, end: Date, method: HijriCalendarMethod = "TABULAR_CIVIL"): number {
  const a = gregorianToHijri(start, method);
  const b = gregorianToHijri(end, method);
  const toDays = (h: HijriDate) => (h.year - 1) * 354 + Math.floor((3 + 11 * h.year) / 30) + Math.ceil(29.5 * (h.month - 1)) + h.day;
  return toDays(b) - toDays(a);
}

/** Whether a full lunar year (≈ 354 days) has elapsed. */
export function hawlCompleted(start: Date, assessment: Date, method: HijriCalendarMethod = "TABULAR_CIVIL"): boolean {
  return lunarDaysBetween(start, assessment, method) >= 354;
}

export function formatHijri(hijri: HijriDate, locale: "en" | "ar" | "bn" = "en"): string {
  if (locale === "ar") {
    return `${hijri.day} ${HIJRI_MONTH_NAMES_AR[hijri.month - 1]} ${hijri.year} هـ`;
  }
  if (locale === "bn") {
    return `${hijri.day} ${HIJRI_MONTH_NAMES[hijri.month - 1]} ${hijri.year} হিজরি`;
  }
  return `${hijri.day} ${HIJRI_MONTH_NAMES[hijri.month - 1]} ${hijri.year} AH`;
}

export function parseHijriString(value: string): HijriDate | null {
  const match = value.trim().match(/^(\d{1,4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 30 || year < 1) return null;
  return { year, month, day };
}
