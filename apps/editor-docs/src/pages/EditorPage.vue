<script setup lang="ts">
import { ref, computed } from "vue";
import {
  CuiCard,
  CuiCardHeader,
  CuiCardBody,
  CuiStack,
  CuiTextarea,
  CuiForm,
  CuiFormField,
  CuiButtonGroup,
  CuiButton,
} from "@itguy614/clean-ui";
import { CuiMarkdownEditor, DEFAULT_PLUGINS, type CuiMarkdownEditorMode } from "@itguy614/clean-ui-editor";
import PropTable from "../components/PropTable.vue";
import EventTable from "../components/EventTable.vue";
import Example from "../components/Example.vue";

const basicDoc = ref("# Hello\n\nEdit **this** document.");

const controlledMode = ref<CuiMarkdownEditorMode>("wysiwyg");

const formValues = ref<{ bio: string; notes: string }>({ bio: "", notes: "" });
function formResolver(values: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  if (!String(values.bio ?? "").trim()) errors.bio = "Bio is required";
  if (!String(values.notes ?? "").trim()) errors.notes = "Notes are required";
  return errors;
}
const formResult = ref("(submit to validate both fields identically)");
function onSubmit() {
  formResult.value = "✅ Both fields passed the same resolver";
}
function onInvalid() {
  formResult.value = "❌ Both fields show the identical error treatment below";
}

const limitedDoc = ref("Short updates only.");

const customToolbarDoc = ref("**Bold**, *italic* and [links](https://example.com) only.");

const noItalicPlugins = computed(() => DEFAULT_PLUGINS.filter((p) => p.id !== "cui-italic"));
const excludedDoc = ref("Type _italic_ or *italic* here — it stays literal, unstyled text.");
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">CuiMarkdownEditor</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        The full public API — every prop, event, slot, exposed method and built-in command id — plus
        live, interactive examples of each of this component's distinguishing behaviors.
      </p>
    </div>

    <Example title="Default" :code="`&lt;CuiMarkdownEditor v-model=&quot;doc&quot; /&gt;`">
      <CuiMarkdownEditor v-model="basicDoc" />
    </Example>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'modelValue', type: 'string', default: '(empty)', description: 'The markdown document (v-model).' },
          { name: 'mode', type: 'wysiwyg | source', default: 'wysiwyg', description: 'wysiwyg hides syntax markers away from the cursor; source shows raw markdown. v-model:mode.' },
          { name: 'placeholder', type: 'string', description: 'Shown only when the document is empty; not selectable, never part of the value.' },
          { name: 'throttle', type: 'number', default: '0', description: 'Minimum ms between update:modelValue emissions. 0 emits on every change.' },
          { name: 'id', type: 'string', description: 'Applied to the editable surface itself, not the outer wrapper — a <label for> pointing at it actually focuses the editor.' },
          { name: 'error', type: 'boolean', default: 'false', description: 'Recolors the border to --cui-error and sets aria-invalid, matching CuiInput/CuiTextarea.' },
          { name: 'errorMessage', type: 'string', description: 'Shown below the editor when error is true.' },
          { name: 'required', type: 'boolean', default: 'false', description: 'Sets aria-required on the editable surface. Presentational only — CuiForm validates through a resolver, not native required validation.' },
          { name: 'maxLength', type: 'number', description: 'Counts markdown source characters. Refuses (never truncates) an edit or paste that would exceed it — truncating markdown can split a link or leave a fence open.' },
          { name: 'cspNonce', type: 'string', description: 'Applied when the view is constructed. Falls back to a meta[name=csp-nonce] tag. See the Integration guide.' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Removes the editor from the tab order entirely.' },
          { name: 'readonly', type: 'boolean', default: 'false', description: 'Allows selection and focus but blocks edits.' },
          { name: 'showModeToggle', type: 'boolean', default: 'true', description: 'Renders the built-in Formatted/Source toggle. Set false to drive mode yourself.' },
          { name: 'plugins', type: 'CuiEditorPlugin[]', default: 'DEFAULT_PLUGINS', description: 'Declarative extensions. Create instances once at module scope, never inline in a template.' },
          { name: 'toolbar', type: 'string[]', description: 'Subsets and orders the toolbar by command id. Omit for the full set the active plugins collect.' },
          { name: 'showToolbar', type: 'boolean', default: 'true', description: 'Renders the plugin-command toolbar. Set false to omit it, e.g. when replacing it via #toolbar.' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Events</h2>
      <EventTable
        :events="[
          { name: 'update:modelValue', payload: 'value: string', description: 'The v-model update.' },
          { name: 'update:mode', payload: 'mode: wysiwyg | source', description: 'Fired when the built-in toggle (or a plugin command) requests a mode change — v-model:mode syncs it.' },
          { name: 'pluginError', payload: '{ pluginId, commandId, error }', description: 'A registered command or isActive query threw. Editing continues; nothing propagates uncaught.' },
          { name: 'pluginConfigError', payload: 'message: string', description: 'The plugins prop changed to an invalid configuration — the previous configuration is kept, and this names why.' },
          { name: 'pasteRejected', payload: 'message: string', description: 'A pasted image file was refused (no upload affordance in v1) — nothing was inserted.' },
          { name: 'maxLengthExceeded', payload: 'message: string', description: 'An edit or paste was refused for exceeding maxLength; message names the overage for a paste specifically.' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Slots</h2>
      <PropTable
        :props="[
          { name: '#toolbar', type: '{ registry, runCommand, isCommandActive }', description: 'Replaces the entire default toolbar. Combine with showToolbar or the toolbar prop for a lighter customization.' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Exposed methods (template ref)</h2>
      <PropTable
        :props="[
          { name: 'el', type: 'Ref<HTMLElement>', description: 'The root element.' },
          { name: 'focus()', type: '() => void', description: 'Focuses the editable surface.' },
          { name: 'blur()', type: '() => void', description: 'Blurs the editable surface.' },
          { name: 'getView()', type: '() => EditorView | null', description: 'The raw CodeMirror view — reach for this only for what the declarative API doesn\'t cover.' },
          { name: 'runCommand(id, ...args)', type: '(string, ...unknown[]) => boolean', description: 'Runs a registered command by id through the same guarded path the toolbar itself uses.' },
          { name: 'isCommandActive(id)', type: '(string) => boolean', description: 'Whether a command reports itself as active for the current selection.' },
          { name: 'getSelection()', type: '() => EditorSelectionRange | null', description: 'The current selection range.' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Built-in commands</h2>
      <p class="mb-4 text-sm" style="color: var(--cui-text-secondary);">
        Every one of these is an ordinary plugin registered through the same public API a consumer
        plugin uses — see the <router-link to="/guides/plugins" style="color: var(--cui-primary);">Plugin
        Authoring guide</router-link>. Each appears in the toolbar and the slash menu (type
        <code class="cui-code">/</code>) automatically.
      </p>
      <PropTable
        :props="[
          { name: 'bold', type: 'Mod-b', description: 'Toggle **bold**.' },
          { name: 'italic', type: 'Mod-i', description: 'Toggle *italic*.' },
          { name: 'strikethrough', type: 'Mod-Shift-x', description: 'Toggle ~~strikethrough~~ (GFM).' },
          { name: 'inlineCode', type: 'Mod-e', description: 'Toggle `inline code`.' },
          { name: 'heading1 / heading2 / heading3', type: 'Mod-Alt-1/2/3', description: 'Set the current line\'s heading level; re-applying the same level clears it.' },
          { name: 'blockquote', type: 'Mod-Shift-.', description: 'Toggle a blockquote on the current line(s).' },
          { name: 'bulletedList', type: 'Mod-Shift-8', description: 'Toggle a bulleted list.' },
          { name: 'numberedList', type: 'Mod-Shift-7', description: 'Toggle a numbered list.' },
          { name: 'taskList', type: '(none)', description: 'Toggle a GFM task list (- [ ]).' },
          { name: 'codeFence', type: '(none)', description: 'Wrap the selection in a fenced code block.' },
          { name: 'horizontalRule', type: '(none)', description: 'Insert a horizontal rule.' },
          { name: 'link', type: 'Mod-k', description: 'Open the link dialog (FR14) — a URL-looking selection pre-fills the URL field.' },
          { name: 'image', type: '(none)', description: 'Open the image dialog — inserted by URL only in v1.' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">
        <Example
          title="Mode switching"
          :code="`&lt;CuiMarkdownEditor v-model=&quot;doc&quot; v-model:mode=&quot;mode&quot; /&gt;
&lt;p&gt;Current mode: {{ mode }}&lt;/p&gt;`"
        >
          <CuiStack spacing="2">
            <CuiMarkdownEditor v-model="basicDoc" v-model:mode="controlledMode" />
            <p class="text-sm" style="color: var(--cui-text-secondary);">Current mode: <code class="cui-code">{{ controlledMode }}</code></p>
          </CuiStack>
        </Example>

        <Example
          title="Form integration — parity with a sibling CuiTextarea"
          :code="`&lt;CuiForm :resolver=&quot;formResolver&quot; v-model=&quot;formValues&quot; @submit=&quot;onSubmit&quot; @submit-invalid=&quot;onInvalid&quot;&gt;
  &lt;CuiFormField name=&quot;bio&quot; label=&quot;Bio&quot; required v-slot=&quot;f&quot;&gt;
    &lt;CuiTextarea v-bind=&quot;f&quot; /&gt;
  &lt;/CuiFormField&gt;
  &lt;CuiFormField name=&quot;notes&quot; label=&quot;Notes&quot; required v-slot=&quot;f&quot;&gt;
    &lt;CuiMarkdownEditor v-bind=&quot;f&quot; /&gt;
  &lt;/CuiFormField&gt;
  &lt;CuiButton type=&quot;submit&quot;&gt;Submit&lt;/CuiButton&gt;
&lt;/CuiForm&gt;`"
        >
          <CuiForm :resolver="formResolver" v-model="formValues" @submit="onSubmit" @submit-invalid="onInvalid">
            <CuiStack spacing="4">
              <CuiFormField name="bio" label="Bio" required help-text="Plain text field, for comparison" v-slot="f">
                <CuiTextarea v-bind="f" placeholder="Tell us about yourself" />
              </CuiFormField>
              <CuiFormField name="notes" label="Notes" required help-text="Same label, error and required treatment as Bio above" v-slot="f">
                <CuiMarkdownEditor v-bind="f" placeholder="Write some markdown" />
              </CuiFormField>
              <CuiButton type="submit">Submit (leave both empty to see identical errors)</CuiButton>
              <p class="text-sm" style="color: var(--cui-text-secondary);">{{ formResult }}</p>
            </CuiStack>
          </CuiForm>
        </Example>

        <Example
          title="Length-limited"
          :code="`&lt;CuiMarkdownEditor v-model=&quot;doc&quot; :max-length=&quot;280&quot; /&gt;`"
        >
          <CuiStack spacing="2">
            <CuiMarkdownEditor v-model="limitedDoc" :max-length="280" />
            <p class="text-sm" style="color: var(--cui-text-secondary);">
              Try typing past the limit, or pasting a long block of text — the edit is refused, not
              truncated. A regular paste that fits still works normally.
            </p>
          </CuiStack>
        </Example>

        <Example
          title="Custom toolbar subset"
          :code="`&lt;CuiMarkdownEditor v-model=&quot;doc&quot; :toolbar=&quot;['bold', 'italic', 'link']&quot; /&gt;`"
        >
          <CuiMarkdownEditor v-model="customToolbarDoc" :toolbar="['bold', 'italic', 'link']" />
        </Example>

        <Example
          title="Construct excluded — italic is unavailable everywhere, not just hidden from the toolbar"
          :code="`const plugins = DEFAULT_PLUGINS.filter((p) => p.id !== &quot;cui-italic&quot;);
&lt;CuiMarkdownEditor v-model=&quot;doc&quot; :plugins=&quot;plugins&quot; /&gt;`"
        >
          <CuiStack spacing="2">
            <CuiMarkdownEditor v-model="excludedDoc" :plugins="noItalicPlugins" />
            <p class="text-sm" style="color: var(--cui-text-secondary);">
              No italic button, no <code class="cui-code">Mod-I</code>, no slash-menu entry — and both
              <code class="cui-code">_underscore_</code> and <code class="cui-code">*asterisk*</code>
              italic syntax stay literal, unstyled characters rather than being revealed/hidden as a
              construct. Pasting HTML containing <code class="cui-code">&lt;em&gt;</code> degrades to
              plain text too (FR27/FR28).
            </p>
          </CuiStack>
        </Example>
      </CuiStack>
    </div>

    <CuiCard variant="outline">
      <CuiCardHeader title="Next" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          <router-link to="/guides/plugins" style="color: var(--cui-primary);">Plugin Authoring</router-link> —
          write your own commands, toolbar entries and paste rules.
          <router-link to="/guides/integration" style="color: var(--cui-primary);">Integration &amp; Testing</router-link> —
          CSP, SSR, the render adapter, and the jsdom-safe test contract.
          <router-link to="/guides/accessibility" style="color: var(--cui-primary);">Accessibility &amp; Mobile</router-link> —
          keyboard shortcuts, screen-reader behavior, and touch.
        </p>
      </CuiCardBody>
    </CuiCard>
  </CuiStack>
</template>
