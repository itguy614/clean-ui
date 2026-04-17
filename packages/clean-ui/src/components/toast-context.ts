import { ref, type InjectionKey, type Ref } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import type { AlertAnimation } from "./CuiAlert.vue";

export type ToastPosition =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";

export type ToastStackMode = "expanded" | "collapsed";

export interface ToastOptions {
  /** Unique id (auto-generated if not provided) */
  id?: string;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Color role */
  color?: ButtonColor;
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
}

export interface ToastInstance extends Required<Pick<ToastOptions, "id" | "color" | "variant" | "dismissible" | "autoDismiss" | "showProgress" | "animation" | "noIcon">> {
  title?: string;
  description?: string;
  icon?: string;
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
