<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { CuiButton, CuiCard, CuiCardBody, CuiFlex, CuiGrid, CuiProgress, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

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
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Progress</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Progress bar and circular ring for showing completion status.
        Supports indeterminate mode for unknown-length operations.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'value', type: 'number', default: '0', description: 'Current value (0 to max)' },
          { name: 'max', type: 'number', default: '100', description: 'Maximum value' },
          { name: 'variant', type: 'bar | circle', default: 'bar', description: 'Visual variant' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Color role' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size (bar thickness or circle diameter)' },
          { name: 'showLabel', type: 'boolean', default: 'false', description: 'Show percentage label' },
          { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Unknown progress — animated indicator' },
          { name: 'animation', type: 'none | stripe | shimmer', default: 'none', description: 'Fill animation (bar variant only)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

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
        <Example title="Bar Sizes">
          <CuiStack spacing="3" class="max-w-lg">
            <CuiProgress :value="60" size="sm" />
            <CuiProgress :value="60" size="md" />
            <CuiProgress :value="60" size="lg" />
          </CuiStack>
        </Example>

        <!-- Colors -->
        <Example title="Colors">
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
        <Example title="Indeterminate Bar">
          <CuiStack spacing="3" class="max-w-lg">
            <CuiProgress indeterminate />
            <CuiProgress indeterminate color="success" size="sm" />
            <CuiProgress indeterminate color="warning" size="lg" />
          </CuiStack>
        </Example>

        <!-- Animated value change -->
        <Example title="Animated Value Change">
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
        <Example title="Circle Sizes">
          <CuiFlex gap="6" class="items-center flex-wrap">
            <CuiProgress variant="circle" :value="65" size="sm" show-label />
            <CuiProgress variant="circle" :value="65" size="md" show-label />
            <CuiProgress variant="circle" :value="65" size="lg" show-label />
          </CuiFlex>
        </Example>

        <!-- Circle colors -->
        <Example title="Circle Colors">
          <CuiFlex gap="4" class="items-center flex-wrap">
            <CuiProgress variant="circle" :value="70" color="primary" show-label size="sm" />
            <CuiProgress variant="circle" :value="70" color="success" show-label size="sm" />
            <CuiProgress variant="circle" :value="70" color="error" show-label size="sm" />
            <CuiProgress variant="circle" :value="70" color="warning" show-label size="sm" />
            <CuiProgress variant="circle" :value="70" color="info" show-label size="sm" />
          </CuiFlex>
        </Example>

        <!-- Circle indeterminate -->
        <Example title="Circle Indeterminate">
          <CuiFlex gap="6" class="items-center flex-wrap">
            <CuiProgress variant="circle" indeterminate size="sm" />
            <CuiProgress variant="circle" indeterminate color="success" />
            <CuiProgress variant="circle" indeterminate color="error" size="lg" />
          </CuiFlex>
        </Example>

        <!-- Circle custom label -->
        <Example title="Circle with Custom Label">
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
        <Example title="Real-World: Dashboard Stats">
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

      </CuiStack>
    </div>
  </CuiStack>
</template>
