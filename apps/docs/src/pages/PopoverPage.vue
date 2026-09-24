<script setup lang="ts">
import { CuiButton, CuiFlex, CuiPopover, CuiStack, CuiBadge, CuiIcon } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/popover";
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiPopover title=&quot;Notifications&quot;>
  <CuiButton variant=&quot;outline&quot;>Click me</CuiButton>
  <template #content>
    <p>You have 3 unread messages.</p>
  </template>
</CuiPopover>`"
      >
        <CuiPopover title="Notifications">
          <CuiButton variant="outline">Click me</CuiButton>
          <template #content>
            <p>You have 3 unread messages.</p>
          </template>
        </CuiPopover>
      </Example>
      <p class="mt-3 text-sm text-surface-600 dark:text-surface-400">
        The default slot is the trigger; the panel's body goes in <code class="cui-code">#content</code>.
        That split is what lets the panel be teleported to <code class="cui-code">&lt;body&gt;</code>,
        so it is never clipped by an <code class="cui-code">overflow: hidden</code> ancestor.
      </p>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        A popover holds content you interact with, so it is a <code>role="dialog"</code> — but a
        non-modal one: it does not trap focus, does not lock the page scroll, and the rest of
        the page stays live behind it. If you need the reader to answer before going on, that is
        a <code>CuiModal</code>, not this.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Escape closes it, from anywhere — the listener is on the document rather than the
          wrapper, because the panel is teleported to <code>&lt;body&gt;</code> and a
          wrapper-scoped handler would miss it once focus moved inside.
        </li>
        <li>
          With <code>trigger="click"</code> a click outside the trigger or the panel closes it
          too.
        </li>
        <li>
          The wrapper adds no role and does not make its contents focusable — put a real
          <code>CuiButton</code> or <code>&lt;button&gt;</code> in the default slot. It also sets
          no <code>aria-haspopup</code> or <code>aria-expanded</code> on that trigger, so add
          them yourself if the state matters.
        </li>
        <li>
          Focus is not moved into the panel when it opens, and the panel lives at the end of the
          document rather than after the trigger — so tabbing onward from the trigger does not
          reach the panel's buttons. Move focus yourself on open when the panel contains
          controls the reader has to reach.
        </li>
        <li>
          <code>trigger="hover"</code> puts the content out of reach of anyone not using a
          pointer. Use <code>hover-focus</code>, or keep hover for things that are merely
          convenient.
        </li>
        <li>
          The <code>title</code> prop names the panel, but the id it uses is a fixed string
          rather than a generated one — so two titled popovers on the same page produce
          duplicate ids and the naming becomes unreliable. A single titled popover per page is
          safe; beyond that, name the panel yourself.
        </li>
      </ul>
    </template>

    <template #examples>
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

        <!-- Rounded -->
        <Example title="Rounded" :code="`<CuiPopover rounded=&quot;none&quot; title=&quot;Square&quot;>...</CuiPopover>
<CuiPopover rounded=&quot;lg&quot; title=&quot;Large&quot;>...</CuiPopover>
<CuiPopover rounded=&quot;full&quot; title=&quot;Pill&quot;>...</CuiPopover>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiPopover rounded="none" title="Square">
              <CuiButton variant="outline" size="sm">None</CuiButton>
              <template #content>Square corners (rounded="none").</template>
            </CuiPopover>
            <CuiPopover rounded="lg" title="Large">
              <CuiButton variant="outline" size="sm">Large</CuiButton>
              <template #content>Large corner radius (rounded="lg").</template>
            </CuiPopover>
            <CuiPopover rounded="full" title="Pill">
              <CuiButton variant="outline" size="sm">Full</CuiButton>
              <template #content>Fully rounded corners (rounded="full").</template>
            </CuiPopover>
          </CuiFlex>
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
          <p class="mt-3 text-sm text-surface-600 dark:text-surface-400">
            Actions in the panel are not reached by tabbing on from the trigger — for a genuine
            confirmation, <code class="cui-code">CuiConfirmDialog</code> is the safer shape.
          </p>
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
    </template>
  </DocPage>
</template>
