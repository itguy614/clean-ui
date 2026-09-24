<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiFlex, CuiRadio, CuiRadioGroup, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/radio";

const selected = ref("option2");
const standalone = ref("a");
const color = ref("blue");
const shipping = ref("standard");
const yesNo = ref<boolean>(true);
const errorVal = ref("");
const errorYesNo = ref<string>("");
const btnSize = ref("md");
const btnAlign = ref("left");
const btnTheme = ref("system");

// Dynamic form simulation
const dynamicField = ref({
  name: "priority",
  label: "Priority Level",
  value: "medium",
  options: [
    { value: "low", label: "Low", description: "Non-urgent, handle when available" },
    { value: "medium", label: "Medium", description: "Standard priority, normal SLA" },
    { value: "high", label: "High", description: "Urgent, requires immediate attention" },
    { value: "critical", label: "Critical", description: "System down, all hands on deck" },
  ],
});
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiRadioGroup v-model=&quot;selected&quot; label=&quot;Choose an option&quot;>
  <CuiRadio value=&quot;option1&quot; label=&quot;Option 1&quot; />
  <CuiRadio value=&quot;option2&quot; label=&quot;Option 2&quot; />
  <CuiRadio value=&quot;option3&quot; label=&quot;Option 3&quot; />
</CuiRadioGroup>`"
      >
        <CuiStack spacing="2">
          <CuiRadioGroup v-model="selected" label="Choose an option">
            <CuiRadio value="option1" label="Option 1" />
            <CuiRadio value="option2" label="Option 2" />
            <CuiRadio value="option3" label="Option 3" />
          </CuiRadioGroup>
          <div class="text-sm text-surface-500">Selected: {{ selected }}</div>
        </CuiStack>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        <code>CuiRadioGroup</code> renders a <code>div[role="radiogroup"]</code>; each
        <code>CuiRadio</code> is a <code>&lt;label&gt;</code> carrying
        <code>role="radio"</code> and <code>tabindex="0"</code>, or a
        <code>&lt;button role="radio"&gt;</code> under <code>variant="buttons"</code>. The
        hidden native <code>&lt;input type="radio"&gt;</code> inside each one is
        <code>aria-hidden</code> and exists only so the group serializes with a native form
        post — that is what the group's <code>name</code> feeds.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          The group handles arrow keys: <kbd>↓</kbd>/<kbd>→</kbd> move to the next radio,
          <kbd>↑</kbd>/<kbd>←</kbd> to the previous, wrapping at both ends. Moving also
          selects, which is the expected behaviour for a radio group. Space and Enter select
          the focused radio.
        </li>
        <li>
          <code>aria-checked</code> tracks the selection, and the focus ring sits on the
          same root element that takes focus.
        </li>
        <li>
          <code>disabled</code> and <code>readonly</code> both set
          <code>aria-disabled</code> and block selection, and the arrow-key handler skips
          disabled radios.
        </li>
        <li>
          The hidden input carries <code>@click.stop.prevent</code>: a
          <code>&lt;label&gt;</code> forwards its click to the input it wraps, so without
          the guard each click would fire the handler twice.
        </li>
        <li>
          <code>error</code> sets <code>aria-invalid</code> on the group and wraps the
          options in a tinted bordered container, so the failure is not signalled by colour
          alone — the message below it carries the text.
        </li>
        <li>
          The group's <code>label</code> prop becomes <code>aria-label</code> and renders
          nothing. When the label is on screen, point <code>aria-labelledby</code> at it
          instead — <code>CuiFormField</code> does that for you.
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> Every radio has <code>tabindex="0"</code>, so
        <kbd>Tab</kbd> steps through each option in turn rather than entering the group once
        and moving on. In a long group, give the surrounding form fewer tab stops elsewhere,
        or prefer <code>variant="buttons"</code> where the segment count is small. The
        <code>id</code>, <code>aria-describedby</code> and <code>aria-labelledby</code> props
        land on the hidden <code>aria-hidden</code> input, so they do not reach the element
        carrying <code>role="radio"</code>; describe the choice on the group instead of the
        individual option.
      </p>
    </template>

    <template #examples>
      <!-- Auto Direction (≤2 = horizontal) -->
      <Example title="Auto Direction (≤2 options = horizontal)" :code="`<CuiRadioGroup v-model=&quot;yesNo&quot;>
  <CuiRadio :value=&quot;true&quot; label=&quot;Yes&quot; />
  <CuiRadio :value=&quot;false&quot; label=&quot;No&quot; />
</CuiRadioGroup>`">
        <CuiStack spacing="4">
          <div>
            <div class="mb-1 text-sm font-medium text-surface-600 dark:text-surface-400">Yes/No (2 options → horizontal)</div>
            <CuiRadioGroup v-model="yesNo" label="Agree?">
              <CuiRadio :value="true" label="Yes" />
              <CuiRadio :value="false" label="No" />
            </CuiRadioGroup>
          </div>
          <div>
            <div class="mb-1 text-sm font-medium text-surface-600 dark:text-surface-400">3+ options → vertical</div>
            <CuiRadioGroup v-model="color" label="Favorite color">
              <CuiRadio value="red" label="Red" />
              <CuiRadio value="green" label="Green" />
              <CuiRadio value="blue" label="Blue" />
            </CuiRadioGroup>
          </div>
        </CuiStack>
      </Example>

      <!-- Forced Direction -->
      <Example title="Forced Horizontal Direction" :code="`<CuiRadioGroup v-model=&quot;color&quot; orientation=&quot;horizontal&quot;>
  <CuiRadio value=&quot;red&quot; label=&quot;Red&quot; />
  <CuiRadio value=&quot;green&quot; label=&quot;Green&quot; />
  <CuiRadio value=&quot;blue&quot; label=&quot;Blue&quot; />
</CuiRadioGroup>`">
        <CuiRadioGroup v-model="color" orientation="horizontal" label="Favorite color">
          <CuiRadio value="red" label="Red" />
          <CuiRadio value="green" label="Green" />
          <CuiRadio value="blue" label="Blue" />
        </CuiRadioGroup>
      </Example>

      <!-- Colors -->
      <Example title="Color Roles" :code="`<CuiRadioGroup v-model=&quot;selected&quot; color=&quot;primary&quot; orientation=&quot;horizontal&quot;>
  <CuiRadio value=&quot;option1&quot; label=&quot;Primary A&quot; />
  <CuiRadio value=&quot;option2&quot; label=&quot;Primary B&quot; />
</CuiRadioGroup>`">
        <CuiStack spacing="3">
          <CuiRadioGroup v-model="selected" color="primary" orientation="horizontal" label="Primary">
            <CuiRadio value="option1" label="Primary A" />
            <CuiRadio value="option2" label="Primary B" />
          </CuiRadioGroup>
          <CuiRadioGroup v-model="selected" color="success" orientation="horizontal" label="Success">
            <CuiRadio value="option1" label="Success A" />
            <CuiRadio value="option2" label="Success B" />
          </CuiRadioGroup>
          <CuiRadioGroup v-model="selected" color="error" orientation="horizontal" label="Error">
            <CuiRadio value="option1" label="Error A" />
            <CuiRadio value="option2" label="Error B" />
          </CuiRadioGroup>
          <CuiRadioGroup v-model="selected" color="warning" orientation="horizontal" label="Warning">
            <CuiRadio value="option1" label="Warning A" />
            <CuiRadio value="option2" label="Warning B" />
          </CuiRadioGroup>
          <CuiRadioGroup v-model="selected" color="info" orientation="horizontal" label="Info">
            <CuiRadio value="option1" label="Info A" />
            <CuiRadio value="option2" label="Info B" />
          </CuiRadioGroup>
        </CuiStack>
      </Example>

      <!-- With Descriptions -->
      <Example title="With Descriptions" :code="`<CuiRadioGroup v-model=&quot;shipping&quot;>
  <CuiRadio value=&quot;standard&quot; label=&quot;Standard&quot;
    description=&quot;5-7 business days&quot; />
  <CuiRadio value=&quot;express&quot; label=&quot;Express&quot;
    description=&quot;1-2 business days&quot; />
</CuiRadioGroup>`">
        <CuiRadioGroup v-model="shipping" label="Shipping method">
          <CuiRadio value="standard" label="Standard Shipping" description="Arrives in 5-7 business days. Free for orders over $50." />
          <CuiRadio value="express" label="Express Shipping" description="Arrives in 1-2 business days. $12.99 flat rate." />
          <CuiRadio value="overnight" label="Overnight Shipping" description="Next business day delivery. $29.99 flat rate." />
        </CuiRadioGroup>
      </Example>

      <!-- Dynamic Form from JSON -->
      <Example title="Dynamic Form (JSON-driven)" :code="`<CuiRadioGroup
  v-model=&quot;field.value&quot;
  :name=&quot;field.name&quot;>
  <CuiRadio
    v-for=&quot;opt in field.options&quot;
    :key=&quot;opt.value&quot;
    :value=&quot;opt.value&quot;
    :label=&quot;opt.label&quot;
    :description=&quot;opt.description&quot; />
</CuiRadioGroup>`">
        <CuiStack spacing="2">
          <div class="text-sm font-medium">{{ dynamicField.label }}</div>
          <CuiRadioGroup v-model="dynamicField.value" :name="dynamicField.name" :label="dynamicField.label">
            <CuiRadio
              v-for="opt in dynamicField.options"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
              :description="opt.description"
            />
          </CuiRadioGroup>
          <div class="text-sm text-surface-500">Bound value: {{ dynamicField.value }}</div>
        </CuiStack>
      </Example>

      <!-- Disabled -->
      <Example title="Disabled State" :code="`<CuiRadioGroup v-model=&quot;selected&quot; disabled>
  <CuiRadio value=&quot;option1&quot; label=&quot;Can't select this&quot; />
  <CuiRadio value=&quot;option2&quot; label=&quot;Or this one&quot; />
</CuiRadioGroup>`">
        <CuiRadioGroup v-model="selected" disabled label="Disabled group">
          <CuiRadio value="option1" label="Can't select this" />
          <CuiRadio value="option2" label="Or this one" />
          <CuiRadio value="option3" label="Or this" />
        </CuiRadioGroup>
      </Example>

      <!-- Readonly -->
      <Example title="Readonly State" :code="`<CuiRadioGroup v-model=&quot;selected&quot; readonly>
  <CuiRadio value=&quot;option1&quot; label=&quot;Locked option 1&quot; />
  <CuiRadio value=&quot;option2&quot; label=&quot;Locked option 2 (selected)&quot; />
</CuiRadioGroup>`">
        <CuiRadioGroup v-model="selected" readonly label="Readonly group">
          <CuiRadio value="option1" label="Locked option 1" />
          <CuiRadio value="option2" label="Locked option 2 (selected)" />
          <CuiRadio value="option3" label="Locked option 3" />
        </CuiRadioGroup>
      </Example>

      <!-- Error Validation -->
      <Example title="Error Validation (3+ options)" :code="`<CuiRadioGroup
  v-model=&quot;plan&quot;
  error
  errorMessage=&quot;Please select a plan&quot;>
  ...
</CuiRadioGroup>`">
        <CuiStack spacing="3">
          <CuiRadioGroup
            v-model="errorVal"
            error
            error-message="Please select an option to continue"
            label="Required selection"
          >
            <CuiRadio value="a" label="Option A" />
            <CuiRadio value="b" label="Option B" />
            <CuiRadio value="c" label="Option C" />
          </CuiRadioGroup>
          <CuiButton size="sm" variant="solid" color="primary" @click="errorVal = 'a'">
            Fix: Select Option A
          </CuiButton>
        </CuiStack>
      </Example>

      <!-- Error Validation (2 options — horizontal) -->
      <Example title="Error Validation (2 options — horizontal)">
        <CuiStack spacing="3">
          <CuiRadioGroup
            v-model="errorYesNo"
            error
            error-message="You must agree or disagree to proceed"
            label="Terms acceptance"
          >
            <CuiRadio value="agree" label="I agree to the terms" />
            <CuiRadio value="disagree" label="I do not agree" />
          </CuiRadioGroup>
          <CuiButton size="sm" variant="solid" color="primary" @click="errorYesNo = 'agree'">
            Fix: Agree
          </CuiButton>
        </CuiStack>
      </Example>

      <!-- Button Variant -->
      <Example title="Button Variant" :code="`<CuiRadioGroup v-model=&quot;size&quot; variant=&quot;buttons&quot;>
  <CuiRadio value=&quot;sm&quot; label=&quot;Small&quot; />
  <CuiRadio value=&quot;md&quot; label=&quot;Medium&quot; />
  <CuiRadio value=&quot;lg&quot; label=&quot;Large&quot; />
</CuiRadioGroup>`">
        <CuiStack spacing="2">
          <div class="text-sm font-medium text-surface-600 dark:text-surface-400">Size selector:</div>
          <CuiRadioGroup v-model="btnSize" variant="buttons" label="Size">
            <CuiRadio value="xs" label="XS" />
            <CuiRadio value="sm" label="Small" />
            <CuiRadio value="md" label="Medium" />
            <CuiRadio value="lg" label="Large" />
            <CuiRadio value="xl" label="XL" />
          </CuiRadioGroup>
          <div class="text-sm text-surface-500">Selected: {{ btnSize }}</div>
        </CuiStack>
      </Example>

      <!-- Button Variant — Sizes -->
      <Example title="Button Variant — Sizes">
        <CuiStack spacing="3">
          <CuiRadioGroup v-model="btnAlign" variant="buttons" size="xs" label="XS">
            <CuiRadio value="left" label="Left" />
            <CuiRadio value="center" label="Center" />
            <CuiRadio value="right" label="Right" />
          </CuiRadioGroup>
          <CuiRadioGroup v-model="btnAlign" variant="buttons" size="sm" label="SM">
            <CuiRadio value="left" label="Left" />
            <CuiRadio value="center" label="Center" />
            <CuiRadio value="right" label="Right" />
          </CuiRadioGroup>
          <CuiRadioGroup v-model="btnAlign" variant="buttons" size="md" label="MD">
            <CuiRadio value="left" label="Left" />
            <CuiRadio value="center" label="Center" />
            <CuiRadio value="right" label="Right" />
          </CuiRadioGroup>
          <CuiRadioGroup v-model="btnAlign" variant="buttons" size="lg" label="LG">
            <CuiRadio value="left" label="Left" />
            <CuiRadio value="center" label="Center" />
            <CuiRadio value="right" label="Right" />
          </CuiRadioGroup>
        </CuiStack>
      </Example>

      <!-- Button Variant — Colors -->
      <Example title="Button Variant — Colors">
        <CuiStack spacing="3">
          <CuiRadioGroup v-model="btnTheme" variant="buttons" color="primary" label="Primary">
            <CuiRadio value="light" label="Light" />
            <CuiRadio value="dark" label="Dark" />
            <CuiRadio value="system" label="System" />
          </CuiRadioGroup>
          <CuiRadioGroup v-model="btnTheme" variant="buttons" color="success" label="Success">
            <CuiRadio value="light" label="Light" />
            <CuiRadio value="dark" label="Dark" />
            <CuiRadio value="system" label="System" />
          </CuiRadioGroup>
          <CuiRadioGroup v-model="btnTheme" variant="buttons" color="error" label="Error">
            <CuiRadio value="light" label="Light" />
            <CuiRadio value="dark" label="Dark" />
            <CuiRadio value="system" label="System" />
          </CuiRadioGroup>
        </CuiStack>
      </Example>

      <!-- Button Variant — Disabled -->
      <Example title="Button Variant — Disabled">
        <CuiRadioGroup v-model="btnSize" variant="buttons" disabled label="Disabled">
          <CuiRadio value="sm" label="Small" />
          <CuiRadio value="md" label="Medium" />
          <CuiRadio value="lg" label="Large" />
        </CuiRadioGroup>
      </Example>

      <!-- Standalone (no group) -->
      <Example title="Standalone (no group)" :code="`<CuiRadio v-model=&quot;standalone&quot; value=&quot;a&quot; name=&quot;standalone&quot; label=&quot;Choice A&quot; />
<CuiRadio v-model=&quot;standalone&quot; value=&quot;b&quot; name=&quot;standalone&quot; label=&quot;Choice B&quot; />`">
        <CuiFlex gap="4">
          <CuiRadio v-model="standalone" value="a" name="standalone" label="Choice A" />
          <CuiRadio v-model="standalone" value="b" name="standalone" label="Choice B" />
        </CuiFlex>
      </Example>
    </template>
  </DocPage>
</template>
