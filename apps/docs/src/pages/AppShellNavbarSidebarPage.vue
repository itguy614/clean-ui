<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import {
  CuiBadge,
  CuiButton,
  CuiCard,
  CuiCardBody,
  CuiGrid,
  CuiIcon,
  CuiList,
  CuiListItem,
  CuiNavbar,
  CuiNavbarActions,
  CuiNavbarBrand,
  CuiSidebar,
  CuiSidebarContent,
  CuiSidebarGroup,
  CuiStack,
} from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import ShellFrame from "../components/ShellFrame.vue";
import ShellPage from "../components/ShellPage.vue";

const sections = [
  { id: "overview", label: "Overview", icon: "squares-four" },
  { id: "reports", label: "Reports", icon: "chart-line-up" },
];
const workspace = [
  { id: "team", label: "Team", icon: "users-three", count: 4 },
  { id: "billing", label: "Billing", icon: "credit-card" },
  { id: "settings", label: "Settings", icon: "gear" },
];
const current = ref("overview");
const drawerOpen = ref(false);
const sidebar = useTemplateRef("sidebar");

const stats = [
  { label: "Active users", value: "1,284" },
  { label: "Revenue", value: "$18.2k" },
  { label: "Open issues", value: "23" },
];

const pageCode = `<template>
  <!-- A sticky navbar publishes its height as --cui-navbar-height, and scroll-padding-top -->
  <CuiNavbar sticky label="Account">
    <CuiButton class="lg:!hidden" variant="ghost" size="sm" v-bind="sidebar?.toggleAttrs" @click="open = true">
      <template #prefix><CuiIcon name="list" size="1.25rem" /></template>
    </CuiButton>
    <CuiNavbarBrand href="/">Pulse Console</CuiNavbarBrand>
    <CuiNavbarActions>
      <CuiButton variant="ghost" size="sm">Search</CuiButton>
      <CuiButton variant="ghost" size="sm">Kurt</CuiButton>
    </CuiNavbarActions>
  </CuiNavbar>

  <div style="display: flex">
    <!-- Hidden below lg, where the sidebar is a drawer, or it would leave an empty column.
         sticky: top is --cui-navbar-height and the height is the rest of the viewport. -->
    <aside class="hidden lg:block" style="width: 16rem; flex-shrink: 0">
      <CuiSidebar ref="sidebar" v-model:open="open" sticky label="Sections" :toggle="false"
                  style="width: 100%">
        <CuiSidebarContent>…</CuiSidebarContent>
      </CuiSidebar>
    </aside>

    <main id="main" tabindex="-1" style="flex: 1; min-width: 0">
      <!-- Anything of your own that sticks reads the same token: never a number -->
      <div style="position: sticky; top: var(--cui-navbar-height, 0px)">Filters</div>
      …
    </main>
  </div>
</template>`;

const frameCode = `<!-- The demo: nothing is sticky; the navbar sits above a row whose content scrolls -->
<div style="display: flex; flex-direction: column; height: 32rem; overflow: hidden">
  <CuiNavbar>…</CuiNavbar>
  <div style="display: flex; flex: 1; min-height: 0">
    <CuiSidebar style="width: 14rem">…</CuiSidebar>
    <main style="flex: 1; min-width: 0; overflow: auto">…</main>
  </div>
</div>`;
</script>

<template>
  <ShellPage
    title="Navbar and sidebar"
    description="A header across the top over a navigation column and the content: the typical dashboard. Both stay put while the content scrolls."
  >
    <template #when>
      <p>
        Choose it when the app has two kinds of navigation. The sidebar is where you go: sections,
        tools, records. The navbar is what you do from anywhere: search, notifications, the account
        menu, a workspace switcher.
      </p>
      <ul class="list-disc pl-5">
        <li>Dashboards, admin consoles, SaaS products, back offices.</li>
        <li>Without global actions, <router-link to="/app-shells/sidebar">sidebar and content</router-link> is simpler; without a deep map, <router-link to="/app-shells/navbar">a navbar</router-link> is.</li>
      </ul>
      <p>
        <strong>The brand lives in the navbar.</strong> The bar spans the full width above everything,
        so it is the first thing on the page and holds the product's name; the sidebar underneath has
        no header of its own (or one that names the section, never the product). When the sidebar owns
        the left edge from top to bottom instead, the brand moves into it: see
        <router-link to="/app-shells/sidebar">sidebar and content</router-link>. Choose a
        <em>navbar-first</em> shell like this one when the bar carries global things (search, notifications,
        the account menu) that belong to the whole app, a <em>sidebar-first</em> one when the
        navigation is the product.
      </p>
      <p>
        The two are coupled by one token. A sticky navbar sets <code>--cui-navbar-height</code> on the
        document; a sticky sidebar offsets itself by it, and so does anything else of yours that
        sticks. Read the token. Never write the navbar's height as a number, because it changes with
        density, font size and wrapping, and the navbar keeps the token current.
      </p>
    </template>

    <template #demo>
      <ShellFrame label="Navbar and sidebar">
        <CuiNavbar label="Demo account" collapse-below="never">
          <CuiButton
            class="lg:!hidden"
            variant="ghost"
            size="sm"
            v-bind="sidebar?.toggleAttrs"
            @click="drawerOpen = true"
          >
            <template #prefix><CuiIcon name="list" size="1.25rem" /></template>
          </CuiButton>
          <CuiNavbarBrand>Pulse Console</CuiNavbarBrand>
          <CuiNavbarActions>
            <CuiButton variant="ghost" size="sm">
              <template #prefix><CuiIcon name="magnifying-glass" size="sm" /></template>
              Search
            </CuiButton>
            <CuiButton variant="ghost" size="sm" aria-label="Notifications, 3 unread">
              <template #prefix><CuiIcon name="bell" size="sm" /></template>
              <CuiBadge size="sm" color="primary">3</CuiBadge>
            </CuiButton>
          </CuiNavbarActions>
        </CuiNavbar>

        <div class="cui-shell-frame__body">
          <div class="cui-shell-frame__side hidden lg:block">
            <CuiSidebar
              ref="sidebar"
              v-model:open="drawerOpen"
              label="Demo sections"
              :toggle="false"
              :style="{ width: '100%' }"
            >
              <CuiSidebarContent>
                <CuiList>
                  <CuiListItem
                    v-for="s in sections"
                    :key="s.id"
                    :title="s.label"
                    :icon="s.icon"
                    :href="`#${s.id}`"
                    :aria-current="current === s.id ? 'page' : undefined"
                    @click.prevent="current = s.id"
                  />
                </CuiList>
                <CuiSidebarGroup label="Workspace" default-expanded>
                  <CuiList>
                    <CuiListItem
                      v-for="s in workspace"
                      :key="s.id"
                      :title="s.label"
                      :icon="s.icon"
                      :href="`#${s.id}`"
                      :aria-current="current === s.id ? 'page' : undefined"
                      @click.prevent="current = s.id"
                    >
                      <template v-if="s.count" #trailing><CuiBadge size="sm">{{ s.count }}</CuiBadge></template>
                    </CuiListItem>
                  </CuiList>
                </CuiSidebarGroup>
              </CuiSidebarContent>
            </CuiSidebar>
          </div>

          <div class="cui-shell-frame__main cui-shell-frame__pad" role="region" tabindex="0" aria-label="Demo content">
            <CuiStack spacing="4">
              <div>
                <h3 class="cui-shell-title">{{ [...sections, ...workspace].find((s) => s.id === current)?.label }}</h3>
                <p class="cui-shell-text">The navbar and the sidebar stay; only this column scrolls.</p>
              </div>
              <CuiGrid :cols="{ sm: 1, lg: 3 }" gap="3">
                <CuiCard v-for="s in stats" :key="s.label" variant="outline">
                  <CuiCardBody>
                    <p class="cui-shell-text">{{ s.label }}</p>
                    <p class="cui-shell-title">{{ s.value }}</p>
                  </CuiCardBody>
                </CuiCard>
              </CuiGrid>
              <CuiList divided>
                <CuiListItem v-for="n in 12" :key="n" :title="`Activity ${n}`" subtitle="Something happened in the workspace" />
              </CuiList>
            </CuiStack>
          </div>
        </div>
      </ShellFrame>
    </template>

    <template #code>
      <Example title="The page" code-open :code="pageCode">
        <p class="text-surface-700 dark:text-surface-300">
          Header on top, then a row: a sticky sidebar and the content. The page itself scrolls and
          both stay in view. The sidebar's own content scrolls inside it when it is taller than the
          screen.
        </p>
      </Example>
      <Example title="Inside a container" :code="frameCode">
        <p class="text-surface-700 dark:text-surface-300">
          What the demo above runs. There is no offset to compute: the sidebar sits beside the
          scroller, not under the bar. Use this form for a shell that lives in a panel, a modal or a
          micro-frontend, where the page's scroll is not yours.
        </p>
      </Example>
    </template>

    <template #mobile>
      <p>
        Below <code>collapse-below</code> (<code>lg</code> by default) the sidebar leaves the page and
        its links move into a slideover, which a button in the header opens. That is this site's own
        shell: the navigation is the sidebar, so the navbar has no <code>CuiNavbarNav</code> and no
        built-in menu button.
      </p>
      <ul class="list-disc pl-5">
        <li>
          A plain <code>CuiButton</code> in the header, hidden from <code>lg</code> up with
          <code>lg:!hidden</code> (the <code>!</code> because CuiButton's own display rule beats a
          layered Tailwind <code>hidden</code>), bound to the sidebar's exposed
          <code>toggleAttrs</code>. Set <code>:toggle="false"</code> on the sidebar.
        </li>
        <li>Following a link closes the drawer and returns focus to that button.</li>
        <li>
          If the navbar <em>also</em> has links of its own (<code>CuiNavbarNav</code>), it keeps its
          built-in menu button for them, and you now have two drawers. Prefer one: put those links in
          the sidebar, or keep the navbar to actions.
        </li>
      </ul>
    </template>

    <template #accessibility>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <strong>Landmarks.</strong> One <code>&lt;header&gt;</code> (the navbar), one
          <code>&lt;main&gt;</code>, and two <code>&lt;nav&gt;</code>s if both have navigation. Two
          unnamed navs are announced identically, so name them for what they hold: here
          <code>label="Account"</code> on the navbar and <code>label="Sections"</code> on the sidebar,
          not "Main" twice.
        </li>
        <li>
          <strong>Skip link.</strong> Header, then sidebar, then content: a keyboard user tabs through
          both before the page. Add a skip link that targets <code>&lt;main id="main" tabindex="-1"&gt;</code>.
        </li>
        <li>
          <strong>Focus is never hidden.</strong> A sticky navbar sets <code>scroll-padding-top</code>
          from its height, so tabbing to a control or following an anchor does not leave it under the
          bar (WCAG 2.4.11). Your own sticky regions that read <code>--cui-navbar-height</code> stack
          under it correctly.
        </li>
        <li>
          <strong><code>aria-current</code>.</strong> Mark the current page in the sidebar. The navbar's
          own links, if any, are marked separately.
        </li>
        <li>
          <strong>The drawer.</strong> A dialog that traps focus, closes on Escape or when a link is
          followed, and returns focus to the header button. The button's name comes from the library's
          catalogue, so it is translated with the rest.
        </li>
      </ul>
    </template>
  </ShellPage>
</template>
