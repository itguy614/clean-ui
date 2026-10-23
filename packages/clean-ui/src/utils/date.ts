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

/** How many years one page of a year picker shows. */
export const YEARS_PER_PAGE = 12;

/**
 * Calendar arithmetic. Here rather than private to a component so the next
 * picker doesn't hand-roll its own — this file is already the home for
 * `daysInMonth`, `firstDayOfMonth` and friends. Date's constructor normalises
 * overflow for us, so adding 1 to 31 January lands on 1 February.
 */
export const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const addMonths = (date: Date, months: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + months, date.getDate());

export const addYears = (date: Date, years: number): Date =>
  new Date(date.getFullYear() + years, date.getMonth(), date.getDate());

/** First year of the page `date` falls in, for a year grid. */
export const yearPageStart = (year: number, perPage: number = YEARS_PER_PAGE): number =>
  Math.floor(year / perPage) * perPage;

/** One cell of a month's day grid. */
export interface MonthGridCell {
  date: Date;
  /** False for the days of the months either side that fill the first and last rows. */
  inMonth: boolean;
  disabled: boolean;
}

/**
 * A month as a calendar shows it: six rows of seven days, Sunday first, padded with the end
 * of the month before and the start of the month after — always 42 cells, so the grid
 * doesn't change height from month to month.
 */
export function buildMonthGrid(year: number, month: number, isDisabled: (date: Date) => boolean): MonthGridCell[] {
  const cells: MonthGridCell[] = [];
  const push = (date: Date, inMonth: boolean) => cells.push({ date, inMonth, disabled: isDisabled(date) });
  const lead = firstDayOfMonth(year, month);
  for (let i = lead; i > 0; i--) push(new Date(year, month, 1 - i), false);
  for (let day = 1; day <= daysInMonth(year, month); day++) push(new Date(year, month, day), true);
  for (let day = 1; cells.length < 42; day++) push(new Date(year, month + 1, day), false);
  return cells;
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
/**
 * The format tokens, longest first, so one alternation matches `MMMM` before `MMM`, `MM`
 * and `M`. Everything else in a format is literal.
 */
const TOKEN = /YYYY|YY|MMMM|MMM|MM|M|DD|D/g;

export function formatDate(date: Date, format: string): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const values: Record<string, string> = {
    YYYY: String(y),
    YY: String(y).slice(-2),
    MMMM: MONTH_NAMES[m],
    MMM: MONTH_NAMES_SHORT[m],
    MM: String(m + 1).padStart(2, "0"),
    M: String(m + 1),
    DD: String(d).padStart(2, "0"),
    D: String(d),
  };
  // One pass (#340): a replacement is never scanned again, so the "M" in "March" or the
  // "D" in "Dec" stays a letter.
  return format.replace(TOKEN, (token) => values[token]);
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Parse a formatted date string back into a Date using the format pattern. The whole
 * string has to match (a half-typed date is `null`), and so does the date itself: no
 * 31 February rolling over into March.
 */
export function parseFormattedDate(value: string, format: string): Date | null {
  if (!value || !format) return null;

  // The format as a pattern, token by token, so a month name of any length lines up (#340).
  const groups: string[] = [];
  let pattern = "";
  let last = 0;
  for (const match of format.matchAll(TOKEN)) {
    pattern += escapeRegExp(format.slice(last, match.index));
    const token = match[0];
    groups.push(token);
    pattern +=
      token === "YYYY" ? "(\\d{4})"
      : token === "MMMM" ? `(${MONTH_NAMES.join("|")})`
      : token === "MMM" ? `(${MONTH_NAMES_SHORT.join("|")})`
      : token.length === 2 ? "(\\d{2})"
      : "(\\d{1,2})";
    last = match.index + token.length;
  }
  pattern += escapeRegExp(format.slice(last));
  const parts = new RegExp(`^${pattern}$`, "i").exec(value.trim());
  if (!parts) return null;

  let year = -1, month = -1, day = 1;
  groups.forEach((token, i) => {
    const part = parts[i + 1];
    const lower = part.toLowerCase();
    if (token === "YYYY") year = parseInt(part, 10);
    else if (token === "YY") year = 2000 + parseInt(part, 10);
    else if (token === "MMMM") month = MONTH_NAMES.findIndex((n) => n.toLowerCase() === lower);
    else if (token === "MMM") month = MONTH_NAMES_SHORT.findIndex((n) => n.toLowerCase() === lower);
    else if (token === "MM" || token === "M") month = parseInt(part, 10) - 1;
    else day = parseInt(part, 10);
  });

  if (year < 0 || month < 0 || month > 11 || day < 1) return null;
  const date = new Date(year, month, day);
  return date.getMonth() === month ? date : null;
}

/** Convert a format pattern to a mask pattern for CuiMaskedInput (uses # for digits) */
export function formatToMask(format: string): string {
  const masks: Record<string, string> = {
    YYYY: "####",
    YY: "##",
    MMMM: "AAAAAAAAAA", // up to 10 chars
    MMM: "AAA",
    MM: "##",
    M: "##",
    DD: "##",
    D: "##",
  };
  // One pass, like formatDate (#340).
  return format.replace(TOKEN, (token) => masks[token]);
}

/** Extract raw digits from a formatted date string (strips separators) */
export function formatToRaw(formatted: string): string {
  return formatted.replace(/[^0-9a-zA-Z]/g, "");
}

/** A picker's value as a Date: a Date as it is, an ISO string parsed, nothing as null. */
export function toDateValue(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : isoToDate(value);
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
