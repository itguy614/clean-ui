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
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import EventTable from "../components/EventTable.vue";
import Example from "../components/Example.vue";

const lastAction = ref("(right-click the area above)");

const bold = ref(false);
const italic = ref(false);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Context Menu</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A right-click menu that appears at the cursor position.
        Reuses all dropdown item components — CuiDropdownItem, CuiDropdownDivider,
        CuiDropdownHeader, and more.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Prevents the context menu from opening' },
          { name: 'minWidth', type: 'string', default: '12rem', description: 'Minimum width of the menu panel' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Slots</h2>
      <PropTable
        :props="[
          { name: 'default', type: 'slot', default: '—', description: 'Content area that triggers the context menu on right-click' },
          { name: 'menu', type: 'slot', default: '—', description: 'Menu items (CuiDropdownItem, CuiDropdownDivider, etc.)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Events</h2>
      <EventTable
        :events="[
          { name: 'select', payload: '\u2014', description: 'Fires when a menu item is selected' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Context Menu" :code="`<CuiContextMenu>
  <div class=&quot;p-8 border rounded&quot;>Right-click here</div>
  <template #menu>
    <CuiDropdownItem @select=&quot;...&quot;>Cut</CuiDropdownItem>
    <CuiDropdownItem @select=&quot;...&quot;>Copy</CuiDropdownItem>
    <CuiDropdownItem @select=&quot;...&quot;>Paste</CuiDropdownItem>
  </template>
</CuiContextMenu>`">
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

      </CuiStack>
    </div>
  </CuiStack>
</template>
