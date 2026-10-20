import { computed, ref, watch, type Ref } from "vue";
import { useCalendarKeyboard, calendarCellKey, type CalendarViewMode } from "./useCalendarKeyboard";
import { buildMonthGrid, isDateDisabled, isoToDate, yearPageStart, YEARS_PER_PAGE, type DisabledDateRange } from "../utils/date";

/** The months grid's cell keys — the same twelve every year. */
const MONTH_KEYS: readonly string[] = Object.freeze(Array.from({ length: 12 }, (_, i) => calendarCellKey("months", i)));

export interface UseDatePickerCalendarOptions {
  minDate: () => string | undefined;
  maxDate: () => string | undefined;
  disabledDate: () => ((date: Date) => boolean) | undefined;
  disabledDates: () => (string | DisabledDateRange)[] | undefined;
  /** Whether the whole control is disabled. */
  disabled: () => boolean;
  /** The grid the panel opens on. */
  openView: () => CalendarViewMode;
  /** The date the panel opens at: the selection, or a range's start. Today when null. */
  anchor: () => Date | null;
  /** The component's own selection, which differs: one date, or a range's two ends. */
  selectDay: (date: Date) => void;
  selectMonth: (month: number) => void;
  /** Focus the field the panel belongs to. */
  focusTrigger: () => void;
  /** Reset the component's own state when the panel opens, before the view is set. */
  onOpen?: () => void;
}

/**
 * The calendar CuiDatePicker and CuiDateRangePicker share (#219): the view (year, month, which
 * grid), the panel's visibility, the disabled-date rules, the 42-cell day grid, paging by
 * month and by page of years, the keyboard (`useCalendarKeyboard`), and the focus handover
 * when the panel opens and closes. What a date is selected *as* stays in each component.
 * Internal.
 */
export function useDatePickerCalendar(options: UseDatePickerCalendarOptions) {
  const viewYear = ref(new Date().getFullYear());
  const viewMonth = ref(new Date().getMonth());
  const viewMode: Ref<CalendarViewMode> = ref(options.openView());
  const popoverVisible = ref(false);

  /** Show the month a date falls in. */
  function showDate(date: Date) {
    viewYear.value = date.getFullYear();
    viewMonth.value = date.getMonth();
  }

  // --- Disabled dates ---
  const minDateObj = computed(() => {
    const iso = options.minDate();
    return iso ? isoToDate(iso) : null;
  });
  const maxDateObj = computed(() => {
    const iso = options.maxDate();
    return iso ? isoToDate(iso) : null;
  });

  function isDisabled(date: Date): boolean {
    return isDateDisabled(date, {
      minDate: minDateObj.value,
      maxDate: maxDateObj.value,
      disabledDate: options.disabledDate(),
      disabledDates: options.disabledDates(),
    });
  }

  // --- Grids ---
  // `key` is built once per month here rather than in the template: the grid re-renders on
  // every arrow press, so a template literal per cell meant 42 string allocations per
  // keystroke for a value that only changes per month.
  const calendarDays = computed(() =>
    buildMonthGrid(viewYear.value, viewMonth.value, isDisabled).map((cell) =>
      Object.assign(cell, { key: calendarCellKey("days", cell.date) }),
    ),
  );

  const yearRangeStart = computed(() => yearPageStart(viewYear.value));
  const yearRangeEnd = computed(() => yearRangeStart.value + YEARS_PER_PAGE - 1);
  const yearRange = computed(() => Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearRangeStart.value + i));
  // Built with the page, like the day keys, rather than per cell per render.
  const yearKeys = computed(() => yearRange.value.map((year) => calendarCellKey("years", year)));

  // Integer arithmetic, not a Date: `new Date(49, …)` means 1949.
  function prevMonth() {
    if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value--; }
    else viewMonth.value--;
  }
  function nextMonth() {
    if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++; }
    else viewMonth.value++;
  }

  /** A year picked: both pickers go on to its months. */
  function selectYear(year: number) {
    viewYear.value = year;
    viewMode.value = "months";
  }
  function prevYearRange() { viewYear.value -= YEARS_PER_PAGE; }
  function nextYearRange() { viewYear.value += YEARS_PER_PAGE; }

  // --- Keyboard (#74) ---
  // Enter runs the component's own selection, so a range's first press sets the start and
  // the second the end, exactly as two clicks do.
  const keyboard = useCalendarKeyboard({
    viewMode,
    viewYear,
    viewMonth,
    selectDay: options.selectDay,
    selectMonth: options.selectMonth,
    selectYear,
    open: () => { popoverVisible.value = true; },
    isDisabled: options.disabled,
    close: () => { popoverVisible.value = false; },
  });

  /**
   * Hand focus back to the field when the panel closes — but only if it is ours to take.
   *
   * Closing is very often caused by clicking somewhere else, including another picker.
   * Restoring unconditionally yanks focus out of whatever was just clicked: with two pickers
   * on a page, opening the second left the focus ring on the first one's field.
   *
   * Two cases are ours. Focus still inside our own panel — the watcher runs before the DOM
   * updates, so that is what Escape and a commit look like. Or focus already on `<body>`,
   * meaning the close orphaned it and nobody else has claimed it. Anything else belongs to
   * whatever the user just clicked.
   */
  function restoreFocusToTrigger() {
    const active = document.activeElement;
    const ours = active === document.body || (!!active && !!keyboard.gridRef.value?.contains(active));
    if (ours) options.focusTrigger();
  }

  watch(popoverVisible, (open) => {
    if (!open) {
      // Or focus falls to <body>, and a keyboard user loses their place in the form.
      restoreFocusToTrigger();
      return;
    }
    options.onOpen?.();
    viewMode.value = options.openView();
    const anchor = options.anchor();
    if (anchor) showDate(anchor);
    // Last, because it moves focus into the grid and syncs the view to wherever that lands —
    // doing it before the lines above would have them overwrite it. It starts on the anchor
    // if there is one, else today, so the arrows begin somewhere meaningful.
    keyboard.resetFocus(anchor ? new Date(anchor) : new Date());
  });

  return {
    viewYear,
    viewMonth,
    viewMode,
    popoverVisible,
    showDate,
    isDisabled,
    calendarDays,
    yearRangeStart,
    yearRangeEnd,
    yearRange,
    yearKeys,
    monthKeys: MONTH_KEYS,
    selectYear,
    prevMonth,
    nextMonth,
    prevYearRange,
    nextYearRange,
    gridRef: keyboard.gridRef,
    focusedDate: keyboard.focusedDate,
    cellTabIndex: keyboard.cellTabIndex,
    onGridKeydown: keyboard.onGridKeydown,
    onFieldKeydown: keyboard.onFieldKeydown,
  };
}
