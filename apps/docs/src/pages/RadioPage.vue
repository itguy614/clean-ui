<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiFlex, CuiRadio, CuiRadioGroup, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const selected = ref("option2");
const standalone = ref("a");
const color = ref("blue");
const shipping = ref("standard");
const plan = ref("");
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
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Radio</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Radio buttons for single-selection from a set of options. Works standalone
        or inside a <code class="cui-code">CuiRadioGroup</code> for managed state,
        keyboard navigation, and validation.
      </p>
    </div>

    <!-- Props Tables -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiRadioGroup Props</h2>
      <PropTable
        :props="[
          { name: 'v-model', type: 'string | number | boolean', default: '-', description: 'Selected value' },
          { name: 'name', type: 'string', default: 'auto', description: 'Shared name attribute for form submission' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Color role inherited by children' },
          { name: 'direction', type: 'horizontal | vertical | auto', default: 'auto', description: 'Layout direction (auto: horizontal ≤2, vertical 3+)' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable all radios' },
          { name: 'readonly', type: 'boolean', default: 'false', description: 'Make all radios readonly' },
          { name: 'error', type: 'boolean', default: 'false', description: 'Show error state' },
          { name: 'errorMessage', type: 'string', default: '-', description: 'Error message below group' },
          { name: 'label', type: 'string', default: '-', description: 'Accessible group label (aria-label)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiRadio Props</h2>
      <PropTable
        :props="[
          { name: 'value', type: 'string | number | boolean', default: '-', description: 'The value this radio represents (required)' },
          { name: 'v-model', type: 'string | number | boolean', default: '-', description: 'Standalone mode binding' },
          { name: 'label', type: 'string', default: '-', description: 'Label text (or use default slot)' },
          { name: 'description', type: 'string', default: '-', description: 'Description below label (or use #description slot)' },
          { name: 'color', type: 'ButtonColor', default: '-', description: 'Overrides group color' },
          { name: 'name', type: 'string', default: '-', description: 'Name attribute (standalone mode)' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'readonly', type: 'boolean', default: 'false', description: 'Readonly state' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic Group -->
        <Example title="Basic Group" :code="`<CuiRadioGroup v-model=&quot;selected&quot;>
  <CuiRadio value=&quot;option1&quot; label=&quot;Option 1&quot; />
  <CuiRadio value=&quot;option2&quot; label=&quot;Option 2&quot; />
  <CuiRadio value=&quot;option3&quot; label=&quot;Option 3&quot; />
</CuiRadioGroup>`">
          <CuiStack spacing="2">
            <CuiRadioGroup v-model="selected" label="Choose an option">
              <CuiRadio value="option1" label="Option 1" />
              <CuiRadio value="option2" label="Option 2" />
              <CuiRadio value="option3" label="Option 3" />
            </CuiRadioGroup>
            <div class="text-sm text-surface-500">Selected: {{ selected }}</div>
          </CuiStack>
        </Example>

        <!-- Auto Direction (≤2 = horizontal) -->
        <Example title="Auto Direction (≤2 options = horizontal)">
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
        <Example title="Forced Horizontal Direction">
          <CuiRadioGroup v-model="color" direction="horizontal" label="Favorite color">
            <CuiRadio value="red" label="Red" />
            <CuiRadio value="green" label="Green" />
            <CuiRadio value="blue" label="Blue" />
          </CuiRadioGroup>
        </Example>

        <!-- Colors -->
        <Example title="Color Roles">
          <CuiStack spacing="3">
            <CuiRadioGroup v-model="selected" color="primary" direction="horizontal" label="Primary">
              <CuiRadio value="option1" label="Primary A" />
              <CuiRadio value="option2" label="Primary B" />
            </CuiRadioGroup>
            <CuiRadioGroup v-model="selected" color="success" direction="horizontal" label="Success">
              <CuiRadio value="option1" label="Success A" />
              <CuiRadio value="option2" label="Success B" />
            </CuiRadioGroup>
            <CuiRadioGroup v-model="selected" color="error" direction="horizontal" label="Error">
              <CuiRadio value="option1" label="Error A" />
              <CuiRadio value="option2" label="Error B" />
            </CuiRadioGroup>
            <CuiRadioGroup v-model="selected" color="warning" direction="horizontal" label="Warning">
              <CuiRadio value="option1" label="Warning A" />
              <CuiRadio value="option2" label="Warning B" />
            </CuiRadioGroup>
            <CuiRadioGroup v-model="selected" color="info" direction="horizontal" label="Info">
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
        <Example title="Disabled State">
          <CuiRadioGroup v-model="selected" disabled label="Disabled group">
            <CuiRadio value="option1" label="Can't select this" />
            <CuiRadio value="option2" label="Or this one" />
            <CuiRadio value="option3" label="Or this" />
          </CuiRadioGroup>
        </Example>

        <!-- Readonly -->
        <Example title="Readonly State">
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
          <CuiStack spacing="4">
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
        <Example title="Standalone (no group)">
          <CuiFlex gap="4">
            <CuiRadio v-model="standalone" value="a" name="standalone" label="Choice A" />
            <CuiRadio v-model="standalone" value="b" name="standalone" label="Choice B" />
          </CuiFlex>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
