<script setup lang="ts">
import { ref } from "vue";
import { CuiCard, CuiCardHeader, CuiCardBody, CuiStack, CuiSlider, CuiAlert } from "@itguy614/clean-ui";
import { CuiMarkdownEditor } from "@itguy614/clean-ui-editor";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const widthDemoDoc = ref("A **bold**, *italic*, ~~strike~~ document with a [link](https://example.com).");
const width = ref(320);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Accessibility &amp; Mobile</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        What this editor actually does for assistive technology and touch input — including the one
        behavior that surprises people the first time they hear it.
      </p>
    </div>

    <CuiAlert color="info" title="Read this before filing it as a bug">
      In <strong>Formatted</strong> (WYSIWYG) mode, hiding a syntax marker away from the cursor is
      <em>visual only</em> — the marker stays a real DOM text node, just rendered at zero size. It is
      never removed from the document, and it is never removed from the accessibility tree. This is
      deliberate: a screen reader reading <code class="cui-code">**bold**</code> announces the literal
      markdown, asterisks included, regardless of where the caret is or what's visually hidden on
      screen. Nothing is concealed from assistive technology that a sighted mouse user can see by
      moving the caret — the two experiences are equivalent by construction, not despite this.
    </CuiAlert>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Why not hide it from the accessibility tree too?</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <p class="text-sm" style="color: var(--cui-text-secondary);">
            The marker-hiding mechanism is a mark decoration styled at zero font-size/line-height —
            never <code class="cui-code">Decoration.replace()</code>, which would remove the
            characters from the DOM (and therefore the accessibility tree) outright. A markdown
            editor's whole value proposition is "the document is markdown text" — an editor that
            silently presented different content to a screen reader than what a sighted user's caret
            reveals would undermine that guarantee for exactly the users who rely on it most. If your
            application wants a genuinely different screen-reader experience, that's a rendered-preview
            concern (a separate, future feature), not something this editor's own buffer should fake.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Keyboard shortcuts (complete list)</h2>
      <PropTable
        :props="[
          { name: 'Mod-b', type: 'Formatting', description: 'Toggle bold' },
          { name: 'Mod-i', type: 'Formatting', description: 'Toggle italic' },
          { name: 'Mod-Shift-x', type: 'Formatting', description: 'Toggle strikethrough' },
          { name: 'Mod-e', type: 'Formatting', description: 'Toggle inline code' },
          { name: 'Mod-Alt-1 / 2 / 3', type: 'Formatting', description: 'Set heading level 1 / 2 / 3' },
          { name: 'Mod-Shift-.', type: 'Formatting', description: 'Toggle blockquote' },
          { name: 'Mod-Shift-8', type: 'Formatting', description: 'Toggle bulleted list' },
          { name: 'Mod-Shift-7', type: 'Formatting', description: 'Toggle numbered list' },
          { name: 'Mod-k', type: 'Formatting', description: 'Open the link dialog' },
          { name: 'Tab / Shift-Tab', type: 'Editing', description: 'Indent / outdent inside a list item' },
          { name: 'Enter', type: 'Editing', description: 'Continues a list item; on an empty item, exits the list instead' },
          { name: '/', type: 'Slash menu', description: 'Opens the slash menu (must be the start of a query — see below)' },
          { name: 'Arrow Up / Down', type: 'Slash menu', description: 'Move the highlighted slash-menu entry' },
          { name: 'Enter', type: 'Slash menu', description: 'Runs the highlighted entry\'s command' },
          { name: 'Escape', type: 'Slash menu', description: 'Dismisses the menu, leaving whatever was typed untouched' },
          { name: 'Tab', type: 'Toolbar', description: 'One tab stop for the whole toolbar (roving tabindex) — arrow keys move between buttons, not Tab' },
          { name: 'Arrow Left / Right', type: 'Toolbar', description: 'Move focus between toolbar buttons' },
          { name: 'Home / End', type: 'Toolbar', description: 'Jump to the first / last toolbar button' },
        ]"
      />
      <p class="mt-3 text-sm" style="color: var(--cui-text-secondary);">
        <code class="cui-code">Mod</code> is <code class="cui-code">Cmd</code> on macOS,
        <code class="cui-code">Ctrl</code> everywhere else — the same convention CodeMirror itself
        uses. Excluding a built-in plugin (see the
        <router-link to="/editor" style="color: var(--cui-primary);">Editor reference</router-link>'s
        "construct excluded" example) removes its keyboard shortcut along with its toolbar button and
        slash-menu entry — there is no back door.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Touch: reveal granularity</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <p class="text-sm" style="color: var(--cui-text-secondary);">
            Reveal granularity follows input type. A mouse or trackpad reveals at the <em>construct</em>
            level — only the specific bold/link/heading the caret is actually inside gets its markers
            shown. A touch input reveals the <em>whole line</em> instead, since a fingertip's imprecise
            hit-target makes construct-level reveal fiddly to actually land on. This can't be
            demonstrated in a desktop browser tab (there is no real touch input to react to here) —
            it's verified with real Playwright <code class="cui-code">pointerType: "touch"</code>
            events, not simulated with a mouse.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Narrow viewport: toolbar overflow</h2>
      <p class="mb-4 text-sm" style="color: var(--cui-text-secondary);">
        At a narrow width the toolbar <strong>scrolls</strong> rather than clipping or wrapping —
        every action stays reachable (by touch-scroll or the roving-tabindex arrow keys), none simply
        disappear. Drag the slider to see it happen.
      </p>
      <Example title="Resize to see the toolbar scroll">
        <CuiStack spacing="3">
          <CuiSlider v-model="width" :min="240" :max="700" :step="10" />
          <p class="text-sm" style="color: var(--cui-text-secondary);">Width: {{ width }}px</p>
          <div :style="{ width: `${width}px`, maxWidth: '100%', border: '1px dashed var(--cui-border)', padding: '0.5rem' }">
            <CuiMarkdownEditor v-model="widthDemoDoc" />
          </div>
        </CuiStack>
      </Example>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Form control accessibility</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <p class="text-sm" style="color: var(--cui-text-secondary);">
            <code class="cui-code">id</code>, <code class="cui-code">aria-invalid</code> and
            <code class="cui-code">aria-required</code> are all applied to the editable surface itself
            (the element with <code class="cui-code">role="textbox"</code>), not the outer wrapper —
            so a <code class="cui-code">&lt;label for&gt;</code> resolves its accessible name
            correctly. One real limitation, found through actual browser testing rather than assumed:
            a native <code class="cui-code">&lt;label for&gt;</code> only auto-focuses "labelable"
            elements (input, textarea, select, button…) on click — a contenteditable surface isn't on
            that list, so clicking the label won't move focus into the editor in any browser. This is
            inherent to every contenteditable-based editor (ProseMirror, Slate, Lexical, TipTap
            included), not something this component's markup can opt out of.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>
  </CuiStack>
</template>
