import type { ComputedRef, InjectionKey, Ref } from "vue";
import type { CuiMessages } from "../messages";
import type { CuiColor, CuiTitleAs } from "../types/common";

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
  roleIcons?: Partial<Record<CuiColor, string>>;
}

/** The defaults an app (`createCleanUI`) or a subtree (`CuiConfigProvider`) provides, merged down the tree. */
export const CuiDefaultsKey: InjectionKey<Readonly<Ref<Required<CleanUIConfig>>>> = Symbol("cui-defaults");
