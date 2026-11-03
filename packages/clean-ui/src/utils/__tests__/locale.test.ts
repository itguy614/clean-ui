import { describe, it, expect } from "vitest";
import { dayPeriodLabels, formatBytes, fullDateLabel, monthNames, monthYearLabel, validLocale, weekdayLabels } from "../locale";
import { formatDate, formatToMask, parseFormattedDate } from "../date";

/** #337 — month and weekday text, sizes and AM/PM follow a locale instead of being English. */
describe("locale formatting", () => {
  it("names the months in the locale", () => {
    expect(monthNames("en", "long")[9]).toBe("October");
    expect(monthNames("de", "long")[2]).toBe("März");
    expect(monthNames("de", "short")[9]).toBe("Okt");
    expect(monthNames("ja", "short")[9]).toBe("10月");
  });

  it("gives English weekday initials as two letters, Sunday first", () => {
    expect(weekdayLabels("en")).toEqual(["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]);
  });

  it("gives weekday labels in German and Japanese", () => {
    expect(weekdayLabels("de")).toEqual(["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]);
    expect(weekdayLabels("ja")).toEqual(["日", "月", "火", "水", "木", "金", "土"]);
  });

  it("writes a full date for a screen reader", () => {
    const date = new Date(2026, 9, 20);
    expect(fullDateLabel(date, "en")).toBe("Tuesday, October 20, 2026");
    expect(fullDateLabel(date, "de")).toBe("Dienstag, 20. Oktober 2026");
    expect(monthYearLabel(date, "en")).toBe("October 2026");
    expect(monthYearLabel(date, "de")).toBe("Oktober 2026");
  });

  it("labels the halves of the day", () => {
    expect(dayPeriodLabels("en")).toEqual({ AM: "AM", PM: "PM" });
    expect(dayPeriodLabels("ja")).toEqual({ AM: "午前", PM: "午後" });
  });

  describe("formatBytes", () => {
    it("is English as it was", () => {
      expect(formatBytes(512, "en")).toBe("512 B");
      expect(formatBytes(1024 * 1024, "en")).toBe("1.0 MB");
      expect(formatBytes(1.5 * 1024 * 1024, "en")).toBe("1.5 MB");
    });

    it("uses the locale's decimal separator", () => {
      expect(formatBytes(1.5 * 1024 * 1024, "de")).toBe("1,5 MB");
      expect(formatBytes(1.5 * 1024 * 1024, "fr")).toMatch(/^1,5\sMo$/);
    });

    it("steps up to gigabytes", () => {
      expect(formatBytes(2.5 * 1024 ** 3, "en")).toBe("2.5 GB");
    });
  });

  describe("date formats", () => {
    const date = new Date(2026, 2, 5);

    it("writes month names in the locale, numbers unchanged", () => {
      expect(formatDate(date, "D MMMM YYYY", "de")).toBe("5 März 2026");
      expect(formatDate(date, "MMM D", "de")).toBe("Mär 5");
      expect(formatDate(date, "DD/MM/YYYY", "de")).toBe("05/03/2026");
    });

    it("stays English with no locale", () => {
      expect(formatDate(date, "MMMM D, YYYY")).toBe("March 5, 2026");
    });

    it("parses what it wrote, in the same locale", () => {
      expect(parseFormattedDate("5 März 2026", "D MMMM YYYY", "de")).toEqual(date);
      expect(parseFormattedDate("5 März 2026", "D MMMM YYYY")).toBeNull();
    });

    it("gives a mask that takes the localised names", () => {
      expect(formatToMask("MMM", "ja")).toBe("***");
      expect(formatToMask("MMM")).toBe("AAA");
      expect(formatToMask("MMMM")).toBe("AAAAAAAAAA");
    });
  });

  it("rejects a tag Intl cannot read", () => {
    expect(validLocale("de-DE")).toBe("de-DE");
    expect(validLocale("not a locale!")).toBe("en");
  });
});
