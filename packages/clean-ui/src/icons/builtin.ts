/**
 * Every icon the library's own components can render, imported statically.
 *
 * Static named imports are the only shape `@phosphor-icons/vue` can tree-shake:
 * it ships no per-icon entry points, and the previous
 * `(await import("@phosphor-icons/vue"))[computedKey]` lookup forced bundlers to
 * retain all ~1500 icons. Listing the bounded set here caps what a consumer can
 * possibly pay for at what clean-ui actually draws.
 *
 * Every entry in this object is reachable, so bundlers keep all of them — that's
 * the deliberate trade: ~50 icons, zero configuration. Consumers add their own
 * with `registerIcons()` (tree-shakeable, since they import statically too) or
 * pass a component straight to `<CuiIcon :icon="PhFoo" />`.
 *
 * `src/icons/__tests__/builtin.test.ts` scans the components and the dynamic
 * lookup tables and fails if a name the library can render is missing here, so
 * this can't silently drift back to the full-set import.
 */
import {
  PhArrowCounterClockwise,
  PhBookmarkSimple,
  PhCalendarBlank,
  PhCaretDoubleLeft,
  PhCaretDoubleRight,
  PhCaretDown,
  PhCaretLeft,
  PhCaretRight,
  PhCaretUp,
  PhCaretUpDown,
  PhCheck,
  PhCheckCircle,
  PhCircle,
  PhCircleNotch,
  PhClock,
  PhCloudArrowUp,
  PhColumns,
  PhCopy,
  PhDotsNine,
  PhDotsSixVertical,
  PhDotsThree,
  PhEye,
  PhEyeSlash,
  PhFile,
  PhFileDoc,
  PhFilePdf,
  PhFileText,
  PhFileXls,
  PhFileZip,
  PhFloppyDisk,
  PhFunnel,
  PhImage,
  PhInfo,
  PhMagnifyingGlass,
  PhMinus,
  PhMusicNote,
  PhPlus,
  PhPushPin,
  PhQuestion,
  PhSpinnerGap,
  PhSquaresFour,
  PhStar,
  PhStarHalf,
  PhTable,
  PhTrash,
  PhUploadSimple,
  PhUser,
  PhVideoCamera,
  PhWarning,
  PhWarningCircle,
  PhX,
  PhXCircle,
} from "@phosphor-icons/vue";
import type { Component } from "vue";

/** kebab-case icon name → Phosphor component. */
export const BUILTIN_ICONS: Record<string, Component> = {
  // --- Carets / navigation ---
  "caret-down": PhCaretDown,
  "caret-left": PhCaretLeft,
  "caret-right": PhCaretRight,
  "caret-up": PhCaretUp,
  "caret-up-down": PhCaretUpDown, // CuiDataGrid unsorted column
  "caret-double-left": PhCaretDoubleLeft,
  "caret-double-right": PhCaretDoubleRight,

  // --- Controls / actions ---
  check: PhCheck,
  copy: PhCopy,
  "dots-nine": PhDotsNine,
  "dots-six-vertical": PhDotsSixVertical,
  "dots-three": PhDotsThree,
  eye: PhEye,
  "eye-slash": PhEyeSlash,
  "floppy-disk": PhFloppyDisk,
  funnel: PhFunnel,
  "magnifying-glass": PhMagnifyingGlass,
  minus: PhMinus,
  plus: PhPlus,
  "push-pin": PhPushPin,
  trash: PhTrash,
  "upload-simple": PhUploadSimple,
  x: PhX,
  "arrow-counter-clockwise": PhArrowCounterClockwise,
  "bookmark-simple": PhBookmarkSimple,

  // --- Status (COLOR_ICON_MAP + CuiConfirmDialog) ---
  "check-circle": PhCheckCircle,
  info: PhInfo,
  warning: PhWarning,
  "warning-circle": PhWarningCircle,
  "x-circle": PhXCircle,

  // --- Structure / display ---
  "calendar-blank": PhCalendarBlank,
  circle: PhCircle,
  "circle-notch": PhCircleNotch,
  clock: PhClock,
  columns: PhColumns,
  "spinner-gap": PhSpinnerGap,
  "squares-four": PhSquaresFour,
  table: PhTable,
  user: PhUser,

  // --- CuiRating defaults ---
  star: PhStar,
  "star-half": PhStarHalf,

  // --- CuiFileUpload's fileIcon() ---
  "cloud-arrow-up": PhCloudArrowUp,
  file: PhFile,
  "file-doc": PhFileDoc,
  "file-pdf": PhFilePdf,
  "file-text": PhFileText,
  "file-xls": PhFileXls,
  "file-zip": PhFileZip,
  image: PhImage,
  "music-note": PhMusicNote,
  "video-camera": PhVideoCamera,

  // --- Fallback for an unknown name ---
  question: PhQuestion,
};

/** Rendered when a name can't be resolved at all. */
export const FALLBACK_ICON = PhQuestion;
