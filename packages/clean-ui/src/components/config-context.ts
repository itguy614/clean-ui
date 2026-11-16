import type { ComputedRef, InjectionKey, Ref } from "vue";
import type { CuiMessages } from "../messages";
import type { CuiColor, CuiRoleIcon, CuiTitleAs } from "../types/common";

/** Resolved (merged) message catalog provided by CuiConfigProvider. */
export const CuiConfigKey: InjectionKey<ComputedRef<CuiMessages>> = Symbol("cui-config");

/**
 * The components whose title renders as a heading, by the key `headingLevels` sets them
 * under. CuiModal and CuiSlideover render their title through CuiModalHeader, so
 * `modalHeader` sets all three.
 */
export interface CuiHeadingLevels {
  cardHeader: CuiTitleAs;
  modalHeader: CuiTitleAs;
  confirmDialog: CuiTitleAs;
  emptyState: CuiTitleAs;
}

/** App-wide defaults (#149): what an application decides once rather than at every call site. */
export interface CleanUIConfig {
  /** The heading level each titled component renders at, unless its `titleAs` says otherwise. */
  headingLevels?: Partial<CuiHeadingLevels>;
  /** The icon each colour role renders in CuiAlert, CuiToast and CuiBanner. */
  roleIcons?: Partial<Record<CuiColor, CuiRoleIcon>>;
  /**
   * The locale dates, month and weekday names, file sizes and AM/PM labels are formatted in
   * (#337), as a BCP 47 tag such as `"de"`. Unset, it follows the document's `lang`, then `"en"`.
   */
  locale?: string;
}

/** `CleanUIConfig` once merged: every layer present, `locale` still optional (unset means the document's). */
export type ResolvedCleanUIConfig = Required<Omit<CleanUIConfig, "locale">> & Pick<CleanUIConfig, "locale">;

/** The defaults an app (`createCleanUI`) or a subtree (`CuiConfigProvider`) provides, merged down the tree. */
export const CuiDefaultsKey: InjectionKey<Readonly<Ref<ResolvedCleanUIConfig>>> = Symbol("cui-defaults");
