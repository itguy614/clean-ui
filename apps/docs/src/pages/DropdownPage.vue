<script setup lang="ts">
import { ref } from "vue";
import {
  CuiButton,
  CuiDropdown,
  CuiDropdownCheckItem,
  CuiDropdownDivider,
  CuiDropdownHeader,
  CuiDropdownItem,
  CuiDropdownMenu,
  CuiDropdownRadioGroup,
  CuiDropdownRadioItem,
  CuiDropdownSub,
  CuiDropdownTrigger,
  CuiFlex,
  CuiIcon,
  CuiStack,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/dropdown";

const showGrid = ref(true);
const showSidebar = ref(true);
const sortBy = ref("name");
const theme = ref("system");
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiDropdown>
  <CuiDropdownTrigger>
    <CuiButton>Options</CuiButton>
  </CuiDropdownTrigger>
  <CuiDropdownMenu>
    <CuiDropdownItem>Edit</CuiDropdownItem>
    <CuiDropdownItem>Duplicate</CuiDropdownItem>
    <CuiDropdownDivider />
    <CuiDropdownItem>Delete</CuiDropdownItem>
  </CuiDropdownMenu>
</CuiDropdown>`"
      >
        <CuiDropdown>
          <CuiDropdownTrigger>
            <CuiButton>Options</CuiButton>
          </CuiDropdownTrigger>
          <CuiDropdownMenu>
            <CuiDropdownItem>Edit</CuiDropdownItem>
            <CuiDropdownItem>Duplicate</CuiDropdownItem>
            <CuiDropdownDivider />
            <CuiDropdownItem>Archive</CuiDropdownItem>
            <CuiDropdownItem>Delete</CuiDropdownItem>
          </CuiDropdownMenu>
        </CuiDropdown>
      </Example>
      <p class="mt-3 text-sm text-surface-600 dark:text-surface-400">
        <code class="cui-code">CuiDropdownDivider</code> draws a
        <code class="cui-code">role="separator"</code> rule between groups and takes no props.
      </p>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The panel is a <code>role="menu"</code>, and each item carries the matching role:
        <code>menuitem</code> for actions, <code>menuitemcheckbox</code> with
        <code>aria-checked</code> for check items, <code>menuitemradio</code> inside a
        <code>radiogroup</code> for radio items, <code>separator</code> for a divider and
        <code>presentation</code> for a header, which keeps the group label out of the item
        sequence.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          On open, focus moves to the first enabled item. Arrow Down and Arrow Up move between
          items and wrap at the ends; Home and End jump to the first and last. Enter and Space
          activate.
        </li>
        <li>
          Disabled items get <code>aria-disabled</code> and <code>tabindex="-1"</code>, and are
          skipped by the arrow keys rather than being focusable dead ends.
        </li>
        <li>
          A sub-menu's row is an <code>aria-haspopup</code> item with <code>aria-expanded</code>.
          Arrow Right opens it, Arrow Left closes it and returns to the parent row, and Escape
          closes the sub-menu on its own. Only one sub-menu is open at a time.
        </li>
        <li>
          <code>CuiDropdownRadioGroup</code> takes <code>label</code>, or
          <code>aria-labelledby</code> when something on screen already names the group — a
          <code>CuiDropdownHeader</code> with an <code>id</code>, say. Without one, the group is
          announced as an unnamed radiogroup.
        </li>
        <li>
          <code>CuiDropdownTrigger</code> is a plain wrapper: it adds no role,
          <code>aria-haspopup</code> or <code>aria-expanded</code>, and it does not make its
          contents focusable. Put a real <code>CuiButton</code> or <code>&lt;button&gt;</code>
          inside it — with anything else the menu cannot be opened from the keyboard at all.
        </li>
        <li>
          Two gaps worth knowing about. Escape does not close the top-level menu: the handler
          sits on the wrapper, and the panel is teleported to <code>&lt;body&gt;</code>, so once
          focus is inside the menu the key never reaches it. And closing the menu does not
          return focus to the trigger. Both are on the list to fix; until then a click outside
          is the reliable way out.
        </li>
        <li>
          <code>trigger="hover"</code> makes the menu unreachable for anyone who cannot use a
          pointer. Keep it for redundant conveniences, not for the only route to an action.
        </li>
      </ul>
    </template>

    <template #examples>
        <!-- With Icons + Shortcuts -->
        <Example title="Icons &amp; Keyboard Shortcuts" :code="`<CuiDropdown>
  <CuiDropdownTrigger>
    <CuiButton variant=&quot;outline&quot;>Edit Menu</CuiButton>
  </CuiDropdownTrigger>
  <CuiDropdownMenu>
    <CuiDropdownItem shortcut=&quot;Ctrl+Z&quot;>
      <template #icon><CuiIcon name=&quot;arrow-counter-clockwise&quot; size=&quot;sm&quot; /></template>
      Undo
    </CuiDropdownItem>
    <CuiDropdownItem shortcut=&quot;Ctrl+C&quot;>
      <template #icon><CuiIcon name=&quot;copy&quot; size=&quot;sm&quot; /></template>
      Copy
    </CuiDropdownItem>
  </CuiDropdownMenu>
</CuiDropdown>`">
          <CuiDropdown>
            <CuiDropdownTrigger>
              <CuiButton variant="outline">
                <template #prefix><CuiIcon name="list" size="sm" /></template>
                Edit Menu
              </CuiButton>
            </CuiDropdownTrigger>
            <CuiDropdownMenu>
              <CuiDropdownItem shortcut="Ctrl+Z">
                <template #icon><CuiIcon name="arrow-counter-clockwise" size="sm" /></template>
                Undo
              </CuiDropdownItem>
              <CuiDropdownItem shortcut="Ctrl+Y">
                <template #icon><CuiIcon name="arrow-clockwise" size="sm" /></template>
                Redo
              </CuiDropdownItem>
              <CuiDropdownDivider />
              <CuiDropdownItem shortcut="Ctrl+X">
                <template #icon><CuiIcon name="scissors" size="sm" /></template>
                Cut
              </CuiDropdownItem>
              <CuiDropdownItem shortcut="Ctrl+C">
                <template #icon><CuiIcon name="copy" size="sm" /></template>
                Copy
              </CuiDropdownItem>
              <CuiDropdownItem shortcut="Ctrl+V">
                <template #icon><CuiIcon name="clipboard" size="sm" /></template>
                Paste
              </CuiDropdownItem>
            </CuiDropdownMenu>
          </CuiDropdown>
          <p class="mt-3 text-sm text-surface-600 dark:text-surface-400">
            <code class="cui-code">shortcut</code> is a hint, not a binding — register the real
            key handler yourself.
          </p>
        </Example>

        <!-- With Descriptions -->
        <Example title="Items with Descriptions" :code="`<CuiDropdownMenu min-width=&quot;16rem&quot;>
  <CuiDropdownItem description=&quot;Start with an empty canvas&quot;>
    <template #icon><CuiIcon name=&quot;file-plus&quot; size=&quot;sm&quot; /></template>
    Blank Project
  </CuiDropdownItem>
</CuiDropdownMenu>`">
          <CuiDropdown>
            <CuiDropdownTrigger>
              <CuiButton variant="solid">New...</CuiButton>
            </CuiDropdownTrigger>
            <CuiDropdownMenu min-width="16rem">
              <CuiDropdownItem description="Start with an empty canvas">
                <template #icon><CuiIcon name="file-plus" size="sm" /></template>
                Blank Project
              </CuiDropdownItem>
              <CuiDropdownItem description="Use a pre-built starting point">
                <template #icon><CuiIcon name="folder-open" size="sm" /></template>
                From Template
              </CuiDropdownItem>
              <CuiDropdownItem description="Clone an existing repository">
                <template #icon><CuiIcon name="git-branch" size="sm" /></template>
                Import from Git
              </CuiDropdownItem>
            </CuiDropdownMenu>
          </CuiDropdown>
        </Example>

        <!-- Check Items -->
        <Example title="Check Items (toggle)" :code="`<CuiDropdown>
  <CuiDropdownTrigger>
    <CuiButton variant=&quot;outline&quot;>View</CuiButton>
  </CuiDropdownTrigger>
  <CuiDropdownMenu>
    <CuiDropdownHeader>Show / Hide</CuiDropdownHeader>
    <CuiDropdownCheckItem v-model=&quot;showGrid&quot;>Grid Lines</CuiDropdownCheckItem>
    <CuiDropdownCheckItem v-model=&quot;showSidebar&quot;>Sidebar</CuiDropdownCheckItem>
  </CuiDropdownMenu>
</CuiDropdown>`">
          <CuiStack spacing="2">
            <CuiDropdown>
              <CuiDropdownTrigger>
                <CuiButton variant="outline">
                  <template #prefix><CuiIcon name="sliders" size="sm" /></template>
                  View
                </CuiButton>
              </CuiDropdownTrigger>
              <CuiDropdownMenu>
                <CuiDropdownHeader>Show / Hide</CuiDropdownHeader>
                <CuiDropdownCheckItem v-model="showGrid">Grid Lines</CuiDropdownCheckItem>
                <CuiDropdownCheckItem v-model="showSidebar">Sidebar</CuiDropdownCheckItem>
              </CuiDropdownMenu>
            </CuiDropdown>
            <div class="text-sm text-surface-500">Grid: {{ showGrid }}, Sidebar: {{ showSidebar }}</div>
          </CuiStack>
        </Example>

        <!-- Radio Items -->
        <Example title="Radio Items (single select)" :code="`<CuiDropdownMenu>
  <CuiDropdownHeader>Sort By</CuiDropdownHeader>
  <CuiDropdownRadioGroup v-model=&quot;sortBy&quot; label=&quot;Sort by&quot;>
    <CuiDropdownRadioItem value=&quot;name&quot;>Name</CuiDropdownRadioItem>
    <CuiDropdownRadioItem value=&quot;date&quot;>Date</CuiDropdownRadioItem>
    <CuiDropdownRadioItem value=&quot;size&quot;>Size</CuiDropdownRadioItem>
  </CuiDropdownRadioGroup>
</CuiDropdownMenu>`">
          <CuiStack spacing="2">
            <CuiDropdown>
              <CuiDropdownTrigger>
                <CuiButton variant="outline">Sort: {{ sortBy }}</CuiButton>
              </CuiDropdownTrigger>
              <CuiDropdownMenu>
                <CuiDropdownHeader>Sort By</CuiDropdownHeader>
                <CuiDropdownRadioGroup v-model="sortBy" label="Sort by">
                  <CuiDropdownRadioItem value="name">Name</CuiDropdownRadioItem>
                  <CuiDropdownRadioItem value="date">Date</CuiDropdownRadioItem>
                  <CuiDropdownRadioItem value="size">Size</CuiDropdownRadioItem>
                  <CuiDropdownRadioItem value="type">Type</CuiDropdownRadioItem>
                </CuiDropdownRadioGroup>
              </CuiDropdownMenu>
            </CuiDropdown>
            <div class="text-sm text-surface-500">Sort by: {{ sortBy }}</div>
          </CuiStack>
        </Example>

        <!-- Sub-menus -->
        <Example title="Sub-Menus (nested)" :code="`<CuiDropdownMenu>
  <CuiDropdownItem>Profile</CuiDropdownItem>
  <CuiDropdownSub>
    Theme
    <template #menu>
      <CuiDropdownRadioGroup v-model=&quot;theme&quot; label=&quot;Theme&quot;>
        <CuiDropdownRadioItem value=&quot;light&quot;>Light</CuiDropdownRadioItem>
        <CuiDropdownRadioItem value=&quot;dark&quot;>Dark</CuiDropdownRadioItem>
      </CuiDropdownRadioGroup>
    </template>
  </CuiDropdownSub>
</CuiDropdownMenu>`">
          <CuiDropdown>
            <CuiDropdownTrigger>
              <CuiButton variant="outline">
                <template #prefix><CuiIcon name="gear" size="sm" /></template>
                Settings
              </CuiButton>
            </CuiDropdownTrigger>
            <CuiDropdownMenu>
              <CuiDropdownItem>
                <template #icon><CuiIcon name="user" size="sm" /></template>
                Profile
              </CuiDropdownItem>
              <CuiDropdownSub>
                <template #icon><CuiIcon name="palette" size="sm" /></template>
                Theme
                <template #menu>
                  <CuiDropdownRadioGroup v-model="theme" label="Theme">
                    <CuiDropdownRadioItem value="light">Light</CuiDropdownRadioItem>
                    <CuiDropdownRadioItem value="dark">Dark</CuiDropdownRadioItem>
                    <CuiDropdownRadioItem value="system">System</CuiDropdownRadioItem>
                  </CuiDropdownRadioGroup>
                </template>
              </CuiDropdownSub>
              <CuiDropdownSub>
                <template #icon><CuiIcon name="translate" size="sm" /></template>
                Language
                <template #menu>
                  <CuiDropdownItem>English</CuiDropdownItem>
                  <CuiDropdownItem>Spanish</CuiDropdownItem>
                  <CuiDropdownItem>French</CuiDropdownItem>
                  <CuiDropdownItem>German</CuiDropdownItem>
                </template>
              </CuiDropdownSub>
              <CuiDropdownDivider />
              <CuiDropdownItem shortcut="Ctrl+Q">
                <template #icon><CuiIcon name="sign-out" size="sm" /></template>
                Sign Out
              </CuiDropdownItem>
            </CuiDropdownMenu>
          </CuiDropdown>
        </Example>

        <!-- Hover trigger -->
        <Example title="Hover Trigger" :code="`<CuiDropdown trigger=&quot;hover&quot;>
  <CuiDropdownTrigger>
    <CuiButton variant=&quot;outline&quot;>Hover me</CuiButton>
  </CuiDropdownTrigger>
  <CuiDropdownMenu>
    <CuiDropdownItem>Quick action 1</CuiDropdownItem>
  </CuiDropdownMenu>
</CuiDropdown>`">
          <CuiFlex gap="3">
            <CuiDropdown trigger="hover">
              <CuiDropdownTrigger>
                <CuiButton variant="outline">Hover me</CuiButton>
              </CuiDropdownTrigger>
              <CuiDropdownMenu>
                <CuiDropdownItem>Quick action 1</CuiDropdownItem>
                <CuiDropdownItem>Quick action 2</CuiDropdownItem>
                <CuiDropdownItem>Quick action 3</CuiDropdownItem>
              </CuiDropdownMenu>
            </CuiDropdown>
            <CuiDropdown trigger="click">
              <CuiDropdownTrigger>
                <CuiButton variant="outline">Click me</CuiButton>
              </CuiDropdownTrigger>
              <CuiDropdownMenu>
                <CuiDropdownItem>Action 1</CuiDropdownItem>
                <CuiDropdownItem>Action 2</CuiDropdownItem>
              </CuiDropdownMenu>
            </CuiDropdown>
          </CuiFlex>
        </Example>

        <!-- Disabled items -->
        <Example title="Disabled Items" :code="`<CuiDropdownMenu>
  <CuiDropdownItem>Edit</CuiDropdownItem>
  <CuiDropdownItem disabled>Move (no permission)</CuiDropdownItem>
  <CuiDropdownDivider />
  <CuiDropdownItem disabled>Delete (locked)</CuiDropdownItem>
</CuiDropdownMenu>`">
          <CuiDropdown>
            <CuiDropdownTrigger>
              <CuiButton variant="outline">Actions</CuiButton>
            </CuiDropdownTrigger>
            <CuiDropdownMenu>
              <CuiDropdownItem>Edit</CuiDropdownItem>
              <CuiDropdownItem>Duplicate</CuiDropdownItem>
              <CuiDropdownItem disabled>Move (no permission)</CuiDropdownItem>
              <CuiDropdownDivider />
              <CuiDropdownItem disabled>Delete (locked)</CuiDropdownItem>
            </CuiDropdownMenu>
          </CuiDropdown>
        </Example>

        <!-- Mixed: real-world overflow menu -->
        <Example title="Real-World: Overflow Menu" :code="`<CuiDropdown>
  <CuiDropdownTrigger>
    <CuiButton variant=&quot;ghost&quot; size=&quot;sm&quot; icon aria-label=&quot;More actions&quot;>
      <CuiIcon name=&quot;dots-three&quot; size=&quot;md&quot; weight=&quot;bold&quot; />
    </CuiButton>
  </CuiDropdownTrigger>
  <CuiDropdownMenu min-width=&quot;14rem&quot;>
    <CuiDropdownItem shortcut=&quot;Enter&quot;>
      <template #icon><CuiIcon name=&quot;eye&quot; size=&quot;sm&quot; /></template>
      Open
    </CuiDropdownItem>
    <CuiDropdownDivider />
    <CuiDropdownItem>
      <template #icon><CuiIcon name=&quot;trash&quot; size=&quot;sm&quot; /></template>
      Delete
    </CuiDropdownItem>
  </CuiDropdownMenu>
</CuiDropdown>`">
          <CuiDropdown>
            <CuiDropdownTrigger>
              <CuiButton variant="ghost" size="sm" aria-label="More actions">
                <CuiIcon name="dots-three" size="md" weight="bold" />
              </CuiButton>
            </CuiDropdownTrigger>
            <CuiDropdownMenu min-width="14rem">
              <CuiDropdownItem shortcut="Enter">
                <template #icon><CuiIcon name="eye" size="sm" /></template>
                Open
              </CuiDropdownItem>
              <CuiDropdownItem shortcut="Ctrl+E">
                <template #icon><CuiIcon name="pencil" size="sm" /></template>
                Edit
              </CuiDropdownItem>
              <CuiDropdownDivider />
              <CuiDropdownItem>
                <template #icon><CuiIcon name="copy" size="sm" /></template>
                Duplicate
              </CuiDropdownItem>
              <CuiDropdownItem>
                <template #icon><CuiIcon name="arrow-square-out" size="sm" /></template>
                Open in New Tab
              </CuiDropdownItem>
              <CuiDropdownDivider />
              <CuiDropdownItem>
                <template #icon><CuiIcon name="archive" size="sm" /></template>
                Archive
              </CuiDropdownItem>
              <CuiDropdownItem disabled>
                <template #icon><CuiIcon name="trash" size="sm" /></template>
                Delete
              </CuiDropdownItem>
            </CuiDropdownMenu>
          </CuiDropdown>
          <p class="mt-3 text-sm text-surface-600 dark:text-surface-400">
            An icon-only trigger has no text, so it needs an <code class="cui-code">aria-label</code>
            of its own — the menu behind it supplies no name.
          </p>
        </Example>
    </template>
  </DocPage>
</template>
