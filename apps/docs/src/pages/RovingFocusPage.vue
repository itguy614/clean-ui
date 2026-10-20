<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { CuiStack, CuiCard, CuiCardBody, CuiButton, CuiToggle, CuiFlex, CuiBadge, useRovingFocus } from "@itguy614/clean-ui";
import Example from "../components/Example.vue";

// --- Toolbar: horizontal, a disabled item to skip, switchable wrap / type-ahead / RTL ---
const tools = [
  { label: "Bold" },
  { label: "Italic" },
  { label: "Underline" },
  { label: "Code", disabled: true },
  { label: "Strikethrough" },
  { label: "Link" },
];
const wrap = ref(false);
const typeahead = ref(false);
const rtl = ref(false);
const pressed = ref<string[]>([]);
const togglePressed = (label: string) =>
  (pressed.value = pressed.value.includes(label) ? pressed.value.filter((l) => l !== label) : [...pressed.value, label]);

const toolbar = useRovingFocus({
  container: useTemplateRef<HTMLElement>("toolbarEl"),
  itemSelector: ".cui-button",
  orientation: "horizontal",
  wrap,
  typeahead,
});

// --- Vertical list with type-ahead ---
const fruits = ["Apple", "Apricot", "Banana", "Blackberry", "Blueberry", "Cherry", "Grape", "Mango"];
const list = useRovingFocus({
  container: useTemplateRef<HTMLElement>("listEl"),
  itemSelector: ".cui-button",
  orientation: "vertical",
  typeahead: true,
});

// --- Selection follows focus: activeIndex is the selection itself ---
const views = ["Day", "Week", "Month", "Year"];
const selectedView = ref(1);
const segmented = useRovingFocus({
  container: useTemplateRef<HTMLElement>("segmentedEl"),
  itemSelector: ".cui-button",
  orientation: "horizontal",
  activeIndex: selectedView,
});

const toolbarCode = `<script setup>
const toolbar = useRovingFocus({
  container: useTemplateRef("toolbarEl"),
  itemSelector: ".cui-button",
  orientation: "horizontal",
  wrap,        // a ref — switchable
  typeahead,
});
<\/script>

<div ref="toolbarEl" role="toolbar" aria-label="Formatting"
     @keydown="toolbar.onKeydown" @focusin="toolbar.onFocusin">
  <CuiButton v-for="(tool, i) in tools" :key="tool.label"
             :tabindex="toolbar.tabIndex(i)" :disabled="tool.disabled">
    {{ tool.label }}
  </CuiButton>
</div>`;

const listCode = `const list = useRovingFocus({
  container: useTemplateRef("listEl"),
  itemSelector: ".cui-button",
  orientation: "vertical",
  typeahead: true,
});`;

const segmentedCode = `const selectedView = ref(1);
// Pass the selection as activeIndex: arrows move focus AND select.
const segmented = useRovingFocus({
  container: useTemplateRef("segmentedEl"),
  itemSelector: ".cui-button",
  orientation: "horizontal",
  activeIndex: selectedView,
});`;
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Roving Focus</h1>
      <p class="cui-lead">
        <code class="cui-code">useRovingFocus()</code> gives a group of controls a single tab stop.
        Tab moves into and out of the group; the arrow keys, Home and End move between its items.
      </p>
      <p>
        Disabled items are skipped, right-to-left layouts swap the meaning of the left and right
        arrows, and an arrow never moves focus out of the group. Focusing an item any other way —
        clicking it — moves the tab stop to it.
      </p>
    </div>

    <!-- Toolbar -->
    <Example title="Toolbar" :code="toolbarCode">
      <CuiStack spacing="4">
        <CuiFlex gap="4" wrap="wrap">
          <CuiToggle v-model="wrap" label="Wrap at the ends" />
          <CuiToggle v-model="typeahead" label="Type-ahead" />
          <CuiToggle v-model="rtl" label="Right-to-left" />
        </CuiFlex>
        <div
          ref="toolbarEl"
          role="toolbar"
          aria-label="Formatting"
          :dir="rtl ? 'rtl' : 'ltr'"
          style="display: flex; flex-wrap: wrap; gap: 0.25rem"
          @keydown="toolbar.onKeydown"
          @focusin="toolbar.onFocusin"
        >
          <CuiButton
            v-for="(tool, i) in tools"
            :key="tool.label"
            size="sm"
            :variant="pressed.includes(tool.label) ? 'outline' : 'ghost'"
            :tabindex="toolbar.tabIndex(i)"
            :disabled="tool.disabled"
            :aria-pressed="pressed.includes(tool.label)"
            @click="togglePressed(tool.label)"
          >
            {{ tool.label }}
          </CuiButton>
        </div>
        <p style="margin: 0">Tab stop: <CuiBadge>{{ tools[toolbar.activeIndex.value]?.label }}</CuiBadge></p>
      </CuiStack>
    </Example>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Try:</strong></p>
        <ul>
          <li>Tab into the toolbar: one stop, on Bold. Tab again leaves it.</li>
          <li>←/→ move between buttons; <em>Code</em> is disabled and skipped. Home/End jump to the ends.</li>
          <li>At Link, → stays put; turn on <em>Wrap</em> and it comes round to Bold.</li>
          <li>Turn on <em>Type-ahead</em> and press <kbd>U</kbd>; pause a moment, then <kbd>S</kbd>. (Letters typed quickly refine one search, so <kbd>U</kbd><kbd>S</kbd> together finds nothing.)</li>
          <li>Turn on <em>Right-to-left</em>: → now moves toward the start.</li>
          <li>Click Underline, then Shift+Tab out and Tab back in — the stop stays on Underline.</li>
          <li>↑/↓ do nothing here: the toolbar is horizontal.</li>
        </ul>
      </CuiCardBody>
    </CuiCard>

    <!-- Vertical list -->
    <Example title="Vertical list with type-ahead" :code="listCode">
      <div
        ref="listEl"
        role="group"
        aria-label="Fruit"
        style="display: flex; flex-direction: column; gap: 0.125rem; max-width: 14rem"
        @keydown="list.onKeydown"
        @focusin="list.onFocusin"
      >
        <CuiButton
          v-for="(fruit, i) in fruits"
          :key="fruit"
          size="sm"
          variant="ghost"
          style="justify-content: flex-start"
          :tabindex="list.tabIndex(i)"
        >
          {{ fruit }}
        </CuiButton>
      </div>
    </Example>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Try:</strong> ↑/↓, Home/End; then type <kbd>B</kbd> repeatedly — it cycles Banana → Blackberry → Blueberry. Type <kbd>b</kbd><kbd>l</kbd><kbd>u</kbd> quickly to land on Blueberry; pause half a second and the search starts over.</p>
      </CuiCardBody>
    </CuiCard>

    <!-- Selection follows focus -->
    <Example title="Selection follows focus" :code="segmentedCode">
      <CuiStack spacing="3">
        <div
          ref="segmentedEl"
          role="radiogroup"
          aria-label="View"
          style="display: flex; gap: 0.25rem"
          @keydown="segmented.onKeydown"
          @focusin="segmented.onFocusin"
        >
          <CuiButton
            v-for="(view, i) in views"
            :key="view"
            size="sm"
            role="radio"
            :aria-checked="selectedView === i"
            :variant="selectedView === i ? 'outline' : 'ghost'"
            :tabindex="segmented.tabIndex(i)"
            @click="selectedView = i"
          >
            {{ view }}
          </CuiButton>
        </div>
        <p style="margin: 0">Selected: <CuiBadge>{{ views[selectedView] }}</CuiBadge></p>
      </CuiStack>
    </Example>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p>
          <strong>Try:</strong> Tab in — the stop is on the selected view (Week), not the first. ←/→ move
          focus <em>and</em> the selection: <code class="cui-code">activeIndex</code> is the selected
          index itself. The composable only writes it when you navigate.
        </p>
      </CuiCardBody>
    </CuiCard>
  </CuiStack>
</template>
