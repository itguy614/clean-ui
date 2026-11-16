<script setup lang="ts">
import { CuiBadge, CuiButton, CuiIcon, CuiList, CuiListItem, CuiNavbar, CuiNavbarActions, CuiNavbarBrand, CuiSidebar, CuiSidebarContent, CuiSidebarGroup } from "@itguy614/clean-ui";
import { ref, useTemplateRef } from "vue";

const open = ref(false);
const sidebar = useTemplateRef("sidebar");
</script>

<template>
  <!-- A sticky navbar publishes its height as --cui-navbar-height, and scroll-padding-top -->
  <CuiNavbar sticky>
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
        <CuiSidebarContent>
          <CuiList>
            <CuiListItem title="Overview" icon="squares-four" to="/" />
          </CuiList>
          <CuiSidebarGroup label="Workspace">
            <CuiList>
              <CuiListItem title="Team" icon="users-three" to="/team">
                <template #trailing><CuiBadge size="sm">4</CuiBadge></template>
              </CuiListItem>
            </CuiList>
          </CuiSidebarGroup>
        </CuiSidebarContent>
      </CuiSidebar>
    </aside>

    <main id="main" tabindex="-1" style="flex: 1; min-width: 0">
      <!-- Anything of your own that sticks reads the same token: never a number -->
      <div style="position: sticky; top: var(--cui-navbar-height, 0px)">Filters</div>
      …
    </main>
  </div>
</template>
