<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import {
  CuiAvatar,
  CuiBadge,
  CuiButton,
  CuiIcon,
  CuiList,
  CuiListItem,
  CuiModalHeader,
  CuiNavbar,
  CuiNavbarActions,
  CuiNavbarBrand,
  CuiPanel,
  CuiSidebar,
  CuiSidebarContent,
  CuiSidebarFooter,
  CuiSidebarHeader,
  CuiSlideover,
  CuiStack,
} from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import ShellFrame from "../components/ShellFrame.vue";
import ShellPage from "../components/ShellPage.vue";
import pageCode from "../shell-snippets/detail-drawer-page.vue?raw";

// A CRM record browser: a list of contacts, each opening into its own record.
interface DemoContact {
  id: string;
  name: string;
  company: string;
  stage: "Lead" | "Customer" | "Churned";
}

const contacts: DemoContact[] = [
  { id: "c1", name: "Ada Lovelace", company: "Analytical Engines", stage: "Customer" },
  { id: "c2", name: "Grace Hopper", company: "Compiler Co.", stage: "Lead" },
  { id: "c3", name: "Alan Turing", company: "Bletchley Labs", stage: "Customer" },
  { id: "c4", name: "Edsger Dijkstra", company: "Structured Systems", stage: "Churned" },
  { id: "c5", name: "Barbara Liskov", company: "Substitution Inc.", stage: "Lead" },
  { id: "c6", name: "Donald Knuth", company: "Literate Press", stage: "Customer" },
  { id: "c7", name: "Margaret Hamilton", company: "Apollo Software", stage: "Lead" },
];
const STAGE_COLOR = { Lead: "info", Customer: "success", Churned: "surface" } as const;

const detailSections = [
  { id: "overview", label: "Overview", icon: "user" },
  { id: "deals", label: "Deals", icon: "handshake" },
  { id: "activity", label: "Activity", icon: "clock-counter-clockwise" },
];

// The app sidebar, which collapses like the other shells' (see "On a small screen").
const appNav = [
  { label: "Contacts", icon: "address-book", count: 7 },
  { label: "Companies", icon: "buildings" },
  { label: "Deals", icon: "handshake" },
  { label: "Reports", icon: "chart-line-up" },
];
// Only Contacts has a page in this demo; the other links are placeholders.
const appCurrent = "Contacts";
const navOpen = ref(false);
const sidebar = useTemplateRef("sidebar");

// The record in the drawer, and which of its sections shows. The record stays set after the
// drawer closes: the slideover keeps its content mounted through the exit transition, and
// clearing it here would blank the title while it slides away.
const selected = ref<DemoContact>();
const drawerVisible = ref(false);
const section = ref("overview");

// The row that opened the drawer, handed to the slideover as `return-focus`. Safari (and Firefox
// on macOS) do not focus a button on click, so without this the overlay finds nothing focused
// when it opens and has nowhere to hand focus back to when it closes.
let opener: HTMLElement | null = null;

function open(contact: DemoContact, event: MouseEvent) {
  section.value = "overview";
  selected.value = contact;
  opener = (event.target as HTMLElement).closest<HTMLElement>("button, a");
  drawerVisible.value = true;
}

</script>

<template>
  <ShellPage
    title="Sidebar and detail drawer"
    description="A list of records in a sidebar-first app. Opening a record slides in a drawer that has a sidebar of its own, to move between the sections of that one record."
  >
    <template #when>
      <p>
        Choose it when people work through a list and need the detail of one record without leaving
        the list: contacts, orders, tickets, files. The list stays where it was, with its scroll and
        filters, and closing the drawer puts the reader back on the row they opened.
      </p>
      <ul class="list-disc pl-5">
        <li>The record has several parts (overview, deals, activity) that deserve navigating, not one long scroll.</li>
        <li>For a short detail, a plain <router-link to="/components/slideover">slideover</router-link> with a form is enough; for a full page of detail, give the record its own route.</li>
        <li>The outer shell is <router-link to="/app-shells/sidebar">sidebar and content</router-link> here; it works as well under a <router-link to="/app-shells/navbar-sidebar">navbar and sidebar</router-link>.</li>
      </ul>
      <p>
        <strong>The brand lives in the app sidebar's header.</strong> The sidebar is the primary
        navigation, so it owns the product's name, and the bar over the content carries only the page's
        title and its action (below <code>lg</code>, where the sidebar is closed, the bar shows the brand instead).
        The drawer's sidebar, a second one, has no brand: it names the record's sections, and the
        drawer's header names the record.
      </p>
      <p>
        Built from <router-link to="/components/sidebar">CuiSidebar</router-link> twice (the second
        with <code>collapse-below="never"</code>), <router-link to="/components/slideover">CuiSlideover</router-link>
        and <router-link to="/components/panel">CuiPanel</router-link> for the record's banner.
      </p>
    </template>

    <template #demo>
      <ShellFrame label="Sidebar and detail drawer: a CRM">
        <div class="cui-shell-frame__body">
          <div class="cui-shell-frame__side hidden lg:block">
            <CuiSidebar
              ref="sidebar"
              v-model:open="navOpen"
              label="Demo CRM"
              :toggle="false"
              :style="{ width: '100%' }"
            >
              <CuiSidebarHeader title="Orbit CRM" icon="planet" />
              <CuiSidebarContent>
                <CuiList>
                  <CuiListItem
                    v-for="item in appNav"
                    :key="item.label"
                    :title="item.label"
                    :icon="item.icon"
                    :href="`#${item.label.toLowerCase()}`"
                    :aria-current="appCurrent === item.label ? 'page' : undefined"
                    @click.prevent
                  >
                    <template v-if="item.count" #trailing><CuiBadge size="sm">{{ item.count }}</CuiBadge></template>
                  </CuiListItem>
                </CuiList>
              </CuiSidebarContent>
              <CuiSidebarFooter>Signed in as Ada</CuiSidebarFooter>
            </CuiSidebar>
          </div>

          <div class="cui-shell-frame__col">
            <CuiNavbar collapse-below="never">
              <CuiButton
                class="lg:!hidden"
                variant="ghost"
                size="sm"
                v-bind="sidebar?.toggleAttrs"
                @click="navOpen = true"
              >
                <template #prefix><CuiIcon name="list" size="1.25rem" /></template>
              </CuiButton>
              <CuiNavbarBrand class="lg:!hidden">Orbit CRM</CuiNavbarBrand>
              <span class="cui-shell-title cui-shell-bar-title hidden lg:block">Contacts</span>
              <CuiNavbarActions>
                <CuiButton size="sm">
                  <template #prefix><CuiIcon name="plus" size="sm" /></template>
                  New contact
                </CuiButton>
              </CuiNavbarActions>
            </CuiNavbar>

            <div class="cui-shell-frame__main cui-shell-frame__pad" role="region" tabindex="0" aria-label="Demo contacts">
              <p class="cui-shell-text">Open a contact: its drawer has a sidebar of its own.</p>
              <CuiList divided>
                <CuiListItem
                  v-for="c in contacts"
                  :key="c.id"
                  :title="c.name"
                  :subtitle="c.company"
                  chevron
                  @click="open(c, $event)"
                >
                  <template #icon><CuiAvatar :name="c.name" size="sm" /></template>
                  <template #trailing>
                    <CuiBadge size="sm" :color="STAGE_COLOR[c.stage]">{{ c.stage }}</CuiBadge>
                  </template>
                </CuiListItem>
              </CuiList>
            </div>
          </div>
        </div>
      </ShellFrame>

      <!-- Teleported to <body> by the slideover, so it overlays the page, not the frame. -->
      <CuiSlideover
        v-model:visible="drawerVisible"
        size="xl"
        :aria-label="selected?.name ?? 'Contact'"
        :return-focus="() => opener"
      >
        <CuiModalHeader :title="selected?.name ?? 'Contact'" @close="drawerVisible = false" />

        <div class="cui-shell-frame__body">
          <CuiSidebar collapse-below="never" label="Contact sections" :style="{ width: '11rem', flexShrink: 0 }">
            <CuiSidebarContent>
              <CuiList>
                <CuiListItem
                  v-for="s in detailSections"
                  :key="s.id"
                  :title="s.label"
                  :icon="s.icon"
                  :aria-current="section === s.id ? 'true' : undefined"
                  @click="section = s.id"
                />
              </CuiList>
            </CuiSidebarContent>
          </CuiSidebar>

          <div class="cui-shell-frame__main">
            <CuiPanel from="var(--cui-primary-bg)" to="var(--cui-surface-base)" :angle="135" :style="{ padding: '1.25rem' }">
              <h3 class="cui-shell-title">{{ selected?.name }}</h3>
              <p class="cui-shell-text" :style="{ marginBottom: 0 }">
                {{ selected?.company }}
                <CuiBadge v-if="selected" size="sm" :color="STAGE_COLOR[selected.stage]">{{ selected.stage }}</CuiBadge>
              </p>
            </CuiPanel>
            <CuiStack spacing="2" class="cui-shell-frame__pad">
              <h4 class="cui-shell-title">{{ detailSections.find((s) => s.id === section)?.label }}</h4>
              <p v-for="n in 3" :key="n" class="cui-shell-text">
                The detail of one section of this contact. Choosing another in the sidebar swaps
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
          from a button in the bar bound to its <code>toggleAttrs</code>, exactly as in
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
          with a click handler), not clickable text. Safari, and Firefox on macOS, do not focus a
          button when it is clicked, so pass the opener explicitly with the slideover's
          <code>return-focus</code> prop, as the demo does, or focus has nowhere to return to there.
        </li>
        <li>
          <strong>Names.</strong> The drawer is a dialog and needs a name: <code>aria-label</code>
          (or the <code>title</code> prop in simple mode). The nested sidebar is a
          <code>&lt;nav&gt;</code> with its own <code>label</code>, distinct from the app's, so the
          page now has two navigations that must be told apart.
        </li>
        <li>
          <strong>Landmarks.</strong> The page keeps one <code>&lt;header&gt;</code> and one
          <code>&lt;main&gt;</code>; the drawer is a modal dialog, not a landmark.
        </li>
        <li>
          <strong><code>aria-current</code>.</strong> The current section carries
          <code>aria-current="true"</code>, not <code>"page"</code>: these rows are buttons that switch
          a panel, and the page does not change. Use <code>"page"</code> only on a link to the page you
          are on. The sidebar draws its raised active fill for any <code>aria-current</code> except
          <code>"false"</code>.
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
