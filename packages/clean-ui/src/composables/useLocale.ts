import { computed, type ComputedRef } from "vue";
import { globalLocale, useCleanUIDefaults } from "../utils/configure";
import { DEFAULT_LOCALE, documentLocale, validLocale } from "../utils/locale";

/**
 * The locale the library formats dates, month and weekday names, file sizes and AM/PM labels
 * in (#337), as a BCP 47 tag. In order: the nearest `CuiConfigProvider`'s `locale`, the
 * `locale` given to `createCleanUI()`, `configureCleanUI({ locale })`, the document's
 * `<html lang>`, then `"en"`. A tag `Intl` rejects is skipped. On the server there is no
 * document, so it is the configured locale or `"en"`.
 *
 * The document's `lang` is read when a component sets up, not watched: set `lang` before the
 * app mounts, or give the locale explicitly, which is reactive.
 */
export function useLocale(): ComputedRef<string> {
  const defaults = useCleanUIDefaults();
  const fromDocument = documentLocale();
  return computed(
    () => validLocale(defaults?.value.locale ?? globalLocale.value, "") || fromDocument || DEFAULT_LOCALE,
  );
}
