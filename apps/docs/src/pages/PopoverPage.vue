<script setup lang="ts">
import { CuiButton, CuiCard, CuiCardBody, CuiFlex, CuiGrid, CuiPopover, CuiStack, CuiBadge, CuiIcon } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Popover</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A floating panel anchored to a trigger element for displaying rich interactive content.
        Supports click, hover, and focus triggers with optional header, footer, and arrow.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'title', type: 'string', default: '—', description: 'Optional header title — renders header bar with close button' },
          { name: 'placement', type: 'top | bottom | left | right | auto', default: 'bottom', description: 'Preferred placement' },
          { name: 'trigger', type: 'click | hover | focus | hover-focus', default: 'click', description: 'How the popover is triggered' },
          { name: 'showDelay', type: 'number', default: '0', description: 'Delay before showing (ms)' },
          { name: 'hideDelay', type: 'number', default: '100', description: 'Delay before hiding (ms)' },
          { name: 'noArrow', type: 'boolean', default: 'false', description: 'Hide the arrow' },
          { name: 'offset', type: 'number', default: '10', description: 'Distance from trigger (px)' },
          { name: 'width', type: 'string', default: '—', description: 'Fixed width (e.g., &quot;320px&quot;)' },
          { name: 'visible', type: 'boolean', default: '—', description: 'Manual v-model:visible control' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Prevents showing' },
          { name: 'closable', type: 'boolean', default: 'true', description: 'Show close button in header (when title is set)' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Slots</h2>
      <PropTable
        :props="[
          { name: 'default', type: 'slot', default: '—', description: 'Trigger element' },
          { name: 'content', type: 'slot', default: '—', description: 'Popover body content' },
          { name: 'header', type: 'slot', default: '—', description: 'Override entire header (replaces title + close button)' },
          { name: 'footer', type: 'slot', default: '—', description: 'Optional footer area' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic click -->
        <Example title="Basic Click Trigger" :code="`<CuiPopover title=&quot;Notifications&quot;>
  <CuiButton variant=&quot;outline&quot;>Click me</CuiButton>
  <template #content>
    <p>You have 3 unread messages.</p>
  </template>
</CuiPopover>`">
          <CuiPopover title="Notifications">
            <CuiButton variant="outline">Click me</CuiButton>
            <template #content>
              <p>You have 3 unread messages.</p>
            </template>
          </CuiPopover>
        </Example>

        <!-- Without title (no header) -->
        <Example title="Without Title" :code="`<CuiPopover>
  <CuiButton variant=&quot;outline&quot;>Simple</CuiButton>
  <template #content>
    <p>Just body content, no header bar.</p>
  </template>
</CuiPopover>`">
          <CuiPopover>
            <CuiButton variant="outline">Simple</CuiButton>
            <template #content>
              <p>Just body content, no header bar.</p>
            </template>
          </CuiPopover>
        </Example>

        <!-- Placements -->
        <Example title="Placements" :code="`<CuiPopover placement=&quot;top&quot; title=&quot;Top&quot;>
  <CuiButton variant=&quot;outline&quot; size=&quot;sm&quot;>Top</CuiButton>
  <template #content>Placed above the trigger.</template>
</CuiPopover>
<CuiPopover placement=&quot;right&quot; title=&quot;Right&quot;>
  <CuiButton variant=&quot;outline&quot; size=&quot;sm&quot;>Right</CuiButton>
  <template #content>Placed to the right.</template>
</CuiPopover>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiPopover placement="top" title="Top">
              <CuiButton variant="outline" size="sm">Top</CuiButton>
              <template #content>Placed above the trigger.</template>
            </CuiPopover>
            <CuiPopover placement="bottom" title="Bottom">
              <CuiButton variant="outline" size="sm">Bottom</CuiButton>
              <template #content>Placed below the trigger.</template>
            </CuiPopover>
            <CuiPopover placement="left" title="Left">
              <CuiButton variant="outline" size="sm">Left</CuiButton>
              <template #content>Placed to the left.</template>
            </CuiPopover>
            <CuiPopover placement="right" title="Right">
              <CuiButton variant="outline" size="sm">Right</CuiButton>
              <template #content>Placed to the right.</template>
            </CuiPopover>
          </CuiFlex>
        </Example>

        <!-- Hover trigger -->
        <Example title="Hover Trigger" :code="`<CuiPopover trigger=&quot;hover&quot; :show-delay=&quot;200&quot; title=&quot;Hover Info&quot;>
  <CuiButton variant=&quot;outline&quot;>Hover me</CuiButton>
  <template #content>
    <p>This popover opens on hover and stays open while you're over it.</p>
  </template>
</CuiPopover>`">
          <CuiPopover trigger="hover" :show-delay="200" title="Hover Info">
            <CuiButton variant="outline">Hover me</CuiButton>
            <template #content>
              <p>This popover opens on hover and stays open while you're over it.</p>
            </template>
          </CuiPopover>
        </Example>

        <!-- No arrow -->
        <Example title="No Arrow" :code="`<CuiPopover no-arrow title=&quot;Settings&quot;>...`">
          <CuiPopover no-arrow title="Settings">
            <CuiButton variant="outline">No Arrow</CuiButton>
            <template #content>
              <p>This popover has no arrow pointing to the trigger.</p>
            </template>
          </CuiPopover>
        </Example>

        <!-- Fixed width -->
        <Example title="Fixed Width" :code="`<CuiPopover width=&quot;360px&quot; title=&quot;Details&quot;>...`">
          <CuiPopover width="360px" title="Details">
            <CuiButton variant="outline">Wide Popover</CuiButton>
            <template #content>
              <p>This popover has a fixed width of 360px, useful for content that needs more breathing room.</p>
            </template>
          </CuiPopover>
        </Example>

        <!-- With footer -->
        <Example title="With Footer" :code="`<CuiPopover title=&quot;Confirm&quot; width=&quot;280px&quot;>
  <CuiButton variant=&quot;outline&quot;>Delete item</CuiButton>
  <template #content>
    <p>Are you sure you want to delete this item? This cannot be undone.</p>
  </template>
  <template #footer>
    <CuiFlex gap=&quot;2&quot; class=&quot;justify-end&quot;>
      <CuiButton size=&quot;xs&quot; variant=&quot;ghost&quot;>Cancel</CuiButton>
      <CuiButton size=&quot;xs&quot; variant=&quot;solid&quot; color=&quot;error&quot;>Delete</CuiButton>
    </CuiFlex>
  </template>
</CuiPopover>`">
          <CuiPopover title="Confirm" width="280px">
            <CuiButton variant="outline">Delete item</CuiButton>
            <template #content>
              <p>Are you sure you want to delete this item? This cannot be undone.</p>
            </template>
            <template #footer>
              <CuiFlex gap="2" class="justify-end">
                <CuiButton size="xs" variant="ghost">Cancel</CuiButton>
                <CuiButton size="xs" variant="solid" color="error">Delete</CuiButton>
              </CuiFlex>
            </template>
          </CuiPopover>
        </Example>

        <!-- Rich content -->
        <Example title="Real-World: User Card" :code="`<CuiPopover trigger=&quot;hover&quot; :show-delay=&quot;300&quot; width=&quot;280px&quot;>
  <span class=&quot;cursor-pointer font-medium&quot; style=&quot;color: var(--cui-primary);&quot;>@janedoe</span>
  <template #content>
    <CuiStack spacing=&quot;3&quot;>
      <div class=&quot;font-semibold text-sm&quot;>Jane Doe</div>
      <p class=&quot;text-xs&quot;>Building beautiful interfaces. Based in San Francisco.</p>
    </CuiStack>
  </template>
</CuiPopover>`">
          <CuiPopover trigger="hover" :show-delay="300" width="280px">
            <span class="cursor-pointer font-medium" style="color: var(--cui-primary);">@janedoe</span>
            <template #content>
              <CuiStack spacing="3">
                <CuiFlex gap="3" class="items-center">
                  <div
                    style="width: 2.5rem; height: 2.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem; background: var(--cui-primary-bg); color: var(--cui-primary);"
                  >JD</div>
                  <div>
                    <div class="font-semibold text-sm">Jane Doe</div>
                    <div class="text-xs" style="color: var(--cui-text-secondary);">Product Designer</div>
                  </div>
                </CuiFlex>
                <p class="text-xs" style="color: var(--cui-text-secondary);">
                  Building beautiful interfaces and design systems. Based in San Francisco.
                </p>
                <CuiFlex gap="3">
                  <div class="text-xs"><strong>142</strong> <span style="color: var(--cui-text-secondary);">following</span></div>
                  <div class="text-xs"><strong>1.2k</strong> <span style="color: var(--cui-text-secondary);">followers</span></div>
                </CuiFlex>
              </CuiStack>
            </template>
          </CuiPopover>
        </Example>

        <!-- Real-world: Notification bell -->
        <Example title="Real-World: Notification Bell" :code="`<CuiPopover title=&quot;Notifications&quot; width=&quot;320px&quot; placement=&quot;bottom&quot;>
  <CuiButton variant=&quot;ghost&quot; size=&quot;sm&quot;>
    <template #prefix><CuiIcon name=&quot;bell&quot; /></template>
    <CuiBadge color=&quot;error&quot; size=&quot;sm&quot;>3</CuiBadge>
  </CuiButton>
  <template #content>
    <CuiStack spacing=&quot;3&quot;>
      <CuiFlex gap=&quot;3&quot; class=&quot;items-start&quot;>
        <CuiIcon name=&quot;chat-circle-text&quot; size=&quot;1.25rem&quot; />
        <div>
          <div class=&quot;text-sm font-medium&quot;>New comment on your post</div>
          <div class=&quot;text-xs&quot;>2 minutes ago</div>
        </div>
      </CuiFlex>
    </CuiStack>
  </template>
  <template #footer>
    <CuiButton size=&quot;xs&quot; variant=&quot;ghost&quot; class=&quot;w-full&quot;>View all notifications</CuiButton>
  </template>
</CuiPopover>`">
          <CuiPopover title="Notifications" width="320px" placement="bottom">
            <CuiButton variant="ghost" size="sm">
              <template #prefix><CuiIcon name="bell" /></template>
              <CuiBadge color="error" size="sm">3</CuiBadge>
            </CuiButton>
            <template #content>
              <CuiStack spacing="3">
                <CuiFlex gap="3" class="items-start">
                  <CuiIcon name="chat-circle-text" size="1.25rem" style="color: var(--cui-primary); flex-shrink: 0; margin-top: 2px;" />
                  <div>
                    <div class="text-sm font-medium">New comment on your post</div>
                    <div class="text-xs" style="color: var(--cui-text-secondary);">2 minutes ago</div>
                  </div>
                </CuiFlex>
                <CuiFlex gap="3" class="items-start">
                  <CuiIcon name="user-plus" size="1.25rem" style="color: var(--cui-success); flex-shrink: 0; margin-top: 2px;" />
                  <div>
                    <div class="text-sm font-medium">Alex started following you</div>
                    <div class="text-xs" style="color: var(--cui-text-secondary);">15 minutes ago</div>
                  </div>
                </CuiFlex>
                <CuiFlex gap="3" class="items-start">
                  <CuiIcon name="check-circle" size="1.25rem" style="color: var(--cui-success); flex-shrink: 0; margin-top: 2px;" />
                  <div>
                    <div class="text-sm font-medium">Task "Design review" completed</div>
                    <div class="text-xs" style="color: var(--cui-text-secondary);">1 hour ago</div>
                  </div>
                </CuiFlex>
              </CuiStack>
            </template>
            <template #footer>
              <CuiButton size="xs" variant="ghost" class="w-full">View all notifications</CuiButton>
            </template>
          </CuiPopover>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
