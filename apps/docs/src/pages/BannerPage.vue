<script setup lang="ts">
import { ref } from "vue";
import { CuiBanner, CuiButton, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import meta from "../meta/banner";
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
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiBanner color=&quot;info&quot; inline&gt;
  Scheduled maintenance this Sunday at 02:00 UTC.
&lt;/CuiBanner&gt;`"
      >
        <CuiBanner color="info" inline>
          Scheduled maintenance this Sunday at 02:00 UTC.
        </CuiBanner>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        A banner announces itself: <code>error</code> becomes an assertive
        <code>role="alert"</code>, every other colour a polite <code>role="status"</code>.
        Set <code>live="off"</code> to silence a promotional banner that should not
        interrupt.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          The role icon is decorative and the message carries the meaning, so colour is
          never the only signal. <code>error</code> uses an octagon rather than an
          <code>✕</code> — a cross reads as "close", and beside the dismiss button it read
          as a second one.
        </li>
        <li>
          The dismiss button is icon-only and carries an accessible name from the
          localized <code>dismiss</code> message.
        </li>
        <li>
          A pinned banner is <code>position: sticky</code>, so it stays in the document
          flow and in reading order — it does not overlay content or trap focus.
        </li>
      </ul>
    </template>

    <template #examples>

        <!-- Basic -->
        <Example title="Subtle (default)" :code="`<CuiBanner @dismiss=&quot;show = false&quot;>
  We've updated our privacy policy.
</CuiBanner>`">
          <div style="position: relative; overflow: hidden; border-radius: 0.5rem; border: 1px solid var(--cui-border); min-height: 6rem;">
            <CuiBanner v-if="show1" @dismiss="show1 = false">
              We've updated our privacy policy. Please review the changes.
            </CuiBanner>
          </div>
        </Example>

        <!-- Solid -->
        <Example title="Solid Variant" :code="`<CuiBanner variant=&quot;solid&quot; @dismiss=&quot;show = false&quot;>
  Scheduled maintenance tonight at 11 PM EST.
</CuiBanner>`">
          <div style="position: relative; overflow: hidden; border-radius: 0.5rem; border: 1px solid var(--cui-border); min-height: 6rem;">
            <CuiBanner v-if="show2" variant="solid" @dismiss="show2 = false">
              Scheduled maintenance tonight at 11 PM EST. Expect brief downtime.
            </CuiBanner>
          </div>
        </Example>

        <!-- Colors -->
        <Example title="Colors" :code="`<CuiBanner color=&quot;primary&quot; :dismissible=&quot;false&quot;>Primary announcement</CuiBanner>
<CuiBanner color=&quot;success&quot; :dismissible=&quot;false&quot;>Account verified</CuiBanner>
<CuiBanner color=&quot;warning&quot; :dismissible=&quot;false&quot;>Subscription expires in 3 days</CuiBanner>
<CuiBanner color=&quot;error&quot; :dismissible=&quot;false&quot;>Payment failed</CuiBanner>
<CuiBanner color=&quot;info&quot; :dismissible=&quot;false&quot;>Version 2.0 available</CuiBanner>`">
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
        <Example title="Solid Colors" :code="`<CuiBanner color=&quot;primary&quot; variant=&quot;solid&quot; :dismissible=&quot;false&quot;>Solid primary</CuiBanner>
<CuiBanner color=&quot;error&quot; variant=&quot;solid&quot; :dismissible=&quot;false&quot;>Service outage</CuiBanner>`">
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
        <Example title="Bottom Position" :code="`<CuiBanner position=&quot;bottom&quot; color=&quot;info&quot; @dismiss=&quot;show = false&quot;>
  This banner sticks to the bottom.
</CuiBanner>`">
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

    </template>
  </DocPage>
</template>
