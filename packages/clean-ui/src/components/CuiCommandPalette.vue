<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import CuiModal from "./CuiModal.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiKbd from "./CuiKbd.vue";
import CuiListboxOption from "./CuiListboxOption.vue";
import { IconMagnifyingGlass } from "../icons/generated/magnifying-glass";
import { useCuiId } from "../composables/useCuiId";
import { useEventListener } from "../composables/useEventListener";
import { followHighlight, useListbox } from "../composables/useListbox";
import { firstIndex } from "../composables/useListNavigation";
import { useMessages } from "../composables/useMessages";
import { useCommandRegistry, type CuiCommand, type CuiCommandGroup } from "../composables/useCommandPalette";
import { fuzzyMatch, highlightSegments, type FuzzyMatch, type HighlightSegment } from "../utils/fuzzy";
import { matchesHotkey, parseHotkey } from "../utils/hotkey";
import type { ColorableProps, HideableProps, OverlayFocusProps } from "../types/common";

export interface CuiCommandPaletteProps extends HideableProps, ColorableProps, OverlayFocusProps {
  /**
   * Open state (v-model:visible). Leave it unbound and the palette is open when
   * `useCommandPalette().visible` is, which the hotkey and `open()` drive.
   */
  visible?: boolean;
  /** Commands listed besides the registered ones. One with the same id as a registered command replaces it. */
  commands?: CuiCommand[];
  /** Headings and their order. A command's `group` that is not listed here is headed by its id. */
  groups?: CuiCommandGroup[];
  /** The search field's placeholder. */
  placeholder?: string;
  /** The dialog's accessible name. */
  label?: string;
  /**
   * The shortcut that opens and closes it, `"mod+k"` by default (Command on a Mac, Control
   * elsewhere). `false` turns it off, and the palette is then opened by `v-model:visible` or
   * `useCommandPalette().open()`.
   */
  hotkey?: string | false;
  /** How many recently run commands to list before anything is typed. 0 for none. */
  recent?: number;
  /** A localStorage key to keep the recents under, across visits. Unset, they last until the page unloads. */
  recentsStorageKey?: string;
  /** The most results listed, across groups. */
  maxResults?: number;
}

// The root is a CuiModal (a Teleport), which takes the class onto its panel (#228).
const props = withDefaults(defineProps<CuiCommandPaletteProps>(), {
  // `undefined`, not Vue's boolean `false`: absent means "follow the registry".
  visible: undefined,
  color: "primary",
  hotkey: "mod+k",
  recent: 5,
  maxResults: 100,
  hidden: false,
  initialFocus: undefined,
  returnFocus: undefined,
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  /** A command was chosen. It runs once the palette has closed. */
  select: [command: CuiCommand];
  close: [];
  /** The entry has finished and focus is in place. */
  "after-enter": [];
  /** The exit has finished and focus has been returned. */
  "after-leave": [];
}>();

defineSlots<{
  /** One result row, in place of the icon, label, description and shortcut. */
  item?(props: { command: CuiCommand; active: boolean; query: string; segments: HighlightSegment[] }): unknown;
  /** A group's heading. */
  heading?(props: { group: { id: string; label: string }; count: number }): unknown;
  /** Shown, in place of the message, when nothing matches. */
  empty?(props: { query: string }): unknown;
}>();

const registry = useCommandRegistry();
const messages = useMessages();

// --- Open state: the registry's, so a button elsewhere can open it, and v-model follows ---
const open = registry.visible;
watch(() => props.visible, (v) => { if (v !== undefined) open.value = v; }, { immediate: true });
watch(open, (v) => emit("update:visible", v));

const query = ref("");
const activeIndex = ref(-1);

// --- The commands ---
const all = computed<CuiCommand[]>(() => {
  const byId = new Map(registry.commands.value.map((c) => [c.id, c]));
  for (const c of props.commands ?? []) byId.set(c.id, c);
  return [...byId.values()];
});

interface Row {
  command: CuiCommand;
  index: number;
  segments: HighlightSegment[];
}
interface Section {
  id: string;
  label: string;
  rows: Row[];
}

const RECENT_GROUP = "\0recent";

// Highest first, then the order the commands (and so the groups) first appeared in.
const sections = computed<Section[]>(() => {
  const q = query.value.trim();
  const order = new Map(all.value.map((c, i) => [c.id, i]));
  const meta = (id: string) => props.groups?.find((g) => g.id === id);
  const groupOrder = new Map<string, number>();
  for (const c of all.value) if (!groupOrder.has(c.group ?? "")) groupOrder.set(c.group ?? "", groupOrder.size);

  // A command found through its keywords or description ranks below one found by its label.
  const hits: Array<{ command: CuiCommand; score: number; ranges: Array<[number, number]> }> = [];
  for (const command of all.value) {
    if (!q) {
      hits.push({ command, score: 0, ranges: [] });
      continue;
    }
    const byLabel = fuzzyMatch(q, command.label);
    if (byLabel) {
      hits.push({ command, score: byLabel.score, ranges: byLabel.ranges });
      continue;
    }
    // Each keyword on its own: joined, a short query finds letters scattered over all of them.
    const byKeyword = command.keywords?.map((k) => fuzzyMatch(q, k)).reduce<FuzzyMatch | null>((best, m) => (m && (!best || m.score > best.score) ? m : best), null);
    if (byKeyword) {
      hits.push({ command, score: byKeyword.score - 20, ranges: [] });
      continue;
    }
    const byDescription = command.description ? fuzzyMatch(q, command.description) : null;
    if (byDescription) hits.push({ command, score: byDescription.score - 40, ranges: [] });
  }

  const byGroup = new Map<string, typeof hits>();
  // Recently run, newest first, only while nothing is typed; each is listed there instead of
  // in its own group.
  const recentIds = new Set<string>();
  if (!q && props.recent > 0) {
    const recent = registry.recents.value
      .map((id) => hits.find((h) => h.command.id === id))
      .filter((h): h is (typeof hits)[number] => !!h && !h.command.disabled)
      .slice(0, props.recent);
    for (const h of recent) recentIds.add(h.command.id);
    if (recent.length) byGroup.set(RECENT_GROUP, recent);
  }
  for (const h of hits) {
    if (recentIds.has(h.command.id)) continue;
    const key = h.command.group ?? "";
    const list = byGroup.get(key);
    if (list) list.push(h);
    else byGroup.set(key, [h]);
  }

  const ordered = [...byGroup.entries()].sort(([a], [b]) => {
    if (a === RECENT_GROUP || b === RECENT_GROUP) return a === RECENT_GROUP ? -1 : 1;
    return (meta(b)?.priority ?? 0) - (meta(a)?.priority ?? 0) || (groupOrder.get(a) ?? 0) - (groupOrder.get(b) ?? 0);
  });

  let index = 0;
  let room = props.maxResults;
  const result: Section[] = [];
  for (const [id, list] of ordered) {
    if (room <= 0) break;
    if (id !== RECENT_GROUP) {
      list.sort((a, b) => b.score - a.score || (b.command.priority ?? 0) - (a.command.priority ?? 0) || order.get(a.command.id)! - order.get(b.command.id)!);
    }
    const rows = list.slice(0, room).map((h): Row => ({
      command: h.command,
      index: index++,
      segments: highlightSegments(h.command.label, h.ranges),
    }));
    room -= rows.length;
    result.push({
      id,
      label: id === RECENT_GROUP ? messages.value.commandPalette.recent : id ? (meta(id)?.label ?? id) : "",
      rows,
    });
  }
  return result;
});

const rows = computed(() => sections.value.flatMap((s) => s.rows));

// --- Combobox: focus stays in the input, the highlight is aria-activedescendant ---
const id = useCuiId("command-palette");
const listbox = useListbox({
  id,
  mode: "editable",
  count: () => rows.value.length,
  isDisabled: (i) => !!rows.value[i]?.command.disabled,
  activeIndex,
  // No results, no popup to speak of: the empty message is not part of the listbox.
  isOpen: () => open.value && rows.value.length > 0,
  // The list is always showing while the palette is.
  open: () => {},
  select: choose,
  hasLabel: () => false,
  announce: () => (!open.value ? "" : rows.value.length ? messages.value.listbox.results(rows.value.length) : messages.value.commandPalette.noResults),
});

const items = () => ({ count: rows.value.length, isDisabled: (i: number) => !!rows.value[i]?.command.disabled });

// The highlight starts on the first result, so Enter runs the best match. After that it
// stays on the command it is on while the list changes underneath (a route registers one).
let lastQuery = "";
watch(
  () => rows.value.map((r) => ({ value: r.command.id, disabled: r.command.disabled })),
  (next, prev) => {
    const typed = query.value !== lastQuery;
    lastQuery = query.value;
    const kept = typed ? -1 : followHighlight(next, prev, activeIndex.value);
    activeIndex.value = kept === -1 ? firstIndex(items()) : kept;
  },
);

const listEl = useTemplateRef<HTMLElement>("listEl");
watch(query, () => {
  if (listEl.value) listEl.value.scrollTop = 0;
});

let pending: CuiCommand | null = null;

watch(open, (isOpen) => {
  if (!isOpen) return;
  // Reopened before the last choice ran (its exit was cut short): run it now.
  flush();
  query.value = "";
  // The list about to show is a fresh one, not the old filtered list changing: start on row 0.
  lastQuery = "\0";
  activeIndex.value = firstIndex(items());
});

function choose(i: number) {
  const command = rows.value[i]?.command;
  if (!command || command.disabled) return;
  registry.remember(command.id);
  emit("select", command);
  // Run it after the exit, once focus is back with the opener: a command that opens a dialog
  // or moves focus would otherwise lose it to the palette's restore.
  pending = command;
  open.value = false;
}

function flush() {
  const command = pending;
  pending = null;
  if (command) void command.action?.(command);
}

// Unmounted mid-exit: the leave never reports, and the choice must not be lost. The shared
// open state goes with the palette, so the next one to mount does not open at once.
onBeforeUnmount(() => {
  flush();
  open.value = false;
});

function onAfterLeave() {
  emit("after-leave");
  flush();
}

function onUpdateVisible(v: boolean) {
  open.value = v;
}

// --- Hotkey: toggles, also from inside a field or over another overlay ---
const parsedHotkey = computed(() => (props.hotkey ? parseHotkey(props.hotkey) : null));
useEventListener(
  "document",
  "keydown",
  (e) => {
    const hotkey = parsedHotkey.value;
    // Something nearer already took the key (an editor with its own use for it); a held key
    // would otherwise flicker the palette; an IME composition is not a shortcut.
    if (!hotkey || e.defaultPrevented || e.repeat || e.isComposing || !matchesHotkey(e, hotkey)) return;
    e.preventDefault();
    registry.toggle();
  },
  { enabled: () => !!parsedHotkey.value && !props.hidden },
);

// --- Recents across visits ---
onMounted(() => {
  const key = props.recentsStorageKey;
  if (!key) return;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (Array.isArray(stored)) registry.recents.value = stored.filter((s): s is string => typeof s === "string").slice(0, 20);
  } catch {
    /* storage unavailable or not ours */
  }
});
watch(registry.recents, (ids) => {
  if (!props.recentsStorageKey) return;
  try {
    localStorage.setItem(props.recentsStorageKey, JSON.stringify(ids));
  } catch {
    /* storage unavailable */
  }
});

// --- Presentation ---
const resolvedLabel = computed(() => props.label ?? messages.value.commandPalette.label);
const initialFocus = computed(() => props.initialFocus ?? ".cui-command-palette__input");

// Emitted as private properties, read back through the public tokens. The two --_listbox-*
// ones paint CuiListboxOption's rows, which reads its consumer's tokens through the panel.
const vars = computed(() => ({
  "--_command-palette-focus-ring": `var(--cui-${props.color}-focus-ring)`,
  "--_command-palette-match": `var(--cui-${props.color})`,
  "--_listbox-font-size": "var(--cui-command-palette-font-size, 0.9375rem)",
  "--_listbox-item-padding":
    "var(--cui-command-palette-py, calc(0.5rem * var(--cui-density-scale, 1))) var(--cui-command-palette-px, calc(0.75rem * var(--cui-density-scale, 1)))",
  "--_listbox-item-color": "var(--cui-command-palette-color, var(--cui-text-body))",
  "--_listbox-item-radius": "var(--cui-command-palette-radius, var(--cui-radius-md, 0.375rem))",
  "--_listbox-item-focus-bg": `var(--cui-command-palette-hover-bg, var(--cui-${props.color}-bg))`,
  "--_listbox-item-disabled-color": "var(--cui-text-tertiary)",
}));

const headingId = (section: string) => `${id}-heading-${section === RECENT_GROUP ? "recent" : section}`;
const shortcuts = (command: CuiCommand) => (command.shortcut === undefined ? [] : Array.isArray(command.shortcut) ? command.shortcut : [command.shortcut]);
// CuiIcon takes a name and a component as separate props, so forward by type.
const iconProps = (icon: NonNullable<CuiCommand["icon"]>) => (typeof icon === "string" ? { name: icon } : { icon });

defineExpose({
  /** Opens the palette. */
  open: () => registry.open(),
  /** Closes it. */
  close: () => registry.close(),
  /** Focuses the search field, if the palette is open. */
  focus: () => document.getElementById(`${id}-input`)?.focus(),
});
</script>

<template>
  <CuiModal
    class="cui-command-palette"
    size="var(--cui-command-palette-width, 36rem)"
    :hidden="hidden"
    :visible="open"
    :aria-label="resolvedLabel"
    :initial-focus="initialFocus"
    :return-focus="returnFocus"
    @update:visible="onUpdateVisible"
    @close="emit('close')"
    @after-enter="emit('after-enter')"
    @after-leave="onAfterLeave"
  >
    <div class="cui-command-palette__body" :style="vars">
      <div class="cui-command-palette__search">
        <CuiIcon :icon="IconMagnifyingGlass" class="cui-command-palette__search-icon" size="1.125rem" aria-hidden="true" />
        <input
          :id="`${id}-input`"
          v-model="query"
          v-bind="listbox.inputAttrs.value"
          class="cui-command-palette__input"
          type="text"
          :placeholder="placeholder ?? messages.commandPalette.placeholder"
          :aria-label="resolvedLabel"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          @keydown="listbox.onKeydown"
        />
      </div>

      <div
        v-show="rows.length"
        ref="listEl"
        v-bind="listbox.panelAttrs.value"
        role="listbox"
        class="cui-command-palette__list"
        :aria-label="resolvedLabel"
      >
        <div
          v-for="section in sections"
          :key="section.id"
          class="cui-command-palette__group"
          :role="section.label ? 'group' : 'presentation'"
          :aria-labelledby="section.label ? headingId(section.id) : undefined"
        >
          <div v-if="section.label" :id="headingId(section.id)" class="cui-command-palette__heading" role="presentation">
            <slot name="heading" :group="{ id: section.id, label: section.label }" :count="section.rows.length">{{ section.label }}</slot>
          </div>
          <CuiListboxOption
            v-for="row in section.rows"
            :id="listbox.optionId(row.index)"
            :key="row.command.id"
            class="cui-command-palette__option"
            :active="row.index === activeIndex"
            :disabled="row.command.disabled"
            @select="choose(row.index)"
            @mousemove="activeIndex = row.index"
          >
            <slot name="item" :command="row.command" :active="row.index === activeIndex" :query="query" :segments="row.segments">
              <CuiIcon v-if="row.command.icon" v-bind="iconProps(row.command.icon)" class="cui-command-palette__icon" size="1.125rem" aria-hidden="true" />
              <span class="cui-command-palette__text">
                <span class="cui-command-palette__label"><template v-for="(segment, i) in row.segments" :key="i"><span v-if="segment.match" class="cui-command-palette__match">{{ segment.text }}</span><template v-else>{{ segment.text }}</template></template></span>
                <span v-if="row.command.description" class="cui-command-palette__description">{{ row.command.description }}</span>
              </span>
              <span v-if="shortcuts(row.command).length" class="cui-command-palette__shortcut" aria-hidden="true">
                <CuiKbd v-for="(key, i) in shortcuts(row.command)" :key="i" size="sm">{{ key }}</CuiKbd>
              </span>
            </slot>
          </CuiListboxOption>
        </div>
      </div>

      <div v-if="!rows.length" class="cui-command-palette__empty">
        <slot name="empty" :query="query">{{ messages.commandPalette.noResults }}</slot>
      </div>

      <span class="cui-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ listbox.announcement.value }}</span>
    </div>
  </CuiModal>
</template>

<style scoped>
/*
 * Every themeable rule is a whole :where(), so a consumer's plain `.cui-command-palette__input { … }`
 * at (0,1,0) wins without !important; structure (display, flex, overflow) keeps normal specificity.
 * The panel is CuiModal's: its width is --cui-command-palette-width, its look --cui-modal-*.
 * Rows are CuiListboxOption, painted through the --_listbox-* properties set on the body; the
 * highlighted row changes colour with no transition, since the keyboard crosses rows.
 */
:where(.cui-command-palette__search) {
  gap: var(--cui-command-palette-gap, calc(0.625rem * var(--cui-density-scale, 1)));
  padding: var(--cui-command-palette-py, calc(0.75rem * var(--cui-density-scale, 1))) var(--cui-command-palette-px, calc(1rem * var(--cui-density-scale, 1)));
  border-bottom: var(--cui-command-palette-border, 1px solid var(--cui-border));
  color: var(--cui-text-tertiary);
}

:where(.cui-command-palette__input) {
  font-size: var(--cui-command-palette-font-size, 1rem);
  color: var(--cui-text-body);
}

:where(.cui-command-palette__input:focus-visible) {
  outline: 2px solid var(--cui-command-palette-focus-ring, var(--_command-palette-focus-ring));
  outline-offset: 2px;
}

:where(.cui-command-palette__input::placeholder) {
  color: var(--cui-text-tertiary);
}

:where(.cui-command-palette__list) {
  padding: calc(0.375rem * var(--cui-density-scale, 1));
}

:where(.cui-command-palette__heading) {
  padding: calc(0.5rem * var(--cui-density-scale, 1)) var(--cui-command-palette-px, calc(0.75rem * var(--cui-density-scale, 1))) calc(0.25rem * var(--cui-density-scale, 1));
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--cui-text-secondary);
}

:where(.cui-command-palette__description) {
  font-size: 0.8125rem;
  color: var(--cui-text-secondary);
}

:where(.cui-command-palette__match) {
  font-weight: 700;
  color: var(--cui-text-emphasis);
  text-decoration: underline 2px;
  text-decoration-color: var(--_command-palette-match);
  text-underline-offset: 0.2em;
}

:where(.cui-command-palette__empty) {
  padding: calc(1.5rem * var(--cui-density-scale, 1)) calc(1rem * var(--cui-density-scale, 1));
  font-size: 0.875rem;
  color: var(--cui-text-secondary);
}

.cui-command-palette__body {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cui-command-palette__search {
  display: flex;
  align-items: center;
  flex: none;
}

.cui-command-palette__search-icon {
  flex: none;
}

.cui-command-palette__input {
  flex: 1 1 auto;
  min-width: 0;
  border: 0;
  background: transparent;
}

.cui-command-palette__list {
  flex: 0 1 auto;
  max-height: 24rem;
  min-height: 0;
  overflow-y: auto;
}

.cui-command-palette__empty {
  text-align: center;
}

.cui-command-palette__icon {
  flex: none;
}

.cui-command-palette__text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
}

.cui-command-palette__label,
.cui-command-palette__description {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cui-command-palette__shortcut {
  display: inline-flex;
  flex: none;
  gap: 0.25rem;
  margin-inline-start: auto;
}
</style>
