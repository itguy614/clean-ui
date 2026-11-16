<script setup lang="ts">
import { ref } from "vue";
import {
  CuiBadge,
  CuiButton,
  CuiList,
  CuiListItem,
  CuiSidebar,
  CuiSidebarContent,
  CuiSidebarFooter,
  CuiSidebarGroup,
  CuiSidebarHeader,
  CuiStack,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/sidebar";

interface DemoLink {
  id: string;
  label: string;
  /** A trailing count. */
  count?: number;
}

const groups: Array<{ label: string; items: DemoLink[] }> = [
  {
    label: "Actions",
    items: [
      { id: "button", label: "Button" },
      { id: "toolbar", label: "Toolbar" },
    ],
  },
  {
    label: "Feedback",
    items: [
      { id: "alert", label: "Alert" },
      { id: "toast", label: "Toast", count: 3 },
      { id: "banner", label: "Banner" },
    ],
  },
];

/** The "current page" of the demos, which a real app takes from its router. */
const current = ref("button");

// Group open state, controlled by the demo that shows v-model:expanded.
const open = ref(false);
const drawerOpen = ref(false);

const usageCode = `<CuiSidebar label="Components" collapse-below="never">
  <CuiSidebarHeader title="Clean UI" subtitle="Vue Component Library">
    <template #suffix><CuiBadge size="sm">v2.1</CuiBadge></template>
  </CuiSidebarHeader>

  <CuiSidebarContent>
    <!-- A standalone link, outside any group -->
    <CuiList>
      <CuiListItem title="Overview" to="/" />
    </CuiList>

    <!-- The group holding the current page opens by itself -->
    <CuiSidebarGroup label="Actions">
      <CuiList>
        <CuiListItem title="Button" to="/components/button" />
        <CuiListItem title="Toolbar" to="/components/toolbar" />
      </CuiList>
    </CuiSidebarGroup>

    <CuiSidebarGroup label="Feedback">
      <CuiList>
        <CuiListItem title="Toast" to="/components/toast">
          <template #trailing><CuiBadge size="sm">3</CuiBadge></template>
        </CuiListItem>
      </CuiList>
    </CuiSidebarGroup>
  </CuiSidebarContent>

  <CuiSidebarFooter>Signed in as kurt</CuiSidebarFooter>
</CuiSidebar>`;

const groupCode = `<CuiSidebarGroup v-model:expanded="open" label="Release notes">
  <CuiList>
    <CuiListItem title="2.1.0" />
    <CuiListItem title="2.0.0" />
  </CuiList>
</CuiSidebarGroup>`;

const drawerCode = `<!-- Below xl the sidebar is not in the page: its links are in a slideover -->
<CuiSidebar collapse-below="xl" label="Docs" v-model:open="drawerOpen">
  …
</CuiSidebar>

<!-- Or open it from your own button and hide the built-in one -->
<!-- toggleAttrs: aria-expanded, aria-controls and the translated name -->
<CuiButton v-bind="sidebar?.toggleAttrs" @click="drawerOpen = true">…</CuiButton>
<CuiSidebar ref="sidebar" :toggle="false" v-model:open="drawerOpen">…</CuiSidebar>`;

const layoutCode = `<div style="display: flex">
  <!-- Sticks below a sticky CuiNavbar, which sets --cui-navbar-height -->
  <CuiSidebar sticky label="Docs" style="width: 16rem; flex-shrink: 0">…</CuiSidebar>
  <main style="flex: 1; min-width: 0">…</main>
</div>`;
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example code-open :code="usageCode">
        <!-- `collapse-below="never"`: this one sits in a card on the page, not beside it. -->
        <div class="h-[28rem] max-w-xs overflow-hidden rounded-lg border border-[var(--cui-border)]">
          <CuiSidebar label="Components" collapse-below="never">
            <CuiSidebarHeader title="Clean UI" subtitle="Vue Component Library">
              <template #suffix><CuiBadge size="sm">v2.1</CuiBadge></template>
            </CuiSidebarHeader>

            <CuiSidebarContent>
              <CuiList>
                <CuiListItem
                  title="Overview"
                  :aria-current="current === 'overview' ? 'page' : undefined"
                  @click="current = 'overview'"
                />
              </CuiList>

              <CuiSidebarGroup v-for="group in groups" :key="group.label" :label="group.label">
                <CuiList>
                  <CuiListItem
                    v-for="item in group.items"
                    :key="item.id"
                    :title="item.label"
                    :aria-current="current === item.id ? 'page' : undefined"
                    @click="current = item.id"
                  >
                    <template v-if="item.count" #trailing><CuiBadge size="sm">{{ item.count }}</CuiBadge></template>
                  </CuiListItem>
                </CuiList>
              </CuiSidebarGroup>
            </CuiSidebarContent>

            <CuiSidebarFooter>Signed in as kurt</CuiSidebarFooter>
          </CuiSidebar>
        </div>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The sidebar is a <code>&lt;nav&gt;</code> landmark with an accessible name
        (<code>label</code>), because a page with a sidebar and another navigation has two and
        they must be told apart.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          The current page's link carries <code>aria-current="page"</code> (a
          <code>router-link</code> sets it itself when exactly active), and is marked by a
          subtle fill and border, never by colour alone and never a solid primary fill.
        </li>
        <li>
          A group heading is a real <code>&lt;button&gt;</code> with <code>aria-expanded</code>
          and <code>aria-controls</code>, so Enter and Space work and the state is announced. Its
          links sit in a <code>role="group"</code> named by the heading.
        </li>
        <li>
          A shut group is <code>hidden="until-found"</code> once its collapse has finished (or
          <code>inert</code> where that is unsupported), so its links leave the tab order and the
          accessibility tree, yet find-in-page still opens it.
        </li>
        <li>
          Below <code>collapse-below</code> the sidebar is not merely invisible: its content is
          not in the page at all until the drawer opens, so nothing in it can take focus. The
          menu button has an accessible name, <code>aria-expanded</code> and
          <code>aria-controls</code> naming the drawer; the drawer traps focus, closes on Escape,
          and returns focus to the button.
        </li>
      </ul>
    </template>

    <template #examples>
      <Example title="Collapsible group, outside a sidebar" :code="groupCode">
        <CuiStack spacing="3" class="max-w-xs">
          <CuiSidebarGroup v-model:expanded="open" label="Release notes">
            <CuiList>
              <CuiListItem title="2.1.0" />
              <CuiListItem title="2.0.0" />
            </CuiList>
          </CuiSidebarGroup>
          <CuiButton size="sm" variant="outline" :aria-pressed="open" @click="open = !open">
            {{ open ? "Close" : "Open" }} from outside
          </CuiButton>
        </CuiStack>
      </Example>

      <Example title="Collapsing into a drawer" :code="drawerCode">
        <p class="mb-3 text-surface-700 dark:text-surface-300">
          Below the <code>collapse-below</code> viewport (<code>lg</code> by default) the sidebar
          becomes a menu button and a slideover. Narrow this window to see it; the sidebar below
          collapses under <code>2xl</code>, so it does on most screens.
        </p>
        <CuiSidebar v-model:open="drawerOpen" label="Collapsing demo" collapse-below="2xl" class="max-w-xs">
          <CuiSidebarHeader title="Collapses" />
          <CuiSidebarContent>
            <CuiSidebarGroup label="Actions" default-expanded>
              <CuiList>
                <CuiListItem title="Button" />
                <CuiListItem title="Toolbar" />
              </CuiList>
            </CuiSidebarGroup>
          </CuiSidebarContent>
        </CuiSidebar>
      </Example>

      <Example title="In a page layout" :code="layoutCode">
        <p class="text-surface-700 dark:text-surface-300">
          A sidebar sizes to its container and never assumes it owns the viewport, so it works in
          a drawer or a panel. In a page, give it a width and <code>sticky</code>: it sticks
          below a sticky <code>CuiNavbar</code> through <code>--cui-navbar-height</code>, and its
          content scrolls inside it.
        </p>
      </Example>
    </template>
  </DocPage>
</template>
