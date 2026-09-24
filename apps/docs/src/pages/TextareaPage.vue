<script setup lang="ts">
import { ref } from "vue";
import { CuiStack, CuiTextarea } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/textarea";

const text = ref("");
const bio = ref("I'm a software developer who enjoys building component libraries.");
const feedback = ref("");
const notes = ref("");
const errorVal = ref("");
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiTextarea v-model=&quot;text&quot; placeholder=&quot;Write something...&quot; />`"
      >
        <CuiStack spacing="2" class="max-w-lg">
          <CuiTextarea v-model="text" placeholder="Write something..." />
          <div class="text-sm text-surface-500">Value length: {{ text.length }}</div>
        </CuiStack>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The focusable element is a real <code>&lt;textarea&gt;</code>, so the caret, text
        selection, spellcheck and the native resize handle all work as the platform
        provides them. The border and focus ring are drawn on the wrapper via
        <code>:focus-within</code>, which is why the textarea itself sets
        <code>outline: none</code>.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <code>error</code> sets <code>aria-invalid</code> on the native textarea and
          recolors the border. Exceeding <code>maxLength</code> does the same, so the
          over-limit state is not signalled by the counter's colour alone.
        </li>
        <li>
          <code>id</code>, <code>name</code>, <code>autocomplete</code>,
          <code>aria-describedby</code> and <code>aria-labelledby</code> are declared props
          rather than fall-through attributes, so they land on the native textarea and a
          <code>&lt;label for&gt;</code> pointing at <code>id</code> forms a real
          association.
        </li>
        <li>
          There is no <code>label</code> prop. Wrap the textarea in
          <code>CuiFormField</code>, which supplies <code>id</code>,
          <code>aria-labelledby</code> and <code>aria-describedby</code> through
          <code>v-bind="f"</code>.
        </li>
        <li>
          <code>autoResize</code> only changes the box's height. It never moves focus or
          rewrites the value, so it does not disturb a screen reader mid-edit.
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> The character counter is plain text with no
        <code>id</code> and no live region, so a screen reader is not told how much room is
        left as you type, and the error message is not wired to
        <code>aria-describedby</code> either. Point <code>aria-describedby</code> at a limit
        note of your own, or use <code>CuiFormField</code>'s help text, when the limit is
        something the reader has to know before they start writing.
      </p>
    </template>

    <template #examples>
      <!-- Rows -->
      <Example title="Custom Row Count" :code="`<CuiTextarea placeholder=&quot;2 rows&quot; :rows=&quot;2&quot; />
<CuiTextarea placeholder=&quot;5 rows&quot; :rows=&quot;5&quot; />`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiTextarea placeholder="2 rows" :rows="2" />
          <CuiTextarea placeholder="5 rows" :rows="5" />
          <CuiTextarea placeholder="8 rows" :rows="8" />
        </CuiStack>
      </Example>

      <!-- Auto Resize -->
      <Example title="Auto Resize" :code="`<CuiTextarea v-model=&quot;bio&quot; auto-resize :max-rows=&quot;8&quot; />`">
        <CuiStack spacing="3" class="max-w-lg">
          <div>
            <div class="mb-1 text-sm font-medium">Grows with content (no max):</div>
            <CuiTextarea v-model="bio" auto-resize placeholder="Type to see it grow..." />
          </div>
          <div>
            <div class="mb-1 text-sm font-medium">Grows up to 6 rows, then scrolls:</div>
            <CuiTextarea v-model="bio" auto-resize :max-rows="6" placeholder="Type to see it grow..." />
          </div>
        </CuiStack>
      </Example>

      <!-- Character Counter -->
      <Example title="Character Counter" :code="`<CuiTextarea v-model=&quot;feedback&quot; :max-length=&quot;200&quot; />`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiTextarea
            v-model="feedback"
            :max-length="200"
            placeholder="Share your feedback (max 200 characters)..."
            auto-resize
          />
          <CuiTextarea
            v-model="notes"
            :max-length="50"
            placeholder="Short note (max 50)..."
            :rows="2"
          />
        </CuiStack>
      </Example>

      <!-- Sizes -->
      <Example title="Sizes" :code="`<CuiTextarea placeholder=&quot;Extra small&quot; size=&quot;xs&quot; />
<CuiTextarea placeholder=&quot;Small&quot; size=&quot;sm&quot; />
<CuiTextarea placeholder=&quot;Medium (default)&quot; size=&quot;md&quot; />
<CuiTextarea placeholder=&quot;Large&quot; size=&quot;lg&quot; />
<CuiTextarea placeholder=&quot;Extra large&quot; size=&quot;xl&quot; />`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiTextarea placeholder="Extra small" size="xs" :rows="2" />
          <CuiTextarea placeholder="Small" size="sm" :rows="2" />
          <CuiTextarea placeholder="Medium (default)" size="md" :rows="2" />
          <CuiTextarea placeholder="Large" size="lg" :rows="2" />
          <CuiTextarea placeholder="Extra large" size="xl" :rows="2" />
        </CuiStack>
      </Example>

      <!-- Rounded -->
      <Example title="Rounded" :code="`<CuiTextarea rounded=&quot;none&quot; placeholder=&quot;Square&quot; />
<CuiTextarea rounded=&quot;lg&quot; placeholder=&quot;Large radius&quot; />`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiTextarea rounded="none" placeholder="Square (none)" :rows="2" />
          <CuiTextarea rounded="lg" placeholder="Large radius" :rows="2" />
        </CuiStack>
      </Example>

      <!-- Focus Colors -->
      <Example title="Focus Colors (click to see)" :code="`<CuiTextarea placeholder=&quot;Primary focus&quot; color=&quot;primary&quot; />
<CuiTextarea placeholder=&quot;Success focus&quot; color=&quot;success&quot; />
<CuiTextarea placeholder=&quot;Error focus&quot; color=&quot;error&quot; />
<CuiTextarea placeholder=&quot;Info focus&quot; color=&quot;info&quot; />`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiTextarea placeholder="Primary focus" color="primary" :rows="2" />
          <CuiTextarea placeholder="Success focus" color="success" :rows="2" />
          <CuiTextarea placeholder="Error focus" color="error" :rows="2" />
          <CuiTextarea placeholder="Info focus" color="info" :rows="2" />
        </CuiStack>
      </Example>

      <!-- Error Validation -->
      <Example title="Error Validation" :code="`<CuiTextarea v-model=&quot;errorVal&quot; error error-message=&quot;Please provide a description&quot; />`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiTextarea
            v-model="errorVal"
            error
            error-message="Please provide a description"
            placeholder="Required field..."
          />
          <CuiTextarea
            v-model="errorVal"
            error
            error-message="Description must be at least 20 characters"
            :max-length="500"
            placeholder="Too short..."
          />
        </CuiStack>
      </Example>

      <!-- Disabled / Readonly -->
      <Example title="Disabled &amp; Readonly" :code="`<CuiTextarea model-value=&quot;This textarea is disabled&quot; disabled />
<CuiTextarea model-value=&quot;This textarea is read-only.&quot; readonly />`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiTextarea model-value="This textarea is disabled" disabled />
          <CuiTextarea model-value="This textarea is read-only. You can select and copy the text but cannot edit it." readonly />
        </CuiStack>
      </Example>

      <!-- Real-world: Bio editor -->
      <Example title="Real-World: Profile Bio">
        <div class="max-w-lg">
          <div class="mb-1 text-sm font-medium">Bio</div>
          <CuiTextarea
            v-model="bio"
            auto-resize
            :max-rows="10"
            :max-length="500"
            placeholder="Tell us about yourself..."
            color="primary"
          />
        </div>
      </Example>
    </template>
  </DocPage>
</template>
