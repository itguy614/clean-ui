// Tailwind spacing scale values
export type TailwindSpacing =
  | "0"
  | "px"
  | "0.5"
  | "1"
  | "1.5"
  | "2"
  | "2.5"
  | "3"
  | "3.5"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "14"
  | "16"
  | "20"
  | "24"
  | "28"
  | "32"
  | "36"
  | "40"
  | "44"
  | "48"
  | "52"
  | "56"
  | "60"
  | "64"
  | "72"
  | "80"
  | "96";

// Tailwind breakpoints
export type TailwindBreakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

// Responsive value type
export type ResponsiveValue<T> =
  | T
  | Partial<Record<TailwindBreakpoint, T>>;

// Grid column count (1-12 for common use cases, or string for custom templates)
export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// Grid rows count
export type GridRows = 1 | 2 | 3 | 4 | 5 | 6;

// Grid item span
export type GridSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | "full";

// Flex direction
export type FlexDirection = "row" | "row-reverse" | "col" | "col-reverse";

// Flex wrap
export type FlexWrap = "wrap" | "wrap-reverse" | "nowrap";
