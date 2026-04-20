<script setup lang="ts">
import { ref } from "vue";
import { CuiBadge, CuiButton, CuiFlex, CuiInput, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import EventTable from "../components/EventTable.vue";
import Example from "../components/Example.vue";
import Playground from "../components/Playground.vue";

const tags = ref(["Vue", "TypeScript", "Tailwind", "Vite"]);

function removeTag(tag: string) {
  tags.value = tags.value.filter((t) => t !== tag);
}

function resetTags() {
  tags.value = ["Vue", "TypeScript", "Tailwind", "Vite"];
}
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Badge</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Small colored labels for status indicators, counts, and removable tags.
        Supports animations for attention-grabbing feedback.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'variant', type: 'solid | subtle | outline', default: 'subtle', description: 'Visual style' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Color role' },
          { name: 'size', type: 'sm | md', default: 'sm', description: 'Badge size' },
          { name: 'dot', type: 'boolean', default: 'false', description: 'Render as a small colored dot (no text)' },
          { name: 'removable', type: 'boolean', default: 'false', description: 'Show X button, emits remove event (tag mode)' },
          { name: 'animation', type: 'pulse | bounce | ping | none', default: 'none', description: 'Attention animation' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },
        ]"
      />
    </div>

    <!-- Events -->
    <div>
      <h2 style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: 600;">Events</h2>
      <EventTable :events="[
        { name: 'remove', payload: '—', description: 'Fires when the remove button is clicked' },
      ]" />
    </div>

    <!-- Playground -->
    <div>
      <h2 style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: 600;">Playground</h2>
      <Playground
        :component="CuiBadge"
        component-name="CuiBadge"
        :props="{
          variant: { type: 'select', options: ['subtle', 'solid', 'outline'], default: 'subtle' },
          color: { type: 'select', options: ['primary', 'secondary', 'success', 'error', 'warning', 'info'], default: 'primary' },
          size: { type: 'select', options: ['sm', 'md'], default: 'sm' },
          dot: { type: 'boolean', default: false },
          removable: { type: 'boolean', default: false },
          animation: { type: 'select', options: ['pulse', 'bounce', 'ping', 'none'], default: 'none' },
        }"
        slot-content="Badge"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Variants -->
        <Example title="Variants" :code="`<CuiBadge variant=&quot;solid&quot;>Solid</CuiBadge>
<CuiBadge variant=&quot;subtle&quot;>Subtle</CuiBadge>
<CuiBadge variant=&quot;outline&quot;>Outline</CuiBadge>`">
          <CuiFlex gap="3" class="items-center flex-wrap">
            <CuiBadge variant="solid">Solid</CuiBadge>
            <CuiBadge variant="subtle">Subtle</CuiBadge>
            <CuiBadge variant="outline">Outline</CuiBadge>
          </CuiFlex>
        </Example>

        <!-- Colors — Subtle -->
        <Example title="Colors (subtle)" :code="`<CuiBadge color=&quot;primary&quot;>Primary</CuiBadge>
<CuiBadge color=&quot;secondary&quot;>Secondary</CuiBadge>
<CuiBadge color=&quot;success&quot;>Success</CuiBadge>
<CuiBadge color=&quot;error&quot;>Error</CuiBadge>
<CuiBadge color=&quot;warning&quot;>Warning</CuiBadge>
<CuiBadge color=&quot;info&quot;>Info</CuiBadge>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiBadge color="primary">Primary</CuiBadge>
            <CuiBadge color="secondary">Secondary</CuiBadge>
            <CuiBadge color="success">Success</CuiBadge>
            <CuiBadge color="error">Error</CuiBadge>
            <CuiBadge color="warning">Warning</CuiBadge>
            <CuiBadge color="info">Info</CuiBadge>
          </CuiFlex>
        </Example>

        <!-- Colors — Solid -->
        <Example title="Colors (solid)" :code="`<CuiBadge variant=&quot;solid&quot; color=&quot;primary&quot;>Primary</CuiBadge>
<CuiBadge variant=&quot;solid&quot; color=&quot;success&quot;>Success</CuiBadge>
<CuiBadge variant=&quot;solid&quot; color=&quot;error&quot;>Error</CuiBadge>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiBadge variant="solid" color="primary">Primary</CuiBadge>
            <CuiBadge variant="solid" color="secondary">Secondary</CuiBadge>
            <CuiBadge variant="solid" color="success">Success</CuiBadge>
            <CuiBadge variant="solid" color="error">Error</CuiBadge>
            <CuiBadge variant="solid" color="warning">Warning</CuiBadge>
            <CuiBadge variant="solid" color="info">Info</CuiBadge>
          </CuiFlex>
        </Example>

        <!-- Colors — Outline -->
        <Example title="Colors (outline)" :code="`<CuiBadge variant=&quot;outline&quot; color=&quot;primary&quot;>Primary</CuiBadge>
<CuiBadge variant=&quot;outline&quot; color=&quot;success&quot;>Success</CuiBadge>
<CuiBadge variant=&quot;outline&quot; color=&quot;error&quot;>Error</CuiBadge>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiBadge variant="outline" color="primary">Primary</CuiBadge>
            <CuiBadge variant="outline" color="secondary">Secondary</CuiBadge>
            <CuiBadge variant="outline" color="success">Success</CuiBadge>
            <CuiBadge variant="outline" color="error">Error</CuiBadge>
            <CuiBadge variant="outline" color="warning">Warning</CuiBadge>
            <CuiBadge variant="outline" color="info">Info</CuiBadge>
          </CuiFlex>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes" :code="`<CuiBadge size=&quot;sm&quot;>Small</CuiBadge>
<CuiBadge size=&quot;md&quot;>Medium</CuiBadge>`">
          <CuiFlex gap="3" class="items-center">
            <CuiBadge size="sm">Small</CuiBadge>
            <CuiBadge size="md">Medium</CuiBadge>
            <CuiBadge variant="solid" size="sm">Small Solid</CuiBadge>
            <CuiBadge variant="solid" size="md">Medium Solid</CuiBadge>
          </CuiFlex>
        </Example>

        <!-- Dot -->
        <Example title="Dot Indicator" :code="`<CuiBadge dot color=&quot;success&quot; />`">
          <CuiFlex gap="4" class="items-center flex-wrap">
            <CuiFlex gap="2" class="items-center">
              <CuiBadge dot color="success" /> Online
            </CuiFlex>
            <CuiFlex gap="2" class="items-center">
              <CuiBadge dot color="error" /> Offline
            </CuiFlex>
            <CuiFlex gap="2" class="items-center">
              <CuiBadge dot color="warning" /> Away
            </CuiFlex>
            <CuiFlex gap="2" class="items-center">
              <CuiBadge dot color="secondary" /> Unknown
            </CuiFlex>
            <CuiFlex gap="2" class="items-center">
              <CuiBadge dot color="success" size="md" /> Large dot
            </CuiFlex>
          </CuiFlex>
        </Example>

        <!-- Removable (tags) -->
        <Example title="Removable Tags" :code="`<CuiBadge removable @remove=&quot;removeTag(tag)&quot;>{{ tag }}</CuiBadge>`">
          <CuiStack spacing="3">
            <CuiFlex gap="2" class="flex-wrap">
              <CuiBadge
                v-for="tag in tags"
                :key="tag"
                removable
                @remove="removeTag(tag)"
              >
                {{ tag }}
              </CuiBadge>
              <CuiBadge v-if="tags.length === 0" color="secondary">No tags</CuiBadge>
            </CuiFlex>
            <CuiButton v-if="tags.length < 4" size="xs" variant="ghost" @click="resetTags">Reset tags</CuiButton>
          </CuiStack>
        </Example>

        <!-- Removable in different variants -->
        <Example title="Removable Variants" :code="`<CuiBadge removable variant=&quot;subtle&quot; color=&quot;primary&quot;>Subtle</CuiBadge>
<CuiBadge removable variant=&quot;solid&quot; color=&quot;success&quot;>Solid</CuiBadge>
<CuiBadge removable variant=&quot;outline&quot; color=&quot;error&quot;>Outline</CuiBadge>`">
          <CuiFlex gap="2" class="flex-wrap">
            <CuiBadge removable variant="subtle" color="primary">Subtle</CuiBadge>
            <CuiBadge removable variant="solid" color="success">Solid</CuiBadge>
            <CuiBadge removable variant="outline" color="error">Outline</CuiBadge>
            <CuiBadge removable variant="solid" color="info" size="md">Medium</CuiBadge>
          </CuiFlex>
        </Example>

        <!-- Animations -->
        <Example title="Animations" :code="`<CuiBadge animation=&quot;pulse&quot;>New</CuiBadge>
<CuiBadge animation=&quot;bounce&quot;>3</CuiBadge>
<CuiBadge dot animation=&quot;ping&quot; />`">
          <CuiFlex gap="6" class="items-center flex-wrap">
            <CuiFlex gap="2" class="items-center">
              <CuiBadge variant="solid" color="error" animation="pulse">New</CuiBadge>
              <span class="text-sm text-surface-500">Pulse</span>
            </CuiFlex>
            <CuiFlex gap="2" class="items-center">
              <CuiBadge variant="solid" color="error" animation="bounce">3</CuiBadge>
              <span class="text-sm text-surface-500">Bounce</span>
            </CuiFlex>
            <CuiFlex gap="2" class="items-center">
              <CuiBadge dot color="success" animation="ping" />
              <span class="text-sm text-surface-500">Ping (dot)</span>
            </CuiFlex>
            <CuiFlex gap="2" class="items-center">
              <CuiBadge dot color="error" animation="ping" />
              <span class="text-sm text-surface-500">Ping (error)</span>
            </CuiFlex>
          </CuiFlex>
        </Example>

        <!-- Use cases -->
        <Example title="Real-World Usage" :code="`<!-- Status labels -->
<CuiBadge color=&quot;success&quot;>Active</CuiBadge>
<CuiBadge color=&quot;warning&quot;>Pending</CuiBadge>
<CuiBadge color=&quot;error&quot;>Expired</CuiBadge>

<!-- With ping dot for online status -->
<CuiBadge dot color=&quot;success&quot; animation=&quot;ping&quot; />`">
          <CuiStack spacing="4">
            <!-- Status labels -->
            <div>
              <div class="mb-2 text-sm font-medium text-surface-600 dark:text-surface-400">Status labels:</div>
              <CuiFlex gap="2" class="flex-wrap">
                <CuiBadge color="success">Active</CuiBadge>
                <CuiBadge color="warning">Pending</CuiBadge>
                <CuiBadge color="error">Expired</CuiBadge>
                <CuiBadge color="secondary">Draft</CuiBadge>
                <CuiBadge color="info">Beta</CuiBadge>
              </CuiFlex>
            </div>

            <!-- Notification counts -->
            <div>
              <div class="mb-2 text-sm font-medium text-surface-600 dark:text-surface-400">With buttons:</div>
              <CuiFlex gap="3" class="flex-wrap items-center">
                <span class="relative">
                  <CuiButton variant="outline">Inbox</CuiButton>
                  <span class="absolute -right-2 -top-2">
                    <CuiBadge variant="solid" color="error" size="sm" animation="pulse">5</CuiBadge>
                  </span>
                </span>
                <span class="relative">
                  <CuiButton variant="outline">Notifications</CuiButton>
                  <span class="absolute -right-2 -top-2">
                    <CuiBadge variant="solid" color="primary" size="sm">12</CuiBadge>
                  </span>
                </span>
              </CuiFlex>
            </div>

            <!-- With input -->
            <div>
              <div class="mb-2 text-sm font-medium text-surface-600 dark:text-surface-400">Tag input pattern:</div>
              <div class="max-w-md">
                <CuiFlex gap="2" class="mb-2 flex-wrap">
                  <CuiBadge
                    v-for="tag in tags"
                    :key="tag"
                    removable
                    color="primary"
                    @remove="removeTag(tag)"
                  >
                    {{ tag }}
                  </CuiBadge>
                </CuiFlex>
                <CuiInput placeholder="Add a tag..." />
              </div>
            </div>

            <!-- Online status -->
            <div>
              <div class="mb-2 text-sm font-medium text-surface-600 dark:text-surface-400">User status:</div>
              <CuiStack spacing="2">
                <CuiFlex gap="2" class="items-center">
                  <CuiBadge dot color="success" animation="ping" />
                  <span>Alice — Online</span>
                </CuiFlex>
                <CuiFlex gap="2" class="items-center">
                  <CuiBadge dot color="warning" />
                  <span>Bob — Away</span>
                </CuiFlex>
                <CuiFlex gap="2" class="items-center">
                  <CuiBadge dot color="secondary" />
                  <span>Charlie — Offline</span>
                </CuiFlex>
              </CuiStack>
            </div>
          </CuiStack>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
