<script setup lang="ts">
import { CuiBadge, CuiBreadcrumb, CuiButton, CuiIcon, CuiList, CuiListItem, CuiNavbar, CuiNavbarActions, CuiNavbarBrand, CuiSidebar, CuiSidebarContent, CuiSidebarFooter, CuiSidebarGroup, CuiSidebarHeader } from "@itguy614/clean-ui";
import { ref, useTemplateRef } from "vue";

const open = ref(false);
const sidebar = useTemplateRef("sidebar");
</script>

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
</template>
