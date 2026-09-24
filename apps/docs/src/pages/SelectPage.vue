<script setup lang="ts">
import { ref } from "vue";
import { CuiBadge, CuiButton, CuiCard, CuiCardBody, CuiIcon, CuiSelect, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/select";

const fruit = ref<string | null>(null);
const multi = ref<string[]>([]);
const grouped = ref<string | null>(null);
const colored = ref<string | null>("blue");
const errorVal = ref<string | null>(null);
const loading = ref(true);
const loadedOptions = ref<string[]>([]);

// Simulate async load
setTimeout(() => {
  loadedOptions.value = ["Loaded Option A", "Loaded Option B", "Loaded Option C"];
  loading.value = false;
}, 3000);

function reloadOptions() {
  loading.value = true;
  loadedOptions.value = [];
  setTimeout(() => { loadedOptions.value = ["A", "B", "C"]; loading.value = false; }, 2000);
}

const fruitOptions = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
  { value: "elderberry", label: "Elderberry" },
];

const countryOptions = [
  { value: "us", label: "United States", group: "Americas" },
  { value: "ca", label: "Canada", group: "Americas" },
  { value: "mx", label: "Mexico", group: "Americas" },
  { value: "uk", label: "United Kingdom", group: "Europe" },
  { value: "de", label: "Germany", group: "Europe" },
  { value: "fr", label: "France", group: "Europe" },
  { value: "jp", label: "Japan", group: "Asia" },
  { value: "kr", label: "South Korea", group: "Asia" },
  { value: "au", label: "Australia", group: "Oceania" },
];

const permissionOptions = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "delete", label: "Delete" },
  { value: "admin", label: "Admin" },
  { value: "super", label: "Super Admin", disabled: true },
];

const iconOptions = [
  { value: "home", label: "Home", icon: "house" },
  { value: "settings", label: "Settings", icon: "gear" },
  { value: "profile", label: "Profile", icon: "user" },
  { value: "messages", label: "Messages", icon: "envelope" },
  { value: "notifications", label: "Notifications", icon: "bell" },
];
const iconVal = ref<string | null>(null);

const statusOptions = [
  { value: "active", label: "Active", icon: "check-circle" },
  { value: "pending", label: "Pending", icon: "clock" },
  { value: "inactive", label: "Inactive", icon: "x-circle" },
];
const statusVal = ref<string | null>(null);

// Naming demo
const namedCountry = ref<string | null>(null);

// Dynamic form
const dynamicField = ref({
  name: "priority",
  value: null as string | null,
  options: [
    { value: "low", label: "Low Priority" },
    { value: "medium", label: "Medium Priority" },
    { value: "high", label: "High Priority" },
    { value: "critical", label: "Critical" },
  ],
});
</script>

<template>
  <DocPage :meta="meta">
    <template #intro>
      <CuiCard variant="outline">
        <CuiCardBody>
          <p class="text-sm text-surface-700 dark:text-surface-300">
            <strong>A <code>&lt;label for&gt;</code> will not name this control.</strong>
            <code>CuiSelect</code> renders no <code>&lt;select&gt;</code> — its focusable
            surface is a <code>div[role="combobox"]</code>, which is not a
            <em>labelable</em> element, so <code>for</code>/<code>id</code> forms no
            association at all and fails silently. Name it with
            <code>aria-labelledby</code>, or let <code>CuiFormField</code> do it —
            Accessibility, below, has both spellings side by side.
          </p>
        </CuiCardBody>
      </CuiCard>
    </template>

    <template #usage>
      <Example
        code-open
        :code="`<CuiSelect
  v-model=&quot;fruit&quot;
  :options=&quot;['Apple', 'Banana', 'Cherry']&quot;
  placeholder=&quot;Pick a fruit...&quot;
  clearable
/>`"
      >
        <CuiStack spacing="2" class="max-w-sm">
          <CuiSelect
            v-model="fruit"
            :options="['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']"
            placeholder="Pick a fruit..."
            clearable
          />
          <div class="text-sm text-surface-500">Selected: {{ fruit ?? 'none' }}</div>
        </CuiStack>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The trigger is a <code>div[role="combobox"]</code> with
        <code>aria-haspopup="listbox"</code> and <code>aria-expanded</code>; the panel is a
        <code>[role="listbox"]</code> teleported to <code>&lt;body&gt;</code>, whose rows
        are <code>[role="option"]</code> carrying <code>aria-selected</code> and
        <code>aria-disabled</code>. Multi-select adds <code>aria-multiselectable</code>.
      </p>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Naming it.</strong> A <code>div</code> is not a labelable element, so
        <code>&lt;label for="x"&gt;</code> plus <code>id="x"</code> creates no association
        and no warning — the control is simply unnamed. Point
        <code>aria-labelledby</code> at the label's own <code>id</code> instead:
      </p>
      <pre class="cui-pre"><code>&lt;!-- wrong: `for` cannot reach a div[role=combobox] --&gt;
&lt;label for="country"&gt;Country&lt;/label&gt;
&lt;CuiSelect id="country" :options="countries" /&gt;

&lt;!-- right: name it by reference --&gt;
&lt;label id="country-label"&gt;Country&lt;/label&gt;
&lt;CuiSelect aria-labelledby="country-label" :options="countries" /&gt;

&lt;!-- or let CuiFormField wire it: `f` carries id, aria-labelledby and aria-describedby --&gt;
&lt;CuiFormField label="Country" help-text="Where the invoice is billed"&gt;
  &lt;template #default="f"&gt;
    &lt;CuiSelect v-bind="f" v-model="country" :options="countries" /&gt;
  &lt;/template&gt;
&lt;/CuiFormField&gt;</code></pre>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Closed, <kbd>↓</kbd> <kbd>↑</kbd> <kbd>Enter</kbd> and <kbd>Space</kbd> all open
          the panel. Open, <kbd>↓</kbd>/<kbd>↑</kbd> move the highlight,
          <kbd>Home</kbd>/<kbd>End</kbd> jump to the ends, <kbd>Enter</kbd> and
          <kbd>Space</kbd> select, and <kbd>Escape</kbd> closes and returns focus to the
          trigger.
        </li>
        <li>
          Opening a single-select highlights the current value rather than the first row,
          so arrow keys move from where you are.
        </li>
        <li>
          Disabled options are skipped by the keyboard entirely — the highlight only ever
          visits selectable rows.
        </li>
        <li>
          <code>error</code> sets <code>aria-invalid</code> on the trigger;
          <code>disabled</code> and <code>readonly</code> both set
          <code>aria-disabled</code>, and only <code>disabled</code> drops the trigger out
          of the tab order.
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> The highlighted option is communicated visually only —
        there is no <code>aria-activedescendant</code> and no <code>aria-controls</code> on
        the trigger, so a screen reader is not told which row the arrow keys are on. The
        chip-remove and clear buttons carry <code>tabindex="-1"</code>, so removing a
        selection needs the pointer or a trip back through the panel. And there is no
        native form control behind any of this: <code>name</code> and
        <code>autocomplete</code> have nothing to land on, so the value never appears in a
        plain form post — submit it from your own state. For a control that must be fully
        announced today, a native <code>&lt;select&gt;</code> remains the safer choice.
      </p>
    </template>

    <template #examples>
      <!-- Named with aria-labelledby -->
      <Example title="Naming it (aria-labelledby)" :code="`<label id=&quot;country-label&quot; class=&quot;text-sm font-medium&quot;>Country</label>
<CuiSelect
  v-model=&quot;country&quot;
  aria-labelledby=&quot;country-label&quot;
  :options=&quot;countryOptions&quot;
/>`">
        <CuiStack spacing="2" class="max-w-sm">
          <label id="country-label" class="text-sm font-medium">Country</label>
          <CuiSelect
            v-model="namedCountry"
            aria-labelledby="country-label"
            :options="countryOptions"
            placeholder="Select country..."
            clearable
          />
          <div class="text-sm text-surface-500">Selected: {{ namedCountry ?? 'none' }}</div>
        </CuiStack>
      </Example>

      <!-- Object options -->
      <Example title="Object Options" :code="`<CuiSelect v-model=&quot;val&quot; :options=&quot;[{ value: 'us', label: 'United States' }]&quot; />`">
        <CuiStack spacing="2" class="max-w-sm">
          <CuiSelect
            v-model="fruit"
            :options="fruitOptions"
            placeholder="Select fruit..."
            clearable
          />
          <div class="text-sm text-surface-500">Selected: {{ fruit ?? 'none' }}</div>
        </CuiStack>
      </Example>

      <!-- Multi-select -->
      <Example title="Multi-Select (chips)" :code="`<CuiSelect v-model=&quot;perms&quot; :options=&quot;options&quot; multiple />`">
        <CuiStack spacing="2" class="max-w-md">
          <CuiSelect
            v-model="multi"
            :options="permissionOptions"
            multiple
            placeholder="Select permissions..."
            clearable
          />
          <div class="text-sm text-surface-500">Selected: {{ multi.join(', ') || 'none' }}</div>
        </CuiStack>
      </Example>

      <!-- Option Groups -->
      <Example title="Option Groups" :code="`<CuiSelect :options=&quot;[{ value: 'us', label: 'USA', group: 'Americas' }]&quot; />`">
        <CuiStack spacing="2" class="max-w-sm">
          <CuiSelect
            v-model="grouped"
            :options="countryOptions"
            placeholder="Select country..."
            clearable
          />
          <div class="text-sm text-surface-500">Selected: {{ grouped ?? 'none' }}</div>
        </CuiStack>
      </Example>

      <!-- Disabled Options -->
      <Example title="Disabled Options" :code="`<CuiSelect v-model=&quot;multi&quot; :options=&quot;permissionOptions&quot; multiple />
<!-- options with disabled: true are greyed out and skipped by the keyboard -->`">
        <CuiStack spacing="2" class="max-w-sm">
          <CuiSelect
            v-model="multi"
            :options="permissionOptions"
            multiple
            placeholder="Some options are disabled..."
          />
        </CuiStack>
      </Example>

      <!-- Options with Icons -->
      <Example title="Options with Icons (icon field)" :code="`<CuiSelect :options=&quot;[{ value: 'home', label: 'Home', icon: 'house' }]&quot; />`">
        <CuiStack spacing="2" class="max-w-sm">
          <CuiSelect
            v-model="iconVal"
            :options="iconOptions"
            placeholder="Select page..."
            clearable
          />
          <div class="text-sm text-surface-500">Selected: {{ iconVal ?? 'none' }}</div>
        </CuiStack>
      </Example>

      <!-- Custom Option Slot -->
      <Example title="Custom #option Slot (rich content)" :code="`<CuiSelect :options=&quot;options&quot;>
  <template #option=&quot;{ option }&quot;>
    <CuiIcon :name=&quot;option.icon&quot; />
    {{ option.label }}
    <CuiBadge v-if=&quot;option.value === 'active'&quot; color=&quot;success&quot;>Live</CuiBadge>
  </template>
</CuiSelect>`">
        <CuiStack spacing="2" class="max-w-sm">
          <CuiSelect
            v-model="statusVal"
            :options="statusOptions"
            placeholder="Select status..."
            clearable
          >
            <template #option="{ option }">
              <CuiIcon :name="(option as any).icon" size="sm" />
              {{ option.label }}
              <CuiBadge v-if="option.value === 'active'" color="success" size="sm">Live</CuiBadge>
            </template>
            <template #selected="{ option }">
              <CuiIcon v-if="option?.icon" :name="option.icon" size="sm" />
              {{ option?.label }}
            </template>
          </CuiSelect>
          <div class="text-sm text-surface-500">Selected: {{ statusVal ?? 'none' }}</div>
        </CuiStack>
      </Example>

      <!-- Loading -->
      <Example title="Loading State (async data)" :code="`<CuiSelect :options=&quot;loadedOptions&quot; :loading=&quot;loading&quot; placeholder=&quot;Loading...&quot; />`">
        <CuiStack spacing="2" class="max-w-sm">
          <CuiSelect
            :options="loadedOptions"
            :loading="loading"
            placeholder="Loading options..."
          />
          <CuiButton v-if="!loading" size="sm" variant="ghost" @click="reloadOptions">
            Reload
          </CuiButton>
        </CuiStack>
      </Example>

      <!-- Sizes -->
      <Example title="Sizes" :code="`<CuiSelect size=&quot;xs&quot; placeholder=&quot;Extra small&quot; />
<CuiSelect size=&quot;sm&quot; placeholder=&quot;Small&quot; />
<CuiSelect size=&quot;md&quot; placeholder=&quot;Medium (default)&quot; />
<CuiSelect size=&quot;lg&quot; placeholder=&quot;Large&quot; />
<CuiSelect size=&quot;xl&quot; placeholder=&quot;Extra large&quot; />`">
        <CuiStack spacing="3" class="max-w-sm">
          <CuiSelect :options="['Small']" size="xs" placeholder="Extra small" />
          <CuiSelect :options="['Small']" size="sm" placeholder="Small" />
          <CuiSelect :options="['Medium']" size="md" placeholder="Medium (default)" />
          <CuiSelect :options="['Large']" size="lg" placeholder="Large" />
          <CuiSelect :options="['XL']" size="xl" placeholder="Extra large" />
        </CuiStack>
      </Example>

      <!-- Rounded -->
      <Example title="Rounded" :code="`<CuiSelect rounded=&quot;none&quot; placeholder=&quot;Square&quot; />
<CuiSelect rounded=&quot;lg&quot; placeholder=&quot;Large radius&quot; />
<CuiSelect rounded=&quot;full&quot; placeholder=&quot;Pill&quot; />`">
        <CuiStack spacing="3" class="max-w-sm">
          <CuiSelect :options="['Apple', 'Banana']" rounded="none" placeholder="Square (none)" />
          <CuiSelect :options="['Apple', 'Banana']" rounded="lg" placeholder="Large radius" />
          <CuiSelect :options="['Apple', 'Banana']" rounded="full" placeholder="Pill (full)" />
        </CuiStack>
      </Example>

      <!-- Colors -->
      <Example title="Focus Colors (click to see)" :code="`<CuiSelect color=&quot;primary&quot; placeholder=&quot;Primary&quot; />
<CuiSelect color=&quot;success&quot; placeholder=&quot;Success&quot; />
<CuiSelect color=&quot;error&quot; placeholder=&quot;Error&quot; />`">
        <CuiStack spacing="3" class="max-w-sm">
          <CuiSelect v-model="colored" :options="['Red', 'Green', 'Blue']" color="primary" placeholder="Primary" />
          <CuiSelect v-model="colored" :options="['Red', 'Green', 'Blue']" color="success" placeholder="Success" />
          <CuiSelect v-model="colored" :options="['Red', 'Green', 'Blue']" color="error" placeholder="Error" />
        </CuiStack>
      </Example>

      <!-- Error -->
      <Example title="Error Validation" :code="`<CuiSelect v-model=&quot;errorVal&quot; :options=&quot;fruitOptions&quot; error error-message=&quot;Please select an option&quot; />`">
        <CuiStack spacing="3" class="max-w-sm">
          <CuiSelect
            v-model="errorVal"
            :options="fruitOptions"
            error
            error-message="Please select an option"
            placeholder="Required..."
          />
        </CuiStack>
      </Example>

      <!-- Disabled / Readonly -->
      <Example title="Disabled &amp; Readonly" :code="`<CuiSelect model-value=&quot;apple&quot; :options=&quot;fruitOptions&quot; disabled />
<CuiSelect model-value=&quot;banana&quot; :options=&quot;fruitOptions&quot; readonly />`">
        <CuiStack spacing="3" class="max-w-sm">
          <CuiSelect model-value="apple" :options="fruitOptions" disabled placeholder="Disabled" />
          <CuiSelect model-value="banana" :options="fruitOptions" readonly placeholder="Readonly" />
        </CuiStack>
      </Example>

      <!-- Dynamic Form -->
      <Example title="Dynamic Form (JSON-driven)" :code="`<CuiSelect v-model=&quot;field.value&quot; :options=&quot;field.options&quot; />`">
        <CuiStack spacing="2" class="max-w-sm">
          <div class="text-sm font-medium">{{ dynamicField.name }}</div>
          <CuiSelect
            v-model="dynamicField.value"
            :options="dynamicField.options"
            placeholder="Select priority..."
            clearable
          />
          <div class="text-sm text-surface-500">Value: {{ dynamicField.value ?? 'none' }}</div>
        </CuiStack>
      </Example>
    </template>
  </DocPage>
</template>
