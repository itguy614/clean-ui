<script setup lang="ts">
import { ref } from "vue";
import { CuiResizablePanels, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/resizable-panels";

const size1 = ref(50);
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiResizablePanels>
  <template #first>Left panel</template>
  <template #second>Right panel</template>
</CuiResizablePanels>`"
      >
        <div style="height: 250px; border: 1px solid var(--cui-border); border-radius: var(--cui-button-radius, 0.375rem); overflow: hidden;">
          <CuiResizablePanels @resize="size1 = $event">
            <template #first>
              <div style="padding: 1rem; height: 100%;">
                <div class="text-sm font-semibold" style="margin-bottom: 0.5rem;">Left Panel</div>
                <p class="text-sm" style="color: var(--cui-text-secondary);">
                  Drag the handle to resize. This panel is {{ Math.round(size1) }}% wide.
                </p>
              </div>
            </template>
            <template #second>
              <div style="padding: 1rem; height: 100%; background: var(--color-surface-50);">
                <div class="text-sm font-semibold" style="margin-bottom: 0.5rem;">Right Panel</div>
                <p class="text-sm" style="color: var(--cui-text-secondary);">
                  This panel takes the remaining {{ Math.round(100 - size1) }}%.
                </p>
              </div>
            </template>
          </CuiResizablePanels>
        </div>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        The split is driven by pointer events on the handle: press and drag to resize, and
        double-click to return to <code>initialSize</code>. Dragging is clamped by
        <code>minFirst</code> and <code>minSecond</code>, so neither panel can be dragged
        out of existence unless <code>collapseThreshold</code> is set.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        <strong>Known limitation:</strong> the handle is not currently keyboard-operable —
        it is not in the tab order and does not respond to arrow keys, and it carries no
        <code>role="separator"</code> or <code>aria-valuenow</code>, so assistive technology
        is not told that the boundary can move or where it currently sits. Treat the split
        as a convenience for pointer users: keep both panels' content reachable at the
        default sizes, and never put the only route to something behind a resize.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        Each panel scrolls on its own overflow, which does keep long content reachable, but
        a scroll container with no focusable child cannot be scrolled from the keyboard in
        every browser — so give a long panel focusable content, or do not rely on its
        scrollbar alone.
      </p>
    </template>

    <template #examples>
      <Example title="Vertical Split" :code="`<CuiResizablePanels orientation=&quot;vertical&quot; :initial-size=&quot;40&quot;>
<template #first>Top panel</template>
<template #second>Bottom panel</template>
</CuiResizablePanels>`">
        <div style="height: 300px; border: 1px solid var(--cui-border); border-radius: var(--cui-button-radius, 0.375rem); overflow: hidden;">
          <CuiResizablePanels orientation="vertical" :initial-size="40">
            <template #first>
              <div style="padding: 1rem; height: 100%;">
                <div class="text-sm font-semibold">Top Panel</div>
                <p class="text-xs" style="color: var(--cui-text-secondary); margin-top: 0.25rem;">Drag the handle below to resize vertically.</p>
              </div>
            </template>
            <template #second>
              <div style="padding: 1rem; height: 100%; background: var(--color-surface-50);">
                <div class="text-sm font-semibold">Bottom Panel</div>
                <p class="text-xs" style="color: var(--cui-text-secondary); margin-top: 0.25rem;">Content in the lower pane.</p>
              </div>
            </template>
          </CuiResizablePanels>
        </div>
      </Example>

      <Example title="Asymmetric with Min Sizes" :code="`<CuiResizablePanels :initial-size=&quot;30&quot; :min-first=&quot;150&quot; :min-second=&quot;200&quot; />`">
        <div style="height: 200px; border: 1px solid var(--cui-border); border-radius: var(--cui-button-radius, 0.375rem); overflow: hidden;">
          <CuiResizablePanels :initial-size="30" :min-first="150" :min-second="200">
            <template #first>
              <div style="padding: 1rem; height: 100%;">
                <div class="text-sm font-semibold">Sidebar</div>
                <p class="text-xs" style="color: var(--cui-text-secondary); margin-top: 0.25rem;">Min 150px. Can't shrink smaller.</p>
              </div>
            </template>
            <template #second>
              <div style="padding: 1rem; height: 100%; background: var(--color-surface-50);">
                <div class="text-sm font-semibold">Main Content</div>
                <p class="text-xs" style="color: var(--cui-text-secondary); margin-top: 0.25rem;">Min 200px. Takes remaining space.</p>
              </div>
            </template>
          </CuiResizablePanels>
        </div>
      </Example>

      <Example title="Collapsible First Panel" :code="`<CuiResizablePanels :initial-size=&quot;30&quot; :min-first=&quot;60&quot; :collapse-threshold=&quot;80&quot; />`">
        <div style="height: 200px; border: 1px solid var(--cui-border); border-radius: var(--cui-button-radius, 0.375rem); overflow: hidden;">
          <CuiResizablePanels :initial-size="30" :collapse-threshold="80" :min-first="60">
            <template #first>
              <div style="padding: 1rem; height: 100%;">
                <div class="text-sm font-semibold">Collapsible</div>
                <p class="text-xs" style="color: var(--cui-text-secondary); margin-top: 0.25rem;">Drag left past 80px to collapse. Double-click handle to reset.</p>
              </div>
            </template>
            <template #second>
              <div style="padding: 1rem; height: 100%; background: var(--color-surface-50);">
                <div class="text-sm font-semibold">Main Area</div>
                <p class="text-xs" style="color: var(--cui-text-secondary); margin-top: 0.25rem;">Expands to full width when sidebar collapses.</p>
              </div>
            </template>
          </CuiResizablePanels>
        </div>
      </Example>

      <Example title="Real-World: Code Editor Layout" :code="`<!-- Nested panels for file explorer + editor + terminal -->
<CuiResizablePanels :initial-size=&quot;35&quot; :min-first=&quot;150&quot;>
<template #first><!-- File Explorer --></template>
<template #second>
  <CuiResizablePanels orientation=&quot;vertical&quot; :initial-size=&quot;70&quot;>
    <template #first><!-- Editor --></template>
    <template #second><!-- Terminal --></template>
  </CuiResizablePanels>
</template>
</CuiResizablePanels>`">
        <div style="height: 300px; border: 1px solid var(--cui-border); border-radius: var(--cui-button-radius, 0.375rem); overflow: hidden;">
          <CuiResizablePanels :initial-size="35" :min-first="150">
            <template #first>
              <div style="padding: 0.75rem; height: 100%; font-family: var(--cui-font-mono, monospace); font-size: 0.75rem; background: var(--color-surface-950); color: var(--color-surface-300); overflow: auto;">
                <div style="color: var(--color-surface-500); margin-bottom: 0.5rem;">// file-explorer.ts</div>
                <div v-for="f in ['src/', '  components/', '    Button.vue', '    Input.vue', '    Modal.vue', '  composables/', '    useTheme.ts', '    useToast.ts', '  styles/', '    main.css', '    themes.css', '  index.ts', 'package.json', 'vite.config.ts']" :key="f" style="padding: 0.125rem 0; white-space: nowrap;">
                  {{ f }}
                </div>
              </div>
            </template>
            <template #second>
              <CuiResizablePanels orientation="vertical" :initial-size="70">
                <template #first>
                  <div style="padding: 0.75rem; height: 100%; font-family: var(--cui-font-mono, monospace); font-size: 0.75rem; overflow: auto;">
                    <div style="color: var(--cui-text-tertiary); margin-bottom: 0.5rem;">// Editor pane</div>
                    <div>import { ref } from "vue";</div>
                    <div>&nbsp;</div>
                    <div>export function useCounter() {</div>
                    <div>&nbsp; const count = ref(0);</div>
                    <div>&nbsp; const increment = () =&gt; count.value++;</div>
                    <div>&nbsp; return { count, increment };</div>
                    <div>}</div>
                  </div>
                </template>
                <template #second>
                  <div style="padding: 0.75rem; height: 100%; background: var(--color-surface-950); color: var(--color-surface-400); font-family: var(--cui-font-mono, monospace); font-size: 0.6875rem; overflow: auto;">
                    <div style="color: var(--color-surface-600);">$ terminal</div>
                    <div style="color: var(--cui-success);">✓ Build complete in 340ms</div>
                    <div>watching for changes...</div>
                  </div>
                </template>
              </CuiResizablePanels>
            </template>
          </CuiResizablePanels>
        </div>
      </Example>
    </template>
  </DocPage>
</template>
