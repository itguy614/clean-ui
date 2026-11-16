<script setup lang="ts">
import { CuiBadge, CuiButton, CuiContainer, CuiGrid, CuiNavbar, CuiNavbarActions, CuiNavbarBrand, CuiNavbarLink, CuiNavbarMenu, CuiNavbarNav, CuiPanel } from "@itguy614/clean-ui";
</script>

<template>
  <!-- sticky: the bar stays at the top and publishes --cui-navbar-height -->
  <CuiNavbar sticky label="Main">
    <CuiNavbarBrand href="/">Acme</CuiNavbarBrand>

    <!-- Written once: in the bar wide, in a drawer below collapse-below -->
    <CuiNavbarNav>
      <CuiNavbarLink to="/" icon="house">Home</CuiNavbarLink>
      <CuiNavbarMenu label="Products" icon="package">
        <CuiNavbarLink to="/products/editor" icon="pencil-simple">Editor</CuiNavbarLink>
        <CuiNavbarLink to="/products/charts" icon="chart-bar">
          Charts
          <template #suffix><CuiBadge size="sm">Beta</CuiBadge></template>
        </CuiNavbarLink>
      </CuiNavbarMenu>
      <CuiNavbarLink to="/pricing" icon="tag">Pricing</CuiNavbarLink>
    </CuiNavbarNav>

    <CuiNavbarActions>
      <CuiButton variant="ghost" size="sm">Sign in</CuiButton>
      <CuiButton size="sm">Get started</CuiButton>
    </CuiNavbarActions>
  </CuiNavbar>

  <main id="main" tabindex="-1">
    <CuiPanel from="var(--cui-primary-bg)" to="var(--cui-surface-base)" :angle="135">
      <CuiContainer max-width="xl" py="12">…hero…</CuiContainer>
    </CuiPanel>
    <CuiContainer max-width="xl" py="8">
      <CuiGrid :cols="{ sm: 1, md: 3 }" gap="4">…cards…</CuiGrid>
    </CuiContainer>
  </main>
</template>
