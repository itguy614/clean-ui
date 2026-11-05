/**
 * Locale-aware text for the pickers and the file list (#337): month and weekday names, full
 * dates, byte sizes and the AM/PM labels, all through `Intl`, so no string here is a
 * translation the library has to ship. Every function takes the locale as an argument and has
 * no state beyond a formatter cache; which locale to use is `useLocale()`'s business.
 */

export const DEFAULT_LOCALE = "en";

/** `tag` canonicalised if `Intl` accepts it as a language tag, else `fallback`. */
export function validLocale(tag: string | undefined | null, fallback: string = DEFAULT_LOCALE): string {
  if (!tag) return fallback;
  try {
    return Intl.getCanonicalLocales(tag)[0] ?? fallback;
  } catch {
    return fallback;
  }
}

/** The document's language (`<html lang>`), if there is a document and it names a valid one. */
export function documentLocale(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const lang = document.documentElement?.lang;
  return lang ? validLocale(lang, "") || undefined : undefined;
}

const dateFormats = new Map<string, Intl.DateTimeFormat>();
/** A formatter for `locale`, cached under `kind` (a name for `options`, which is not looked at). */
function dateFormat(locale: string, kind: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${kind}`;
  let format = dateFormats.get(key);
  if (!format) dateFormats.set(key, (format = new Intl.DateTimeFormat(locale, options)));
  return format;
}

/** The twelve month names, January first: `long` ("October") or `short` ("Oct"). */
export function monthNames(locale: string, style: "long" | "short"): string[] {
  const format = dateFormat(locale, `month-${style}`, { month: style });
  return Array.from({ length: 12 }, (_, month) => format.format(new Date(2023, month, 1)));
}

/**
 * The seven weekday labels, Sunday first (the pickers' grids start on Sunday). Two letters
 * where the locale's short name is longer ("Su", "Mo"; German "So", Japanese "日"): `narrow`
 * is a single letter, which makes Tuesday and Thursday the same. Where two letters still
 * collide (Portuguese "seg" and "sex" are both "se"), the whole short names.
 */
export function weekdayLabels(locale: string): string[] {
  const format = dateFormat(locale, "weekday-short", { weekday: "short" });
  const names = Array.from({ length: 7 }, (_, day) => format.format(new Date(2023, 0, 1 + day)).replace(/\.$/, ""));
  const twoLetters = names.map((name) => Array.from(name).slice(0, 2).join(""));
  return new Set(twoLetters).size === 7 ? twoLetters : names;
}

/** A day written out for a screen reader: "Monday, October 20, 2026". */
export function fullDateLabel(date: Date, locale: string): string {
  return dateFormat(locale, "full", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(date);
}

/** A month and year: "October 2026". */
export function monthYearLabel(date: Date, locale: string): string {
  return dateFormat(locale, "month-year", { month: "long", year: "numeric" }).format(date);
}

/** The locale's labels for the two halves of a 12-hour day ("AM"/"PM"; Japanese "午前"/"午後"). */
export function dayPeriodLabels(locale: string): { AM: string; PM: string } {
  const label = (hour: number, fallback: string) =>
    dateFormat(locale, "day-period", { hour: "numeric", hourCycle: "h12" })
      .formatToParts(new Date(2023, 0, 1, hour))
      .find((part) => part.type === "dayPeriod")?.value ?? fallback;
  return { AM: label(9, "AM"), PM: label(15, "PM") };
}

const SIZE_UNITS = ["kilobyte", "megabyte", "gigabyte"] as const;
const sizeFormats = new Map<string, Intl.NumberFormat | null>();
function sizeFormat(locale: string, unit: string, digits: number): Intl.NumberFormat | null {
  const key = `${locale}|${unit}|${digits}`;
  let format = sizeFormats.get(key);
  if (format === undefined) {
    try {
      format = new Intl.NumberFormat(locale, {
        style: "unit", unit, unitDisplay: "short", minimumFractionDigits: digits, maximumFractionDigits: digits,
      });
    } catch {
      format = null; // an engine without `unit` style
    }
    sizeFormats.set(key, format);
  }
  return format;
}

/**
 * A byte count as a short size, 1024 to the step: "512 B", "1.5 MB", and "1,5 MB" in German.
 * Numbers and unit names come from `Intl.NumberFormat`; one decimal above a kilobyte, as it
 * always was. The word "byte" (Intl's short English and German form) stays "B"; where the
 * locale has its own symbol, such as French "o", that is used.
 */
export function formatBytes(bytes: number, locale: string): string {
  let unit = "byte";
  let value = bytes;
  for (const next of SIZE_UNITS) {
    if (value < 1024) break;
    value /= 1024;
    unit = next;
  }
  const digits = unit === "byte" ? 0 : 1;
  const format = sizeFormat(locale, unit, digits);
  if (!format) {
    const symbol = { byte: "B", kilobyte: "KB", megabyte: "MB", gigabyte: "GB" }[unit];
    const number = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
    return `${number.format(value)} ${symbol}`;
  }
  return format.formatToParts(value).map((part) => (part.type === "unit" && /^bytes?$/i.test(part.value) ? "B" : part.value)).join("");
}
