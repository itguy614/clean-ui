<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  CuiBadge,
  CuiButton,
  CuiCard,
  CuiCardBody,
  CuiCommandPalette,
  CuiFlex,
  CuiKbd,
  CuiToggle,
  useColorMode,
  useCommandPalette,
  useToast,
  type CuiCommand,
  type CuiCommandGroup,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/command-palette";
import { PAGES } from "../navigation/pages";

const router = useRouter();
const colorMode = useColorMode();
const { toast } = useToast();
const palette = useCommandPalette();

const lastRan = ref("(nothing yet)");

const groups: CuiCommandGroup[] = [
  { id: "actions", label: "Actions", priority: 2 },
  { id: "page", label: "This page", priority: 3 },
  { id: "navigation", label: "Go to", priority: 1 },
];

// Registered from setup, so they are withdrawn when this page unmounts: leave for another
// page, press Cmd/Ctrl-K there, and these are gone (the palette on this page is gone too).
palette.register([
  {
    id: "demo.dark-mode",
    label: "Toggle dark mode",
    description: "Switch between the light and dark scheme",
    keywords: ["theme", "appearance", "night"],
    group: "actions",
    icon: "eye",
    shortcut: ["⇧", "D"],
    action: () => colorMode.toggle(),
  },
  {
    id: "demo.toast",
    label: "Show a toast",
    group: "actions",
    icon: "info",
    action: () => toast({ title: "Hello from a command", color: "info" }),
  },
  {
    id: "demo.copy-link",
    label: "Copy a link to this page",
    group: "actions",
    icon: "copy",
    action: () => navigator.clipboard?.writeText(window.location.href),
  },
  {
    id: "demo.delete",
    label: "Delete everything",
    description: "Disabled: listed, skipped by the arrow keys, ignored on click",
    group: "actions",
    icon: "trash",
    disabled: true,
  },
  ...PAGES.map(
    (page): CuiCommand => ({
      id: `go.${page.id}`,
      label: page.label,
      description: page.group,
      keywords: page.keywords,
      group: "navigation",
      icon: "file-text",
      action: () => void router.push(page.path),
    }),
  ),
]);

// A registration that comes and goes while the page is up: a route's own commands.
const routeCommands = ref(false);
let withdrawRoute: (() => void) | undefined;
watch(routeCommands, (on) => {
  withdrawRoute?.();
  withdrawRoute = on
    ? palette.register({
        id: "page.refresh",
        label: "Refresh this page's data",
        group: "page",
        icon: "clock",
        priority: 1,
      })
    : undefined;
});
onBeforeUnmount(() => withdrawRoute?.());

const customRows = ref(false);
const recents = computed(() => palette.recents.value.length);

const usageCode = `<script setup>
import { CuiCommandPalette, useCommandPalette } from "@itguy614/clean-ui";

const palette = useCommandPalette();

// Anywhere, any time. Withdrawn when this component unmounts.
palette.register([
  { id: "invoice.new", label: "New invoice", group: "actions", icon: "plus",
    shortcut: "⌘N", action: () => router.push("/invoices/new") },
  { id: "theme.dark", label: "Toggle dark mode", keywords: ["appearance"],
    group: "actions", action: () => colorMode.toggle() },
]);
<\/script>

<template>
  <!-- Once, near the root of the app. Cmd/Ctrl-K opens it. -->
  <CuiCommandPalette :groups="[{ id: 'actions', label: 'Actions' }]" />

  <!-- Reachable without the shortcut, too -->
  <CuiButton @click="palette.open()">Search commands</CuiButton>
</template>`;

const scopeCode = `// In a route component: gone again when the route unmounts.
const palette = useCommandPalette();
palette.register({ id: "invoice.send", label: "Send this invoice", group: "this-invoice", action: send });

// Reactive: a getter (or a ref) is read again when what it reads changes.
palette.register(() => ({ id: "invoice.send", label: "Send this invoice", disabled: !invoice.value.ready, action: send }));

// Outside a component (an entry file): kept until you withdraw it.
const withdraw = palette.register(globalCommands);
withdraw();

// The same id registered twice: the latest wins, and withdrawing it brings the earlier back.
// A route can override a global command for as long as it is mounted.`;

const slotsCode = `<CuiCommandPalette :groups="groups">
  <template #item="{ command, active, segments }">
    <span>
      <template v-for="(s, i) in segments" :key="i">
        <strong v-if="s.match">{{ s.text }}</strong><template v-else>{{ s.text }}</template>
      </template>
    </span>
    <CuiBadge v-if="active" size="sm">↵ run</CuiBadge>
  </template>

  <template #heading="{ group, count }">{{ group.label }} · {{ count }}</template>
  <template #empty="{ query }">Nothing called “{{ query }}”. Try another word.</template>
</CuiCommandPalette>`;

const hotkeyCode = `<!-- Rebind it -->
<CuiCommandPalette hotkey="mod+shift+p" />

<!-- No shortcut at all: open it from your own UI -->
<CuiCommandPalette :hotkey="false" v-model:visible="open" />`;
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example code-open :code="usageCode">
        <CuiFlex gap="3" align="center" wrap="wrap">
          <CuiButton variant="outline" @click="palette.open()">Search commands</CuiButton>
          <span>
            or press <CuiKbd>Ctrl</CuiKbd> <CuiKbd>K</CuiKbd> (<CuiKbd>⌘</CuiKbd> <CuiKbd>K</CuiKbd> on a Mac)
          </span>
        </CuiFlex>
        <p style="margin: 0.75rem 0 0">Last run: <CuiBadge>{{ lastRan }}</CuiBadge></p>

        <CuiCommandPalette :groups="groups" :max-results="30" :recent="3" @select="lastRan = $event.label">
          <template v-if="customRows" #item="{ command, active, segments }">
            <span style="flex: 1 1 auto">
              <template v-for="(s, i) in segments" :key="i">
                <strong v-if="s.match">{{ s.text }}</strong><template v-else>{{ s.text }}</template>
              </template>
            </span>
            <CuiBadge v-if="command.disabled" size="sm" color="surface">off</CuiBadge>
            <CuiBadge v-else-if="active" size="sm">↵ run</CuiBadge>
          </template>
          <template v-if="customRows" #heading="{ group, count }">{{ group.label }} · {{ count }}</template>
          <template v-if="customRows" #empty="{ query }">Nothing called “{{ query }}”. Try another word.</template>
        </CuiCommandPalette>
      </Example>

      <CuiCard variant="outline" style="margin-top: 1rem">
        <CuiCardBody>
          <p><strong>Try:</strong></p>
          <ul>
            <li>Press the shortcut: the palette opens with focus in the field, and the same shortcut closes it. It works while you are typing in another field, and over an open modal.</li>
            <li>Type <kbd>tgdm</kbd>: <em>Toggle dark mode</em> is found by the letters you typed, and they are underlined. Type <kbd>appearance</kbd>: found by a keyword, with nothing underlined.</li>
            <li>↑/↓ move the highlight (focus stays in the field), Enter runs it, Escape closes. <em>Delete everything</em> is listed but skipped.</li>
            <li>Run <em>Show a toast</em>, then reopen: it is now under <em>Recent</em>, above the other groups, with nothing typed. ({{ recents }} recent so far.)</li>
            <li>Type <kbd>modal</kbd> and press Enter on a <em>Go to</em> row: the page changes after the palette has closed, and focus is back where you opened it from.</li>
            <li>Switch on <em>Contribute a command from this route</em>: a <em>This page</em> group appears, first. Switch it off, or leave this page, and it is withdrawn.</li>
            <li>Press the shortcut with a screen reader running, and type: the number of results is announced a moment after you stop typing.</li>
          </ul>
        </CuiCardBody>
      </CuiCard>
    </template>

    <template #accessibility>
      <p>
        The palette is a <code>CuiModal</code> holding the ARIA combobox pattern: the search field
        has <code>role="combobox"</code>, <code>aria-expanded</code>, <code>aria-controls</code> and
        <code>aria-autocomplete="list"</code>, and the results are a <code>role="listbox"</code> of
        <code>role="option"</code> rows, in <code>role="group"</code>s named by their headings.
      </p>
      <ul>
        <li>Focus stays in the field. The highlighted row is named by <code>aria-activedescendant</code>, and the arrow keys move it, skipping disabled commands. Home, End and the left and right arrows stay the text cursor's.</li>
        <li>The dialog traps Tab, takes focus on open and gives it back to what had it (a field you were typing in, or a button) on close, and Escape closes it, topmost layer first.</li>
        <li>The number of results is announced through a polite live region as the list narrows, once typing pauses, and so is an empty result.</li>
        <li>The shortcut is a convenience, never the only way in: <code>v-model:visible</code>, <code>useCommandPalette().open()</code> and the exposed <code>open()</code> all open it. <code>shortcut</code> on a command is shown but hidden from assistive tech, since it binds nothing.</li>
        <li>The match underline sits on text that is already high contrast: the highlight is bold and underlined, not a color change alone.</li>
      </ul>
    </template>

    <template #extra>
      <div>
        <h2 id="usecommandpalette" class="mb-4 text-2xl font-semibold">useCommandPalette</h2>
        <p class="mb-4 text-surface-600 dark:text-surface-400">
          The registry behind the palette. Commands are not props: a feature registers its own from
          wherever it lives, and the palette lists whatever is registered while it is open.
        </p>
        <ul class="mb-4 list-disc pl-5 text-surface-700 dark:text-surface-300">
          <li><code>register(commands)</code> takes a command, an array, or a ref or getter of either (so <code>disabled</code> and <code>label</code> can follow state), and returns <code>withdraw()</code>. Called in a component's setup it also withdraws on unmount.</li>
          <li><code>commands</code>: everything registered now. <code>recents</code>: the ids last run, newest first, with <code>clearRecents()</code>.</li>
          <li><code>visible</code>, <code>open()</code>, <code>close()</code> and <code>toggle()</code>: whether the palette is open, and a way to change it from anywhere. There is one palette per page.</li>
          <li>On the server <code>register</code> does nothing, so a request cannot leave commands behind for the next.</li>
        </ul>
        <Example title="Scoped, reactive and overriding registrations" code-open :code="scopeCode">
          <CuiToggle v-model="routeCommands" label="Contribute a command from this route" />
        </Example>
      </div>

      <div>
        <h2 id="matching" class="mb-4 text-2xl font-semibold">Matching and ranking</h2>
        <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
          <li>A query matches when its letters appear in the label in order, ignoring case: <code>opset</code> finds <em>Open settings</em>. A query of several words needs each word to match, in any order.</li>
          <li>Better matches rank higher: the start of the label or of a word (or a camelCase hump) beats the middle of a word, and letters together beat letters spread out. Equal matches fall back to <code>priority</code>, then to registration order.</li>
          <li>A command found only through its <code>keywords</code> or <code>description</code> ranks below one found by its label, and highlights nothing. Accents are not folded: <code>cafe</code> does not find <em>Café</em>.</li>
          <li>Results stay in their groups. Groups run by <code>priority</code> then registration order, and, while nothing is typed, <em>Recent</em> comes first and its commands are not repeated in their own group.</li>
        </ul>
      </div>

      <div>
        <h2 id="running-a-command" class="mb-4 text-2xl font-semibold">Running a command</h2>
        <p class="text-surface-700 dark:text-surface-300">
          Choosing a command emits <code>select</code> and closes the palette; its <code>action</code>
          runs once the exit has finished and focus is back where it came from. A command that opens a
          dialog or moves focus would otherwise lose it to the palette's own focus restore. Reopened
          before that, the pending action runs at once.
        </p>
      </div>
    </template>

    <template #examples>
      <Example title="Rows, headings and the empty state" :code="slotsCode">
        <CuiToggle v-model="customRows" label="Use the item, heading and empty slots" />
        <p style="margin: 0.75rem 0 0">The palette above takes the slots when this is on. Open it and type <kbd>zzz</kbd>.</p>
      </Example>

      <Example title="The shortcut" :code="hotkeyCode">
        <p style="margin: 0">
          <code>mod</code> is Command on Apple platforms and Control elsewhere. The shortcut toggles,
          ignores a held key and an IME composition, and leaves a key alone when something nearer
          has already taken it with <code>preventDefault()</code>.
        </p>
      </Example>
    </template>
  </DocPage>
</template>
