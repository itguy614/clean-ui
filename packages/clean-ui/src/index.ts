import type { App } from "vue";
import type { CleanUIOptions } from "./types";

// Components
import CuiButton from "./components/CuiButton.vue";
import CuiButtonGroup from "./components/CuiButtonGroup.vue";
import CuiGrid from "./components/CuiGrid.vue";
import CuiGridItem from "./components/CuiGridItem.vue";
import CuiFlex from "./components/CuiFlex.vue";
import CuiFlexItem from "./components/CuiFlexItem.vue";
import CuiStack from "./components/CuiStack.vue";
import CuiContainer from "./components/CuiContainer.vue";
import CuiSpacer from "./components/CuiSpacer.vue";
import CuiRadio from "./components/CuiRadio.vue";
import CuiRadioGroup from "./components/CuiRadioGroup.vue";
import CuiCheckbox from "./components/CuiCheckbox.vue";
import CuiCheckboxGroup from "./components/CuiCheckboxGroup.vue";
import CuiToggle from "./components/CuiToggle.vue";
import CuiToggleGroup from "./components/CuiToggleGroup.vue";
import CuiInput from "./components/CuiInput.vue";
import CuiMaskedInput from "./components/CuiMaskedInput.vue";
import CuiTextarea from "./components/CuiTextarea.vue";
import CuiSelect from "./components/CuiSelect.vue";
import CuiFormField from "./components/CuiFormField.vue";
import CuiFieldset from "./components/CuiFieldset.vue";
import CuiBadge from "./components/CuiBadge.vue";
import CuiAlert from "./components/CuiAlert.vue";
import CuiTooltip from "./components/CuiTooltip.vue";
import CuiToast from "./components/CuiToast.vue";
import CuiToastProvider from "./components/CuiToastProvider.vue";
import CuiIcon from "./components/CuiIcon.vue";
import CuiTabs from "./components/CuiTabs.vue";
import CuiTab from "./components/CuiTab.vue";
import CuiBackdrop from "./components/CuiBackdrop.vue";
import CuiModal from "./components/CuiModal.vue";
import CuiModalHeader from "./components/CuiModalHeader.vue";
import CuiModalBody from "./components/CuiModalBody.vue";
import CuiModalFooter from "./components/CuiModalFooter.vue";
import CuiDropdown from "./components/CuiDropdown.vue";
import CuiDropdownTrigger from "./components/CuiDropdownTrigger.vue";
import CuiDropdownMenu from "./components/CuiDropdownMenu.vue";
import CuiDropdownItem from "./components/CuiDropdownItem.vue";
import CuiDropdownCheckItem from "./components/CuiDropdownCheckItem.vue";
import CuiDropdownRadioGroup from "./components/CuiDropdownRadioGroup.vue";
import CuiDropdownRadioItem from "./components/CuiDropdownRadioItem.vue";
import CuiDropdownDivider from "./components/CuiDropdownDivider.vue";
import CuiDropdownHeader from "./components/CuiDropdownHeader.vue";
import CuiDropdownSub from "./components/CuiDropdownSub.vue";
import CuiPagination from "./components/CuiPagination.vue";
import CuiBreadcrumb from "./components/CuiBreadcrumb.vue";
import CuiBreadcrumbItem from "./components/CuiBreadcrumbItem.vue";
import CuiCard from "./components/CuiCard.vue";
import CuiCardHeader from "./components/CuiCardHeader.vue";
import CuiCardBody from "./components/CuiCardBody.vue";
import CuiCardFooter from "./components/CuiCardFooter.vue";
import CuiCardMedia from "./components/CuiCardMedia.vue";

import "./styles/main.css";

// Component exports
export { CuiButton, CuiButtonGroup, CuiGrid, CuiGridItem, CuiFlex, CuiFlexItem, CuiStack, CuiContainer, CuiSpacer, CuiRadio, CuiRadioGroup, CuiCheckbox, CuiCheckboxGroup, CuiToggle, CuiToggleGroup, CuiInput, CuiMaskedInput, CuiTextarea, CuiSelect, CuiFormField, CuiFieldset, CuiBadge, CuiAlert, CuiTooltip, CuiToast, CuiToastProvider, CuiIcon, CuiBackdrop, CuiModal, CuiModalHeader, CuiModalBody, CuiModalFooter, CuiTabs, CuiTab, CuiDropdown, CuiDropdownTrigger, CuiDropdownMenu, CuiDropdownItem, CuiDropdownCheckItem, CuiDropdownRadioGroup, CuiDropdownRadioItem, CuiDropdownDivider, CuiDropdownHeader, CuiDropdownSub, CuiPagination, CuiBreadcrumb, CuiBreadcrumbItem, CuiCard, CuiCardHeader, CuiCardBody, CuiCardFooter, CuiCardMedia };

// Type exports
export type { CuiButtonProps, ButtonColor, ButtonVariant, ButtonSize, ButtonRounded } from "./components/CuiButton.vue";
export type { CuiButtonGroupProps, ButtonGroupOrientation } from "./components/CuiButtonGroup.vue";
export type { CuiGridProps } from "./components/CuiGrid.vue";
export type { CuiGridItemProps } from "./components/CuiGridItem.vue";
export type { CuiFlexProps } from "./components/CuiFlex.vue";
export type { CuiFlexItemProps } from "./components/CuiFlexItem.vue";
export type { CuiStackProps } from "./components/CuiStack.vue";
export type { CuiContainerProps, ContainerSize } from "./components/CuiContainer.vue";
export type { CuiSpacerProps } from "./components/CuiSpacer.vue";
export type { CuiRadioProps } from "./components/CuiRadio.vue";
export type { CuiCheckboxProps } from "./components/CuiCheckbox.vue";
export type { CuiCheckboxGroupProps, CheckboxDirection } from "./components/CuiCheckboxGroup.vue";
export { CheckboxGroupKey } from "./components/multi-select-group-context";
export type { CheckboxGroupContext } from "./components/checkbox-context";
export type { CuiToggleProps, ToggleSize } from "./components/CuiToggle.vue";
export type { CuiInputProps, InputSize, InputType } from "./components/CuiInput.vue";
export type { CuiMaskedInputProps, MaskToken } from "./components/CuiMaskedInput.vue";
export type { CuiTextareaProps } from "./components/CuiTextarea.vue";
export type { CuiSelectProps, SelectOption } from "./components/CuiSelect.vue";
export type { CuiFormFieldProps, LabelPosition } from "./components/CuiFormField.vue";
export type { CuiFieldsetProps } from "./components/CuiFieldset.vue";
export type { CuiBadgeProps, BadgeVariant, BadgeSize, BadgeAnimation } from "./components/CuiBadge.vue";
export type { CuiAlertProps, AlertVariant, AlertEntrance, AlertAnimation } from "./components/CuiAlert.vue";
export type { CuiTooltipProps, TooltipTrigger } from "./components/CuiTooltip.vue";
export { usePopover, type PopoverPlacement, type UsePopoverOptions } from "./composables/usePopover";
export type { CuiToastProps } from "./components/CuiToast.vue";
export type { CuiToastProviderProps } from "./components/CuiToastProvider.vue";
export type { ToastOptions, ToastPosition, ToastStackMode } from "./components/toast-context";
export { ToastContextKey } from "./components/toast-context";
export { useToast } from "./composables/useToast";
export type { CuiIconProps, IconWeight, IconSize } from "./components/CuiIcon.vue";
export type { CuiTabsProps } from "./components/CuiTabs.vue";
export type { CuiTabProps } from "./components/CuiTab.vue";
export type { CuiDropdownProps } from "./components/CuiDropdown.vue";
export type { CuiDropdownMenuProps } from "./components/CuiDropdownMenu.vue";
export type { CuiDropdownItemProps } from "./components/CuiDropdownItem.vue";
export type { CuiDropdownCheckItemProps } from "./components/CuiDropdownCheckItem.vue";
export type { CuiDropdownRadioGroupProps } from "./components/CuiDropdownRadioGroup.vue";
export type { CuiDropdownRadioItemProps } from "./components/CuiDropdownRadioItem.vue";
export type { CuiDropdownSubProps } from "./components/CuiDropdownSub.vue";
export type { DropdownTrigger } from "./components/dropdown-context";
export { DropdownContextKey } from "./components/dropdown-context";
export type { TabVariant, TabOrientation, TabTransition } from "./components/tabs-context";
export { TabsContextKey } from "./components/tabs-context";
export type { CuiBackdropProps, BackdropBlur } from "./components/CuiBackdrop.vue";
export type { CuiModalProps, ModalSize } from "./components/CuiModal.vue";
export type { CuiModalHeaderProps } from "./components/CuiModalHeader.vue";
export type { CuiModalBodyProps } from "./components/CuiModalBody.vue";
export type { CuiModalFooterProps } from "./components/CuiModalFooter.vue";
export type { CuiPaginationProps, LaravelPaginatorMeta, PaginationSize } from "./components/CuiPagination.vue";
export type { CuiBreadcrumbProps } from "./components/CuiBreadcrumb.vue";
export type { CuiBreadcrumbItemProps } from "./components/CuiBreadcrumbItem.vue";
export type { CuiCardProps, CardVariant } from "./components/CuiCard.vue";
export type { CuiCardHeaderProps } from "./components/CuiCardHeader.vue";
export type { CuiCardBodyProps } from "./components/CuiCardBody.vue";
export type { CuiCardFooterProps } from "./components/CuiCardFooter.vue";
export type { CuiCardMediaProps } from "./components/CuiCardMedia.vue";
export type { CuiToggleGroupProps, ToggleDirection } from "./components/CuiToggleGroup.vue";
export { ToggleGroupKey } from "./components/multi-select-group-context";
export type { ToggleGroupContext } from "./components/toggle-context";
export type { CuiRadioGroupProps, RadioDirection } from "./components/CuiRadioGroup.vue";
export { RadioGroupKey } from "./components/radio-context";
export type { RadioGroupContext } from "./components/radio-context";
export type { CleanUIOptions, CleanUIPlugin } from "./types";
export type {
  TailwindSpacing,
  TailwindBreakpoint,
  ResponsiveValue,
  GridColumns,
  GridRows,
  GridSpan,
  FlexDirection,
  FlexWrap,
} from "./types/grid";

// Composable exports
export { useTheme, THEME_PRESETS, type ThemePreset } from "./composables/useTheme";
export { useBreakpoint } from "./composables/useBreakpoint";
export { useGridContext, useFlexContext } from "./composables/useLayoutContext";
export type { LayoutContext } from "./composables/useLayoutContext";
export type { ActiveBreakpoint } from "./composables/useBreakpoint";
export { useClickOutside } from "./composables/useClickOutside";
export type { MultiSelectGroupContext } from "./components/multi-select-group-context";

export function createCleanUI(_options: CleanUIOptions = {}) {
  return {
    install(app: App) {
      app.component("CuiButton", CuiButton);
      app.component("CuiButtonGroup", CuiButtonGroup);
      app.component("CuiGrid", CuiGrid);
      app.component("CuiGridItem", CuiGridItem);
      app.component("CuiFlex", CuiFlex);
      app.component("CuiFlexItem", CuiFlexItem);
      app.component("CuiStack", CuiStack);
      app.component("CuiContainer", CuiContainer);
      app.component("CuiSpacer", CuiSpacer);
      app.component("CuiRadio", CuiRadio);
      app.component("CuiRadioGroup", CuiRadioGroup);
      app.component("CuiCheckbox", CuiCheckbox);
      app.component("CuiCheckboxGroup", CuiCheckboxGroup);
      app.component("CuiToggle", CuiToggle);
      app.component("CuiToggleGroup", CuiToggleGroup);
      app.component("CuiInput", CuiInput);
      app.component("CuiMaskedInput", CuiMaskedInput);
      app.component("CuiTextarea", CuiTextarea);
      app.component("CuiSelect", CuiSelect);
      app.component("CuiFormField", CuiFormField);
      app.component("CuiFieldset", CuiFieldset);
      app.component("CuiBadge", CuiBadge);
      app.component("CuiAlert", CuiAlert);
      app.component("CuiTooltip", CuiTooltip);
      app.component("CuiToast", CuiToast);
      app.component("CuiToastProvider", CuiToastProvider);
      app.component("CuiIcon", CuiIcon);
      app.component("CuiTabs", CuiTabs);
      app.component("CuiTab", CuiTab);
      app.component("CuiBackdrop", CuiBackdrop);
      app.component("CuiModal", CuiModal);
      app.component("CuiModalHeader", CuiModalHeader);
      app.component("CuiModalBody", CuiModalBody);
      app.component("CuiModalFooter", CuiModalFooter);
      app.component("CuiDropdown", CuiDropdown);
      app.component("CuiDropdownTrigger", CuiDropdownTrigger);
      app.component("CuiDropdownMenu", CuiDropdownMenu);
      app.component("CuiDropdownItem", CuiDropdownItem);
      app.component("CuiDropdownCheckItem", CuiDropdownCheckItem);
      app.component("CuiDropdownRadioGroup", CuiDropdownRadioGroup);
      app.component("CuiDropdownRadioItem", CuiDropdownRadioItem);
      app.component("CuiDropdownDivider", CuiDropdownDivider);
      app.component("CuiDropdownHeader", CuiDropdownHeader);
      app.component("CuiDropdownSub", CuiDropdownSub);
      app.component("CuiPagination", CuiPagination);
      app.component("CuiBreadcrumb", CuiBreadcrumb);
      app.component("CuiBreadcrumbItem", CuiBreadcrumbItem);
      app.component("CuiCard", CuiCard);
      app.component("CuiCardHeader", CuiCardHeader);
      app.component("CuiCardBody", CuiCardBody);
      app.component("CuiCardFooter", CuiCardFooter);
      app.component("CuiCardMedia", CuiCardMedia);
    },
  };
}

export default createCleanUI;
