/**
 * The opt-in theme stylesheets (#220), as text, keyed by theme id. Read from the directory, not a
 * list, so a new theme file is picked up by every test that loads them. A browser test that
 * needs a themed element appends `main + allThemesCss`; one about loading order or a missing
 * file picks from `themeCss`.
 */
const files = import.meta.glob("../../styles/themes/*.css", { query: "?inline", import: "default", eager: true }) as Record<string, string>;

export const themeCss: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, css]) => [/([^/]+)\.css$/.exec(path)![1], css] as const),
);

/** Every theme file, in file-name order: the same set as the all-in-one stylesheet. */
export const allThemesCss: string = Object.values(themeCss).join("\n");
