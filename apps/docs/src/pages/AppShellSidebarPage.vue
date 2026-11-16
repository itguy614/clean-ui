<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import {
  CuiBadge,
  CuiButton,
  CuiIcon,
  CuiList,
  CuiListItem,
  CuiNavbar,
  CuiNavbarActions,
  CuiNavbarBrand,
  CuiSidebar,
  CuiSidebarContent,
  CuiSidebarFooter,
  CuiSidebarGroup,
  CuiSidebarHeader,
} from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import ShellFrame from "../components/ShellFrame.vue";
import ShellPage from "../components/ShellPage.vue";

interface DemoPage {
  id: string;
  label: string;
}

const intro: DemoPage = { id: "welcome", label: "Welcome" };
const groups: Array<{ label: string; items: DemoPage[] }> = [
  {
    label: "Guides",
    items: [
      { id: "install", label: "Installation" },
      { id: "theming", label: "Theming" },
    ],
  },
  {
    label: "Reference",
    items: [
      { id: "api", label: "API" },
      { id: "changelog", label: "Changelog" },
    ],
  },
];

/** The "current page", which a real app takes from its router. */
const current = ref(intro.id);
const currentLabel = computed(
  () => [intro, ...groups.flatMap((g) => g.items)].find((p) => p.id === current.value)?.label ?? intro.label,
);

const drawerOpen = ref(false);
const sidebar = useTemplateRef("sidebar");

const pageCode = `<script setup>
const open = ref(false);
const sidebar = useTemplateRef("sidebar");
<\/script>

<template>
  <div style="display: flex">
    <!-- Wide: a sticky column. Below lg it is not in the page: its links are in a drawer. -->
    <CuiSidebar
      ref="sidebar"
      v-model:open="open"
      sticky
      label="Documentation"
      :toggle="false"
      style="width: 16rem; flex-shrink: 0"
    >
      <CuiSidebarHeader title="Acme Docs" subtitle="Version 2.1" />
      <CuiSidebarContent>
        <CuiList>
          <CuiListItem title="Welcome" to="/" />
        </CuiList>
        <CuiSidebarGroup label="Guides">
          <CuiList>
            <CuiListItem title="Installation" to="/guides/install" />
            <CuiListItem title="Theming" to="/guides/theming" />
          </CuiList>
        </CuiSidebarGroup>
      </CuiSidebarContent>
      <CuiSidebarFooter>Signed in as kurt</CuiSidebarFooter>
    </CuiSidebar>

    <div style="flex: 1; min-width: 0">
      <!-- The header is a navbar with no nav of its own: the sidebar is the navigation -->
      <CuiNavbar sticky>
        <CuiButton
          class="lg:!hidden"
          variant="ghost"
          size="sm"
          v-bind="sidebar?.toggleAttrs"
          @click="open = true"
        >
          <template #prefix><CuiIcon name="list" size="1.25rem" /></template>
        </CuiButton>
        <CuiNavbarBrand>Acme Docs</CuiNavbarBrand>
        <CuiNavbarActions>…</CuiNavbarActions>
      </CuiNavbar>

      <main id="main" tabindex="-1">
        <router-view />
      </main>
    </div>
  </div>
</template>`;

const frameCode = `<!-- The same regions where the container, not the page, scrolls: nothing sticky -->
<div style="display: flex; flex-direction: column; height: 32rem; overflow: hidden">
  <CuiNavbar>…</CuiNavbar>
  <div style="display: flex; flex: 1; min-height: 0">
    <CuiSidebar collapse-below="lg" style="width: 14rem">…</CuiSidebar>
    <main style="flex: 1; min-width: 0; overflow: auto">…</main>
  </div>
</div>`;

const skipCode = `<body>
  <!-- First in the tab order, visible only while focused. The library ships no utilities,
       so this is your own class (here Tailwind's sr-only / not-sr-only). -->
  <a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>
  …
</body>`;
</script>

<template>
  <ShellPage
    title="Sidebar and content"
    description="A navigation column beside the page. The shell of documentation sites and admin tools, and the one this site is built with."
  >
    <template #when>
      <p>
        Choose it when the navigation is the main way around: many pages, in groups, that a reader
        moves between all day. A column shows the whole map at once and the current place in it, and
        it keeps its scroll position while the content changes.
      </p>
      <ul class="list-disc pl-5">
        <li>Documentation, knowledge bases, settings and admin areas.</li>
        <li>Skip it for a handful of top-level links: a <router-link to="/app-shells/navbar">top navbar</router-link> costs the page no width.</li>
        <li>Add a navbar above it when the page also needs global actions, search or an account menu: see <router-link to="/app-shells/navbar-sidebar">navbar and sidebar</router-link>.</li>
      </ul>
      <p>
        Built from <router-link to="/components/sidebar">CuiSidebar</router-link>, a
        <router-link to="/components/navbar">CuiNavbar</router-link> as the header, and a plain flex row.
        There is no shell component: the layout is yours to arrange.
      </p>
    </template>

    <template #demo>
      <ShellFrame label="Sidebar and content">
        <CuiNavbar label="Demo header" collapse-below="never">
          <!-- Below lg the sidebar is a drawer, opened from here; hidden from lg up. The class
               is an `!important` utility because CuiButton's own display rule beats a layered one. -->
          <CuiButton
            class="lg:!hidden"
            variant="ghost"
            size="sm"
            v-bind="sidebar?.toggleAttrs"
            aria-label="Demo navigation menu"
            @click="drawerOpen = true"
          >
            <template #prefix><CuiIcon name="list" size="1.25rem" /></template>
          </CuiButton>
          <CuiNavbarBrand>Acme Docs</CuiNavbarBrand>
          <CuiNavbarActions>
            <CuiButton variant="ghost" size="sm">Search</CuiButton>
          </CuiNavbarActions>
        </CuiNavbar>

        <div class="cui-shell-frame__body">
          <div class="cui-shell-frame__side hidden lg:block">
            <CuiSidebar
              ref="sidebar"
              v-model:open="drawerOpen"
              label="Demo documentation"
              :toggle="false"
              :style="{ width: '100%' }"
            >
              <CuiSidebarHeader title="Acme Docs" subtitle="Version 2.1">
                <template #suffix><CuiBadge color="primary" size="sm">v2.1</CuiBadge></template>
              </CuiSidebarHeader>
              <CuiSidebarContent>
                <CuiList>
                  <CuiListItem
                    :title="intro.label"
                    href="#welcome"
                    :aria-current="current === intro.id ? 'page' : undefined"
                    @click.prevent="current = intro.id"
                  />
                </CuiList>
                <CuiSidebarGroup v-for="group in groups" :key="group.label" :label="group.label" default-expanded>
                  <CuiList>
                    <CuiListItem
                      v-for="item in group.items"
                      :key="item.id"
                      :title="item.label"
                      :href="`#${item.id}`"
                      :aria-current="current === item.id ? 'page' : undefined"
                      @click.prevent="current = item.id"
                    />
                  </CuiList>
                </CuiSidebarGroup>
              </CuiSidebarContent>
              <CuiSidebarFooter>Signed in as kurt</CuiSidebarFooter>
            </CuiSidebar>
          </div>

          <div class="cui-shell-frame__main cui-shell-frame__pad" tabindex="0" aria-label="Demo content">
            <h3 class="cui-shell-title">{{ currentLabel }}</h3>
            <p v-for="n in 8" :key="n" class="cui-shell-text">
              Only this column scrolls. The sidebar keeps its own place, so the current page stays
              in view however far down the content is (paragraph {{ n }}).
            </p>
          </div>
        </div>
      </ShellFrame>
    </template>

    <template #code>
      <Example title="The page" code-open :code="pageCode">
        <p class="text-surface-700 dark:text-surface-300">
          A sticky sidebar sticks below <code>--cui-navbar-height</code> (<code>0</code> with no
          sticky navbar above it) and fills the rest of the viewport; its content scrolls inside it.
          Give it a width: it sizes to its container. This is how this site is built.
        </p>
      </Example>
      <Example title="Inside a container" :code="frameCode">
        <p class="text-surface-700 dark:text-surface-300">
          What the demo above runs. Drop <code>sticky</code> and give the container a height, and
          the regions fill it: the sidebar to its height, the content scrolling on its own.
        </p>
      </Example>
    </template>

    <template #mobile>
      <p>
        Below <code>collapse-below</code> (<code>lg</code> by default) the sidebar is not in the
        page: its content moves into a slideover. There are two ways to open it.
      </p>
      <ul class="list-disc pl-5">
        <li>
          <strong>The header owns the button</strong> (this site, and the demo above). The navbar has
          no <code>CuiNavbarNav</code> and so no built-in menu button; a plain
          <code>CuiButton</code> in the header opens the sidebar's drawer. Bind the sidebar's exposed
          <code>toggleAttrs</code> (<code>aria-expanded</code>, <code>aria-controls</code> and the
          translated name) and set <code>:toggle="false"</code> on the sidebar so it draws no button
          of its own. Hide the button from <code>lg</code> up with <code>lg:!hidden</code>: the
          <code>!</code> is needed because CuiButton's own display rule beats a layered Tailwind
          <code>hidden</code>.
        </li>
        <li>
          <strong>The sidebar owns the button</strong>: leave <code>toggle</code> on and the collapsed
          sidebar draws its menu button where the column was. Simplest, but it sits in the page, not
          the header.
        </li>
      </ul>
      <p>
        Following a link closes the drawer and focus returns to the button that opened it. Add
        <code>v-model:open</code> when the route should close it too, as this site does.
      </p>
      <p>
        A site with a navbar <em>and</em> a navbar nav relies on the navbar's own built-in menu
        button for that nav instead: see <router-link to="/app-shells/navbar">top navbar and content</router-link>.
      </p>
    </template>

    <template #accessibility>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <strong>Landmarks.</strong> The sidebar is a <code>&lt;nav&gt;</code> named by
          <code>label</code>; the navbar is a <code>&lt;header&gt;</code>. Keep one
          <code>&lt;header&gt;</code> and one <code>&lt;main&gt;</code> per page, and name every
          <code>&lt;nav&gt;</code> if there is more than one.
        </li>
        <li>
          <strong>Skip link.</strong> The sidebar comes before the content in the tab order, so give
          the page a link that jumps past it, and make its target focusable.
          <pre class="cui-pre mt-2"><code>{{ skipCode }}</code></pre>
        </li>
        <li>
          <strong><code>aria-current</code>.</strong> The current page's link carries
          <code>aria-current="page"</code>; a <code>router-link</code> sets it itself. It is shown by a
          fill and border, not colour alone.
        </li>
        <li>
          <strong>Focus order.</strong> Header, then sidebar, then content, as they read. Below the
          breakpoint the sidebar is not in the page at all until opened, so it takes no tab stops.
        </li>
        <li>
          <strong>The drawer.</strong> A dialog that traps focus, closes on Escape or when a link is
          followed, and returns focus to the button that opened it.
        </li>
        <li>
          <strong>Scrolling content.</strong> A region that scrolls on its own, as in the frame above,
          needs to be reachable by keyboard: give it <code>tabindex="0"</code> and a name when it has
          nothing focusable inside. On a real page the document scrolls and none of this applies.
        </li>
      </ul>
    </template>
  </ShellPage>
</template>
