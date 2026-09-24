<script setup lang="ts">
import { ref, computed } from "vue";
import { CuiButton, CuiCheckbox, CuiCheckboxGroup, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/checkbox";

const agree = ref(false);
const toppings = ref<string[]>(["cheese"]);
const permissions = ref<string[]>(["read"]);
const errorVal = ref<string[]>([]);
const errorTwo = ref<string[]>([]);

// Select-all / indeterminate demo
const allFruits = ["apple", "banana", "cherry", "date"];
const selectedFruits = ref<string[]>(["apple", "cherry"]);
const allChecked = computed(() => selectedFruits.value.length === allFruits.length);
const someChecked = computed(() => selectedFruits.value.length > 0 && !allChecked.value);

function toggleAll() {
  if (allChecked.value) {
    selectedFruits.value = [];
  } else {
    selectedFruits.value = [...allFruits];
  }
}

// Dynamic form
const dynamicField = ref({
  name: "features",
  label: "Desired Features",
  value: ["dark-mode"] as string[],
  options: [
    { value: "dark-mode", label: "Dark Mode", description: "Toggle between light and dark themes" },
    { value: "i18n", label: "Internationalization", description: "Multi-language support" },
    { value: "a11y", label: "Accessibility", description: "WCAG AA compliance" },
    { value: "ssr", label: "SSR Support", description: "Server-side rendering" },
  ],
});
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<!-- group mode: v-model is an array, each child carries a value -->
<CuiCheckboxGroup v-model=&quot;toppings&quot; label=&quot;Pizza toppings&quot;>
  <CuiCheckbox value=&quot;cheese&quot; label=&quot;Cheese&quot; />
  <CuiCheckbox value=&quot;pepperoni&quot; label=&quot;Pepperoni&quot; />
  <CuiCheckbox value=&quot;mushrooms&quot; label=&quot;Mushrooms&quot; />
</CuiCheckboxGroup>

<!-- standalone: v-model is a boolean, no value prop -->
<CuiCheckbox v-model=&quot;agree&quot; label=&quot;I agree to the terms&quot; />`"
      >
        <CuiStack spacing="4">
          <CuiCheckboxGroup v-model="toppings" label="Pizza toppings">
            <CuiCheckbox value="cheese" label="Cheese" />
            <CuiCheckbox value="pepperoni" label="Pepperoni" />
            <CuiCheckbox value="mushrooms" label="Mushrooms" />
          </CuiCheckboxGroup>
          <CuiCheckbox v-model="agree" label="I agree to the terms and conditions" />
          <div class="text-sm text-surface-500">
            Group: {{ toppings.join(", ") || "none" }} · Standalone: {{ agree }}
          </div>
        </CuiStack>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The root is a <code>&lt;label&gt;</code> carrying <code>role="checkbox"</code> and
        <code>tabindex="0"</code>; the real <code>&lt;input type="checkbox"&gt;</code> inside it
        is hidden from assistive technology and exists only so the value serializes with a
        native form post. Everything a screen reader sees comes from the root.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <code>aria-checked</code> tracks the value, and becomes <code>"mixed"</code> when
          <code>indeterminate</code> is set and the box is not itself checked.
        </li>
        <li>
          Space and Enter both toggle. The focus ring is on the root, which is why
          <code>--cui-&#123;color&#125;-focus-ring</code> is set there rather than on the
          indicator box.
        </li>
        <li>
          <code>disabled</code> and <code>readonly</code> both set
          <code>aria-disabled</code> and block the toggle; only <code>disabled</code> drops
          the checkbox out of the tab order.
        </li>
        <li>
          The hidden input carries <code>@click.stop.prevent</code>. A
          <code>&lt;label&gt;</code> forwards its own click to the input it wraps, so without
          that guard every click would toggle twice and land back where it started.
        </li>
        <li>
          <code>CuiCheckboxGroup</code> is a <code>div[role="group"]</code> with
          <code>aria-invalid</code> when <code>error</code> is set. Its <code>label</code>
          prop becomes <code>aria-label</code> and renders nothing — a group has no single
          labelable control for a <code>&lt;label for&gt;</code> to point at, so name it with
          <code>aria-labelledby</code> (what <code>CuiFormField</code> passes) when the label
          is also on screen.
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> <code>id</code>, <code>aria-describedby</code> and
        <code>aria-labelledby</code> land on the hidden input, which is
        <code>aria-hidden</code> — so they do not reach the element that carries
        <code>role="checkbox"</code>. Put describing text where it can be read instead: a
        <code>description</code>, or <code>CuiFormField</code>'s help text next to the group
        rather than the individual box. The label and the description are both inside the
        root, so a screen reader reads them as one accessible name; keep descriptions short
        for that reason.
      </p>
    </template>

    <template #examples>
      <!-- Indeterminate / Select All -->
      <Example title="Indeterminate (Select All)" :code="`<CuiCheckbox :indeterminate=&quot;someChecked&quot; :modelValue=&quot;allChecked&quot;
  @update:modelValue=&quot;toggleAll&quot; label=&quot;Select All&quot; />
<CuiCheckboxGroup v-model=&quot;selectedFruits&quot;>
  <CuiCheckbox value=&quot;apple&quot; label=&quot;Apple&quot; />
  ...
</CuiCheckboxGroup>`">
        <CuiStack spacing="2">
          <CuiCheckbox
            :indeterminate="someChecked"
            :model-value="allChecked"
            label="Select All Fruits"
            color="primary"
            @update:model-value="toggleAll"
          />
          <div class="ml-6">
            <CuiCheckboxGroup v-model="selectedFruits" label="Fruits">
              <CuiCheckbox value="apple" label="Apple" />
              <CuiCheckbox value="banana" label="Banana" />
              <CuiCheckbox value="cherry" label="Cherry" />
              <CuiCheckbox value="date" label="Date" />
            </CuiCheckboxGroup>
          </div>
          <div class="text-sm text-surface-500">Selected: {{ selectedFruits.join(', ') || 'none' }}</div>
        </CuiStack>
      </Example>

      <!-- Colors -->
      <Example title="Color Roles" :code="`<CuiCheckbox v-model=&quot;agree&quot; color=&quot;primary&quot; label=&quot;Primary&quot; />
<CuiCheckbox v-model=&quot;agree&quot; color=&quot;success&quot; label=&quot;Success&quot; />
<CuiCheckbox v-model=&quot;agree&quot; color=&quot;error&quot; label=&quot;Error&quot; />`">
        <CuiStack spacing="3">
          <CuiCheckbox v-model="agree" color="primary" label="Primary" />
          <CuiCheckbox v-model="agree" color="secondary" label="Secondary" />
          <CuiCheckbox v-model="agree" color="success" label="Success" />
          <CuiCheckbox v-model="agree" color="error" label="Error" />
          <CuiCheckbox v-model="agree" color="warning" label="Warning" />
          <CuiCheckbox v-model="agree" color="info" label="Info" />
        </CuiStack>
      </Example>

      <!-- With Descriptions -->
      <Example title="With Descriptions" :code="`<CuiCheckboxGroup v-model=&quot;permissions&quot;>
  <CuiCheckbox value=&quot;read&quot; label=&quot;Read&quot; description=&quot;View files and folders&quot; />
  <CuiCheckbox value=&quot;write&quot; label=&quot;Write&quot; description=&quot;Create and edit files&quot; />
  <CuiCheckbox value=&quot;delete&quot; label=&quot;Delete&quot; description=&quot;Remove files permanently&quot; color=&quot;error&quot; />
</CuiCheckboxGroup>`">
        <CuiCheckboxGroup v-model="permissions" label="Permissions">
          <CuiCheckbox value="read" label="Read" description="View files and folders" />
          <CuiCheckbox value="write" label="Write" description="Create and edit files" />
          <CuiCheckbox value="delete" label="Delete" description="Remove files permanently" color="error" />
          <CuiCheckbox value="admin" label="Admin" description="Full system access" color="warning" />
        </CuiCheckboxGroup>
      </Example>

      <!-- Dynamic Form -->
      <Example title="Dynamic Form (JSON-driven)" :code="`<CuiCheckboxGroup v-model=&quot;field.value&quot;>
  <CuiCheckbox v-for=&quot;opt in field.options&quot;
    :value=&quot;opt.value&quot; :label=&quot;opt.label&quot;
    :description=&quot;opt.description&quot; />
</CuiCheckboxGroup>`">
        <CuiStack spacing="2">
          <div class="text-sm font-medium">{{ dynamicField.label }}</div>
          <CuiCheckboxGroup v-model="dynamicField.value" :label="dynamicField.label">
            <CuiCheckbox
              v-for="opt in dynamicField.options"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
              :description="opt.description"
            />
          </CuiCheckboxGroup>
          <div class="text-sm text-surface-500">Selected: {{ dynamicField.value.join(', ') || 'none' }}</div>
        </CuiStack>
      </Example>

      <!-- Disabled -->
      <Example title="Disabled State" :code="`<CuiCheckboxGroup v-model=&quot;toppings&quot; disabled>
  <CuiCheckbox value=&quot;cheese&quot; label=&quot;Cheese&quot; />
  <CuiCheckbox value=&quot;pepperoni&quot; label=&quot;Pepperoni&quot; />
</CuiCheckboxGroup>`">
        <CuiCheckboxGroup v-model="toppings" disabled label="Disabled group">
          <CuiCheckbox value="cheese" label="Cheese" />
          <CuiCheckbox value="pepperoni" label="Pepperoni" />
        </CuiCheckboxGroup>
      </Example>

      <!-- Readonly -->
      <Example title="Readonly State" :code="`<CuiCheckboxGroup v-model=&quot;toppings&quot; readonly>
  <CuiCheckbox value=&quot;cheese&quot; label=&quot;Cheese (locked)&quot; />
  <CuiCheckbox value=&quot;pepperoni&quot; label=&quot;Pepperoni (locked)&quot; />
</CuiCheckboxGroup>`">
        <CuiCheckboxGroup v-model="toppings" readonly label="Readonly group">
          <CuiCheckbox value="cheese" label="Cheese (locked)" />
          <CuiCheckbox value="pepperoni" label="Pepperoni (locked)" />
          <CuiCheckbox value="mushrooms" label="Mushrooms (locked)" />
        </CuiCheckboxGroup>
      </Example>

      <!-- Error (3+ vertical) -->
      <Example title="Error Validation (vertical)">
        <CuiStack spacing="3">
          <CuiCheckboxGroup
            v-model="errorVal"
            error
            error-message="Please select at least one option"
            label="Required selection"
          >
            <CuiCheckbox value="a" label="Option A" />
            <CuiCheckbox value="b" label="Option B" />
            <CuiCheckbox value="c" label="Option C" />
          </CuiCheckboxGroup>
          <CuiButton size="sm" variant="solid" @click="errorVal = ['a']">Fix: Select A</CuiButton>
        </CuiStack>
      </Example>

      <!-- Error (2 horizontal) -->
      <Example title="Error Validation (horizontal)">
        <CuiStack spacing="3">
          <CuiCheckboxGroup
            v-model="errorTwo"
            error
            error-message="You must accept both policies"
            label="Policy acceptance"
          >
            <CuiCheckbox value="privacy" label="Privacy Policy" />
            <CuiCheckbox value="terms" label="Terms of Service" />
          </CuiCheckboxGroup>
          <CuiButton size="sm" variant="solid" @click="errorTwo = ['privacy', 'terms']">Fix: Accept Both</CuiButton>
        </CuiStack>
      </Example>
    </template>
  </DocPage>
</template>
