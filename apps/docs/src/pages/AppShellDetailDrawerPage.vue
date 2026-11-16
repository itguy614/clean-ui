<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import {
  CuiBadge,
  CuiButton,
  CuiIcon,
  CuiList,
  CuiListItem,
  CuiModalHeader,
  CuiNavbar,
  CuiNavbarBrand,
  CuiPanel,
  CuiSidebar,
  CuiSidebarContent,
  CuiSidebarHeader,
  CuiSlideover,
  CuiStack,
} from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import ShellFrame from "../components/ShellFrame.vue";
import ShellPage from "../components/ShellPage.vue";

interface DemoOrder {
  id: string;
  customer: string;
  total: string;
  status: "Paid" | "Pending" | "Refunded";
}

const orders: DemoOrder[] = [
  { id: "1042", customer: "Ada Lovelace", total: "$128.00", status: "Paid" },
  { id: "1041", customer: "Grace Hopper", total: "$64.50", status: "Pending" },
  { id: "1040", customer: "Alan Turing", total: "$310.00", status: "Paid" },
  { id: "1039", customer: "Edsger Dijkstra", total: "$22.00", status: "Refunded" },
  { id: "1038", customer: "Barbara Liskov", total: "$98.25", status: "Paid" },
  { id: "1037", customer: "Donald Knuth", total: "$75.00", status: "Pending" },
  { id: "1036", customer: "Margaret Hamilton", total: "$240.00", status: "Paid" },
];
const STATUS_COLOR = { Paid: "success", Pending: "warning", Refunded: "surface" } as const;

const detailSections = [
  { id: "overview", label: "Overview" },
  { id: "items", label: "Items" },
  { id: "activity", label: "Activity" },
];

// The app sidebar, which collapses like the other shells' (see "On a small screen").
const appNav = ["Orders", "Customers", "Products"];
const appCurrent = ref("Orders");
const navOpen = ref(false);
const sidebar = useTemplateRef("sidebar");

// The record in the drawer, and which of its sections shows.
// The record stays set after the drawer closes: the slideover keeps its content mounted through
// the exit transition, and clearing it here would blank the title while it slides away.
const selected = ref<DemoOrder>();
const drawerVisible = ref(false);
const section = ref("overview");

function open(order: DemoOrder) {
  section.value = "overview";
  selected.value = order;
  drawerVisible.value = true;
}

const pageCode = `<script setup>
const visible = ref(false);
const order = ref();            // kept after closing, so the exit transition still has content
const section = ref("overview");
const sections = [{ id: "overview", label: "Overview" }, { id: "items", label: "Items" }];

function open(o) {
  section.value = "overview";
  order.value = o;
  visible.value = true;
}
<\/script>

<template>
<!-- The record list: each row is a button that opens its record -->
<CuiList>
  <CuiListItem v-for="o in orders" :key="o.id" :title="o.customer" :subtitle="'Order ' + o.id" @click="open(o)">
    <template #trailing><CuiBadge size="sm">{{ o.status }}</CuiBadge></template>
  </CuiListItem>
</CuiList>

<!-- Sub-component mode: the header, then a row, so the drawer is a shell of its own.
     aria-label names the dialog; the sidebar inside names its own nav. -->
<CuiSlideover v-model:visible="visible" size="xl" :aria-label="'Order ' + order?.id">
  <CuiModalHeader :title="'Order ' + order?.id" @close="visible = false" />

  <div style="display: flex; flex: 1; min-height: 0">
    <!-- collapse-below="never": inside a drawer there is nothing to collapse into -->
    <CuiSidebar collapse-below="never" label="Order sections" style="width: 11rem; flex-shrink: 0">
      <CuiSidebarContent>
        <CuiList>
          <CuiListItem
            v-for="s in sections"
            :key="s.id"
            :title="s.label"
            :aria-current="section === s.id ? 'page' : undefined"
            @click="section = s.id"
          />
        </CuiList>
      </CuiSidebarContent>
    </CuiSidebar>

    <div style="flex: 1; min-width: 0; overflow: auto">
      <CuiPanel from="var(--cui-primary-bg)" to="var(--cui-surface-base)" :angle="135">…banner…</CuiPanel>
      …the section…
    </div>
  </div>
</CuiSlideover>
</template>`;
</script>

<template>
  <ShellPage
    title="Sidebar and detail drawer"
    description="A list of records beside the app's navigation. Opening a record slides in a drawer that has a sidebar of its own, to move between the sections of that one record."
  >
    <template #when>
      <p>
        Choose it when people work through a list and need the detail of one record without leaving
        the list: orders, tickets, customers, files. The list stays where it was, with its scroll and
        filters, and closing the drawer puts the reader back on the row they opened.
      </p>
      <ul class="list-disc pl-5">
        <li>The record has several parts (overview, items, activity) that deserve navigating, not one long scroll.</li>
        <li>For a short detail, a plain <router-link to="/components/slideover">slideover</router-link> with a form is enough; for a full page of detail, give the record its own route.</li>
        <li>The outer shell is <router-link to="/app-shells/sidebar">sidebar and content</router-link>, or <router-link to="/app-shells/navbar-sidebar">navbar and sidebar</router-link>.</li>
      </ul>
      <p>
        Built from <router-link to="/components/sidebar">CuiSidebar</router-link> twice (the second
        with <code>collapse-below="never"</code>), <router-link to="/components/slideover">CuiSlideover</router-link>
        and <router-link to="/components/panel">CuiPanel</router-link> for the record's banner.
      </p>
    </template>

    <template #demo>
      <ShellFrame label="Sidebar and detail drawer">
        <CuiNavbar label="Demo header" collapse-below="never">
          <CuiButton
            class="lg:!hidden"
            variant="ghost"
            size="sm"
            v-bind="sidebar?.toggleAttrs"
            @click="navOpen = true"
          >
            <template #prefix><CuiIcon name="list" size="1.25rem" /></template>
          </CuiButton>
          <CuiNavbarBrand>Acme Shop</CuiNavbarBrand>
        </CuiNavbar>

        <div class="cui-shell-frame__body">
          <div class="cui-shell-frame__side hidden lg:block">
            <CuiSidebar
              ref="sidebar"
              v-model:open="navOpen"
              label="Demo app"
              :toggle="false"
              :style="{ width: '100%' }"
            >
              <CuiSidebarHeader title="Acme Shop" />
              <CuiSidebarContent>
                <CuiList>
                  <CuiListItem
                    v-for="item in appNav"
                    :key="item"
                    :title="item"
                    :href="`#${item.toLowerCase()}`"
                    :aria-current="appCurrent === item ? 'page' : undefined"
                    @click.prevent="appCurrent = item"
                  />
                </CuiList>
              </CuiSidebarContent>
            </CuiSidebar>
          </div>

          <div class="cui-shell-frame__main cui-shell-frame__pad" role="region" tabindex="0" aria-label="Demo orders">
            <h3 class="cui-shell-title">Orders</h3>
            <p class="cui-shell-text">Open a record: its drawer has a sidebar of its own.</p>
            <CuiList divided>
              <CuiListItem
                v-for="o in orders"
                :key="o.id"
                :title="o.customer"
                :subtitle="`Order ${o.id}`"
                chevron
                @click="open(o)"
              >
                <template #trailing>
                  <CuiBadge size="sm" :color="STATUS_COLOR[o.status]">{{ o.status }}</CuiBadge>
                </template>
              </CuiListItem>
            </CuiList>
          </div>
        </div>
      </ShellFrame>

      <!-- Teleported to <body> by the slideover, so it overlays the page, not the frame. -->
      <CuiSlideover v-model:visible="drawerVisible" size="xl" :aria-label="`Order ${selected?.id ?? ''}`">
        <CuiModalHeader :title="`Order ${selected?.id ?? ''}`" @close="drawerVisible = false" />

        <div class="cui-shell-frame__body">
          <CuiSidebar collapse-below="never" label="Order sections" :style="{ width: '11rem', flexShrink: 0 }">
            <CuiSidebarContent>
              <CuiList>
                <CuiListItem
                  v-for="s in detailSections"
                  :key="s.id"
                  :title="s.label"
                  :aria-current="section === s.id ? 'page' : undefined"
                  @click="section = s.id"
                />
              </CuiList>
            </CuiSidebarContent>
          </CuiSidebar>

          <div class="cui-shell-frame__main">
            <CuiPanel from="var(--cui-primary-bg)" to="var(--cui-surface-base)" :angle="135" :style="{ padding: '1.25rem' }">
              <h3 class="cui-shell-title">{{ selected?.customer }}</h3>
              <p class="cui-shell-text" :style="{ marginBottom: 0 }">
                Order {{ selected?.id }}, {{ selected?.total }}
                <CuiBadge v-if="selected" size="sm" :color="STATUS_COLOR[selected.status]">{{ selected.status }}</CuiBadge>
              </p>
            </CuiPanel>
            <CuiStack spacing="2" class="cui-shell-frame__pad">
              <h4 class="cui-shell-title">{{ detailSections.find((s) => s.id === section)?.label }}</h4>
              <p v-for="n in 3" :key="n" class="cui-shell-text">
                The detail of one section of this record. Choosing another in the sidebar swaps
                this area and leaves the list behind the drawer exactly as it was ({{ n }}).
              </p>
            </CuiStack>
          </div>
        </div>
      </CuiSlideover>
    </template>

    <template #code>
      <Example title="The list and the drawer" code-open :code="pageCode">
        <p class="text-surface-700 dark:text-surface-300">
          The drawer is in sub-component mode (<code>CuiModalHeader</code> then your own content), so
          the body is not padded or scrolled for you: the row below the header fills the panel, the
          sidebar is its column and the content scrolls on its own. Everything is the same component
          as the outer shell, one level down. The slideover is teleported, so it overlays the page
          rather than the frame.
        </p>
      </Example>
    </template>

    <template #mobile>
      <ul class="list-disc pl-5">
        <li>
          <strong>The outer sidebar</strong> collapses into its own drawer below <code>lg</code>, opened
          from a header button bound to its <code>toggleAttrs</code>, exactly as in
          <router-link to="/app-shells/sidebar">sidebar and content</router-link>.
        </li>
        <li>
          <strong>The detail drawer</strong> never collapses further: a drawer inside a drawer is a
          worse place to be than a narrow column. Its sidebar stays inline
          (<code>collapse-below="never"</code>), so keep it narrow with short labels, and let the
          slideover take the full width of the screen on a phone (<code>size="full"</code>, or a
          narrower named size).
        </li>
        <li>On a phone the detail can also be a route of its own, as long as closing it brings the reader back to the list.</li>
      </ul>
    </template>

    <template #accessibility>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <strong>Focus.</strong> Opening a record moves focus into the drawer; Tab stays inside it;
          Escape or the close button closes it and focus returns to the row that opened it, so the
          reader never loses their place in the list. Rows are buttons (a <code>CuiListItem</code>
          with a click handler), not clickable text.
        </li>
        <li>
          <strong>Names.</strong> The drawer is a dialog and needs a name: <code>aria-label</code>
          (or the <code>title</code> prop in simple mode). The nested sidebar is a
          <code>&lt;nav&gt;</code> with its own <code>label</code>, distinct from the app's, so the
          page now has three navigations that must be told apart.
        </li>
        <li>
          <strong>Landmarks.</strong> The page keeps one <code>&lt;header&gt;</code> and one
          <code>&lt;main&gt;</code>; the drawer is a modal dialog, not a landmark.
        </li>
        <li>
          <strong><code>aria-current</code>.</strong> The current section carries
          <code>aria-current="page"</code>; sections are buttons here, so it marks which one shows.
          Use real links (<code>to</code>) when each section has its own URL.
        </li>
        <li>
          <strong>Contrast.</strong> The banner is a <code>CuiPanel</code> between the theme's own
          tint and the page surface, so text keeps body contrast in light and dark. A gradient is
          outside the contrast audit: check any stops of your own.
        </li>
      </ul>
    </template>
  </ShellPage>
</template>
