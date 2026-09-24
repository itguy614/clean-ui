<script setup lang="ts">
import { ref } from "vue";
import { CuiBadge, CuiButton, CuiFlex, CuiInput, CuiStack, CuiTooltip } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/tooltip";

const manualVisible = ref(false);
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiTooltip text=&quot;Hello, world!&quot;>
  <CuiButton>Hover me</CuiButton>
</CuiTooltip>`"
      >
        <CuiFlex gap="4" class="flex-wrap">
          <CuiTooltip text="Hello, world!">
            <CuiButton>Hover me</CuiButton>
          </CuiTooltip>
          <CuiTooltip text="I appear on focus too — try tabbing">
            <CuiButton variant="outline">Hover or focus</CuiButton>
          </CuiTooltip>
        </CuiFlex>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The default <code>trigger="hover-focus"</code> shows the tooltip on focus as well as
        hover, so it is reachable by keyboard — provided the element you wrap is focusable. The
        wrapper adds no <code>tabindex</code> of its own: wrap a real control, or wrap plain
        text and accept that the tooltip is pointer-only.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <strong>The tooltip is not announced by assistive technology.</strong> The panel
          carries <code>role="tooltip"</code>, but nothing points the trigger at it — no
          <code>aria-describedby</code>, no generated id — so a screen reader reads the trigger
          and never the tooltip. This is a known bug. Until it is fixed, treat the tooltip as a
          sighted-pointer convenience: never put anything in it that is not also available as
          visible text or an <code>aria-label</code> on the trigger.
        </li>
        <li>
          Escape hides a visible tooltip while the trigger has focus, and the panel stays open
          while the pointer is over it, so a tooltip can be read without being chased. Between
          them, that covers the dismissible and hoverable halves of WCAG 1.4.13.
        </li>
        <li>
          An icon-only button needs an <code>aria-label</code> whether or not it has a tooltip.
          The tooltip is not a substitute for a name.
        </li>
        <li>
          <code>trigger="hover"</code> takes away the focus route entirely, and
          <code>trigger="click"</code> steals the click from whatever is inside. Both are worth
          choosing deliberately rather than by habit.
        </li>
      </ul>
    </template>

    <template #examples>
        <!-- Placements -->
        <Example title="Placements" :code="`<CuiTooltip text=&quot;Top&quot; placement=&quot;top&quot;>...</CuiTooltip>`">
          <CuiFlex gap="4" class="flex-wrap items-center justify-center">
            <CuiTooltip text="I appear on top" placement="top">
              <CuiButton variant="outline" size="sm">Top</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="I appear on the bottom" placement="bottom">
              <CuiButton variant="outline" size="sm">Bottom</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="I appear on the left" placement="left">
              <CuiButton variant="outline" size="sm">Left</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="I appear on the right" placement="right">
              <CuiButton variant="outline" size="sm">Right</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="I pick the best spot automatically" placement="auto">
              <CuiButton variant="outline" size="sm">Auto</CuiButton>
            </CuiTooltip>
          </CuiFlex>
        </Example>

        <!-- Triggers -->
        <Example title="Trigger Modes" :code="`<CuiTooltip text=&quot;Hover only&quot; trigger=&quot;hover&quot;>...</CuiTooltip>
<CuiTooltip text=&quot;Focus only&quot; trigger=&quot;focus&quot;>...</CuiTooltip>
<CuiTooltip text=&quot;Click to toggle&quot; trigger=&quot;click&quot;>...</CuiTooltip>
<CuiTooltip text=&quot;Hover + focus&quot; trigger=&quot;hover-focus&quot;>...</CuiTooltip>`">
          <CuiFlex gap="4" class="flex-wrap">
            <CuiTooltip text="Hover only" trigger="hover">
              <CuiButton variant="outline" size="sm">Hover</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Focus only (tab to me)" trigger="focus">
              <CuiButton variant="outline" size="sm">Focus</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Click to toggle" trigger="click">
              <CuiButton variant="outline" size="sm">Click</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Hover + focus (default)" trigger="hover-focus">
              <CuiButton variant="outline" size="sm">Hover + Focus</CuiButton>
            </CuiTooltip>
          </CuiFlex>
        </Example>

        <!-- No Arrow -->
        <Example title="Without Arrow" :code="`<CuiTooltip text=&quot;No arrow&quot; no-arrow>
  <CuiButton>No arrow</CuiButton>
</CuiTooltip>`">
          <CuiFlex gap="4" class="flex-wrap">
            <CuiTooltip text="No arrow here" no-arrow>
              <CuiButton variant="outline" size="sm">No arrow</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="With arrow (default)">
              <CuiButton variant="outline" size="sm">With arrow</CuiButton>
            </CuiTooltip>
          </CuiFlex>
        </Example>

        <!-- Rich Content -->
        <Example title="Rich Content (#content slot)" :code="`<CuiTooltip>
  <CuiButton>Hover</CuiButton>
  <template #content>
    <strong>Rich HTML</strong>
    <p>With multiple lines</p>
  </template>
</CuiTooltip>`">
          <CuiFlex gap="4" class="flex-wrap">
            <CuiTooltip>
              <CuiButton variant="outline" size="sm">Rich content</CuiButton>
              <template #content>
                <div style="max-width: 200px">
                  <strong style="display: block; margin-bottom: 4px;">Keyboard Shortcuts</strong>
                  <div style="display: flex; justify-content: space-between; gap: 1rem;">
                    <span>Save</span>
                    <span><kbd class="cui-kbd">Ctrl+S</kbd></span>
                  </div>
                  <div style="display: flex; justify-content: space-between; gap: 1rem;">
                    <span>Undo</span>
                    <span><kbd class="cui-kbd">Ctrl+Z</kbd></span>
                  </div>
                </div>
              </template>
            </CuiTooltip>
            <CuiTooltip>
              <CuiButton variant="outline" size="sm">User info</CuiButton>
              <template #content>
                <div>
                  <strong>Kurt Wolf</strong>
                  <div style="opacity: 0.8; font-size: 0.75rem;">Admin &middot; Last active 2m ago</div>
                </div>
              </template>
            </CuiTooltip>
          </CuiFlex>
          <p class="mt-3 text-sm text-surface-600 dark:text-surface-400">
            The panel is not reachable by Tab, so anything interactive placed in it is
            unreachable by keyboard. Rich content here means layout, not controls — for those,
            use <code class="cui-code">CuiPopover</code>.
          </p>
        </Example>

        <!-- Colors -->
        <Example title="Semantic Colors" :code="`<CuiTooltip text=&quot;Primary tooltip&quot; color=&quot;primary&quot;>
  <CuiButton color=&quot;primary&quot;>Primary</CuiButton>
</CuiTooltip>
<CuiTooltip text=&quot;Success!&quot; color=&quot;success&quot;>
  <CuiButton color=&quot;success&quot;>Success</CuiButton>
</CuiTooltip>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiTooltip text="Default (dark)" placement="bottom">
              <CuiButton variant="outline" size="sm">Default</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Primary tooltip" color="primary" placement="bottom">
              <CuiButton variant="outline" size="sm" color="primary">Primary</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Success!" color="success" placement="bottom">
              <CuiButton variant="outline" size="sm" color="success">Success</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Something went wrong" color="error" placement="bottom">
              <CuiButton variant="outline" size="sm" color="error">Error</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Be careful here" color="warning" placement="bottom">
              <CuiButton variant="outline" size="sm" color="warning">Warning</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="FYI" color="info" placement="bottom">
              <CuiButton variant="outline" size="sm" color="info">Info</CuiButton>
            </CuiTooltip>
          </CuiFlex>
        </Example>

        <!-- Delays -->
        <Example title="Custom Delays" :code="`<CuiTooltip text=&quot;Instant!&quot; :show-delay=&quot;0&quot; :hide-delay=&quot;0&quot;>
  <CuiButton>No delay</CuiButton>
</CuiTooltip>
<CuiTooltip text=&quot;Slow to appear...&quot; :show-delay=&quot;800&quot;>
  <CuiButton>800ms delay</CuiButton>
</CuiTooltip>`">
          <CuiFlex gap="4" class="flex-wrap">
            <CuiTooltip text="Instant!" :show-delay="0" :hide-delay="0">
              <CuiButton variant="outline" size="sm">No delay</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="200ms show (default)">
              <CuiButton variant="outline" size="sm">Default delay</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Slow to appear..." :show-delay="800">
              <CuiButton variant="outline" size="sm">800ms delay</CuiButton>
            </CuiTooltip>
          </CuiFlex>
        </Example>

        <!-- Manual control -->
        <Example title="Manual Control (v-model:visible)" :code="`<CuiTooltip text=&quot;I am manually controlled&quot; v-model:visible=&quot;visible&quot; placement=&quot;right&quot;>
  <CuiBadge>Target</CuiBadge>
</CuiTooltip>`">
          <CuiStack spacing="3">
            <CuiFlex gap="3">
              <CuiButton size="sm" variant="solid" @click="manualVisible = !manualVisible">
                {{ manualVisible ? 'Hide' : 'Show' }} Tooltip
              </CuiButton>
            </CuiFlex>
            <CuiTooltip text="I am manually controlled" v-model:visible="manualVisible" placement="right">
              <CuiBadge variant="outline" color="primary">Target element</CuiBadge>
            </CuiTooltip>
          </CuiStack>
        </Example>

        <!-- On different elements -->
        <Example title="On Various Elements" :code="`<CuiTooltip text=&quot;This button does something important&quot;>
  <CuiButton variant=&quot;solid&quot; color=&quot;primary&quot;>Action</CuiButton>
</CuiTooltip>
<CuiTooltip text=&quot;3 unread notifications&quot;>
  <CuiBadge variant=&quot;solid&quot; color=&quot;error&quot;>3</CuiBadge>
</CuiTooltip>`">
          <CuiFlex gap="4" class="flex-wrap items-center">
            <CuiTooltip text="This button does something important">
              <CuiButton variant="solid" color="primary">Action</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="3 unread notifications">
              <CuiBadge variant="solid" color="error" animation="pulse">3</CuiBadge>
            </CuiTooltip>
            <CuiTooltip text="Enter your full legal name" placement="bottom">
              <div class="max-w-xs">
                <CuiInput placeholder="Full name..." />
              </div>
            </CuiTooltip>
            <CuiTooltip text="Currently online" color="success">
              <CuiFlex gap="2" class="items-center">
                <CuiBadge dot color="success" animation="ping" />
                <span class="text-sm">Alice</span>
              </CuiFlex>
            </CuiTooltip>
          </CuiFlex>
          <p class="mt-3 text-sm text-surface-600 dark:text-surface-400">
            A badge and a bare <code class="cui-code">&lt;span&gt;</code> are not focusable, so
            those two tooltips are pointer-only. If the text matters, it belongs in the page.
          </p>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled" :code="`<CuiTooltip text=&quot;You won't see me&quot; disabled>
  <CuiButton>Disabled tooltip</CuiButton>
</CuiTooltip>`">
          <CuiFlex gap="4">
            <CuiTooltip text="You won't see me" disabled>
              <CuiButton variant="outline" size="sm">Disabled tooltip</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="I still work!">
              <CuiButton variant="outline" size="sm">Enabled tooltip</CuiButton>
            </CuiTooltip>
          </CuiFlex>
        </Example>
    </template>
  </DocPage>
</template>
