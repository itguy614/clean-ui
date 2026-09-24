<script setup lang="ts">
import { ref } from "vue";
import { CuiIcon, CuiSlider, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/slider";

const volume = ref(65);
const price = ref(250);
const opacity = ref(0.8);
const temp = ref(72);
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiSlider v-model=&quot;volume&quot; label=&quot;Volume&quot; show-value />`"
      >
        <div class="max-w-md">
          <CuiSlider v-model="volume" label="Volume" show-value />
        </div>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The track, fill and thumb are decoration drawn under a real
        <code>&lt;input type="range"&gt;</code>, which is stretched over the whole control
        at <code>opacity: 0</code>. That is deliberate: <code>role="slider"</code>,
        <code>aria-valuenow</code>, <code>aria-valuemin</code>,
        <code>aria-valuemax</code>, the arrow keys, <kbd>Home</kbd>/<kbd>End</kbd> and
        touch dragging all come from the browser rather than from hand-written ARIA, so
        they match the platform exactly.
        <code>min</code>, <code>max</code> and <code>step</code> are the native attributes.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          The thumb is <code>pointer-events: none</code>, so every pointer and touch
          gesture lands on the native input underneath it — including a tap on the track,
          which jumps the value there.
        </li>
        <li>
          <code>id</code>, <code>name</code>, <code>autocomplete</code>,
          <code>aria-describedby</code> and <code>aria-labelledby</code> are forwarded to
          that native input, so a <code>&lt;label for&gt;</code> pointing at
          <code>id</code> forms a real association and the value serializes in a form post.
        </li>
        <li>
          <code>showValue</code> prints the current value in text, which is worth turning
          on: the thumb's position is otherwise the only indication of where the value is.
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> Three things need handling on your side:
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <strong>The <code>label</code> prop names nothing.</strong> It renders a bare
          <code>&lt;label&gt;</code> with no <code>for</code>, so it is a visual caption
          only. Name the control with <code>aria-labelledby</code>, or wrap it in
          <code>CuiFormField</code> and <code>v-bind="f"</code>, and keep
          <code>label</code> for layout if you like the value sitting opposite it.
        </li>
        <li>
          <strong>There is no visible focus indicator.</strong> The focusable element is the
          transparent range input, and nothing draws a ring when it takes focus. Add one
          yourself until the component does:
          <pre class="cui-pre"><code>.cui-slider:focus-within &#123;
  outline: 2px solid var(--cui-primary-focus-ring);
  outline-offset: 2px;
  border-radius: 0.25rem;
&#125;</code></pre>
        </li>
        <li>
          <strong><code>formatValue</code> does not reach assistive technology.</strong> It
          formats the printed value and the min/max labels only; a screen reader still
          announces the raw number, so a slider showing “$250” or “80%” is read as
          “250” or “0.8”. Where the unit matters, put it in the accessible name — “Budget
          in dollars” — so the bare number lands in context.
        </li>
      </ul>
    </template>

    <template #examples>
      <!-- With range labels -->
      <Example title="With Range Labels" :code="`<CuiSlider v-model=&quot;temp&quot; :min=&quot;60&quot; :max=&quot;85&quot; label=&quot;Temperature&quot;
  show-value show-range :format-value=&quot;(v) =&gt; v + '°F'&quot; />`">
        <div class="max-w-md">
          <CuiSlider
            v-model="temp"
            :min="60"
            :max="85"
            label="Temperature"
            show-value
            show-range
            :format-value="(v: number) => `${v}°F`"
          />
        </div>
      </Example>

      <!-- Custom formatting -->
      <Example title="Custom Formatting" :code="`<CuiSlider :format-value=&quot;(v) => '$' + v&quot; />`">
        <div class="max-w-md">
          <CuiStack spacing="4">
            <CuiSlider
              v-model="price"
              :min="0"
              :max="1000"
              :step="10"
              label="Budget"
              show-value
              show-range
              :format-value="(v: number) => `$${v}`"
            />
            <CuiSlider
              v-model="opacity"
              :min="0"
              :max="1"
              :step="0.01"
              label="Opacity"
              show-value
              :format-value="(v: number) => `${Math.round(v * 100)}%`"
            />
          </CuiStack>
        </div>
      </Example>

      <!-- Sizes -->
      <Example title="Sizes" :code="`<CuiSlider :model-value=&quot;40&quot; size=&quot;sm&quot; label=&quot;Small&quot; show-value />
<CuiSlider :model-value=&quot;60&quot; size=&quot;md&quot; label=&quot;Medium&quot; show-value />
<CuiSlider :model-value=&quot;80&quot; size=&quot;lg&quot; label=&quot;Large&quot; show-value />`">
        <div class="max-w-md">
          <CuiStack spacing="4">
            <CuiSlider :model-value="40" size="sm" label="Small" show-value />
            <CuiSlider :model-value="60" size="md" label="Medium" show-value />
            <CuiSlider :model-value="80" size="lg" label="Large" show-value />
          </CuiStack>
        </div>
      </Example>

      <!-- Colors -->
      <Example title="Colors" :code="`<CuiSlider :model-value=&quot;70&quot; color=&quot;primary&quot; label=&quot;Primary&quot; show-value />
<CuiSlider :model-value=&quot;70&quot; color=&quot;success&quot; label=&quot;Success&quot; show-value />
<CuiSlider :model-value=&quot;70&quot; color=&quot;error&quot; label=&quot;Error&quot; show-value />`">
        <div class="max-w-md">
          <CuiStack spacing="4">
            <CuiSlider :model-value="70" color="primary" label="Primary" show-value />
            <CuiSlider :model-value="70" color="success" label="Success" show-value />
            <CuiSlider :model-value="70" color="error" label="Error" show-value />
            <CuiSlider :model-value="70" color="warning" label="Warning" show-value />
            <CuiSlider :model-value="70" color="info" label="Info" show-value />
          </CuiStack>
        </div>
      </Example>

      <!-- Thumb icon -->
      <Example title="Thumb Icons" :code="`<CuiSlider thumb-icon=&quot;speaker-high&quot; />`">
        <div class="max-w-md">
          <CuiStack spacing="4">
            <CuiSlider v-model="volume" label="Volume" show-value thumb-icon="speaker-high" />
            <CuiSlider v-model="temp" :min="60" :max="85" label="Temperature" show-value color="error" thumb-icon="thermometer" :format-value="(v: number) => `${v}°F`" />
            <CuiSlider v-model="opacity" :min="0" :max="1" :step="0.01" label="Brightness" show-value color="warning" thumb-icon="sun" size="lg" :format-value="(v: number) => `${Math.round(v * 100)}%`" />
          </CuiStack>
        </div>
      </Example>

      <!-- Custom thumb slot -->
      <Example title="Custom Thumb Slot" :code="`<CuiSlider>
  <template #thumb>🔥</template>
</CuiSlider>`">
        <div class="max-w-md">
          <CuiStack spacing="4">
            <CuiSlider v-model="volume" label="Heat" show-value size="lg" color="error">
              <template #thumb><span style="font-size: 0.75rem;">🔥</span></template>
            </CuiSlider>
            <CuiSlider :model-value="price" :max="1000" :step="10" label="Budget" show-value size="lg" color="success" :format-value="(v: number) => `$${v}`">
              <template #thumb><CuiIcon name="currency-dollar" size="0.75rem" /></template>
            </CuiSlider>
          </CuiStack>
        </div>
      </Example>

      <!-- Disabled -->
      <Example title="Disabled" :code="`<CuiSlider :model-value=&quot;50&quot; disabled label=&quot;Disabled&quot; show-value />`">
        <div class="max-w-md">
          <CuiSlider :model-value="50" disabled label="Disabled" show-value />
        </div>
      </Example>
    </template>
  </DocPage>
</template>
