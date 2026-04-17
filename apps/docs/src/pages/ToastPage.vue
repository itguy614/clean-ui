<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiCard, CuiCardBody, CuiFlex, CuiStack, CuiToastProvider, useToast } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const collapsedToasts = ref<Array<{ id: string; title: string; color: string }>>([]);
let collapsedCounter = 0;

function addCollapsedToast() {
  const colors = ["primary", "success", "error", "warning", "info", "secondary"] as const;
  collapsedCounter++;
  const color = colors[(collapsedCounter - 1) % colors.length];
  collapsedToasts.value.push({
    id: `collapsed-${collapsedCounter}`,
    title: `Notification ${collapsedCounter}`,
    color,
  });
  if (collapsedToasts.value.length > 5) {
    collapsedToasts.value.shift();
  }
}

function clearCollapsedToasts() {
  collapsedToasts.value = [];
}

const { toast, dismissAll } = useToast();

function basicToast() {
  toast({ title: "Hello!", description: "This is a basic toast notification.", color: "primary" });
}

function successToast() {
  toast.success("Changes saved", { description: "Your profile has been updated successfully." });
}

function errorToast() {
  toast.error("Upload failed", { description: "The file could not be uploaded. Please try again." });
}

function warningToast() {
  toast.warning("Session expiring", { description: "Your session will expire in 5 minutes." });
}

function infoToast() {
  toast.info("New update available", { description: "Version 2.0 is ready to install." });
}

function noProgressToast() {
  toast({ title: "No progress bar", color: "secondary", showProgress: false, autoDismiss: 3000 });
}

function persistentToast() {
  toast({ title: "I won't go away", description: "Dismiss me manually.", color: "error", autoDismiss: 0, showProgress: false });
}

function pulseToast() {
  toast({ title: "Pulsing!", color: "info", animation: "pulse" });
}

function glowToast() {
  toast({ title: "Glowing!", color: "warning", animation: "glow" });
}

function shakeToast() {
  toast({ title: "Urgent!", description: "Requires immediate attention.", color: "error", animation: "shake" });
}

function customIconToast() {
  toast({ title: "Deployed!", description: "v2.1.0 is live.", icon: "🚀", color: "success" });
}

function stackTest() {
  toast.success("Toast 1");
  setTimeout(() => toast.info("Toast 2"), 200);
  setTimeout(() => toast.warning("Toast 3"), 400);
  setTimeout(() => toast.error("Toast 4"), 600);
  setTimeout(() => toast({ title: "Toast 5", color: "secondary" }), 800);
}

const colors = ["primary", "success", "error", "warning", "info", "secondary"] as const;
function floodTest() {
  for (let i = 1; i <= 15; i++) {
    setTimeout(() => {
      toast({
        title: `Notification ${i}`,
        description: `This is toast number ${i} of 15.`,
        color: colors[(i - 1) % colors.length],
        autoDismiss: 15000,
      });
    }, i * 150);
  }
}
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Toast</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Floating notification messages with auto-dismiss, progress countdown,
        stacking, and animations. Programmatic API via
        <code class="cui-code">useToast()</code> or template-based
        <code class="cui-code">CuiToast</code>.
      </p>
    </div>

    <!-- Provider Props -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiToastProvider Props</h2>
      <PropTable
        :props="[
          { name: 'position', type: 'top-right | top-left | top-center | bottom-right | bottom-left | bottom-center', default: 'bottom-center', description: 'Screen position for toasts' },
          { name: 'stackMode', type: 'expanded | collapsed', default: 'expanded', description: 'How multiple toasts display' },
          { name: 'maxToasts', type: 'number', default: '5', description: 'Maximum visible toasts before oldest dismissed' },
        ]"
      />
    </div>

    <!-- Toast Options -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Toast Options (useToast)</h2>
      <PropTable
        :props="[
          { name: 'title', type: 'string', default: '-', description: 'Title text' },
          { name: 'description', type: 'string', default: '-', description: 'Description text' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Color role with auto-icon' },
          { name: 'dismissible', type: 'boolean', default: 'true', description: 'Show X dismiss button' },
          { name: 'autoDismiss', type: 'number', default: '5000', description: 'Auto-dismiss after N ms (0 to disable)' },
          { name: 'showProgress', type: 'boolean', default: 'true', description: 'Show countdown progress bar' },
          { name: 'animation', type: 'pulse | glow | shake | none', default: 'none', description: 'Persistent attention animation' },
          { name: 'icon', type: 'string', default: '-', description: 'Custom icon (emoji/text)' },
          { name: 'noIcon', type: 'boolean', default: 'false', description: 'Hide the auto-icon' },
        ]"
      />
    </div>

    <!-- Composable API -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">useToast() API</h2>
      <CuiCard>
        <CuiCardBody>
          <pre class="cui-pre"><code>import { useToast } from '@itguy614/clean-ui'

const { toast, dismiss, dismissAll } = useToast()

// Generic
toast({ title: 'Hello', color: 'primary' })

// Convenience methods
toast.success('Saved!')
toast.error('Failed', { description: 'Try again.' })
toast.warning('Watch out')
toast.info('FYI')

// Returns id for manual dismiss
const id = toast({ title: 'Sticky', autoDismiss: 0 })
dismiss(id)

// Clear all
dismissAll()</code></pre>
        </CuiCardBody>
      </CuiCard>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic Colors -->
        <Example title="Color Roles">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton variant="solid" color="primary" size="sm" @click="basicToast">Primary</CuiButton>
            <CuiButton variant="solid" color="success" size="sm" @click="successToast">Success</CuiButton>
            <CuiButton variant="solid" color="error" size="sm" @click="errorToast">Error</CuiButton>
            <CuiButton variant="solid" color="warning" size="sm" @click="warningToast">Warning</CuiButton>
            <CuiButton variant="solid" color="info" size="sm" @click="infoToast">Info</CuiButton>
          </CuiFlex>
        </Example>

        <!-- Custom Icon -->
        <Example title="Custom Icon" :code="`toast({ title: 'Deployed!', icon: '🚀', color: 'success' })`">
          <CuiButton variant="outline" size="sm" @click="customIconToast">Deploy Toast</CuiButton>
        </Example>

        <!-- No Progress / Persistent -->
        <Example title="Progress Bar Control">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton variant="outline" size="sm" @click="noProgressToast">No Progress Bar</CuiButton>
            <CuiButton variant="outline" size="sm" color="error" @click="persistentToast">Persistent (no auto-dismiss)</CuiButton>
          </CuiFlex>
        </Example>

        <!-- Animations -->
        <Example title="Persistent Animations">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton variant="outline" size="sm" @click="pulseToast">Pulse</CuiButton>
            <CuiButton variant="outline" size="sm" color="warning" @click="glowToast">Glow</CuiButton>
            <CuiButton variant="outline" size="sm" color="error" @click="shakeToast">Shake</CuiButton>
          </CuiFlex>
        </Example>

        <!-- Stacking -->
        <Example title="Stacking">
          <CuiStack spacing="3">
            <CuiFlex gap="3" class="flex-wrap">
              <CuiButton variant="solid" size="sm" @click="stackTest">Fire 5 Toasts</CuiButton>
              <CuiButton variant="solid" size="sm" color="warning" @click="floodTest">Flood 15 Toasts</CuiButton>
              <CuiButton variant="ghost" size="sm" @click="dismissAll">Dismiss All</CuiButton>
            </CuiFlex>
            <p class="text-sm text-surface-500 dark:text-surface-400">
              The provider has a max of 5 visible. Flooding 15 shows oldest being removed as new ones arrive.
            </p>
          </CuiStack>
        </Example>

        <!-- Collapsed Stack Mode — Live Demo -->
        <Example title="Collapsed Stack Mode (live preview)" :code="`<CuiToastProvider stack-mode=&quot;collapsed&quot; position=&quot;bottom-center&quot;>
  <App />
</CuiToastProvider>`">
          <CuiStack spacing="3">
            <CuiFlex gap="3" class="flex-wrap">
              <CuiButton variant="solid" size="sm" @click="addCollapsedToast">Add Toast</CuiButton>
              <CuiButton variant="ghost" size="sm" @click="clearCollapsedToasts">Clear</CuiButton>
            </CuiFlex>
            <!-- Inline collapsed preview container -->
            <div class="relative rounded-lg border border-surface-200 bg-surface-100 dark:border-surface-700 dark:bg-surface-800" style="min-height: 200px; overflow: hidden;">
              <div class="absolute bottom-0 left-1/2 flex flex-col-reverse items-center gap-2 pb-4" style="transform: translateX(-50%);">
                <div
                  v-for="(t, i) in [...collapsedToasts].reverse()"
                  :key="t.id"
                  class="rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300"
                  :style="{
                    background: `var(--cui-${t.color})`,
                    minWidth: '260px',
                    textAlign: 'center',
                    transform: i > 0 ? `scale(${1 - i * 0.05}) translateY(${i * -8}px)` : '',
                    opacity: i > 0 ? Math.max(0.4, 1 - i * 0.2) : 1,
                    maxHeight: i > 0 ? '2.5rem' : 'none',
                    overflow: 'hidden',
                    zIndex: collapsedToasts.length - i,
                    position: i > 0 ? 'absolute' : 'relative',
                    bottom: '0',
                  }"
                >
                  {{ t.title }}
                </div>
              </div>
              <div v-if="collapsedToasts.length === 0" class="flex h-full min-h-[200px] items-center justify-center text-sm text-surface-400">
                Click "Add Toast" to see collapsed stacking
              </div>
            </div>
          </CuiStack>
        </Example>

        <!-- Hover to pause -->
        <Example title="Hover to Pause">
          <div class="rounded-lg border border-surface-200 bg-surface-50 p-4 dark:border-surface-800 dark:bg-surface-900">
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Hover over any toast to pause its auto-dismiss countdown.
              The progress bar pauses and resumes when you move away.
              Try triggering a toast and hovering over it.
            </p>
          </div>
        </Example>

        <!-- Inertia Flash Integration -->
        <Example title="Inertia Flash Message Integration">
          <div class="rounded-lg border border-surface-200 bg-surface-50 p-6 dark:border-surface-800 dark:bg-surface-900">
            <p class="mb-3 text-surface-600 dark:text-surface-400">
              Bridge Laravel flash messages to toasts with a simple watcher.
              Add this to your root layout component:
            </p>
            <pre class="cui-pre"><code>import { watch } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { useToast } from '@itguy614/clean-ui'

const page = usePage()
const { toast } = useToast()

// Watch for flash messages from Laravel
watch(
  () => page.props.flash,
  (flash) => {
    if (flash?.success) {
      toast.success(flash.success)
    }
    if (flash?.error) {
      toast.error(flash.error)
    }
    if (flash?.warning) {
      toast.warning(flash.warning)
    }
    if (flash?.info) {
      toast.info(flash.info)
    }
  },
  { immediate: true }
)</code></pre>
            <p class="mt-3 text-sm text-surface-500 dark:text-surface-400">
              Laravel side: <code class="cui-code">return back()-&gt;with('success', 'Item saved!')</code>
            </p>
          </div>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
