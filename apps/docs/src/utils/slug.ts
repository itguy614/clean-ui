/**
 * Heading id from heading text. Shared by `DocPage` (h2) and `Example` (h3) so that a
 * section and the on-page nav entry pointing at it can never disagree — `PageNav` reads
 * the ids off the rendered document rather than being told them.
 */
export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
