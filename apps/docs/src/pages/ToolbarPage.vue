<script setup lang="ts">
import { ref } from "vue";
import {
  CuiButton,
  CuiButtonGroup,
  CuiCard,
  CuiCardBody,
  CuiIcon,
  CuiInput,
  CuiSelect,
  CuiStack,
  CuiToolbar,
  CuiToolbarSeparator,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/toolbar";

const marks = [
  { id: "bold", label: "Bold", icon: "text-bolder" },
  { id: "italic", label: "Italic", icon: "text-italic" },
  { id: "underline", label: "Underline", icon: "text-underline" },
  { id: "strike", label: "Strikethrough", icon: "text-strikethrough" },
];
const pressed = ref<string[]>(["bold"]);
const toggle = (id: string) =>
  (pressed.value = pressed.value.includes(id) ? pressed.value.filter((p) => p !== id) : [...pressed.value, id]);
const isPressed = (id: string) => pressed.value.includes(id);

const block = ref("paragraph");
const blocks = [
  { value: "paragraph", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "quote", label: "Quote" },
];

const search = ref("");

const usageCode = `<CuiToolbar label="Formatting">
  <span id="block-label" class="cui-sr-only">Block type</span>
  <CuiSelect v-model="block" :options="blocks" size="sm" aria-labelledby="block-label" />
  <CuiToolbarSeparator />
  <CuiButtonGroup label="Text style">
    <CuiButton
      v-for="mark in marks"
      :key="mark.id"
      icon
      size="sm"
      :variant="isPressed(mark.id) ? 'outline' : 'ghost'"
      :aria-pressed="isPressed(mark.id)"
      :aria-label="mark.label"
      @click="toggle(mark.id)"
    >
      <CuiIcon :name="mark.icon" size="sm" />
    </CuiButton>
  </CuiButtonGroup>
  <CuiToolbarSeparator />
  <CuiButton icon size="sm" variant="ghost" aria-label="Bulleted list">
    <CuiIcon name="list-bullets" size="sm" />
  </CuiButton>
  <CuiButton icon size="sm" variant="ghost" aria-label="Numbered list">
    <CuiIcon name="list-numbers" size="sm" />
  </CuiButton>
  <CuiButton icon size="sm" variant="ghost" aria-label="Insert link" disabled>
    <CuiIcon name="link" size="sm" />
  </CuiButton>
</CuiToolbar>`;
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example code-open :code="usageCode">
        <CuiToolbar label="Formatting">
          <span id="docs-toolbar-block-label" class="cui-sr-only">Block type</span>
          <div style="width: 9rem">
            <CuiSelect v-model="block" :options="blocks" size="sm" aria-labelledby="docs-toolbar-block-label" />
          </div>
          <CuiToolbarSeparator />
          <CuiButtonGroup label="Text style">
            <CuiButton
              v-for="mark in marks"
              :key="mark.id"
              icon
              size="sm"
              :variant="isPressed(mark.id) ? 'outline' : 'ghost'"
              :aria-pressed="isPressed(mark.id)"
              :aria-label="mark.label"
              @click="toggle(mark.id)"
            >
              <CuiIcon :name="mark.icon" size="sm" />
            </CuiButton>
          </CuiButtonGroup>
          <CuiToolbarSeparator />
          <CuiButton icon size="sm" variant="ghost" aria-label="Bulleted list">
            <CuiIcon name="list-bullets" size="sm" />
          </CuiButton>
          <CuiButton icon size="sm" variant="ghost" aria-label="Numbered list">
            <CuiIcon name="list-numbers" size="sm" />
          </CuiButton>
          <CuiButton icon size="sm" variant="ghost" aria-label="Insert link" disabled>
            <CuiIcon name="link" size="sm" />
          </CuiButton>
        </CuiToolbar>
      </Example>
      <CuiCard variant="outline" class="mt-4">
        <CuiCardBody>
          <p class="text-sm">
            <strong>Try:</strong> Tab in — focus lands on one control, not the first of eight. ←/→
            move between them, passing over the separators and the disabled link button; Home and
            End jump to the ends. On the select, ↓ opens it and ←/→ still move along the toolbar;
            once it is open its keys are its own. Tab again leaves the toolbar.
          </p>
        </CuiCardBody>
      </CuiCard>
    </template>

    <template #accessibility>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        The toolbar renders <code>role="toolbar"</code> with <code>aria-orientation</code>, and needs
        an accessible name: <code>label</code>, <code>aria-label</code> or
        <code>aria-labelledby</code>. Without one it warns in the console, since an unnamed toolbar
        is announced only as "toolbar".
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        It is one tab stop, built on
        <router-link to="/composables/roving-focus">useRovingFocus</router-link>.
        <kbd class="cui-kbd">←</kbd>/<kbd class="cui-kbd">→</kbd> (or
        <kbd class="cui-kbd">↑</kbd>/<kbd class="cui-kbd">↓</kbd> when vertical) move between its
        controls, <kbd class="cui-kbd">Home</kbd> and <kbd class="cui-kbd">End</kbd> reach the ends,
        and a disabled control is skipped. Right-to-left pages swap the meaning of the left and
        right arrows. Clicking a control moves the tab stop to it, so the next Tab-in returns there.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        A control that needs the arrow keys keeps them. A text input is not one of the toolbar's
        controls at all: it is a tab stop of its own, and ←/→ move its caret. An open select owns
        its keys until it closes. Place a text input at the start or end of the toolbar, so the
        tab order still reads naturally.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        Icon-only controls need their own <code>aria-label</code>, and a toggle should say whether
        it is on with <code>aria-pressed</code>.
      </p>
    </template>

    <template #extra>
      <h2 class="text-2xl font-semibold" id="toolbar-or-button-group">Toolbar or button group?</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <CuiStack spacing="3" class="text-sm">
            <p>
              They can look the same, and they behave differently in the one way that matters.
              A <router-link to="/components/button-group">button group</router-link> is
              presentational: its buttons share borders, and <kbd class="cui-kbd">Tab</kbd> stops at
              every one of them. A toolbar is a single tab stop with arrow keys inside it.
            </p>
            <p>
              <strong>Use a toolbar</strong> for a dense strip of controls a keyboard user wants to
              get past: a text-formatting bar of a dozen icon buttons is a dozen tab stops as a
              group, and one as a toolbar.
            </p>
            <p>
              <strong>Use a button group</strong> for two or three related actions — Save and its
              menu, Previous and Next — where a tab stop each is what a keyboard user expects.
            </p>
            <p>
              The two combine: a button group inside a toolbar keeps its merged borders, and its
              buttons join the toolbar's single tab stop.
            </p>
          </CuiStack>
        </CuiCardBody>
      </CuiCard>
    </template>

    <template #examples>
      <CuiStack spacing="6">
        <Example
          title="Overflow: scroll"
          :code="`<CuiToolbar label=&quot;Formatting&quot; overflow=&quot;scroll&quot;>
  <CuiButton v-for=&quot;mark in marks&quot; …>…</CuiButton>
</CuiToolbar>`"
        >
          <div style="max-width: 14rem">
            <CuiToolbar label="Formatting (scrolling)" overflow="scroll">
              <CuiButton v-for="mark in marks" :key="mark.id" size="sm" variant="ghost">
                <template #prefix><CuiIcon :name="mark.icon" size="sm" /></template>
                {{ mark.label }}
              </CuiButton>
            </CuiToolbar>
          </div>
        </Example>

        <Example
          title="With a search box"
          :code="`<CuiToolbar label=&quot;Files&quot;>
  <span id=&quot;filter-label&quot; class=&quot;cui-sr-only&quot;>Filter files</span>
  <CuiInput v-model=&quot;search&quot; size=&quot;sm&quot; placeholder=&quot;Filter files…&quot; aria-labelledby=&quot;filter-label&quot; />
  <CuiToolbarSeparator />
  <CuiButton size=&quot;sm&quot;>Upload</CuiButton>
  <CuiButton size=&quot;sm&quot;>New folder</CuiButton>
  <CuiButton size=&quot;sm&quot;>Share</CuiButton>
</CuiToolbar>`"
        >
          <CuiToolbar label="Files">
            <span id="docs-toolbar-filter-label" class="cui-sr-only">Filter files</span>
            <div style="width: 12rem">
              <CuiInput v-model="search" size="sm" placeholder="Filter files…" aria-labelledby="docs-toolbar-filter-label" />
            </div>
            <CuiToolbarSeparator />
            <CuiButton size="sm">Upload</CuiButton>
            <CuiButton size="sm">New folder</CuiButton>
            <CuiButton size="sm">Share</CuiButton>
          </CuiToolbar>
        </Example>

        <Example
          title="Vertical"
          :code="`<CuiToolbar label=&quot;Drawing tools&quot; orientation=&quot;vertical&quot; loop>
  …
</CuiToolbar>`"
        >
          <CuiToolbar label="Drawing tools" orientation="vertical" loop>
            <CuiButton icon size="sm" variant="ghost" aria-label="Select">
              <CuiIcon name="cursor" size="sm" />
            </CuiButton>
            <CuiButton icon size="sm" variant="ghost" aria-label="Pencil">
              <CuiIcon name="pencil-simple" size="sm" />
            </CuiButton>
            <CuiToolbarSeparator />
            <CuiButton icon size="sm" variant="ghost" aria-label="Undo">
              <CuiIcon name="arrow-u-up-left" size="sm" />
            </CuiButton>
            <CuiButton icon size="sm" variant="ghost" aria-label="Redo">
              <CuiIcon name="arrow-u-up-right" size="sm" />
            </CuiButton>
          </CuiToolbar>
        </Example>

        <Example
          title="Styled through tokens"
          :code="`<CuiToolbar label=&quot;History&quot; class=&quot;bordered-toolbar&quot;>…</CuiToolbar>

.bordered-toolbar {
  --cui-toolbar-border: 1px solid var(--cui-border);
  --cui-toolbar-radius: var(--cui-radius-md);
  --cui-toolbar-px: 0.25rem;
  --cui-toolbar-py: 0.25rem;
}`"
        >
          <CuiToolbar label="History" class="docs-bordered-toolbar">
            <CuiButton size="sm" variant="ghost">Undo</CuiButton>
            <CuiButton size="sm" variant="ghost">Redo</CuiButton>
            <CuiToolbarSeparator />
            <CuiButton size="sm" variant="ghost">History</CuiButton>
          </CuiToolbar>
        </Example>
      </CuiStack>
    </template>
  </DocPage>
</template>

<style scoped>
.docs-bordered-toolbar {
  display: inline-flex;
  --cui-toolbar-border: 1px solid var(--cui-border);
  --cui-toolbar-radius: var(--cui-radius-md, 0.375rem);
  --cui-toolbar-px: 0.25rem;
  --cui-toolbar-py: 0.25rem;
}
</style>
