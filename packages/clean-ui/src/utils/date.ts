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

/**
 * What each format token writes, matches when parsing, and takes in an input mask. Listed
 * longest first, so the one alternation built from them matches `MMMM` before `MMM`, `MM`
 * and `M`. Everything else in a format is literal.
 */
interface Parsed {
  year: number;
  month: number;
  day: number;
}
const monthIndex = (names: string[], text: string) => names.findIndex((n) => n.toLowerCase() === text.toLowerCase());
const TOKENS: Record<string, { write: (d: Date) => string; pattern: string; mask: string; read: (text: string, into: Parsed) => void }> = {
  YYYY: { write: (d) => String(d.getFullYear()), pattern: "\\d{4}", mask: "####", read: (t, p) => (p.year = parseInt(t, 10)) },
  YY: { write: (d) => String(d.getFullYear()).slice(-2), pattern: "\\d{2}", mask: "##", read: (t, p) => (p.year = 2000 + parseInt(t, 10)) },
  MMMM: { write: (d) => MONTH_NAMES[d.getMonth()], pattern: MONTH_NAMES.join("|"), mask: "AAAAAAAAAA", read: (t, p) => (p.month = monthIndex(MONTH_NAMES, t)) },
  MMM: { write: (d) => MONTH_NAMES_SHORT[d.getMonth()], pattern: MONTH_NAMES_SHORT.join("|"), mask: "AAA", read: (t, p) => (p.month = monthIndex(MONTH_NAMES_SHORT, t)) },
  MM: { write: (d) => String(d.getMonth() + 1).padStart(2, "0"), pattern: "\\d{2}", mask: "##", read: (t, p) => (p.month = parseInt(t, 10) - 1) },
  M: { write: (d) => String(d.getMonth() + 1), pattern: "\\d{1,2}", mask: "##", read: (t, p) => (p.month = parseInt(t, 10) - 1) },
  DD: { write: (d) => String(d.getDate()).padStart(2, "0"), pattern: "\\d{2}", mask: "##", read: (t, p) => (p.day = parseInt(t, 10)) },
  D: { write: (d) => String(d.getDate()), pattern: "\\d{1,2}", mask: "##", read: (t, p) => (p.day = parseInt(t, 10)) },
};
const TOKEN = new RegExp(Object.keys(TOKENS).join("|"), "g");

/**
 * Format a Date using a format string pattern. One pass (#340): a replacement is never
 * scanned again, so the "M" in "March" or the "D" in "Dec" stays a letter.
 */
export function formatDate(date: Date, format: string): string {
  return format.replace(TOKEN, (token) => TOKENS[token].write(date));
}

/**
 * The format an input mask holds: the mask gives `M` and `D` two digits (`##`), so a value
 * written back into it has to be padded the same way, or a typed "01/09/25" in `M/D/YY`
 * comes back as "1925" and redraws the field as "19/25/__".
 */
export function maskedFormat(format: string): string {
  return format.replace(TOKEN, (token) => (token === "M" ? "MM" : token === "D" ? "DD" : token));
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A format's full-match pattern and the tokens its groups hold, built once per format. */
const parsers = new Map<string, { pattern: RegExp; tokens: string[] }>();
function parserFor(format: string) {
  let parser = parsers.get(format);
  if (!parser) {
    const tokens: string[] = [];
    let source = "";
    let last = 0;
    for (const match of format.matchAll(TOKEN)) {
      source += escapeRegExp(format.slice(last, match.index)) + `(${TOKENS[match[0]].pattern})`;
      tokens.push(match[0]);
      last = match.index + match[0].length;
    }
    source += escapeRegExp(format.slice(last));
    parser = { pattern: new RegExp(`^${source}$`, "i"), tokens };
    parsers.set(format, parser);
  }
  return parser;
}

/**
 * Parse a formatted date string back into a Date using the format pattern. The whole
 * string has to match, token by token, so a month name of any length lines up (#340) and
 * a half-typed date is `null`; so does a date that doesn't exist, such as 31 February.
 * Without a day in the format, the 1st.
 */
export function parseFormattedDate(value: string, format: string): Date | null {
  if (!value || !format) return null;
  const { pattern, tokens } = parserFor(format);
  const parts = pattern.exec(value);
  if (!parts) return null;

  const parsed: Parsed = { year: -1, month: -1, day: 1 };
  tokens.forEach((token, i) => TOKENS[token].read(parts[i + 1], parsed));
  const { year, month, day } = parsed;
  if (year < 0 || month < 0 || month > 11 || day < 1) return null;
  const date = new Date(year, month, day);
  return date.getMonth() === month ? date : null;
}

/** Convert a format pattern to a mask pattern for CuiMaskedInput (uses # for digits) */
export function formatToMask(format: string): string {
  // One pass, like formatDate (#340).
  return format.replace(TOKEN, (token) => TOKENS[token].mask);
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
