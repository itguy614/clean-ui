<script setup lang="ts">
import { CuiBadge, CuiButton, CuiList, CuiListItem, CuiModalHeader, CuiNavbar, CuiNavbarActions, CuiPanel, CuiSidebar, CuiSidebarContent, CuiSidebarHeader, CuiSlideover } from "@itguy614/clean-ui";
import { ref, useTemplateRef } from "vue";

interface Contact {
  id: number;
  name: string;
  company: string;
  stage: string;
}

const contacts: Contact[] = [
  { id: 1, name: "Ada Lovelace", company: "Analytical Engines", stage: "Lead" },
  { id: 2, name: "Grace Hopper", company: "Compiler Co", stage: "Customer" },
];

const navOpen = ref(false); // the page sidebar's drawer, below lg
const sidebar = useTemplateRef("sidebar");

const visible = ref(false);
const contact = ref<Contact>(); // kept after closing, so the exit transition still has content
const section = ref("overview");
const sections = [{ id: "overview", label: "Overview" }, { id: "deals", label: "Deals" }];

// Remember the row that opened it and hand it back as `return-focus`: Safari does not focus a
// button on click, so the overlay would otherwise have nothing to restore focus to.
let opener: HTMLElement | null = null;

function open(c: Contact, event: MouseEvent) {
  section.value = "overview";
  contact.value = c;
  opener = (event.target as HTMLElement).closest<HTMLElement>("button, a");
  visible.value = true;
}
</script>

<template>
  <!-- The outer shell is sidebar-first (see "Sidebar and content"): the brand is in the sidebar
       header, and the bar over the content carries the page title and its action. -->
  <div style="display: flex">
    <aside class="hidden lg:block" style="width: 15rem; flex-shrink: 0; position: sticky; top: 0; height: 100vh">
      <CuiSidebar ref="sidebar" v-model:open="navOpen" label="Orbit CRM" :toggle="false" style="width: 100%">
        <CuiSidebarHeader title="Orbit CRM" icon="planet" />
        <CuiSidebarContent>…</CuiSidebarContent>
      </CuiSidebar>
    </aside>

    <div style="flex: 1; min-width: 0">
      <CuiNavbar sticky translucent>
        <CuiButton class="lg:!hidden" variant="ghost" size="sm" v-bind="sidebar?.toggleAttrs" @click="navOpen = true">…</CuiButton>
        <h1 class="page-title">Contacts</h1>
        <CuiNavbarActions><CuiButton size="sm">New contact</CuiButton></CuiNavbarActions>
      </CuiNavbar>

      <main id="main" tabindex="-1">
        <!-- The record list: each row is a button that opens its record -->
        <CuiList divided>
          <CuiListItem v-for="c in contacts" :key="c.id" :title="c.name" :subtitle="c.company" chevron @click="open(c, $event)">
            <template #trailing><CuiBadge size="sm">{{ c.stage }}</CuiBadge></template>
          </CuiListItem>
        </CuiList>
      </main>
    </div>
  </div>

  <!-- Teleported, so it can sit anywhere. Sub-component mode: the header, then a row, so the
       drawer is a shell of its own. aria-label names the dialog; the sidebar inside names its own nav. -->
  <CuiSlideover v-model:visible="visible" size="xl" :aria-label="contact?.name" :return-focus="() => opener">
    <CuiModalHeader :title="contact?.name" @close="visible = false" />

    <div style="display: flex; flex: 1; min-height: 0">
      <!-- collapse-below="never": inside a drawer there is nothing to collapse into -->
      <CuiSidebar collapse-below="never" label="Contact sections" style="width: 11rem; flex-shrink: 0">
        <CuiSidebarContent>
          <CuiList>
            <CuiListItem
              v-for="s in sections"
              :key="s.id"
              :title="s.label"
              :aria-current="section === s.id ? 'true' : undefined"
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
</template>
