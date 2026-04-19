<script setup lang="ts">
import { ref } from "vue";
import { CuiBanner, CuiButton, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const show1 = ref(true);
const show2 = ref(true);
const show3 = ref(true);
const show4 = ref(true);
const show5 = ref(true);

function resetAll() {
  show1.value = true;
  show2.value = true;
  show3.value = true;
  show4.value = true;
  show5.value = true;
}
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Banner</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A full-width notification bar that sticks to the top or bottom of a container.
        Use for announcements, cookie notices, maintenance alerts, or promotions.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Color role' },
          { name: 'variant', type: 'solid | subtle', default: 'subtle', description: 'Visual variant' },
          { name: 'position', type: 'top | bottom', default: 'top', description: 'Sticky position' },
          { name: 'dismissible', type: 'boolean', default: 'true', description: 'Show dismiss button' },
          { name: 'noIcon', type: 'boolean', default: 'false', description: 'Hide default role icon' },
          { name: 'storageKey', type: 'string', default: '—', description: 'Persist dismissal to localStorage under this key' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Slots</h2>
      <PropTable
        :props="[
          { name: 'default', type: 'slot', default: '—', description: 'Banner message content' },
          { name: 'actions', type: 'slot', default: '—', description: 'Action buttons (e.g., Learn More, Accept)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>

      <CuiButton size="sm" variant="outline" style="margin-bottom: 1rem;" @click="resetAll">Reset All Banners</CuiButton>

      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Subtle (default)">
          <div style="position: relative; overflow: hidden; border-radius: 0.5rem; border: 1px solid var(--cui-border); min-height: 6rem;">
            <CuiBanner v-if="show1" @dismiss="show1 = false">
              We've updated our privacy policy. Please review the changes.
            </CuiBanner>
          </div>
        </Example>

        <!-- Solid -->
        <Example title="Solid Variant">
          <div style="position: relative; overflow: hidden; border-radius: 0.5rem; border: 1px solid var(--cui-border); min-height: 6rem;">
            <CuiBanner v-if="show2" variant="solid" @dismiss="show2 = false">
              Scheduled maintenance tonight at 11 PM EST. Expect brief downtime.
            </CuiBanner>
          </div>
        </Example>

        <!-- Colors -->
        <Example title="Colors">
          <CuiStack spacing="2">
            <div style="position: relative; overflow: hidden; border-radius: 0.375rem;">
              <CuiBanner color="primary" :dismissible="false">Primary: New features available!</CuiBanner>
            </div>
            <div style="position: relative; overflow: hidden; border-radius: 0.375rem;">
              <CuiBanner color="success" :dismissible="false">Success: Your account has been verified.</CuiBanner>
            </div>
            <div style="position: relative; overflow: hidden; border-radius: 0.375rem;">
              <CuiBanner color="warning" :dismissible="false">Warning: Your subscription expires in 3 days.</CuiBanner>
            </div>
            <div style="position: relative; overflow: hidden; border-radius: 0.375rem;">
              <CuiBanner color="error" :dismissible="false">Error: Payment failed. Please update your card.</CuiBanner>
            </div>
            <div style="position: relative; overflow: hidden; border-radius: 0.375rem;">
              <CuiBanner color="info" :dismissible="false">Info: Version 2.0 is now available.</CuiBanner>
            </div>
          </CuiStack>
        </Example>

        <!-- With actions -->
        <Example title="With Action Buttons" :code="`<CuiBanner color=&quot;warning&quot;>
  We use cookies...
  <template #actions>
    <CuiButton size=&quot;xs&quot; variant=&quot;solid&quot;>Accept</CuiButton>
  </template>
</CuiBanner>`">
          <div style="position: relative; overflow: hidden; border-radius: 0.5rem; border: 1px solid var(--cui-border); min-height: 6rem;">
            <CuiBanner v-if="show3" color="warning" @dismiss="show3 = false">
              We use cookies to improve your experience. By continuing, you agree to our cookie policy.
              <template #actions>
                <CuiButton size="xs" variant="solid" color="warning">Accept All</CuiButton>
              </template>
            </CuiBanner>
          </div>
        </Example>

        <!-- Solid colors -->
        <Example title="Solid Colors">
          <CuiStack spacing="2">
            <div style="position: relative; overflow: hidden; border-radius: 0.375rem;">
              <CuiBanner color="primary" variant="solid" :dismissible="false">Solid primary announcement.</CuiBanner>
            </div>
            <div style="position: relative; overflow: hidden; border-radius: 0.375rem;">
              <CuiBanner color="error" variant="solid" :dismissible="false">Solid error: Service outage in progress.</CuiBanner>
            </div>
            <div style="position: relative; overflow: hidden; border-radius: 0.375rem;">
              <CuiBanner color="success" variant="solid" :dismissible="false">Solid success: All systems operational.</CuiBanner>
            </div>
          </CuiStack>
        </Example>

        <!-- Bottom position -->
        <Example title="Bottom Position">
          <div style="position: relative; overflow: hidden; border-radius: 0.5rem; border: 1px solid var(--cui-border); min-height: 8rem;">
            <div style="padding: 1rem; color: var(--cui-text-secondary); font-size: 0.875rem;">
              Page content here...
            </div>
            <CuiBanner v-if="show4" position="bottom" color="info" @dismiss="show4 = false">
              This banner sticks to the bottom.
              <template #actions>
                <CuiButton size="xs" variant="outline" color="info">Learn More</CuiButton>
              </template>
            </CuiBanner>
          </div>
        </Example>

        <!-- Non-dismissible -->
        <Example title="Non-Dismissible" :code="`<CuiBanner :dismissible=&quot;false&quot;>...</CuiBanner>`">
          <div style="position: relative; overflow: hidden; border-radius: 0.375rem;">
            <CuiBanner color="error" variant="solid" :dismissible="false">
              System maintenance in progress. Some features may be unavailable.
            </CuiBanner>
          </div>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
