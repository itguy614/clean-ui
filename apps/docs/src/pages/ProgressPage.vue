<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { CuiButton, CuiCard, CuiCardBody, CuiFlex, CuiGrid, CuiProgress, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/progress";

const animated = ref(0);
let animInterval: ReturnType<typeof setInterval> | null = null;

function startAnimation() {
  animated.value = 0;
  if (animInterval) clearInterval(animInterval);
  animInterval = setInterval(() => {
    animated.value += 2;
    if (animated.value >= 100) {
      animated.value = 100;
      if (animInterval) clearInterval(animInterval);
    }
  }, 80);
}

onMounted(startAnimation);
onUnmounted(() => { if (animInterval) clearInterval(animInterval); });
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiProgress :value=&quot;65&quot; />
<CuiProgress :value=&quot;65&quot; show-label />
<CuiProgress variant=&quot;circle&quot; :value=&quot;65&quot; show-label />`"
      >
        <CuiStack spacing="4" class="max-w-lg">
          <CuiProgress :value="65" />
          <CuiProgress :value="65" show-label />
          <CuiProgress variant="circle" :value="65" show-label />
        </CuiStack>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        Both variants render <code>role="progressbar"</code> with
        <code>aria-valuemin="0"</code>, <code>aria-valuemax</code> from <code>max</code> and
        <code>aria-valuenow</code> from <code>value</code>. When
        <code>indeterminate</code> is set, <code>aria-valuenow</code> is omitted — which is
        precisely how a screen reader is told the length is unknown, rather than being told
        the task is 0% done.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          There is no <code>label</code> prop. Give the component an
          <code>aria-label</code> (or <code>aria-labelledby</code>) yourself — it falls
          through to the root — otherwise the bar is announced as a nameless progress
          indicator and the user has no idea what is progressing.
        </li>
        <li>
          Assistive technology reads <code>aria-valuenow</code> against
          <code>max</code>, so with <code>:max="10"</code> it says “3, 30%”. If you use the
          <code>label</code> slot to write something else — “3 of 10 files” — add a matching
          <code>aria-valuetext</code> so the announced value and the visible one agree.
        </li>
        <li>
          The visible percentage is inside the <code>progressbar</code> element, so it is not
          announced separately — it is not a second, contradictory reading of the same value.
        </li>
        <li>
          <code>stripe</code>, <code>shimmer</code> and <code>indeterminate</code> animate
          continuously. They are fine for a moment of loading; for something long-running,
          consider leaving them off.
        </li>
        <li>
          Colour alone does not say “failed” or “complete”. Pair
          <code>color="error"</code> with text.
        </li>
      </ul>
    </template>

    <template #examples>

      <!-- Basic bar -->
      <Example title="Basic Bar" :code="`<CuiProgress :value=&quot;65&quot; />`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiProgress :value="25" />
          <CuiProgress :value="50" />
          <CuiProgress :value="75" />
          <CuiProgress :value="100" />
        </CuiStack>
      </Example>

      <!-- Sizes -->
      <Example title="Bar Sizes" :code="`<CuiProgress :value=&quot;60&quot; size=&quot;sm&quot; />
<CuiProgress :value=&quot;60&quot; size=&quot;md&quot; />
<CuiProgress :value=&quot;60&quot; size=&quot;lg&quot; />`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiProgress :value="60" size="sm" />
          <CuiProgress :value="60" size="md" />
          <CuiProgress :value="60" size="lg" />
        </CuiStack>
      </Example>

      <!-- Colors -->
      <Example title="Colors" :code="`<CuiProgress :value=&quot;70&quot; color=&quot;primary&quot; />
<CuiProgress :value=&quot;70&quot; color=&quot;success&quot; />
<CuiProgress :value=&quot;70&quot; color=&quot;error&quot; />
<CuiProgress :value=&quot;70&quot; color=&quot;warning&quot; />
<CuiProgress :value=&quot;70&quot; color=&quot;info&quot; />`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiProgress :value="70" color="primary" />
          <CuiProgress :value="70" color="secondary" />
          <CuiProgress :value="70" color="success" />
          <CuiProgress :value="70" color="error" />
          <CuiProgress :value="70" color="warning" />
          <CuiProgress :value="70" color="info" />
        </CuiStack>
      </Example>

      <!-- Fill Animations -->
      <Example title="Fill Animations" :code="`<CuiProgress :value=&quot;70&quot; animation=&quot;stripe&quot; />
<CuiProgress :value=&quot;70&quot; animation=&quot;shimmer&quot; />`">
        <CuiStack spacing="4" class="max-w-lg">
          <div>
            <div class="mb-1 text-sm font-medium text-surface-600 dark:text-surface-400">Stripe:</div>
            <CuiProgress :value="70" animation="stripe" size="lg" />
          </div>
          <div>
            <div class="mb-1 text-sm font-medium text-surface-600 dark:text-surface-400">Shimmer:</div>
            <CuiProgress :value="70" animation="shimmer" size="lg" />
          </div>
          <div>
            <div class="mb-1 text-sm font-medium text-surface-600 dark:text-surface-400">Stripe + color:</div>
            <CuiProgress :value="60" animation="stripe" color="success" />
          </div>
          <div>
            <div class="mb-1 text-sm font-medium text-surface-600 dark:text-surface-400">Shimmer + color:</div>
            <CuiProgress :value="85" animation="shimmer" color="warning" show-label />
          </div>
        </CuiStack>
      </Example>

      <!-- With label -->
      <Example title="With Label" :code="`<CuiProgress :value=&quot;45&quot; show-label />`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiProgress :value="45" show-label />
          <CuiProgress :value="87" show-label color="success" />
        </CuiStack>
      </Example>

      <!-- Custom label slot -->
      <Example title="Custom Label Slot" :code="`<CuiProgress :value=&quot;3&quot; :max=&quot;10&quot;>
  <template #label=&quot;{ value, max }&quot;>{{ value }} of {{ max }} files</template>
</CuiProgress>`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiProgress :value="3" :max="10">
            <template #label="{ value, max }">{{ value }} of {{ max }} files</template>
          </CuiProgress>
          <CuiProgress :value="750" :max="1000" color="info">
            <template #label="{ value, max }">{{ value }}MB / {{ max }}MB</template>
          </CuiProgress>
        </CuiStack>
      </Example>

      <!-- Indeterminate bar -->
      <Example title="Indeterminate Bar" :code="`<CuiProgress indeterminate />
<CuiProgress indeterminate color=&quot;success&quot; size=&quot;sm&quot; />
<CuiProgress indeterminate color=&quot;warning&quot; size=&quot;lg&quot; />`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiProgress indeterminate />
          <CuiProgress indeterminate color="success" size="sm" />
          <CuiProgress indeterminate color="warning" size="lg" />
        </CuiStack>
      </Example>

      <!-- Animated value change -->
      <Example title="Animated Value Change" :code="`<CuiProgress :value=&quot;animated&quot; show-label color=&quot;success&quot; size=&quot;lg&quot; />`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiProgress :value="animated" show-label color="success" size="lg" />
          <CuiButton size="sm" variant="outline" @click="startAnimation">Restart</CuiButton>
        </CuiStack>
      </Example>

      <!-- Circle basic -->
      <Example title="Circle Variant" :code="`<CuiProgress variant=&quot;circle&quot; :value=&quot;75&quot; show-label />`">
        <CuiFlex gap="6" class="items-center flex-wrap">
          <CuiProgress variant="circle" :value="25" show-label />
          <CuiProgress variant="circle" :value="50" show-label />
          <CuiProgress variant="circle" :value="75" show-label />
          <CuiProgress variant="circle" :value="100" show-label color="success" />
        </CuiFlex>
      </Example>

      <!-- Circle sizes -->
      <Example title="Circle Sizes" :code="`<CuiProgress variant=&quot;circle&quot; :value=&quot;65&quot; size=&quot;sm&quot; show-label />
<CuiProgress variant=&quot;circle&quot; :value=&quot;65&quot; size=&quot;md&quot; show-label />
<CuiProgress variant=&quot;circle&quot; :value=&quot;65&quot; size=&quot;lg&quot; show-label />`">
        <CuiFlex gap="6" class="items-center flex-wrap">
          <CuiProgress variant="circle" :value="65" size="sm" show-label />
          <CuiProgress variant="circle" :value="65" size="md" show-label />
          <CuiProgress variant="circle" :value="65" size="lg" show-label />
        </CuiFlex>
      </Example>

      <!-- Circle colors -->
      <Example title="Circle Colors" :code="`<CuiProgress variant=&quot;circle&quot; :value=&quot;70&quot; color=&quot;primary&quot; show-label />
<CuiProgress variant=&quot;circle&quot; :value=&quot;70&quot; color=&quot;success&quot; show-label />
<CuiProgress variant=&quot;circle&quot; :value=&quot;70&quot; color=&quot;warning&quot; show-label />`">
        <CuiFlex gap="4" class="items-center flex-wrap">
          <CuiProgress variant="circle" :value="70" color="primary" show-label size="sm" />
          <CuiProgress variant="circle" :value="70" color="success" show-label size="sm" />
          <CuiProgress variant="circle" :value="70" color="error" show-label size="sm" />
          <CuiProgress variant="circle" :value="70" color="warning" show-label size="sm" />
          <CuiProgress variant="circle" :value="70" color="info" show-label size="sm" />
        </CuiFlex>
      </Example>

      <!-- Circle indeterminate -->
      <Example title="Circle Indeterminate" :code="`<CuiProgress variant=&quot;circle&quot; indeterminate />
<CuiProgress variant=&quot;circle&quot; indeterminate color=&quot;success&quot; />
<CuiProgress variant=&quot;circle&quot; indeterminate color=&quot;error&quot; size=&quot;lg&quot; />`">
        <CuiFlex gap="6" class="items-center flex-wrap">
          <CuiProgress variant="circle" indeterminate size="sm" />
          <CuiProgress variant="circle" indeterminate color="success" />
          <CuiProgress variant="circle" indeterminate color="error" size="lg" />
        </CuiFlex>
      </Example>

      <!-- Circle custom label -->
      <Example title="Circle with Custom Label" :code="`<CuiProgress variant=&quot;circle&quot; :value=&quot;animated&quot; size=&quot;lg&quot; color=&quot;success&quot;>
  <template #label=&quot;{ percent }&quot;>
    {{ Math.round(percent) }}
  </template>
</CuiProgress>`">
        <CuiFlex gap="6" class="items-center flex-wrap">
          <CuiProgress variant="circle" :value="animated" size="lg" color="success">
            <template #label="{ percent }">
              <span style="font-size: 0.75rem; font-weight: 400;">Score</span>
              <br />
              {{ Math.round(percent) }}
            </template>
          </CuiProgress>
          <CuiProgress variant="circle" :value="3" :max="5" size="lg" color="warning">
            <template #label="{ value, max }">{{ value }}/{{ max }}</template>
          </CuiProgress>
        </CuiFlex>
      </Example>

      <!-- Real-world: dashboard cards -->
      <Example title="Real-World: Dashboard Stats" :code="`<CuiCard variant=&quot;outline&quot;>
  <CuiCardBody class=&quot;text-center&quot;>
    <CuiProgress variant=&quot;circle&quot; :value=&quot;87&quot; color=&quot;success&quot; show-label size=&quot;lg&quot; />
    <div class=&quot;mt-2 text-sm font-medium&quot;>Uptime</div>
  </CuiCardBody>
</CuiCard>`">
        <CuiGrid :cols="{ sm: 1, md: 3 }" gap="4">
          <CuiCard variant="outline">
            <CuiCardBody class="text-center">
              <CuiProgress variant="circle" :value="87" color="success" show-label size="lg" />
              <div class="mt-2 text-sm font-medium">Uptime</div>
            </CuiCardBody>
          </CuiCard>
          <CuiCard variant="outline">
            <CuiCardBody class="text-center">
              <CuiProgress variant="circle" :value="42" color="warning" show-label size="lg" />
              <div class="mt-2 text-sm font-medium">Storage</div>
            </CuiCardBody>
          </CuiCard>
          <CuiCard variant="outline">
            <CuiCardBody class="text-center">
              <CuiProgress variant="circle" :value="95" color="error" show-label size="lg" />
              <div class="mt-2 text-sm font-medium">CPU Load</div>
            </CuiCardBody>
          </CuiCard>
        </CuiGrid>
      </Example>

    </template>
  </DocPage>
</template>
