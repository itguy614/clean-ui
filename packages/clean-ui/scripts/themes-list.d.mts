export interface ThemeEntry {
  id: string;
  label: string;
  description: string;
  default?: boolean;
  aliases?: string[];
  cascade?: number;
}
export const SYNC_COMMAND: string;
export const THEMES_JSON: string;
export function loadThemes(root?: string): ThemeEntry[];
export function optIn(themes: ThemeEntry[]): ThemeEntry[];
export function cascadeOrder(themes: ThemeEntry[]): ThemeEntry[];
export function themeFilesOnDisk(root?: string): string[];
export function themeExportEntries(themes: ThemeEntry[]): Record<string, string>;
export function syncExports(exportsMap: Record<string, unknown>, themes: ThemeEntry[]): Record<string, unknown>;
export function sourceProblems(input: { themes: ThemeEntry[]; files: string[]; exports: Record<string, unknown> }): string[];
