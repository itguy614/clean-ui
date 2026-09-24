<script setup lang="ts">
import { ref } from "vue";
import { CuiBadge, CuiButton, CuiCard, CuiCardBody, CuiFlex, CuiInput, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/badge";

const tags = ref(["Vue", "TypeScript", "Tailwind", "Vite"]);

function removeTag(tag: string) {
  tags.value = tags.value.filter((t) => t !== tag);
}

function resetTags() {
  tags.value = ["Vue", "TypeScript", "Tailwind", "Vite"];
}
</script>

<template>
  <DocPage :meta="meta">
    <template #intro>
      <CuiCard variant="outline">
        <CuiCardBody>
          <p class="text-sm text-surface-700 dark:text-surface-300">
            <strong><code>color</code> vs <code>variant</code>:</strong>
            <code>color</code> sets the semantic role (<code>primary</code>,
            <code>success</code>, <code>error</code>, <code>warning</code>,
            <code>info</code>, …); <code>variant</code> sets the visual style
            (<code>solid</code>, <code>subtle</code>, <code>outline</code>).
            Passing a role name to <code>variant</code> (e.g.
            <code>variant="info"</code>) won't color the badge — use
            <code>color="info"</code>. Note the role for “danger” is
            <code>error</code>.
          </p>
        </CuiCardBody>
      </CuiCard>
    </template>

    <template #usage>
      <Example
        code-open
        :code="`<CuiBadge color=&quot;success&quot;>Active</CuiBadge>
<CuiBadge color=&quot;warning&quot;>Pending</CuiBadge>
<CuiBadge variant=&quot;solid&quot; color=&quot;error&quot;>3</CuiBadge>`"
      >
        <CuiFlex gap="3" class="items-center flex-wrap">
          <CuiBadge color="success">Active</CuiBadge>
          <CuiBadge color="warning">Pending</CuiBadge>
          <CuiBadge variant="solid" color="error">3</CuiBadge>
        </CuiFlex>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        A badge is a <code>&lt;span&gt;</code> with no role of its own — it reads as the
        text inside it, in document order. That is usually what you want, and it is also
        the thing to watch: a badge carries meaning through colour, and colour alone is
        never conveyed.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <code>dot</code> renders no text at all, so it is invisible to a screen reader.
          Always pair it with a visible label (“Online”), or give the wrapper an
          <code>aria-label</code>.
        </li>
        <li>
          A count badge pinned to a button is not part of that button's accessible name.
          Put the whole meaning in the button — <code>aria-label="Inbox, 5 unread"</code>
          — rather than leaving “Inbox” and “5” as two unrelated pieces of text.
        </li>
        <li>
          The <code>removable</code> button gets an accessible name from the library's
          <code>remove</code> message (“Remove”), so it is never an unlabelled icon button.
          It does not include the tag name — wrap the badge in a labelled group, or override
          the message, if “Remove” on its own is ambiguous.
        </li>
        <li>
          A badge that changes while the page is open (an unread count) is not announced.
          Wrap it in your own <code>aria-live="polite"</code> region if the change matters.
        </li>
        <li>
          <code>animation</code> runs indefinitely. Animation that cannot be stopped is a
          WCAG 2.2.2 problem, so use it for a moment of arrival, not as a permanent state.
        </li>
      </ul>
    </template>

    <template #examples>

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

      <!-- Rounded -->
      <Example title="Rounded" :code="`<CuiBadge rounded=&quot;none&quot;>Square</CuiBadge>
<CuiBadge rounded=&quot;md&quot;>Medium</CuiBadge>
<CuiBadge rounded=&quot;full&quot;>Pill</CuiBadge>`">
        <CuiFlex gap="3" class="items-center flex-wrap">
          <CuiBadge rounded="none">Square</CuiBadge>
          <CuiBadge rounded="md">Medium</CuiBadge>
          <CuiBadge rounded="full">Pill (default)</CuiBadge>
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

    </template>
  </DocPage>
</template>
