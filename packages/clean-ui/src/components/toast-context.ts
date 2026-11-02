import { ref, type InjectionKey, type Ref } from "vue";
import type { CuiColor, LiveRegionMode } from "../types/common";
import type { AlertAnimation } from "./CuiAlert.vue";

export type ToastPosition =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";

export type ToastStackMode = "expanded" | "collapsed";

/** A button on a programmatic toast: "Undo", "Retry", "View" (#345). */
export interface ToastAction {
  /** Button text */
  label: string;
  /** Runs when the button is pressed */
  onClick: () => void;
  /** Dismiss the toast after `onClick` runs (default true) */
  dismissOnClick?: boolean;
}

export interface ToastOptions {
  /** Unique id (auto-generated if not provided) */
  id?: string;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Color role */
  color?: CuiColor;
  /** Visual variant */
  variant?: "solid" | "subtle" | "outline";
  /** Show dismiss button */
  dismissible?: boolean;
  /** Auto-dismiss duration in ms (default 5000, set 0 to disable) */
  autoDismiss?: number;
  /** Show countdown progress bar */
  showProgress?: boolean;
  /** Persistent animation */
  animation?: AlertAnimation;
  /** Custom icon (emoji or text) */
  icon?: string;
  /** Hide the default role icon */
  noIcon?: boolean;
  /**
   * Screen-reader live-region mode. Defaults from `color`: `error` → assertive
   * (`role="alert"`), everything else → polite (`role="status"`).
   */
  live?: LiveRegionMode;
  /** A button rendered in the toast, e.g. Undo or Retry */
  action?: ToastAction;
  /** Pause auto-dismiss while hovered (default true) */
  pauseOnHover?: boolean;
  /** Pause auto-dismiss while focus is inside the toast (default true) */
  pauseOnFocus?: boolean;
  /**
   * Pause auto-dismiss while another toast is on top (default true). With all three
   * `pause*` options `false`, `autoDismiss` is a wall-clock deadline.
   */
  pauseWhenInactive?: boolean;
}

export interface ToastInstance
  extends Required<
    Pick<
      ToastOptions,
      | "id"
      | "color"
      | "variant"
      | "dismissible"
      | "autoDismiss"
      | "showProgress"
      | "animation"
      | "noIcon"
    >
  >,
    Pick<ToastOptions, "pauseOnHover" | "pauseOnFocus" | "pauseWhenInactive"> {
  title?: string;
  description?: string;
  icon?: string;
  live?: LiveRegionMode;
  action?: ToastAction;
  createdAt: number;
}

export interface ToastContext {
  toasts: Ref<ToastInstance[]>;
  position: Ref<ToastPosition>;
  stackMode: Ref<ToastStackMode>;
  maxToasts: Ref<number>;
  add: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const ToastContextKey: InjectionKey<ToastContext> = Symbol("toast-context");

let counter = 0;

export function createToastState(
  position: Ref<ToastPosition>,
  stackMode: Ref<ToastStackMode>,
  maxToasts: Ref<number>,
): ToastContext {
  const toasts = ref<ToastInstance[]>([]);

  function add(options: ToastOptions): string {
    const id = options.id ?? `cui-toast-${++counter}`;

    const instance: ToastInstance = {
      id,
      title: options.title,
      description: options.description,
      color: options.color ?? "primary",
      variant: options.variant ?? "subtle",
      dismissible: options.dismissible ?? true,
      autoDismiss: options.autoDismiss ?? 5000,
      showProgress: options.showProgress ?? true,
      animation: options.animation ?? "none",
      icon: options.icon,
      noIcon: options.noIcon ?? false,
      live: options.live,
      action: options.action,
      // Left undefined when not given, so CuiToast's own defaults (true) apply.
      pauseOnHover: options.pauseOnHover,
      pauseOnFocus: options.pauseOnFocus,
      pauseWhenInactive: options.pauseWhenInactive,
      createdAt: Date.now(),
    };

    toasts.value.push(instance);

    // Enforce max
    while (toasts.value.length > maxToasts.value) {
      toasts.value.shift();
    }

    return id;
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function dismissAll() {
    toasts.value = [];
  }

  return {
    toasts,
    position,
    stackMode,
    maxToasts,
    add,
    dismiss,
    dismissAll,
  };
}
