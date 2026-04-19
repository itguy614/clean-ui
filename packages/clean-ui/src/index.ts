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
import CuiProgress from "./components/CuiProgress.vue";
import CuiPagination from "./components/CuiPagination.vue";
import CuiBreadcrumb from "./components/CuiBreadcrumb.vue";
import CuiBreadcrumbItem from "./components/CuiBreadcrumbItem.vue";
import CuiCard from "./components/CuiCard.vue";
import CuiCardHeader from "./components/CuiCardHeader.vue";
import CuiCardBody from "./components/CuiCardBody.vue";
import CuiCardFooter from "./components/CuiCardFooter.vue";
import CuiCardMedia from "./components/CuiCardMedia.vue";
import CuiAccordion from "./components/CuiAccordion.vue";
import CuiAccordionItem from "./components/CuiAccordionItem.vue";
import CuiSlideover from "./components/CuiSlideover.vue";
import CuiSkeleton from "./components/CuiSkeleton.vue";
import CuiPopover from "./components/CuiPopover.vue";
import CuiContextMenu from "./components/CuiContextMenu.vue";
import CuiEmptyState from "./components/CuiEmptyState.vue";
import CuiTable from "./components/CuiTable.vue";
import CuiTableHead from "./components/CuiTableHead.vue";
import CuiTableBody from "./components/CuiTableBody.vue";
import CuiTableFoot from "./components/CuiTableFoot.vue";
import CuiTableRow from "./components/CuiTableRow.vue";
import CuiTableCell from "./components/CuiTableCell.vue";
import CuiDataGrid from "./components/CuiDataGrid.vue";
import CuiAvatar from "./components/CuiAvatar.vue";
import CuiAvatarGroup from "./components/CuiAvatarGroup.vue";
import CuiStepper from "./components/CuiStepper.vue";
import CuiInputStepper from "./components/CuiInputStepper.vue";
import CuiSlider from "./components/CuiSlider.vue";
import CuiSpinner from "./components/CuiSpinner.vue";
import CuiBanner from "./components/CuiBanner.vue";
import CuiDivider from "./components/CuiDivider.vue";
import CuiCopyButton from "./components/CuiCopyButton.vue";
import CuiResizablePanels from "./components/CuiResizablePanels.vue";
import CuiConfirmDialog from "./components/CuiConfirmDialog.vue";
import CuiTimeline from "./components/CuiTimeline.vue";
import CuiTimelineItem from "./components/CuiTimelineItem.vue";
import CuiKbd from "./components/CuiKbd.vue";
import CuiColorPicker from "./components/CuiColorPicker.vue";
import CuiDatePicker from "./components/CuiDatePicker.vue";
import CuiDateRangePicker from "./components/CuiDateRangePicker.vue";
import CuiCombobox from "./components/CuiCombobox.vue";
import CuiTransferList from "./components/CuiTransferList.vue";
import CuiTimePicker from "./components/CuiTimePicker.vue";
import CuiTagInput from "./components/CuiTagInput.vue";
import CuiFileUpload from "./components/CuiFileUpload.vue";
import CuiTreeView from "./components/CuiTreeView.vue";

import "./styles/main.css";

// Component exports
export { CuiButton, CuiButtonGroup, CuiGrid, CuiGridItem, CuiFlex, CuiFlexItem, CuiStack, CuiContainer, CuiSpacer, CuiRadio, CuiRadioGroup, CuiCheckbox, CuiCheckboxGroup, CuiToggle, CuiToggleGroup, CuiInput, CuiMaskedInput, CuiTextarea, CuiSelect, CuiFormField, CuiFieldset, CuiBadge, CuiAlert, CuiTooltip, CuiToast, CuiToastProvider, CuiIcon, CuiBackdrop, CuiModal, CuiModalHeader, CuiModalBody, CuiModalFooter, CuiTabs, CuiTab, CuiDropdown, CuiDropdownTrigger, CuiDropdownMenu, CuiDropdownItem, CuiDropdownCheckItem, CuiDropdownRadioGroup, CuiDropdownRadioItem, CuiDropdownDivider, CuiDropdownHeader, CuiDropdownSub, CuiProgress, CuiPagination, CuiBreadcrumb, CuiBreadcrumbItem, CuiCard, CuiCardHeader, CuiCardBody, CuiCardFooter, CuiCardMedia, CuiAccordion, CuiAccordionItem, CuiSlideover, CuiSkeleton, CuiPopover, CuiContextMenu, CuiEmptyState, CuiTable, CuiTableHead, CuiTableBody, CuiTableFoot, CuiTableRow, CuiTableCell, CuiDataGrid, CuiAvatar, CuiAvatarGroup, CuiStepper, CuiInputStepper, CuiSlider, CuiSpinner, CuiBanner, CuiDivider, CuiCopyButton, CuiResizablePanels, CuiConfirmDialog, CuiTimeline, CuiTimelineItem, CuiKbd, CuiColorPicker, CuiDatePicker, CuiDateRangePicker, CuiCombobox, CuiTransferList, CuiTimePicker, CuiTagInput, CuiFileUpload, CuiTreeView };

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
export type { CuiProgressProps, ProgressVariant, ProgressSize, ProgressAnimation } from "./components/CuiProgress.vue";
export type { CuiPaginationProps, LaravelPaginatorMeta, PaginationSize } from "./components/CuiPagination.vue";
export type { CuiBreadcrumbProps } from "./components/CuiBreadcrumb.vue";
export type { CuiBreadcrumbItemProps } from "./components/CuiBreadcrumbItem.vue";
export type { CuiCardProps, CardVariant } from "./components/CuiCard.vue";
export type { CuiCardHeaderProps } from "./components/CuiCardHeader.vue";
export type { CuiCardBodyProps } from "./components/CuiCardBody.vue";
export type { CuiCardFooterProps } from "./components/CuiCardFooter.vue";
export type { CuiCardMediaProps } from "./components/CuiCardMedia.vue";
export type { CuiAccordionProps } from "./components/CuiAccordion.vue";
export type { CuiAccordionItemProps } from "./components/CuiAccordionItem.vue";
export type { CuiSlideoverProps, SlideoverSide, SlideoverSize } from "./components/CuiSlideover.vue";
export type { CuiSkeletonProps, SkeletonVariant, SkeletonAnimation, SkeletonRounded } from "./components/CuiSkeleton.vue";
export type { CuiPopoverProps, PopoverTrigger } from "./components/CuiPopover.vue";
export type { CuiContextMenuProps } from "./components/CuiContextMenu.vue";
export type { CuiEmptyStateProps, EmptyStateSize } from "./components/CuiEmptyState.vue";
export type { CuiAvatarProps, AvatarSize, AvatarShape, AvatarStatus, AvatarStatusAnimation } from "./components/CuiAvatar.vue";
export type { CuiAvatarGroupProps } from "./components/CuiAvatarGroup.vue";
export type { CuiStepperProps, StepperOrientation, StepperSize, StepStatus, StepDef } from "./components/CuiStepper.vue";
export type { CuiInputStepperProps, InputStepperSize, InputStepperOrientation } from "./components/CuiInputStepper.vue";
export type { CuiSliderProps, SliderSize } from "./components/CuiSlider.vue";
export type { CuiSpinnerProps, SpinnerSize, SpinnerVariant } from "./components/CuiSpinner.vue";
export type { CuiBannerProps, BannerPosition, BannerVariant } from "./components/CuiBanner.vue";
export type { CuiDividerProps, DividerOrientation, DividerLabelPosition, DividerVariant } from "./components/CuiDivider.vue";
export type { CuiCopyButtonProps, CopyButtonSize } from "./components/CuiCopyButton.vue";
export { useCopyToClipboard } from "./composables/useCopyToClipboard";
export { useScrollShadows, scrollShadowTopStyle, scrollShadowBottomStyle, scrollShadowRightStyle } from "./composables/useScrollShadows";
export type { CuiResizablePanelsProps, ResizableDirection } from "./components/CuiResizablePanels.vue";
export type { CuiConfirmDialogProps, ConfirmDialogVariant } from "./components/CuiConfirmDialog.vue";
export type { CuiTimelineProps } from "./components/CuiTimeline.vue";
export type { CuiTimelineItemProps } from "./components/CuiTimelineItem.vue";
export type { CuiKbdProps, KbdSize } from "./components/CuiKbd.vue";
export type { CuiColorPickerProps, ColorPickerSize, PresetPalette } from "./components/CuiColorPicker.vue";
export type { CuiDatePickerProps, DatePickerMode, DatePickerValueType, DatePickerFillDay } from "./components/CuiDatePicker.vue";
export type { DisabledDateRange } from "./utils/date";
export { formatDate, parseFormattedDate, dateToIso, isoToDate } from "./utils/date";
export type { CuiDateRangePickerProps, DateRangeValue, DateRangePickerValueType } from "./components/CuiDateRangePicker.vue";
export type { CuiComboboxProps, ComboboxOption } from "./components/CuiCombobox.vue";
export type { CuiTransferListProps, TransferListItem } from "./components/CuiTransferList.vue";
export type { CuiTimePickerProps, TimePickerFormat } from "./components/CuiTimePicker.vue";
export type { CuiTagInputProps, TagOption } from "./components/CuiTagInput.vue";
export type { CuiFileUploadProps, FileEntry } from "./components/CuiFileUpload.vue";
export type { CuiTreeViewProps, TreeNode } from "./components/CuiTreeView.vue";
export type { RGB, HSV, HSL, RGBA, ColorFormat } from "./utils/color";
export { parseColor, formatColor, rgbToHex, hexToRgb, rgbToHsl, hslToRgb, hsvToRgb, rgbToHsv, PALETTE_BASIC, PALETTE_MATERIAL, PALETTE_TAILWIND, getThemePalette } from "./utils/color";
export type { CuiTableProps } from "./components/CuiTable.vue";
export type { CuiTableRowProps } from "./components/CuiTableRow.vue";
export type { CuiTableCellProps, TableCellAlign } from "./components/CuiTableCell.vue";
export type { TableSize, TableContext, TableSectionContext } from "./components/table-context";
export { TableContextKey, TableSectionContextKey } from "./components/table-context";
export type { CuiDataGridProps } from "./components/CuiDataGrid.vue";
export type {
  DataGridColumn,
  DataGridSort,
  DataGridFilter,
  DataGridFilterType,
  DataGridQueryParams,
  DataGridRowAction,
  DataGridBulkAction,
  DataGridRow,
  DataGridColumnState,
  DataGridViewConfig,
  DataGridSavedView,
  DataGridViewAdapter,
  DataGridViewMode,
  PaginatedData,
} from "./types/data-grid";
export type { DataGridContext } from "./components/data-grid-context";
export { DataGridContextKey } from "./components/data-grid-context";
export { useDataGrid, provideDataGrid, useDataGridState } from "./composables/useDataGrid";
export { useDataGridInertia, type UseDataGridInertiaOptions } from "./composables/useDataGridInertia";
export { useDataGridViews, localStorageViewAdapter, type UseDataGridViewsOptions } from "./composables/useDataGridViews";
export { AccordionContextKey } from "./components/accordion-context";
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
export { useOverlay, type UseOverlayOptions } from "./composables/useOverlay";
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
      app.component("CuiProgress", CuiProgress);
      app.component("CuiPagination", CuiPagination);
      app.component("CuiBreadcrumb", CuiBreadcrumb);
      app.component("CuiBreadcrumbItem", CuiBreadcrumbItem);
      app.component("CuiCard", CuiCard);
      app.component("CuiCardHeader", CuiCardHeader);
      app.component("CuiCardBody", CuiCardBody);
      app.component("CuiCardFooter", CuiCardFooter);
      app.component("CuiCardMedia", CuiCardMedia);
      app.component("CuiAccordion", CuiAccordion);
      app.component("CuiAccordionItem", CuiAccordionItem);
      app.component("CuiSlideover", CuiSlideover);
      app.component("CuiSkeleton", CuiSkeleton);
      app.component("CuiPopover", CuiPopover);
      app.component("CuiContextMenu", CuiContextMenu);
      app.component("CuiEmptyState", CuiEmptyState);
      app.component("CuiTable", CuiTable);
      app.component("CuiTableHead", CuiTableHead);
      app.component("CuiTableBody", CuiTableBody);
      app.component("CuiTableFoot", CuiTableFoot);
      app.component("CuiTableRow", CuiTableRow);
      app.component("CuiTableCell", CuiTableCell);
      app.component("CuiDataGrid", CuiDataGrid);
      app.component("CuiAvatar", CuiAvatar);
      app.component("CuiAvatarGroup", CuiAvatarGroup);
      app.component("CuiStepper", CuiStepper);
      app.component("CuiInputStepper", CuiInputStepper);
      app.component("CuiSlider", CuiSlider);
      app.component("CuiSpinner", CuiSpinner);
      app.component("CuiBanner", CuiBanner);
      app.component("CuiDivider", CuiDivider);
      app.component("CuiCopyButton", CuiCopyButton);
      app.component("CuiResizablePanels", CuiResizablePanels);
      app.component("CuiConfirmDialog", CuiConfirmDialog);
      app.component("CuiTimeline", CuiTimeline);
      app.component("CuiTimelineItem", CuiTimelineItem);
      app.component("CuiKbd", CuiKbd);
      app.component("CuiColorPicker", CuiColorPicker);
      app.component("CuiDatePicker", CuiDatePicker);
      app.component("CuiDateRangePicker", CuiDateRangePicker);
      app.component("CuiCombobox", CuiCombobox);
      app.component("CuiTransferList", CuiTransferList);
      app.component("CuiTimePicker", CuiTimePicker);
      app.component("CuiTagInput", CuiTagInput);
      app.component("CuiFileUpload", CuiFileUpload);
      app.component("CuiTreeView", CuiTreeView);
    },
  };
}

export default createCleanUI;
