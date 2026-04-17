import { inject } from "vue";
import { ToastContextKey, type ToastOptions } from "../components/toast-context";

/**
 * Programmatic toast API.
 * Must be called within a component inside a <CuiToastProvider>.
 */
export function useToast() {
  const context = inject(ToastContextKey);

  if (!context) {
    throw new Error(
      "[CuiToast] useToast() must be used within a <CuiToastProvider>. " +
        "Wrap your app with <CuiToastProvider> to enable toasts.",
    );
  }

  const ctx = context!;

  /**
   * Show a toast. Returns the toast id for programmatic dismissal.
   */
  function toast(options: ToastOptions): string {
    return ctx.add(options);
  }

  /**
   * Dismiss a specific toast by id.
   */
  function dismiss(id: string) {
    ctx.dismiss(id);
  }

  /**
   * Dismiss all visible toasts.
   */
  function dismissAll() {
    ctx.dismissAll();
  }

  // Convenience methods
  toast.success = (title: string, options?: Omit<ToastOptions, "title" | "color">) =>
    toast({ ...options, title, color: "success" });

  toast.error = (title: string, options?: Omit<ToastOptions, "title" | "color">) =>
    toast({ ...options, title, color: "error" });

  toast.warning = (title: string, options?: Omit<ToastOptions, "title" | "color">) =>
    toast({ ...options, title, color: "warning" });

  toast.info = (title: string, options?: Omit<ToastOptions, "title" | "color">) =>
    toast({ ...options, title, color: "info" });

  return { toast, dismiss, dismissAll };
}
