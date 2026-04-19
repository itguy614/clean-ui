<script setup lang="ts">
import { ref } from "vue";
import { CuiFlex, CuiRating, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const rating1 = ref(3);
const rating2 = ref(3.5);
const rating3 = ref(4);
const rating4 = ref(2);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Rating</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A star rating input with hover preview, half-star support, custom icons,
        and readonly display mode. Click a star to rate, click again to clear.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'modelValue', type: 'number', default: '0', description: 'Current rating (v-model)' },
          { name: 'max', type: 'number', default: '5', description: 'Maximum rating' },
          { name: 'half', type: 'boolean', default: 'false', description: 'Allow half-star values' },
          { name: 'size', type: 'sm | md | lg | xl', default: 'md', description: 'Size' },
          { name: 'color', type: 'primary | warning | ...', default: 'warning', description: 'Color role' },
          { name: 'icon', type: 'string', default: 'star', description: 'Phosphor icon name (uses fill weight when active)' },
          { name: 'halfIcon', type: 'string', default: 'star-half', description: 'Icon for half-star state' },
          { name: 'readonly', type: 'boolean', default: 'false', description: 'Display only, no interaction' },
          { name: 'showValue', type: 'boolean', default: 'false', description: 'Show numeric value' },
          { name: 'clearable', type: 'boolean', default: 'true', description: 'Click current value to clear to 0' },
          { name: 'label', type: 'string', default: '—', description: 'Label text' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic" :code="`<CuiRating v-model=&quot;rating&quot; />`">
          <CuiFlex gap="4" class="items-center">
            <CuiRating v-model="rating1" label="Rating" />
            <span class="text-sm" style="color: var(--cui-text-secondary);">Value: {{ rating1 }}</span>
          </CuiFlex>
        </Example>

        <!-- Half stars -->
        <Example title="Half Stars" :code="`<CuiRating v-model=&quot;rating&quot; half />`">
          <CuiFlex gap="4" class="items-center">
            <CuiRating v-model="rating2" half show-value label="Precision Rating" />
          </CuiFlex>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes" :code="`<CuiRating :model-value=&quot;4&quot; size=&quot;sm&quot; readonly label=&quot;Small&quot; />
<CuiRating :model-value=&quot;4&quot; size=&quot;md&quot; readonly label=&quot;Medium&quot; />
<CuiRating :model-value=&quot;4&quot; size=&quot;lg&quot; readonly label=&quot;Large&quot; />
<CuiRating :model-value=&quot;4&quot; size=&quot;xl&quot; readonly label=&quot;Extra Large&quot; />`">
          <CuiStack spacing="3">
            <CuiRating :model-value="4" size="sm" readonly label="Small" />
            <CuiRating :model-value="4" size="md" readonly label="Medium" />
            <CuiRating :model-value="4" size="lg" readonly label="Large" />
            <CuiRating :model-value="4" size="xl" readonly label="Extra Large" />
          </CuiStack>
        </Example>

        <!-- Colors -->
        <Example title="Colors" :code="`<CuiRating :model-value=&quot;4&quot; color=&quot;warning&quot; readonly show-value />
<CuiRating :model-value=&quot;4&quot; color=&quot;primary&quot; readonly show-value />
<CuiRating :model-value=&quot;4&quot; color=&quot;error&quot; readonly show-value />
<CuiRating :model-value=&quot;4&quot; color=&quot;success&quot; readonly show-value />`">
          <CuiStack spacing="3">
            <CuiRating :model-value="4" color="warning" readonly show-value />
            <CuiRating :model-value="4" color="primary" readonly show-value />
            <CuiRating :model-value="4" color="error" readonly show-value />
            <CuiRating :model-value="4" color="success" readonly show-value />
          </CuiStack>
        </Example>

        <!-- Custom icons -->
        <Example title="Custom Icons" :code="`<CuiRating icon=&quot;heart&quot; color=&quot;error&quot; />`">
          <CuiStack spacing="3">
            <CuiFlex gap="2" class="items-center">
              <CuiRating v-model="rating3" icon="heart" half-icon="heart-half" color="error" size="lg" />
              <span class="text-sm" style="color: var(--cui-text-secondary);">Hearts</span>
            </CuiFlex>
            <CuiFlex gap="2" class="items-center">
              <CuiRating v-model="rating4" icon="thumbs-up" color="primary" :max="3" size="lg" />
              <span class="text-sm" style="color: var(--cui-text-secondary);">Thumbs (max 3)</span>
            </CuiFlex>
          </CuiStack>
        </Example>

        <!-- Readonly with value -->
        <Example title="Readonly Display" :code="`<CuiRating :model-value=&quot;4.5&quot; half readonly show-value />`">
          <CuiStack spacing="3">
            <CuiFlex gap="3" class="items-center">
              <CuiRating :model-value="4.5" half readonly show-value />
              <span class="text-sm" style="color: var(--cui-text-secondary);">4.5 out of 5 (128 reviews)</span>
            </CuiFlex>
            <CuiFlex gap="3" class="items-center">
              <CuiRating :model-value="3" readonly show-value size="sm" />
              <span class="text-sm" style="color: var(--cui-text-secondary);">Average</span>
            </CuiFlex>
          </CuiStack>
        </Example>

        <!-- 10-star scale -->
        <Example title="10-Point Scale" :code="`<CuiRating v-model=&quot;rating1&quot; :max=&quot;10&quot; size=&quot;sm&quot; show-value label=&quot;Rate 1-10&quot; />`">
          <CuiRating v-model="rating1" :max="10" size="sm" show-value label="Rate 1-10" />
        </Example>

        <!-- Disabled -->
        <Example title="Disabled" :code="`<CuiRating :model-value=&quot;3&quot; disabled label=&quot;Disabled&quot; />`">
          <CuiRating :model-value="3" disabled label="Disabled" />
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
