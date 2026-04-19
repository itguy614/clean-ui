/** Month names */
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const DAY_NAMES_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Get number of days in a month */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Get day of week for first day of month (0=Sun) */
export function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/** Check if two dates are the same calendar day */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/** Check if a date is today */
export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

/** Format a Date using a format string pattern */
export function formatDate(date: Date, format: string): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  return format
    .replace("YYYY", String(y))
    .replace("YY", String(y).slice(-2))
    .replace("MMMM", MONTH_NAMES[m])
    .replace("MMM", MONTH_NAMES_SHORT[m])
    .replace("MM", String(m + 1).padStart(2, "0"))
    .replace(/(?<!M)M(?!M)/, String(m + 1))
    .replace("DD", String(d).padStart(2, "0"))
    .replace(/(?<!D)D(?!D)/, String(d));
}

/** Parse a formatted date string back into a Date using the format pattern */
export function parseFormattedDate(value: string, format: string): Date | null {
  if (!value || !format) return null;

  let year = -1, month = -1, day = 1;

  // Extract positions from format
  const yearMatch4 = format.indexOf("YYYY");
  const yearMatch2 = yearMatch4 === -1 ? format.indexOf("YY") : -1;
  const monthMatchLong = format.indexOf("MMMM");
  const monthMatchShort = monthMatchLong === -1 ? format.indexOf("MMM") : -1;
  const monthMatch2 = monthMatchLong === -1 && monthMatchShort === -1 ? format.indexOf("MM") : -1;
  const dayMatch2 = format.indexOf("DD");

  if (yearMatch4 !== -1) {
    const v = value.slice(yearMatch4, yearMatch4 + 4);
    year = parseInt(v, 10);
  } else if (yearMatch2 !== -1) {
    const v = value.slice(yearMatch2, yearMatch2 + 2);
    year = 2000 + parseInt(v, 10);
  }

  if (monthMatch2 !== -1) {
    const v = value.slice(monthMatch2, monthMatch2 + 2);
    month = parseInt(v, 10) - 1;
  } else if (monthMatchShort !== -1) {
    const name = value.slice(monthMatchShort, monthMatchShort + 3);
    month = MONTH_NAMES_SHORT.findIndex((n) => n.toLowerCase() === name.toLowerCase());
  } else if (monthMatchLong !== -1) {
    const found = MONTH_NAMES.find((n) => value.includes(n));
    if (found) month = MONTH_NAMES.indexOf(found);
  }

  if (dayMatch2 !== -1) {
    const v = value.slice(dayMatch2, dayMatch2 + 2);
    day = parseInt(v, 10);
  }

  if (isNaN(year) || year < 0 || month < 0 || month > 11 || isNaN(day)) return null;

  return new Date(year, month, day);
}

/** Convert a format pattern to a mask pattern for CuiMaskedInput (uses # for digits) */
export function formatToMask(format: string): string {
  return format
    .replace("YYYY", "####")
    .replace("YY", "##")
    .replace("MMMM", "AAAAAAAAAA") // up to 10 chars
    .replace("MMM", "AAA")
    .replace("MM", "##")
    .replace(/(?<!#)M(?!M)/, "##")
    .replace("DD", "##")
    .replace(/(?<!#)D(?!D)/, "##");
}

/** Extract raw digits from a formatted date string (strips separators) */
export function formatToRaw(formatted: string): string {
  return formatted.replace(/[^0-9a-zA-Z]/g, "");
}

/** Convert ISO string (YYYY-MM-DD) to Date */
export function isoToDate(iso: string): Date | null {
  if (!iso) return null;
  const parts = iso.split("-");
  if (parts.length < 3) return null;
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return isNaN(d.getTime()) ? null : d;
}

/** Convert Date to ISO string (YYYY-MM-DD) */
export function dateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface DisabledDateRange {
  from: string; // ISO
  to: string;   // ISO
}

/** Check if a date is disabled */
export function isDateDisabled(
  date: Date,
  opts: {
    minDate?: Date | null;
    maxDate?: Date | null;
    disabledDate?: (date: Date) => boolean;
    disabledDates?: (string | DisabledDateRange)[];
  },
): boolean {
  if (opts.minDate && date < opts.minDate) return true;
  if (opts.maxDate && date > opts.maxDate) return true;
  if (opts.disabledDate && opts.disabledDate(date)) return true;
  if (opts.disabledDates) {
    const iso = dateToIso(date);
    for (const entry of opts.disabledDates) {
      if (typeof entry === "string") {
        if (entry === iso) return true;
      } else {
        if (iso >= entry.from && iso <= entry.to) return true;
      }
    }
  }
  return false;
}
