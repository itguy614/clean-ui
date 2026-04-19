<script setup lang="ts">
import { ref } from "vue";
import { CuiAlert, CuiButton, CuiFlex, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const showDismissible = ref(true);
const showAuto = ref(false);
const showEntrance = ref({ fade: false, slideDown: false, slideLeft: false });
const showShake = ref(true);
const showGlow = ref(true);
const showPulse = ref(true);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Alert</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Contextual feedback messages with role-specific icons, entrance
        animations, persistent attention effects, dismissible and auto-dismiss.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'info', description: 'Color role (auto-selects icon)' },
          { name: 'variant', type: 'solid | subtle | outline', default: 'subtle', description: 'Visual style' },
          { name: 'title', type: 'string', default: '-', description: 'Bold title text' },
          { name: 'noIcon', type: 'boolean', default: 'false', description: 'Hide the default role icon' },
          { name: 'dismissible', type: 'boolean', default: 'false', description: 'Show X dismiss button' },
          { name: 'autoDismiss', type: 'number', default: '-', description: 'Auto-dismiss after N milliseconds' },
          { name: 'entrance', type: 'fade | slide-down | slide-left | none', default: 'fade', description: 'Entrance animation on mount' },
          { name: 'animation', type: 'pulse | glow | shake | none', default: 'none', description: 'Persistent attention animation' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Slots</h2>
      <PropTable
        :props="[
          { name: 'default', type: 'slot', default: '-', description: 'Description/body text' },
          { name: '#icon', type: 'slot', default: '-', description: 'Custom icon (overrides auto-icon)' },
          { name: '#actions', type: 'slot', default: '-', description: 'Action buttons in the footer' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- All Colors (subtle) -->
        <Example title="Colors (subtle — default)" :code="`<CuiAlert color=&quot;success&quot; title=&quot;Success&quot; entrance=&quot;none&quot;>Your changes have been saved.</CuiAlert>
<CuiAlert color=&quot;error&quot; title=&quot;Error&quot; entrance=&quot;none&quot;>Something went wrong.</CuiAlert>
<CuiAlert color=&quot;warning&quot; title=&quot;Warning&quot; entrance=&quot;none&quot;>Session expires soon.</CuiAlert>
<CuiAlert color=&quot;info&quot; title=&quot;Info&quot; entrance=&quot;none&quot;>A new version is available.</CuiAlert>`">
          <CuiStack spacing="3">
            <CuiAlert color="primary" title="Primary" entrance="none">
              This is a primary alert with auto icon.
            </CuiAlert>
            <CuiAlert color="secondary" title="Secondary" entrance="none">
              This is a secondary alert with auto icon.
            </CuiAlert>
            <CuiAlert color="success" title="Success" entrance="none">
              Your changes have been saved successfully.
            </CuiAlert>
            <CuiAlert color="error" title="Error" entrance="none">
              Something went wrong. Please try again.
            </CuiAlert>
            <CuiAlert color="warning" title="Warning" entrance="none">
              Your session will expire in 5 minutes.
            </CuiAlert>
            <CuiAlert color="info" title="Info" entrance="none">
              A new version is available. Refresh to update.
            </CuiAlert>
          </CuiStack>
        </Example>

        <!-- Solid Variant -->
        <Example title="Solid Variant" :code="`<CuiAlert variant=&quot;solid&quot; color=&quot;success&quot; title=&quot;Payment Received&quot; entrance=&quot;none&quot;>
  Your payment has been processed.
</CuiAlert>
<CuiAlert variant=&quot;solid&quot; color=&quot;error&quot; title=&quot;Connection Lost&quot; entrance=&quot;none&quot;>
  Unable to reach the server.
</CuiAlert>`">
          <CuiStack spacing="3">
            <CuiAlert variant="solid" color="success" title="Payment Received" entrance="none">
              Your payment of $49.99 has been processed.
            </CuiAlert>
            <CuiAlert variant="solid" color="error" title="Connection Lost" entrance="none">
              Unable to reach the server. Check your internet connection.
            </CuiAlert>
          </CuiStack>
        </Example>

        <!-- Outline Variant -->
        <Example title="Outline Variant" :code="`<CuiAlert variant=&quot;outline&quot; color=&quot;info&quot; title=&quot;Tip&quot; entrance=&quot;none&quot;>
  You can use keyboard shortcuts to navigate faster.
</CuiAlert>`">
          <CuiStack spacing="3">
            <CuiAlert variant="outline" color="info" title="Tip" entrance="none">
              You can use keyboard shortcuts to navigate faster.
            </CuiAlert>
            <CuiAlert variant="outline" color="warning" title="Deprecation Notice" entrance="none">
              This API endpoint will be removed in v3.0.
            </CuiAlert>
          </CuiStack>
        </Example>

        <!-- No Icon -->
        <Example title="Without Icon" :code="`<CuiAlert color=&quot;info&quot; title=&quot;Simple Message&quot; no-icon entrance=&quot;none&quot;>
  Sometimes you just need text without the icon.
</CuiAlert>`">
          <CuiAlert color="info" title="Simple Message" no-icon entrance="none">
            Sometimes you just need text without the icon.
          </CuiAlert>
        </Example>

        <!-- Custom Icon -->
        <Example title="Custom Icon Slot" :code="`<CuiAlert color=&quot;primary&quot; title=&quot;Rocket Launched&quot; entrance=&quot;none&quot;>
  <template #icon>🚀</template>
  Your deployment is live and serving traffic.
</CuiAlert>`">
          <CuiAlert color="primary" title="Rocket Launched" entrance="none">
            <template #icon>🚀</template>
            Your deployment is live and serving traffic.
          </CuiAlert>
        </Example>

        <!-- Title Only / Description Only -->
        <Example title="Title Only &amp; Description Only" :code="`<CuiAlert color=&quot;success&quot; title=&quot;File uploaded successfully&quot; entrance=&quot;none&quot; />
<CuiAlert color=&quot;info&quot; entrance=&quot;none&quot;>
  Click the button below to get started.
</CuiAlert>`">
          <CuiStack spacing="3">
            <CuiAlert color="success" title="File uploaded successfully" entrance="none" />
            <CuiAlert color="info" entrance="none">
              Click the button below to get started with your new project.
            </CuiAlert>
          </CuiStack>
        </Example>

        <!-- With Actions -->
        <Example title="With Action Buttons" :code="`<CuiAlert color=&quot;error&quot; title=&quot;Upload Failed&quot;>
  Something went wrong.
  <template #actions>
    <CuiButton size=&quot;sm&quot; variant=&quot;solid&quot;>Retry</CuiButton>
  </template>
</CuiAlert>`">
          <CuiStack spacing="3">
            <CuiAlert color="error" title="Upload Failed" entrance="none">
              The file could not be uploaded. The server returned a 500 error.
              <template #actions>
                <CuiButton size="sm" variant="solid" color="error">Retry Upload</CuiButton>
                <CuiButton size="sm" variant="ghost" color="error">Cancel</CuiButton>
              </template>
            </CuiAlert>
            <CuiAlert color="info" title="New Feature Available" entrance="none">
              Dark mode is now available in settings.
              <template #actions>
                <CuiButton size="sm" variant="solid" color="info">Try It</CuiButton>
                <CuiButton size="sm" variant="ghost" color="secondary">Later</CuiButton>
              </template>
            </CuiAlert>
          </CuiStack>
        </Example>

        <!-- Dismissible -->
        <Example title="Dismissible" :code="`<CuiAlert
  color=&quot;warning&quot;
  title=&quot;Heads Up&quot;
  dismissible
  entrance=&quot;none&quot;
  @dismiss=&quot;show = false&quot;
>
  This alert can be dismissed.
</CuiAlert>`">
          <CuiStack spacing="3">
            <CuiAlert
              v-if="showDismissible"
              color="warning"
              title="Heads Up"
              dismissible
              entrance="none"
              @dismiss="showDismissible = false"
            >
              This alert can be dismissed by clicking the X button.
            </CuiAlert>
            <CuiButton
              v-if="!showDismissible"
              size="sm"
              variant="ghost"
              @click="showDismissible = true"
            >
              Show alert again
            </CuiButton>
          </CuiStack>
        </Example>

        <!-- Auto-dismiss -->
        <Example title="Auto-Dismiss (3 seconds)" :code="`<CuiAlert
  color=&quot;success&quot;
  title=&quot;Saved!&quot;
  :auto-dismiss=&quot;3000&quot;
  entrance=&quot;slide-down&quot;
  @dismiss=&quot;show = false&quot;
>
  This alert disappears in 3 seconds.
</CuiAlert>`">
          <CuiStack spacing="3">
            <CuiAlert
              v-if="showAuto"
              color="success"
              title="Saved!"
              :auto-dismiss="3000"
              entrance="slide-down"
              @dismiss="showAuto = false"
            >
              Your changes were saved. This alert will disappear in 3 seconds.
            </CuiAlert>
            <CuiButton
              size="sm"
              variant="solid"
              color="success"
              @click="showAuto = true"
            >
              Trigger Auto-Dismiss Alert
            </CuiButton>
          </CuiStack>
        </Example>

        <!-- Entrance Animations -->
        <Example title="Entrance Animations" :code="`<CuiAlert color=&quot;info&quot; entrance=&quot;fade&quot; title=&quot;Fade&quot; />
<CuiAlert color=&quot;success&quot; entrance=&quot;slide-down&quot; title=&quot;Slide Down&quot; />
<CuiAlert color=&quot;warning&quot; entrance=&quot;slide-left&quot; title=&quot;Slide Left&quot; />`">
          <CuiStack spacing="3">
            <CuiFlex gap="3" class="flex-wrap">
              <CuiButton size="sm" variant="outline" @click="showEntrance.fade = !showEntrance.fade">
                {{ showEntrance.fade ? 'Hide' : 'Show' }} Fade
              </CuiButton>
              <CuiButton size="sm" variant="outline" @click="showEntrance.slideDown = !showEntrance.slideDown">
                {{ showEntrance.slideDown ? 'Hide' : 'Show' }} Slide Down
              </CuiButton>
              <CuiButton size="sm" variant="outline" @click="showEntrance.slideLeft = !showEntrance.slideLeft">
                {{ showEntrance.slideLeft ? 'Hide' : 'Show' }} Slide Left
              </CuiButton>
            </CuiFlex>
            <CuiAlert
              v-if="showEntrance.fade"
              color="info"
              title="Fade entrance"
              entrance="fade"
              dismissible
              @dismiss="showEntrance.fade = false"
            />
            <CuiAlert
              v-if="showEntrance.slideDown"
              color="success"
              title="Slide-down entrance"
              entrance="slide-down"
              dismissible
              @dismiss="showEntrance.slideDown = false"
            />
            <CuiAlert
              v-if="showEntrance.slideLeft"
              color="warning"
              title="Slide-left entrance"
              entrance="slide-left"
              dismissible
              @dismiss="showEntrance.slideLeft = false"
            />
          </CuiStack>
        </Example>

        <!-- Persistent Animations -->
        <Example title="Persistent Animations" :code="`<CuiAlert color=&quot;info&quot; animation=&quot;pulse&quot; title=&quot;Pulse&quot; entrance=&quot;none&quot; />
<CuiAlert color=&quot;warning&quot; animation=&quot;glow&quot; title=&quot;Glow&quot; entrance=&quot;none&quot; />
<CuiAlert color=&quot;error&quot; animation=&quot;shake&quot; title=&quot;Shake&quot; entrance=&quot;none&quot; />`">
          <CuiStack spacing="3">
            <CuiAlert
              v-if="showPulse"
              color="info"
              title="Pulse"
              animation="pulse"
              entrance="none"
              dismissible
              @dismiss="showPulse = false"
            >
              Gentle opacity pulse for ongoing status.
            </CuiAlert>
            <CuiAlert
              v-if="showGlow"
              color="warning"
              title="Glow"
              animation="glow"
              entrance="none"
              dismissible
              @dismiss="showGlow = false"
            >
              Box-shadow glow pulse for attention.
            </CuiAlert>
            <CuiAlert
              v-if="showShake"
              color="error"
              title="Shake"
              animation="shake"
              entrance="none"
              dismissible
              @dismiss="showShake = false"
            >
              Periodic shake for urgent errors.
            </CuiAlert>
            <CuiButton
              v-if="!showPulse || !showGlow || !showShake"
              size="sm"
              variant="ghost"
              @click="showPulse = true; showGlow = true; showShake = true"
            >
              Reset all
            </CuiButton>
          </CuiStack>
        </Example>

        <!-- Real-world combinations -->
        <Example title="Real-World Examples">
          <CuiStack spacing="3">
            <CuiAlert
              color="error"
              title="Service Outage"
              animation="glow"
              entrance="none"
            >
              Our payment processor is experiencing issues. We are actively investigating.
              <template #actions>
                <CuiButton size="sm" variant="solid" color="error">Status Page</CuiButton>
                <CuiButton size="sm" variant="ghost" color="error">Dismiss</CuiButton>
              </template>
            </CuiAlert>
            <CuiAlert color="success" title="Welcome!" entrance="none" dismissible>
              Your account has been created. Check your email to verify.
            </CuiAlert>
            <CuiAlert variant="outline" color="info" entrance="none">
              <template #icon>💡</template>
              <strong>Pro tip:</strong> Press <kbd class="cui-kbd">Ctrl</kbd> + <kbd class="cui-kbd">K</kbd> to open the command palette.
            </CuiAlert>
          </CuiStack>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
