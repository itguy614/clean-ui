<script setup lang="ts">
import { ref } from "vue";
import { CuiFlex, CuiRating, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/rating";

const rating1 = ref(3);
const rating2 = ref(3.5);
const rating3 = ref(4);
const rating4 = ref(2);
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiRating v-model=&quot;rating&quot; label=&quot;Rating&quot; />`"
      >
        <CuiFlex gap="4" class="items-center">
          <CuiRating v-model="rating1" label="Rating" />
          <span class="text-sm" style="color: var(--cui-text-secondary);">Value: {{ rating1 }}</span>
        </CuiFlex>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The icons are one <code>role="slider"</code> — a single tab stop, the WAI-ARIA slider
        pattern — with <code>aria-valuemin</code> 0, <code>aria-valuemax</code> set to
        <code>max</code>, <code>aria-valuenow</code>, and <code>aria-valuetext</code> reading
        “3 of 5 stars”, so a screen reader announces a rating rather than a row of glyphs.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Arrow Right and Arrow Up add a star, Arrow Left and Arrow Down take one away — half a
          star with <code>half</code>. Home goes to 0 (or to one step when
          <code>clearable</code> is off), End to <code>max</code>.
        </li>
        <li>
          <code>label</code> names the slider through <code>aria-labelledby</code>, and a click
          on it focuses the slider.
        </li>
        <li>
          <code>readonly</code> makes it a display, not a control: a <code>role="img"</code>
          with the same text and no tab stop, so a list of reviews is not a list of tab stops.
          <code>disabled</code> keeps the slider but takes it out of the tab order.
        </li>
        <li>
          The value text comes from the message catalogue
          (<code>rating.valueText(value, max)</code>), so it can be translated.
          <code>showValue</code> prints the number for sighted users too, rather than leaving
          it to colour and fill weight.
        </li>
      </ul>
    </template>

    <template #examples>
      <!-- Half stars -->
      <Example title="Half Stars" :code="`<CuiRating v-model=&quot;rating&quot; half show-value />`">
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
      <Example title="Custom Icons" :code="`<CuiRating icon=&quot;heart&quot; half-icon=&quot;heart-half&quot; color=&quot;error&quot; />`">
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
      <Example title="10-Point Scale" :code="`<CuiRating v-model=&quot;rating&quot; :max=&quot;10&quot; size=&quot;sm&quot; show-value label=&quot;Rate 1-10&quot; />`">
        <CuiRating v-model="rating1" :max="10" size="sm" show-value label="Rate 1-10" />
      </Example>

      <!-- Disabled -->
      <Example title="Disabled" :code="`<CuiRating :model-value=&quot;3&quot; disabled label=&quot;Disabled&quot; />`">
        <CuiRating :model-value="3" disabled label="Disabled" />
      </Example>
    </template>
  </DocPage>
</template>
