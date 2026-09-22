import { ref, computed, nextTick, type Ref } from "vue";
import { addDays, addMonths, addYears, yearPageStart, YEARS_PER_PAGE } from "../utils/date";

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
  /** Open the panel. */
  open: () => void;
  /** Close the panel and hand focus back to the trigger. */
  close: () => void;
  /** Whether the control is currently disabled. */
  isDisabled?: () => boolean;
}

/** Columns per row, per grid — arrow-up/down moves by exactly one row. */
const COLUMNS: Record<CalendarViewMode, number> = { days: 7, months: 3, years: 3 };

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
  const { viewMode, viewYear, viewMonth, selectDay, selectMonth, selectYear, open, close } = options;
  const yearsPerPage = options.yearsPerPage ?? YEARS_PER_PAGE;
  const isDisabled = options.isDisabled ?? (() => false);

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

  /**
   * The focused cell's key, as one string. Cells compare their own key against
   * it, which is a single string compare per cell instead of three Date getters
   * — and the grid re-renders on every arrow press, so that ran ~250 times a
   * keystroke before.
   */
  const focusedKey = computed(() => {
    const date = focusedDate.value;
    if (viewMode.value === "days") return calendarCellKey("days", date);
    if (viewMode.value === "months") return calendarCellKey("months", date.getMonth());
    return calendarCellKey("years", date.getFullYear());
  });

  /** Roving tabindex: only the focused cell is in the tab order. */
  const cellTabIndex = (key: string) => (key === focusedKey.value ? 0 : -1);

  function focusCell() {
    const key = focusedKey.value;
    // One attempt is enough: CuiPopover hides its unpositioned panel with
    // `opacity: 0` rather than `visibility: hidden` (#112), so the cell is
    // focusable as soon as it is rendered.
    //
    // `preventScroll` because of that same change: the cell is focusable while
    // the panel is still at the origin, and focusing an element scrolls it into
    // view — which yanked the whole page to the top. The calendar opens beside
    // a trigger the user is already looking at, so there is nothing to scroll
    // to.
    nextTick(() => {
      gridRef.value
        ?.querySelector<HTMLElement>(`[data-cui-cell="${key}"]`)
        ?.focus({ preventScroll: true });
    });
  }

  function moveTo(date: Date) {
    focusedDate.value = date;
    syncViewToFocus();
    focusCell();
  }

  /** Point the grid at a date and focus it — call this when the panel opens. */
  const resetFocus = (date: Date = new Date()) => moveTo(date);

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
      case "End": {
        e.preventDefault();
        const toEnd = e.key === "End";
        if (mode === "days") moveTo(addDays(date, toEnd ? 6 - date.getDay() : -date.getDay()));
        else if (mode === "months") moveTo(new Date(date.getFullYear(), toEnd ? 11 : 0, 1));
        else {
          const pageStart = yearPageStart(date.getFullYear(), yearsPerPage);
          moveTo(new Date(toEnd ? pageStart + yearsPerPage - 1 : pageStart, date.getMonth(), 1));
        }
        break;
      }
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

  /**
   * Opening the calendar from the field. CuiPopover's only open path is a click,
   * so without this the grid navigation above is unreachable: a keyboard user
   * can tab to the field and type a date, but never see the calendar.
   *
   * `ArrowDown` is the convention for a date field and for comboboxes generally.
   * Enter is deliberately not bound — in a form it submits, and the field
   * accepts typed input, so stealing it would be worse than useless.
   */
  function onFieldKeydown(e: KeyboardEvent) {
    if (isDisabled()) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      open();
    }
  }

  return {
    gridRef,
    focusedDate,
    focusedKey,
    cellTabIndex,
    onGridKeydown,
    onFieldKeydown,
    resetFocus,
    focusCell,
  };
}
