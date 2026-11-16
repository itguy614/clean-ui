<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import {
  CuiBadge,
  CuiBreadcrumb,
  CuiBreadcrumbItem,
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

// A docs reader: a library's documentation, whose map of pages is the way around.
interface DemoPage {
  id: string;
  label: string;
  icon: string;
}

const intro: DemoPage = { id: "welcome", label: "Welcome", icon: "house" };
const groups: Array<{ label: string; items: DemoPage[] }> = [
  {
    label: "Guides",
    items: [
      { id: "install", label: "Installation", icon: "download-simple" },
      { id: "theming", label: "Theming", icon: "palette" },
      { id: "forms", label: "Forms", icon: "textbox" },
    ],
  },
  {
    label: "Reference",
    items: [
      { id: "api", label: "API", icon: "brackets-curly" },
      { id: "changelog", label: "Changelog", icon: "clock-counter-clockwise" },
    ],
  },
];

/** The "current page", which a real app takes from its router. */
const current = ref(intro.id);
const currentPage = computed(() => [intro, ...groups.flatMap((g) => g.items)].find((p) => p.id === current.value) ?? intro);

const drawerOpen = ref(false);
const sidebar = useTemplateRef("sidebar");

const pageCode = `<script setup>
const open = ref(false);
const sidebar = useTemplateRef("sidebar");
<\/script>

<template>
  <div style="display: flex">
    <!-- The column runs the full height of the viewport. Hidden below lg, where the sidebar is
         not in the page and its links are in a drawer: without this the collapsed sidebar
         would leave an empty strip. top: 0, because nothing sits above it. -->
    <aside class="hidden lg:block" style="width: 16rem; flex-shrink: 0; position: sticky; top: 0; height: 100vh">
      <CuiSidebar ref="sidebar" v-model:open="open" label="Documentation" :toggle="false" style="width: 100%">
        <!-- The brand lives here, once -->
        <CuiSidebarHeader title="Acme Docs" subtitle="Component library">
          <template #suffix><CuiBadge size="sm" color="primary">v2.1</CuiBadge></template>
        </CuiSidebarHeader>
        <CuiSidebarContent>
          <CuiList>
            <CuiListItem title="Welcome" icon="house" to="/" />
          </CuiList>
          <CuiSidebarGroup label="Guides">
            <CuiList>
              <CuiListItem title="Installation" icon="download-simple" to="/guides/install" />
              <CuiListItem title="Theming" icon="palette" to="/guides/theming" />
            </CuiList>
          </CuiSidebarGroup>
        </CuiSidebarContent>
        <CuiSidebarFooter>…theme controls, account…</CuiSidebarFooter>
      </CuiSidebar>
    </aside>

    <div style="flex: 1; min-width: 0">
      <!-- The bar spans the content column only, so it sticks at the top of that column:
           --cui-navbar-height is still published, and still sets scroll-padding-top. -->
      <CuiNavbar sticky translucent>
        <CuiButton class="lg:!hidden" variant="ghost" size="sm" v-bind="sidebar?.toggleAttrs" @click="open = true">
          <template #prefix><CuiIcon name="list" size="1.25rem" /></template>
        </CuiButton>
        <!-- Page context, not the brand: the brand is in the sidebar. Below lg the sidebar is
             closed, so the brand shows here instead; the two are never on screen together. -->
        <CuiNavbarBrand class="lg:!hidden">Acme Docs</CuiNavbarBrand>
        <CuiBreadcrumb class="hidden lg:flex">…</CuiBreadcrumb>
        <CuiNavbarActions>
          <CuiButton variant="ghost" size="sm">Edit this page</CuiButton>
        </CuiNavbarActions>
      </CuiNavbar>

      <main id="main" tabindex="-1">
        <router-view />
      </main>
    </div>
  </div>
</template>`;

const frameCode = `<!-- The same regions where the container, not the page, scrolls: nothing sticky -->
<div style="display: flex; height: 32rem; overflow: hidden">
  <aside class="hidden lg:block" style="width: 14rem">
    <CuiSidebar collapse-below="lg" style="width: 100%">…</CuiSidebar>
  </aside>
  <div style="flex: 1; min-width: 0; display: flex; flex-direction: column">
    <CuiNavbar>…</CuiNavbar>
    <main style="flex: 1; min-height: 0; overflow: auto">…</main>
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
    description="A sidebar-first shell: the navigation runs the full height of the page at the left, and a slim bar sits over the content only. The shell of documentation sites, and the one this site is built with."
  >
    <template #when>
      <p>
        Choose it when the navigation <em>is</em> the product: many pages, in groups, that a reader
        moves between all day. A column shows the whole map at once and the current place in it, and
        it keeps its scroll position while the content changes.
      </p>
      <ul class="list-disc pl-5">
        <li>Documentation, knowledge bases, wikis, settings and admin areas.</li>
        <li>
          <strong>Sidebar-first or navbar-first?</strong> Here the sidebar owns the left edge from top
          to bottom, with the brand, the version and the account or theme controls in its header and
          footer, and the bar only carries page context (a breadcrumb or title) and page actions. If
          the app instead has one global bar (brand, search, account) that spans the whole page, with
          the navigation under it, that is <router-link to="/app-shells/navbar-sidebar">navbar and sidebar</router-link>.
        </li>
        <li>Skip it for a handful of top-level links: a <router-link to="/app-shells/navbar">top navbar</router-link> costs the page no width.</li>
      </ul>
      <p>
        <strong>The brand lives in the sidebar header.</strong> When the sidebar is the primary
        navigation it is the natural home of the product's name, and a second copy in the bar would
        only repeat it. The bar is freed for what changes page by page. (Below <code>lg</code> the
        sidebar is closed, so the bar shows the brand then; the two are never on screen together.)
      </p>
      <p>
        Built from <router-link to="/components/sidebar">CuiSidebar</router-link>, a
        <router-link to="/components/navbar">CuiNavbar</router-link> over the content column, and a
        plain flex row. There is no shell component: the layout is yours to arrange.
      </p>
    </template>

    <template #demo>
      <ShellFrame label="Sidebar and content: a docs reader">
        <div class="cui-shell-frame__body">
          <div class="cui-shell-frame__side hidden lg:block">
            <CuiSidebar
              ref="sidebar"
              v-model:open="drawerOpen"
              label="Demo documentation"
              :toggle="false"
              :style="{ width: '100%' }"
            >
              <CuiSidebarHeader title="Acme Docs" subtitle="Component library" icon="books">
                <template #suffix><CuiBadge color="primary" size="sm">v2.1</CuiBadge></template>
              </CuiSidebarHeader>
              <CuiSidebarContent>
                <CuiList>
                  <CuiListItem
                    :title="intro.label"
                    :icon="intro.icon"
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
                      :icon="item.icon"
                      :href="`#${item.id}`"
                      :aria-current="current === item.id ? 'page' : undefined"
                      @click.prevent="current = item.id"
                    />
                  </CuiList>
                </CuiSidebarGroup>
              </CuiSidebarContent>
              <CuiSidebarFooter>
                <CuiButton variant="ghost" size="sm">
                  <template #prefix><CuiIcon name="palette" size="sm" /></template>
                  Theme: Navy
                </CuiButton>
              </CuiSidebarFooter>
            </CuiSidebar>
          </div>

          <div class="cui-shell-frame__col">
            <CuiNavbar label="Demo page bar" collapse-below="never">
              <!-- Below lg the sidebar is a drawer, opened from here; hidden from lg up. The class
                   is an `!important` utility because CuiButton's own display rule beats a layered one. -->
              <CuiButton
                class="lg:!hidden"
                variant="ghost"
                size="sm"
                v-bind="sidebar?.toggleAttrs"
                @click="drawerOpen = true"
              >
                <template #prefix><CuiIcon name="list" size="1.25rem" /></template>
              </CuiButton>
              <CuiNavbarBrand class="lg:!hidden">Acme Docs</CuiNavbarBrand>
              <CuiBreadcrumb class="hidden lg:flex">
                <CuiBreadcrumbItem href="#welcome" @click.prevent="current = intro.id">Docs</CuiBreadcrumbItem>
                <CuiBreadcrumbItem>{{ currentPage.label }}</CuiBreadcrumbItem>
              </CuiBreadcrumb>
              <CuiNavbarActions>
                <CuiButton variant="ghost" size="sm">
                  <template #prefix><CuiIcon name="pencil-simple" size="sm" /></template>
                  Edit this page
                </CuiButton>
              </CuiNavbarActions>
            </CuiNavbar>

            <div class="cui-shell-frame__main cui-shell-frame__pad" role="region" tabindex="0" aria-label="Demo content">
              <h3 class="cui-shell-title">{{ currentPage.label }}</h3>
              <p v-for="n in 8" :key="n" class="cui-shell-text">
                Only this column scrolls. The sidebar keeps its own place from top to bottom, so the
                current page stays in view however far down the content is (paragraph {{ n }}).
              </p>
            </div>
          </div>
        </div>
      </ShellFrame>
    </template>

    <template #code>
      <Example title="The page" code-open :code="pageCode">
        <p class="text-surface-700 dark:text-surface-300">
          The sidebar sizes to its container, so the column is a sticky <code>&lt;aside&gt;</code>
          with a width and the viewport's height; the sidebar's own content scrolls inside it. The
          wrapper is hidden below <code>lg</code>, where the sidebar is a drawer. This is how this
          site is built. The bar sticks at the top of the <em>content column</em>, so it still
          publishes <code>--cui-navbar-height</code> and sets <code>scroll-padding-top</code>: an
          anchor jump or a focused link in the content clears it. The sidebar does not read the
          token, because nothing sits above it; its own <code>sticky</code> prop is for a navbar that
          spans the page, as in <router-link to="/app-shells/navbar-sidebar">navbar and sidebar</router-link>.
          <code>translucent</code> frosts the bar over the content passing under it, as on this site.
        </p>
      </Example>
      <Example title="Inside a container" :code="frameCode">
        <p class="text-surface-700 dark:text-surface-300">
          What the demo above runs. Drop <code>sticky</code> and give the container a height: the
          sidebar fills the full height, the bar sits over the content, and the content scrolls on its own.
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
          <strong>The bar owns the button</strong> (this site, and the demo above). The navbar has
          no <code>CuiNavbarNav</code> and so no built-in menu button; a plain
          <code>CuiButton</code> in the bar opens the sidebar's drawer. Bind the sidebar's exposed
          <code>toggleAttrs</code> (<code>aria-expanded</code>, <code>aria-controls</code> and the
          translated name) and set <code>:toggle="false"</code> on the sidebar so it draws no button
          of its own. Hide the button from <code>lg</code> up with <code>lg:!hidden</code>: the
          <code>!</code> is needed because CuiButton's own display rule beats a layered Tailwind
          <code>hidden</code>.
        </li>
        <li>
          <strong>The sidebar owns the button</strong>: leave <code>toggle</code> on and the collapsed
          sidebar draws its menu button where the column was. Simplest, but it sits in the page, not
          the bar.
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
          <code>label</code>; the bar is a <code>&lt;header&gt;</code>. Keep one
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
          fill and border, not colour alone. A breadcrumb's last item is the current page too.
        </li>
        <li>
          <strong>Focus order.</strong> It follows the markup: sidebar, then bar, then content. Below the
          breakpoint the sidebar is not in the page at all until opened, so it takes no tab stops.
        </li>
        <li>
          <strong>The drawer.</strong> A dialog that traps focus, closes on Escape or when a link is
          followed, and returns focus to the button that opened it.
        </li>
        <li>
          <strong>Scrolling content.</strong> A region that scrolls on its own, as in the frame above,
          needs to be reachable by keyboard: give it <code>tabindex="0"</code>, <code>role="region"</code> and a name when it has
          nothing focusable inside. On a real page the document scrolls and none of this applies.
        </li>
      </ul>
    </template>
  </ShellPage>
</template>
