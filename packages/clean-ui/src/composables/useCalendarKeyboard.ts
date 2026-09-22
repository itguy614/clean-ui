import { ref, nextTick, type Ref } from "vue";

export type CalendarViewMode = "days" | "months" | "years";

export interface UseCalendarKeyboardOptions {
  /** Which grid is showing — the same ref the component switches on. */
  viewMode: Ref<CalendarViewMode>;
  viewYear: Ref<number>;
  viewMonth: Ref<number>;
  /** How many years one page of the years grid shows. */
  yearsPerPage?: number;
  selectDay: (date: Date) => void;
  selectMonth: (month: number) => void;
  selectYear: (year: number) => void;
  /** Close the panel and hand focus back to the trigger. */
  close: () => void;
}

/** Columns per row, per grid — arrow-up/down moves by exactly one row. */
const COLUMNS: Record<CalendarViewMode, number> = { days: 7, months: 3, years: 3 };

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
const addYears = (date: Date, years: number) =>
  new Date(date.getFullYear() + years, date.getMonth(), date.getDate());

/** Stable key for a cell, so focus can be restored to it after a re-render. */
export function calendarCellKey(mode: CalendarViewMode, value: Date | number): string {
  if (mode === "days") {
    const d = value as Date;
    return `d:${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }
  return `${mode === "months" ? "m" : "y"}:${value as number}`;
}

/**
 * Keyboard navigation for the day/month/year grids shared by CuiDatePicker and
 * CuiDateRangePicker (#74). Both built their calendar out of unfocusable
 * `<div>`s with a click handler, so a date could only be picked with a pointer.
 *
 * One piece of state drives all three grids: `focusedDate`. The months grid
 * focuses its month, the years grid its year, so switching views keeps the
 * user where they were instead of resetting to today. Movement also pulls
 * `viewMonth`/`viewYear` along, so stepping off the edge of a month pages the
 * calendar rather than focusing a cell nobody can see.
 *
 * Movement deliberately does NOT skip disabled dates — unlike a menu, a
 * calendar is a grid whose shape carries meaning, and holes in it make it
 * impossible to navigate predictably. Disabled cells are reachable and
 * announced via `aria-disabled`; it is *selection* that refuses.
 */
export function useCalendarKeyboard(options: UseCalendarKeyboardOptions) {
  const { viewMode, viewYear, viewMonth, selectDay, selectMonth, selectYear, close } = options;
  const yearsPerPage = options.yearsPerPage ?? 12;

  const gridRef = ref<HTMLElement | null>(null);
  const focusedDate = ref<Date>(new Date());

  /** Keep the visible page in step with whatever now has focus. */
  function syncViewToFocus() {
    const date = focusedDate.value;
    if (viewMode.value === "days" || viewMode.value === "months") {
      viewMonth.value = date.getMonth();
    }
    viewYear.value = date.getFullYear();
  }

  function currentKey(): string {
    const date = focusedDate.value;
    if (viewMode.value === "days") return calendarCellKey("days", date);
    if (viewMode.value === "months") return calendarCellKey("months", date.getMonth());
    return calendarCellKey("years", date.getFullYear());
  }

  /**
   * Frames to keep retrying the focus for. CuiPopover renders its panel with
   * `visibility: hidden` until Floating UI has positioned it (#88) — and
   * `focus()` on a `visibility: hidden` element is a silent no-op, so a single
   * attempt lands nowhere and the arrow keys go to the input's caret instead.
   * Whether it happens is a race with positioning, which is why it only
   * misbehaved sometimes, and most often when opened from the keyboard.
   */
  const FOCUS_ATTEMPT_FRAMES = 10;

  function focusCell(attempt = 0) {
    const key = currentKey();
    const tryFocus = () => {
      const cell = gridRef.value?.querySelector<HTMLElement>(`[data-cui-cell="${key}"]`);
      cell?.focus();
      if (cell && document.activeElement !== cell && attempt < FOCUS_ATTEMPT_FRAMES) {
        // Not focusable yet — still hidden, or not laid out. Try again next frame.
        requestAnimationFrame(() => focusCell(attempt + 1));
      }
    };
    if (attempt === 0) nextTick(tryFocus);
    else tryFocus();
  }

  /** Point the grid at a date and focus it — call this when the panel opens. */
  function resetFocus(date: Date = new Date()) {
    focusedDate.value = date;
    syncViewToFocus();
    focusCell();
  }

  function moveTo(date: Date) {
    focusedDate.value = date;
    syncViewToFocus();
    focusCell();
  }

  function onGridKeydown(e: KeyboardEvent) {
    const mode = viewMode.value;
    const date = focusedDate.value;
    const columns = COLUMNS[mode];
    // One step along a row, and one whole row, in this grid's own unit.
    const step = (n: number) =>
      mode === "days" ? addDays(date, n) : mode === "months" ? addMonths(date, n) : addYears(date, n);

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        moveTo(step(-1));
        break;
      case "ArrowRight":
        e.preventDefault();
        moveTo(step(1));
        break;
      case "ArrowUp":
        e.preventDefault();
        moveTo(step(-columns));
        break;
      case "ArrowDown":
        e.preventDefault();
        moveTo(step(columns));
        break;
      case "Home":
        e.preventDefault();
        if (mode === "days") moveTo(addDays(date, -date.getDay()));
        else if (mode === "months") moveTo(new Date(date.getFullYear(), 0, 1));
        else moveTo(new Date(Math.floor(date.getFullYear() / yearsPerPage) * yearsPerPage, date.getMonth(), 1));
        break;
      case "End":
        e.preventDefault();
        if (mode === "days") moveTo(addDays(date, 6 - date.getDay()));
        else if (mode === "months") moveTo(new Date(date.getFullYear(), 11, 1));
        else
          moveTo(
            new Date(
              Math.floor(date.getFullYear() / yearsPerPage) * yearsPerPage + yearsPerPage - 1,
              date.getMonth(),
              1,
            ),
          );
        break;
      case "PageUp":
        e.preventDefault();
        // Shift makes it a year instead of a month, matching every native picker.
        moveTo(mode === "years" ? addYears(date, -yearsPerPage) : e.shiftKey ? addYears(date, -1) : addMonths(date, -1));
        break;
      case "PageDown":
        e.preventDefault();
        moveTo(mode === "years" ? addYears(date, yearsPerPage) : e.shiftKey ? addYears(date, 1) : addMonths(date, 1));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (mode === "days") selectDay(new Date(date));
        else if (mode === "months") selectMonth(date.getMonth());
        else selectYear(date.getFullYear());
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
      default:
    }
  }

  const isFocusedDay = (date: Date) =>
    viewMode.value === "days" &&
    date.getFullYear() === focusedDate.value.getFullYear() &&
    date.getMonth() === focusedDate.value.getMonth() &&
    date.getDate() === focusedDate.value.getDate();

  const isFocusedMonth = (month: number) =>
    viewMode.value === "months" && month === focusedDate.value.getMonth();

  const isFocusedYear = (year: number) =>
    viewMode.value === "years" && year === focusedDate.value.getFullYear();

  return {
    gridRef,
    focusedDate,
    onGridKeydown,
    resetFocus,
    focusCell,
    isFocusedDay,
    isFocusedMonth,
    isFocusedYear,
  };
}
