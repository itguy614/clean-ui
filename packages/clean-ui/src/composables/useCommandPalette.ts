import { computed, getCurrentScope, hasInjectionContext, inject, onScopeDispose, provide, ref, shallowRef, toValue, type Component, type MaybeRefOrGetter } from "vue";
import type { CuiColor } from "../types/common";
import { CuiCommandPaletteKey } from "./command-palette-context";

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
 * Several registrations may use the same command id: the latest wins, and withdrawing it
 * brings the earlier one back, so a route can override a global command for as long as it
 * is mounted.
 *
 * A registry holds the commands, the open state and the recents. Code that provides none
 * shares one default registry per page, which is all a single palette needs (#197). An app,
 * or a subtree such as a palette inside a drawer, gets its own with
 * `useCommandPaletteProvider()` or `app.provide(CuiCommandPaletteKey, createCommandPalette())`
 * (#530): `useCommandPalette()` then answers with the nearest one.
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

/** The registry the palette itself uses: `UseCommandPalette` plus `remember`. */
export type CuiCommandRegistry = ReturnType<typeof createRegistry>;

/** What `useCommandPalette()` returns. */
export type UseCommandPalette = Omit<CuiCommandRegistry, "remember">;

/** The registry for code that never provides one. */
const defaultRegistry = createRegistry();

/**
 * A registry of its own: commands, open state and recents shared with nothing else. Provide
 * it app-wide with `app.provide(CuiCommandPaletteKey, createCommandPalette())`, or hand it
 * to a palette's `registry` prop and to whatever registers into it.
 */
export function createCommandPalette(): UseCommandPalette {
  return createRegistry();
}

/**
 * Gives this component's subtree its own registry, so a palette inside it (a drawer's, say)
 * shares nothing with a global one. Pass one from `createCommandPalette()` to provide that
 * instead. Returns what `useCommandPalette()` returns for the subtree.
 */
export function useCommandPaletteProvider(registry: UseCommandPalette = createRegistry()): UseCommandPalette {
  provide(CuiCommandPaletteKey, registry);
  return registry;
}

/**
 * The nearest provided registry, else the default one. Outside a component or an app
 * context (an entry file, a router guard) that is the default, and nothing warns: unlike a
 * family context it does not throw outside a provider, since the default is the usage that
 * never needed one. The palette's own use also records a command as recently run.
 */
export function useCommandPaletteContext(): CuiCommandRegistry {
  // Every registry is made by createRegistry, so `remember` is there whatever the type says.
  return ((hasInjectionContext() && inject(CuiCommandPaletteKey, null)) || defaultRegistry) as CuiCommandRegistry;
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
 *
 * It answers with the registry the calling component's ancestors provided, and with the
 * page-wide default where there is none.
 */
export function useCommandPalette(): UseCommandPalette {
  return useCommandPaletteContext();
}
