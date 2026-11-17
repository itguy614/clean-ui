import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, toValue, type Component, type MaybeRefOrGetter } from "vue";
import type { CuiColor } from "../types/common";

/**
 * The command registry behind CuiCommandPalette (#197): register commands from anywhere,
 * withdraw them again, and open or close the palette without a reference to it.
 *
 * ```ts
 * const palette = useCommandPalette();
 * palette.register({ id: "invoices.new", label: "New invoice", group: "Actions", action: () => router.push("/invoices/new") });
 * ```
 *
 * Registered from a component's `setup()` (or any effect scope), the commands are withdrawn
 * when it unmounts: a route that contributes commands loses them on leave, with nothing to
 * clean up. Registered anywhere else (an app's entry file), they stay until `withdraw()`.
 *
 * There is one registry per page, and the palette reads it. Several registrations may use
 * the same command id: the latest wins, and withdrawing it brings the earlier one back, so
 * a route can override a global command for as long as it is mounted.
 */

/** A group of commands under one heading. Commands name it by `id` in `group`. */
export interface CuiCommandGroup {
  id: string;
  /** The heading. Defaults to the id. */
  label?: string;
  /** Higher groups come first. Default 0; groups tied on it keep the order they were registered in. */
  priority?: number;
}

export interface CuiCommand {
  /** Stable and unique: it is what recents remember. */
  id: string;
  /** The text shown, and matched first. */
  label: string;
  /** Secondary text under the label. Searched too, but ranked lower than the label. */
  description?: string;
  /** Extra words that find it: synonyms, the name in another tool. Ranked lower than the label. */
  keywords?: string[];
  /** The id of a `CuiCommandGroup`. Without one, the command sits in a group with no heading. */
  group?: string;
  /** Higher comes first within its group, and breaks a tie in match score. Default 0. */
  priority?: number;
  /** A registered icon name or an icon component. */
  icon?: string | Component;
  /**
   * A count or short label shown beside the row, such as unread notifications. A bare value
   * takes the library's subtle badge; `{ label, color }` picks a color role. Nothing is shown
   * for 0 or an empty label. Register the command through a getter or a ref and it follows
   * state, also while the palette is open.
   */
  badge?: string | number | { label: string | number; color?: CuiColor };
  /** The shortcut to show, e.g. `"⌘N"` or `["G", "I"]` for a sequence. Display only: it binds nothing. */
  shortcut?: string | string[];
  /** Listed but not runnable: skipped by the arrow keys and ignored on click. */
  disabled?: boolean;
  /**
   * What choosing it does. Runs once the palette has closed and focus is back where it was,
   * so a command that opens a dialog or moves focus is not fighting the palette for it.
   */
  action?: (command: CuiCommand) => unknown;
}

type CommandSource = MaybeRefOrGetter<CuiCommand | readonly CuiCommand[]>;

interface Entry {
  source: CommandSource;
}

const RECENTS_LIMIT = 20;

function createRegistry() {
  const entries = shallowRef<readonly Entry[]>([]);
  const visible = ref(false);
  const recents = ref<string[]>([]);

  // Every registration's commands in registration order; for one id the latest registration
  // wins, in the earlier one's place.
  const commands = computed<readonly CuiCommand[]>(() => {
    const byId = new Map<string, CuiCommand>();
    for (const entry of entries.value) {
      const value = toValue(entry.source);
      for (const command of Array.isArray(value) ? value : [value as CuiCommand]) byId.set(command.id, command);
    }
    return [...byId.values()];
  });

  function register(source: CommandSource): () => void {
    // On the server nothing would ever withdraw it, and the registry outlives the request.
    if (typeof window === "undefined") return () => {};
    const entry: Entry = { source };
    entries.value = [...entries.value, entry];
    let withdrawn = false;
    const withdraw = () => {
      if (withdrawn) return;
      withdrawn = true;
      entries.value = entries.value.filter((e) => e !== entry);
    };
    if (getCurrentScope()) onScopeDispose(withdraw);
    return withdraw;
  }

  /** Puts a command first in the recents, once. */
  function remember(id: string) {
    recents.value = [id, ...recents.value.filter((r) => r !== id)].slice(0, RECENTS_LIMIT);
  }

  return {
    commands,
    visible,
    recents,
    register,
    remember,
    open: () => (visible.value = true),
    close: () => (visible.value = false),
    toggle: () => (visible.value = !visible.value),
    clearRecents: () => (recents.value = []),
  };
}

const registry = createRegistry();

/** What `useCommandPalette()` returns. */
export type UseCommandPalette = Omit<typeof registry, "remember">;

/** The palette's own use of the registry: also records a command as recently run. */
export function useCommandRegistry() {
  return registry;
}

/**
 * Register and withdraw commands, and open or close the palette, from anywhere.
 *
 * - `register(commands)` takes one command, an array, or a ref or getter of either (so a
 *   command's `disabled` or `label` can follow state), and returns `withdraw()`. Called in a
 *   component's setup, it is withdrawn on unmount as well.
 * - `commands` is everything registered now. `visible` is whether the palette is open, a
 *   ref you may also write. `open()`, `close()` and `toggle()` set it.
 * - `recents` is the ids of the commands run most recently, newest first.
 */
export function useCommandPalette(): UseCommandPalette {
  return registry;
}
