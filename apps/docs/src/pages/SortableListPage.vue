<script setup lang="ts">
import { ref } from "vue";
import { CuiBadge, CuiCard, CuiCardBody, CuiIcon, CuiSortableList, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/sortable-list";

interface Task {
  id: number;
  label: string;
  due: string;
}

const tasks = ref<Task[]>([
  { id: 1, label: "Draft the release notes", due: "Mon" },
  { id: 2, label: "Review open pull requests", due: "Tue" },
  { id: 3, label: "Update the changelog", due: "Tue" },
  { id: 4, label: "Tag the release", due: "Wed" },
  { id: 5, label: "Announce it", due: "Thu" },
]);

const steps = ref(["Collect", "Sort", "Review", "Ship"]);
const lastMove = ref("");
const onReorder = (e: { item: Task; from: number; to: number }) => (lastMove.value = `${e.item.label}: ${e.from} → ${e.to}`);

const rich = ref([
  { id: "a", label: "Billing", note: "Invoices and receipts" },
  { id: "b", label: "Security", note: "Passwords and sessions" },
  { id: "c", label: "Notifications", note: "Email and push" },
]);

const frozen = ref(["One", "Two", "Three"]);
</script>

<template>
  <DocPage :meta="meta">
    <template #intro>
      <p class="text-surface-700 dark:text-surface-300">
        Drag an item by its grip, or reach it with the keyboard: Space grabs it, the arrow keys
        move it, Space drops it, Escape puts it back. Every item also has Move up and Move down
        buttons, so nothing depends on dragging. The array you bind is the order, and it changes
        once, on the drop.
      </p>
    </template>

    <template #usage>
      <Example
        code-open
        :code="`<CuiSortableList v-model=&quot;tasks&quot; label=&quot;Tasks&quot; @reorder=&quot;onReorder&quot; />`"
      >
        <CuiStack spacing="3" class="max-w-md">
          <CuiSortableList v-model="tasks" label="Tasks" @reorder="onReorder" />
          <div class="text-sm" style="color: var(--cui-text-secondary);">
            Order: <code class="cui-code">{{ tasks.map((t) => t.id).join(", ") }}</code>
            <span v-if="lastMove"> · last move <code class="cui-code">{{ lastMove }}</code></span>
          </div>
        </CuiStack>
      </Example>

      <CuiCard variant="outline" class="mt-4">
        <CuiCardBody>
          <p><strong>Try:</strong></p>
          <ul>
            <li>Drag a grip: the item floats, tilted and a little see-through, and a faint placeholder holds its slot while the others slide out of the way. Drop it and it settles into the slot.</li>
            <li>Start a drag, then press <kbd>Esc</kbd> before releasing: the list snaps back and nothing is emitted.</li>
            <li>Tab to the list (one tab stop, on a grip). <kbd>↑</kbd>/<kbd>↓</kbd>, <kbd>Home</kbd>/<kbd>End</kbd> move between grips.</li>
            <li>Press <kbd>Space</kbd> or <kbd>Enter</kbd> on a grip: it is grabbed (the row tints). <kbd>↑</kbd>/<kbd>↓</kbd> move it, <kbd>Home</kbd>/<kbd>End</kbd> send it to an end, <kbd>Space</kbd> drops it, <kbd>Esc</kbd> cancels.</li>
            <li>Click Move up / Move down on any row: one place per click, and the arrows go quiet at the ends.</li>
            <li>With a screen reader on, each step is announced: grabbed, moved to position N of M, dropped at, cancelled.</li>
            <li>Tab away from a grabbed item: the grab is cancelled and the order restored.</li>
          </ul>
        </CuiCardBody>
      </CuiCard>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The list is a <code>role="list"</code> named by <code>label</code>. Dragging is a pointer
        convenience, never the only way: the same reorder is available from the keyboard and from
        buttons that need a single click or tap (WCAG 2.5.7, Dragging Movements).
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Each item's grip is a real <code>&lt;button&gt;</code> named “Reorder Grace”, described
          by the keyboard instructions, with <code>aria-pressed</code> while it is grabbed
          (the deprecated <code>aria-grabbed</code> is not used). The list is one tab stop
          (roving focus over the grips).
        </li>
        <li>
          <kbd>Space</kbd> or <kbd>Enter</kbd> grabs, the arrow keys (along the list's axis) move
          it, <kbd>Home</kbd> and <kbd>End</kbd> send it to the ends, <kbd>Space</kbd> or
          <kbd>Enter</kbd> drops and <kbd>Esc</kbd> cancels and restores. While a grab or drag is
          under way, Escape goes to the list alone: an enclosing modal stays open.
        </li>
        <li>
          A polite live region announces every step, with the position out of the total: “Ada
          grabbed, position 1 of 3”, “Ada moved to position 2 of 3”, “Ada dropped at position 2
          of 3”, “Reorder cancelled. Ada is back at position 1 of 3”. The words come from the
          message catalogue (<code>sortableList.*</code>).
        </li>
        <li>
          The Move up / Move down buttons are named “Move Grace up” and sit outside the tab order
          (the grips are the keyboard route), but stay reachable by pointer, touch, voice and
          switch control, and by a screen reader's own navigation. A button with nowhere to go
          is <code>aria-disabled</code>, not removed.
        </li>
        <li>
          Under <code>prefers-reduced-motion</code> the dragged item does not tilt or lift and
          the other items jump into place instead of sliding. It still follows the pointer, which
          is direct manipulation.
        </li>
      </ul>
    </template>

    <template #examples>
      <Example
        title="Custom item content"
        :code="`<CuiSortableList v-model=&quot;sections&quot; label=&quot;Settings sections&quot;>
  <template #item=&quot;{ item, index }&quot;>
    <strong>{{ item.label }}</strong>
    <small>{{ item.note }}</small>
  </template>
</CuiSortableList>`"
      >
        <div class="max-w-md">
          <CuiSortableList v-model="rich" label="Settings sections">
            <template #item="{ item, index }">
              <div class="flex items-center gap-3">
                <CuiBadge>{{ index + 1 }}</CuiBadge>
                <div>
                  <div class="font-medium" style="color: var(--cui-text-emphasis);">{{ item.label }}</div>
                  <div class="text-sm" style="color: var(--cui-text-secondary);">{{ item.note }}</div>
                </div>
              </div>
            </template>
          </CuiSortableList>
        </div>
      </Example>

      <Example
        title="Horizontal, with a custom handle"
        :code="`<CuiSortableList v-model=&quot;steps&quot; orientation=&quot;horizontal&quot; label=&quot;Steps&quot;>
  <template #handle><CuiIcon name=&quot;arrows-out-cardinal&quot; /></template>
</CuiSortableList>`"
      >
        <CuiSortableList v-model="steps" orientation="horizontal" label="Steps" :move-buttons="false">
          <template #handle>
            <CuiIcon name="arrows-out-cardinal" />
          </template>
        </CuiSortableList>
        <p class="mt-2 text-sm" style="color: var(--cui-text-secondary);">
          Left and right arrows move the grabbed item; with <code class="cui-code">moveButtons</code> off
          here, the keyboard and the pointer are the two ways to reorder.
        </p>
      </Example>

      <Example
        title="Tuning the lift"
        :code="`.my-list {
  --cui-sortable-list-drag-rotate: 0deg;
  --cui-sortable-list-drag-scale: 1.04;
  --cui-sortable-list-drag-opacity: 1;
}`"
      >
        <div class="max-w-md">
          <CuiSortableList
            v-model="steps"
            label="Steps, level lift"
            style="--cui-sortable-list-drag-rotate: 0deg; --cui-sortable-list-drag-scale: 1.04; --cui-sortable-list-drag-opacity: 1"
          />
        </div>
      </Example>

      <Example title="Disabled" :code="`<CuiSortableList v-model=&quot;items&quot; disabled />`">
        <div class="max-w-md">
          <CuiSortableList v-model="frozen" label="Frozen" disabled />
        </div>
      </Example>
    </template>

    <template #extra>
      <div>
        <h2 id="when-to-use" class="mb-4 text-2xl font-semibold">When to use it</h2>
        <CuiCard variant="outline">
          <CuiCardBody>
            <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
              <li>
                Use it when the order is the data: a priority list, the steps of a flow, which
                section comes first. If the user is choosing <em>which</em> items and also their
                order, <router-link to="/components/transfer-list">Transfer List</router-link> is
                the better fit.
              </li>
              <li>
                Give every item a unique, stable <code class="cui-code">itemKey</code> (an
                <code class="cui-code">id</code> by default). The key is what keeps an item's
                focus and state with it as it moves.
              </li>
              <li>
                The v-model changes once per move, on the drop, so it is safe to save on every
                update. Refuse the update (don't assign it) and the list returns to your order.
              </li>
              <li>
                Not included: dragging between lists, and scrolling a scrollable ancestor when an
                item is dragged near its edge. Scrolling by wheel during a drag also moves the
                dragged item off the pointer. In a long scrolling list, reorder with the keyboard
                or the move buttons.
              </li>
            </ul>
          </CuiCardBody>
        </CuiCard>
      </div>
    </template>
  </DocPage>
</template>
