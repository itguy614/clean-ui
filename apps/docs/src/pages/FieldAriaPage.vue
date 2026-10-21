<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
  CuiStack,
  CuiCard,
  CuiCardBody,
  CuiFlex,
  CuiToggle,
  useFieldDescribedBy,
  type DescribableProps,
} from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import PropTable, { type PropRow } from "../components/PropTable.vue";

// The demo control's props: reactive, as a component's props object would be.
const error = ref(false);
const hasMessage = ref(true);
const hasHelp = ref(true);
const hasOwnId = ref(true);
const value = ref("not-an-email");
const helpId = "field-aria-demo-help";

const demo: DescribableProps = reactive({
  id: computed(() => (hasOwnId.value ? "field-aria-demo" : undefined)),
  ariaDescribedby: computed(() => (hasHelp.value ? helpId : undefined)),
  error,
  errorMessage: computed(() => (hasMessage.value ? "Enter an address like name@example.com." : undefined)),
});

const { errorId, describedBy } = useFieldDescribedBy(demo);
// The input needs an id for its <label> either way; the composable only derives the error's.
const inputId = computed(() => demo.id ?? "field-aria-demo-input");

const code = `<!-- MyEmailField.vue -->
<script setup lang="ts">
import { computed, useId } from "vue";
import { useFieldDescribedBy, type DescribableProps } from "@itguy614/clean-ui";

interface Props extends DescribableProps {
  label: string;
}
const props = defineProps<Props>();
const model = defineModel<string>();

const { errorId, describedBy } = useFieldDescribedBy(props);
// The composable only derives the error's id; the input needs one for its label either way.
const fallbackId = useId();
const inputId = computed(() => props.id ?? fallbackId);
<\/script>

<template>
  <div class="my-email-field">
    <label :for="inputId">{{ label }}</label>
    <input
      :id="inputId"
      v-model="model"
      type="email"
      :aria-invalid="error || undefined"
      :aria-describedby="describedBy"
    />
    <div v-if="error && errorMessage" :id="errorId" class="my-email-field__error cui-field-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<!-- usage: the caller owns the help text and passes its id -->
<p id="email-help">We only use this for receipts.</p>
<MyEmailField
  id="email"
  label="Email"
  aria-describedby="email-help"
  :error="invalid"
  error-message="Enter an address like name@example.com."
/>`;

const params: PropRow[] = [
  {
    name: "props.id",
    type: "string",
    description: "The control's own id. The error message's id is derived from it; without it, a generated cui-field-… id is used.",
  },
  {
    name: "props.ariaDescribedby",
    type: "string",
    description: "Ids the caller wants read as descriptions (help text, hints). Space-separated, passed through first.",
  },
  { name: "props.error", type: "boolean", description: "Whether the control is in its error state." },
  {
    name: "props.errorMessage",
    type: "string",
    description: "The message shown in the error state. Its id joins aria-describedby only when error is true and this is non-empty.",
  },
];

const returns: PropRow[] = [
  {
    name: "errorId",
    type: "ComputedRef<string>",
    description: "The id to put on the error message element: `${id}-error`, or `${generated id}-error` when there is no id.",
  },
  {
    name: "describedBy",
    type: "ComputedRef<string | undefined>",
    description:
      "The value for aria-describedby on the focusable element: the caller's ids, then errorId while an error message is showing. undefined when there is neither, so the attribute is left off.",
  },
];
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Field ARIA</h1>
      <p class="cui-lead">
        <code class="cui-code">useFieldDescribedBy()</code> links a form control to its error message
        through <code class="cui-code">aria-describedby</code>, keeping any descriptions the caller
        passed in.
      </p>
      <p>
        A control that sets <code class="cui-code">aria-invalid</code> and shows an error message that
        nothing references tells a screen-reader user that something is wrong, but never what. The fix is
        the same in every control — give the message an id, and add it to the control's
        <code class="cui-code">aria-describedby</code> after the caller's own ids — so clean-ui's inputs,
        selects, comboboxes and groups all get it from this one composable. It is public so that controls
        built outside the library (clean-ui's markdown editor among them) can follow the same rule.
      </p>
    </div>

    <Example title="A custom control" :code="code">
      <CuiStack spacing="4">
        <CuiFlex gap="4" wrap="wrap">
          <CuiToggle v-model="error" label="Error" />
          <CuiToggle v-model="hasMessage" label="Error message" />
          <CuiToggle v-model="hasHelp" label="Caller's help text" />
          <CuiToggle v-model="hasOwnId" label="Own id" />
        </CuiFlex>

        <div class="field-aria-demo">
          <label :for="inputId" style="font-weight: 600">Email</label>
          <p v-if="hasHelp" :id="helpId" style="margin: 0; color: var(--cui-text-secondary)">
            We only use this for receipts.
          </p>
          <input
            :id="inputId"
            v-model="value"
            type="email"
            class="field-aria-demo__input"
            :class="{ 'field-aria-demo__input--error': error }"
            :aria-invalid="error || undefined"
            :aria-describedby="describedBy"
          />
          <div v-if="demo.error && demo.errorMessage" :id="errorId" style="color: var(--cui-error)">
            {{ demo.errorMessage }}
          </div>
        </div>

        <CuiCard variant="outline">
          <CuiCardBody>
            <pre class="cui-pre" style="margin: 0"><code class="cui-code">&lt;input
  id="{{ inputId }}"
  aria-invalid="{{ error ? "true" : "(absent)" }}"
  aria-describedby="{{ describedBy ?? "(absent)" }}"
/&gt;
errorId = "{{ errorId }}"</code></pre>
          </CuiCardBody>
        </CuiCard>
      </CuiStack>
    </Example>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Try:</strong></p>
        <ul>
          <li>Turn on <em>Error</em>: <code class="cui-code">aria-describedby</code> becomes the help text's id <em>then</em> the error's — the caller's general description is read first.</li>
          <li>Turn off <em>Error message</em> while <em>Error</em> is on: the error id drops out. A reference to an element that isn't rendered would be a dangling one.</li>
          <li>Turn off <em>Caller's help text</em>: only the error id remains, and with no error the attribute disappears entirely.</li>
          <li>Turn off <em>Own id</em>: <code class="cui-code">errorId</code> falls back to a generated <code class="cui-code">cui-field-…-error</code>, stable across re-renders and identical between server render and hydration.</li>
          <li>With a screen reader, focus the input while it is in error: the help text and then the message are announced.</li>
        </ul>
      </CuiCardBody>
    </CuiCard>

    <div>
      <h2>API</h2>
      <p>
        <code class="cui-code">useFieldDescribedBy(props: DescribableProps)</code> — pass the component's
        props object itself (or another reactive object) so the results stay live. Call it in
        <code class="cui-code">setup</code>: the fallback id comes from <code class="cui-code">useCuiId()</code>.
      </p>
      <p>
        <code class="cui-code">DescribableProps</code> is exported as a type with the four optional fields
        below; extend it in your control's props interface.
      </p>
      <PropTable :props="params" />
      <h3>Returns</h3>
      <PropTable :props="returns" />
      <p>
        Bind <code class="cui-code">describedBy</code> on the element that receives focus — the native
        <code class="cui-code">&lt;input&gt;</code>, or a group's <code class="cui-code">role="group"</code>
        container — not on a wrapper. The composable does not render or id the caller's description: an
        element the caller owns is the caller's to id, and it arrives in
        <code class="cui-code">ariaDescribedby</code>.
      </p>
    </div>

    <div>
      <h2>When to use it</h2>
      <ul>
        <li>Building your own form control — a rich editor, a custom picker — that shows an error message and should behave like clean-ui's own.</li>
        <li>Not needed when you wrap an existing clean-ui control: CuiInput, CuiSelect, CuiTextarea, CuiCombobox, CuiTagInput and the radio, checkbox and toggle groups already wire their error messages this way.</li>
      </ul>
    </div>
  </CuiStack>
</template>

<style scoped>
.field-aria-demo {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-width: 22rem;
}
.field-aria-demo__input {
  font: inherit;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--cui-border-strong);
  border-radius: var(--cui-radius-md, 0.375rem);
  background: var(--cui-surface-base);
  color: var(--cui-text-body);
}
.field-aria-demo__input:focus-visible {
  outline: 2px solid var(--cui-primary-focus-ring);
  outline-offset: 2px;
}
.field-aria-demo__input--error {
  border-color: var(--cui-error);
}
</style>
