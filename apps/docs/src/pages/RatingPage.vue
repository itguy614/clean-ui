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
        <code>CuiRating</code> today is a display component that also happens to respond to
        clicks. The icons are plain <code>&lt;div&gt;</code>s with pointer handlers: there
        is no <code>role</code>, no <code>tabindex</code> and no key handling anywhere in
        the component, so nothing here is reachable or operable by keyboard, and assistive
        technology is told only that some star glyphs are on screen. <code>focus()</code>
        targets the root, which carries no <code>tabindex</code>, so it does nothing on its
        own either.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          The <code>label</code> prop renders a bare <code>&lt;label&gt;</code> with no
          <code>for</code> and no control to point at, so it names nothing — treat it as a
          visual caption.
        </li>
        <li>
          <code>showValue</code> prints the number next to the icons, which is the only
          thing on the page that states the rating in text rather than in colour and fill
          weight. Turn it on wherever the rating carries meaning.
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps, and what to do meanwhile.</strong> For <em>display</em> —
        showing an average, a score on a card — use <code>readonly</code> with
        <code>showValue</code>, and put the full sentence in the surrounding text
        (“4.5 out of 5, 128 reviews”) so the number is not left to the icons. For
        <em>input</em>, do not ship this as the only way to rate something: back it with a
        keyboard-operable control — a <code>CuiRadioGroup</code> with
        <code>variant="buttons"</code>, or a <code>CuiSlider</code> — or provide one as an
        alternative path. Until the component grows a role and key handling, a rating
        collected only through these icons cannot be given by keyboard at all.
      </p>
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
