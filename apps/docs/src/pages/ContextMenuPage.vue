<script setup lang="ts">
import { ref } from "vue";
import {
  CuiCard,
  CuiCardBody,
  CuiContextMenu,
  CuiDropdownItem,
  CuiDropdownDivider,
  CuiDropdownHeader,
  CuiDropdownCheckItem,
  CuiIcon,
  CuiStack,
  CuiButton,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/context-menu";

const lastAction = ref("(right-click the area above)");

const bold = ref(false);
const italic = ref(false);

// Touch / keyboard reachability demo
const touchMenu = ref<InstanceType<typeof CuiContextMenu> | null>(null);
const touchAction = ref("(hold the row, press Shift+F10 on it, or use the button)");

function openFromButton(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  touchMenu.value?.openAt(rect.left, rect.bottom);
}
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiContextMenu>
  <div class=&quot;p-12 border rounded&quot;>Right-click anywhere in this area</div>
  <template #menu>
    <CuiDropdownItem @select=&quot;cut&quot;>Cut</CuiDropdownItem>
    <CuiDropdownItem @select=&quot;copy&quot;>Copy</CuiDropdownItem>
    <CuiDropdownItem @select=&quot;paste&quot;>Paste</CuiDropdownItem>
  </template>
</CuiContextMenu>`"
      >
        <CuiContextMenu>
          <div
            class="flex items-center justify-center rounded-lg border-2 border-dashed p-12"
            style="border-color: var(--cui-border); color: var(--cui-text-secondary);"
          >
            Right-click anywhere in this area
          </div>
          <template #menu>
            <CuiDropdownItem @select="lastAction = 'Cut'">Cut</CuiDropdownItem>
            <CuiDropdownItem @select="lastAction = 'Copy'">Copy</CuiDropdownItem>
            <CuiDropdownItem @select="lastAction = 'Paste'">Paste</CuiDropdownItem>
          </template>
        </CuiContextMenu>
        <p class="mt-2 text-sm" style="color: var(--cui-text-secondary);">
          Last action: {{ lastAction }}
        </p>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        A right-click is invisible and unreachable by half the people using your app, so the
        component summons the same menu three other ways. The panel itself is a
        <code>role="menu"</code> filled with the dropdown item components, so the roles and the
        arrow-key behaviour are exactly Dropdown's.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <code>Shift+F10</code> and the dedicated Menu key open the menu at the focused element,
          as the platform does. This needs no opt-in — but the wrapper is
          <code>display: contents</code>, so it only works if what you wrap is itself focusable.
          Give it a real control, or a <code>tabindex="0"</code>.
        </li>
        <li>
          On open, focus moves to the first enabled item. Arrow Down and Arrow Up move and wrap,
          Home and End jump to the ends, Enter and Space activate, and Escape closes.
        </li>
        <li>
          Disabled items carry <code>aria-disabled</code> and are skipped by the arrow keys.
        </li>
        <li>
          Closing does not return focus to the element the menu was opened from. Until that is
          fixed, a keyboard user who presses Escape lands back on the document rather than on the
          row they were working with.
        </li>
        <li>
          The menu also closes on a scroll and on a click outside, and a long-press that opened
          it swallows the click the platform synthesises afterwards, so the thing underneath is
          not activated as well.
        </li>
      </ul>
    </template>

    <template #extra>

      <div>
        <h2 id="reaching-it-without-a-right-click" class="mb-4 text-2xl font-semibold">
          Reaching it without a right-click
        </h2>
        <p class="mb-4" style="color: var(--cui-text-secondary);">
          A native <code class="cui-code">contextmenu</code> event is the default trigger, but it is
          not reachable on touch, and not reachable at all from the keyboard. Three routes cover the
          rest.
        </p>
        <CuiCard variant="outline">
          <CuiCardBody>
            <CuiStack spacing="3">
              <div>
                <strong>Keyboard</strong> &mdash; <code class="cui-code">Shift+F10</code> and the
                dedicated Menu key open the menu at the focused element, as the platform does. This
                works with no opt-in, as long as the wrapped content contains something focusable.
              </div>
              <div>
                <strong>Long press</strong> &mdash; set <code class="cui-code">trigger</code> to
                <code class="cui-code">auto</code>. It is opt-in because suppressing the iOS callout
                and native text selection has to be in place before the gesture starts, so it cannot
                be switched on mid-hold: enabling it makes the wrapped content unselectable by touch.
                Use it on rows and tiles, not on prose.
              </div>
              <div>
                <strong>Your own affordance</strong> &mdash; call
                <code class="cui-code">openAt(x, y)</code> from a visible kebab button, positioned with
                its <code class="cui-code">getBoundingClientRect()</code>. That turns a hidden gesture
                into a discoverable control.
              </div>
            </CuiStack>
          </CuiCardBody>
        </CuiCard>
      </div>
    </template>

    <template #examples>
        <!-- Touch and keyboard -->
        <Example title="Touch, keyboard, and your own button" :code="`&lt;CuiContextMenu ref=&quot;menu&quot; trigger=&quot;auto&quot;&gt;
  &lt;div tabindex=&quot;0&quot;&gt;Hold me, or focus me and press Shift+F10&lt;/div&gt;
  &lt;template #menu&gt; ... &lt;/template&gt;
&lt;/CuiContextMenu&gt;

&lt;!-- or drive it from a visible affordance --&gt;
&lt;CuiButton @click=&quot;openFromButton&quot;&gt;Actions&lt;/CuiButton&gt;

function openFromButton(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  menu.value.openAt(rect.left, rect.bottom)
}`">
          <CuiStack spacing="3">
            <CuiContextMenu ref="touchMenu" trigger="auto">
              <div
                tabindex="0"
                style="padding: 1.5rem; border: 1px solid var(--cui-border); border-radius: 0.375rem; cursor: pointer;"
              >
                Right-click, hold (touch), or focus and press Shift+F10
              </div>
              <template #menu>
                <CuiDropdownItem @select="touchAction = 'Renamed'">Rename</CuiDropdownItem>
                <CuiDropdownItem @select="touchAction = 'Duplicated'">Duplicate</CuiDropdownItem>
                <CuiDropdownDivider />
                <CuiDropdownItem @select="touchAction = 'Deleted'">Delete</CuiDropdownItem>
              </template>
            </CuiContextMenu>

            <div>
              <CuiButton size="sm" @click="openFromButton">Actions</CuiButton>
            </div>

            <div class="text-sm" style="color: var(--cui-text-secondary);">
              Last action: <code class="cui-code">{{ touchAction }}</code>
            </div>
          </CuiStack>
        </Example>

        <!-- With icons and shortcuts -->
        <Example title="Icons and Keyboard Shortcuts" :code="`<CuiContextMenu>
  ...
  <template #menu>
    <CuiDropdownItem shortcut=&quot;⌘X&quot;>
      <template #icon><CuiIcon name=&quot;scissors&quot; /></template>
      Cut
    </CuiDropdownItem>
    ...
  </template>
</CuiContextMenu>`">
          <CuiContextMenu>
            <div
              class="flex items-center justify-center rounded-lg border-2 border-dashed p-12"
              style="border-color: var(--cui-border); color: var(--cui-text-secondary);"
            >
              Right-click for a rich menu
            </div>
            <template #menu>
              <CuiDropdownItem shortcut="⌘X">
                <template #icon><CuiIcon name="scissors" size="1rem" /></template>
                Cut
              </CuiDropdownItem>
              <CuiDropdownItem shortcut="⌘C">
                <template #icon><CuiIcon name="copy" size="1rem" /></template>
                Copy
              </CuiDropdownItem>
              <CuiDropdownItem shortcut="⌘V">
                <template #icon><CuiIcon name="clipboard-text" size="1rem" /></template>
                Paste
              </CuiDropdownItem>
              <CuiDropdownDivider />
              <CuiDropdownItem shortcut="⌘A">
                <template #icon><CuiIcon name="selection-all" size="1rem" /></template>
                Select All
              </CuiDropdownItem>
            </template>
          </CuiContextMenu>
        </Example>

        <!-- With headers and dividers -->
        <Example title="Sections with Headers and Dividers" :code="`<CuiContextMenu min-width=&quot;14rem&quot;>
  <div>Right-click for grouped actions</div>
  <template #menu>
    <CuiDropdownHeader>Edit</CuiDropdownHeader>
    <CuiDropdownItem shortcut=&quot;⌘Z&quot;>
      <template #icon><CuiIcon name=&quot;arrow-counter-clockwise&quot; /></template>
      Undo
    </CuiDropdownItem>
    <CuiDropdownDivider />
    <CuiDropdownHeader>View</CuiDropdownHeader>
    <CuiDropdownItem shortcut=&quot;⌘+&quot;>Zoom In</CuiDropdownItem>
    <CuiDropdownDivider />
    <CuiDropdownItem disabled>Delete</CuiDropdownItem>
  </template>
</CuiContextMenu>`">
          <CuiContextMenu min-width="14rem">
            <div
              class="flex items-center justify-center rounded-lg border-2 border-dashed p-12"
              style="border-color: var(--cui-border); color: var(--cui-text-secondary);"
            >
              Right-click for grouped actions
            </div>
            <template #menu>
              <CuiDropdownHeader>Edit</CuiDropdownHeader>
              <CuiDropdownItem shortcut="⌘Z">
                <template #icon><CuiIcon name="arrow-counter-clockwise" size="1rem" /></template>
                Undo
              </CuiDropdownItem>
              <CuiDropdownItem shortcut="⌘⇧Z">
                <template #icon><CuiIcon name="arrow-clockwise" size="1rem" /></template>
                Redo
              </CuiDropdownItem>
              <CuiDropdownDivider />
              <CuiDropdownHeader>View</CuiDropdownHeader>
              <CuiDropdownItem shortcut="⌘+">
                <template #icon><CuiIcon name="magnifying-glass-plus" size="1rem" /></template>
                Zoom In
              </CuiDropdownItem>
              <CuiDropdownItem shortcut="⌘-">
                <template #icon><CuiIcon name="magnifying-glass-minus" size="1rem" /></template>
                Zoom Out
              </CuiDropdownItem>
              <CuiDropdownDivider />
              <CuiDropdownItem disabled>
                <template #icon><CuiIcon name="trash" size="1rem" /></template>
                Delete
              </CuiDropdownItem>
            </template>
          </CuiContextMenu>
        </Example>

        <!-- Checkbox items -->
        <Example title="With Checkbox Items" :code="`<CuiContextMenu>
  <div>Right-click for formatting options</div>
  <template #menu>
    <CuiDropdownHeader>Formatting</CuiDropdownHeader>
    <CuiDropdownCheckItem v-model=&quot;bold&quot;>Bold</CuiDropdownCheckItem>
    <CuiDropdownCheckItem v-model=&quot;italic&quot;>Italic</CuiDropdownCheckItem>
    <CuiDropdownDivider />
    <CuiDropdownItem>Clear Formatting</CuiDropdownItem>
  </template>
</CuiContextMenu>`">
          <CuiContextMenu>
            <div
              class="flex items-center justify-center rounded-lg border-2 border-dashed p-12"
              style="border-color: var(--cui-border); color: var(--cui-text-secondary);"
            >
              Right-click for formatting options
            </div>
            <template #menu>
              <CuiDropdownHeader>Formatting</CuiDropdownHeader>
              <CuiDropdownCheckItem v-model="bold">Bold</CuiDropdownCheckItem>
              <CuiDropdownCheckItem v-model="italic">Italic</CuiDropdownCheckItem>
              <CuiDropdownDivider />
              <CuiDropdownItem>Clear Formatting</CuiDropdownItem>
            </template>
          </CuiContextMenu>
          <p class="mt-2 text-sm" style="color: var(--cui-text-secondary);">
            Bold: {{ bold }}, Italic: {{ italic }}
          </p>
        </Example>

        <!-- On a card -->
        <Example title="Real-World: Card Context Menu" :code="`<CuiContextMenu>
  <CuiCard variant=&quot;outline&quot;>
    <CuiCardBody>quarterly-report.pdf</CuiCardBody>
  </CuiCard>
  <template #menu>
    <CuiDropdownItem>
      <template #icon><CuiIcon name=&quot;eye&quot; /></template>
      Open
    </CuiDropdownItem>
    <CuiDropdownItem>
      <template #icon><CuiIcon name=&quot;download-simple&quot; /></template>
      Download
    </CuiDropdownItem>
    <CuiDropdownItem>
      <template #icon><CuiIcon name=&quot;share-network&quot; /></template>
      Share
    </CuiDropdownItem>
    <CuiDropdownDivider />
    <CuiDropdownItem>
      <template #icon><CuiIcon name=&quot;trash&quot; /></template>
      Move to Trash
    </CuiDropdownItem>
  </template>
</CuiContextMenu>`">
          <div class="max-w-sm">
            <CuiContextMenu>
              <CuiCard variant="outline">
                <CuiCardBody>
                  <div class="flex items-center gap-3">
                    <div
                      style="width: 2.5rem; height: 2.5rem; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; background: var(--cui-primary-bg); color: var(--cui-primary);"
                    >
                      <CuiIcon name="file-text" size="1.25rem" />
                    </div>
                    <div>
                      <div class="text-sm font-semibold">quarterly-report.pdf</div>
                      <div class="text-xs" style="color: var(--cui-text-secondary);">2.4 MB · Modified today</div>
                    </div>
                  </div>
                </CuiCardBody>
              </CuiCard>
              <template #menu>
                <CuiDropdownItem>
                  <template #icon><CuiIcon name="eye" size="1rem" /></template>
                  Open
                </CuiDropdownItem>
                <CuiDropdownItem>
                  <template #icon><CuiIcon name="download-simple" size="1rem" /></template>
                  Download
                </CuiDropdownItem>
                <CuiDropdownItem>
                  <template #icon><CuiIcon name="share-network" size="1rem" /></template>
                  Share
                </CuiDropdownItem>
                <CuiDropdownItem>
                  <template #icon><CuiIcon name="pencil-simple" size="1rem" /></template>
                  Rename
                </CuiDropdownItem>
                <CuiDropdownDivider />
                <CuiDropdownItem>
                  <template #icon><CuiIcon name="trash" size="1rem" /></template>
                  Move to Trash
                </CuiDropdownItem>
              </template>
            </CuiContextMenu>
            <p class="mt-2 text-xs" style="color: var(--cui-text-tertiary);">
              Right-click the card above
            </p>
          </div>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled" :code="`<CuiContextMenu disabled>...</CuiContextMenu>`">
          <CuiContextMenu disabled>
            <div
              class="flex items-center justify-center rounded-lg border-2 border-dashed p-12 opacity-50"
              style="border-color: var(--cui-border); color: var(--cui-text-secondary);"
            >
              Right-click does nothing (disabled)
            </div>
            <template #menu>
              <CuiDropdownItem>This won't show</CuiDropdownItem>
            </template>
          </CuiContextMenu>
        </Example>
    </template>
  </DocPage>
</template>
