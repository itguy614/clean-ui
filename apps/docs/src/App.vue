<script setup lang="ts">
import { ref, provide, watch } from "vue";
import { useRoute } from "vue-router";
import {
  CuiButton,
  CuiDropdown,
  CuiDropdownTrigger,
  CuiDropdownMenu,
  CuiDropdownRadioGroup,
  CuiDropdownRadioItem,
  CuiDropdownHeader,
  CuiIcon,
  CuiBadge,
  CuiSlideover,
  CuiToastProvider,
  useTheme,
  useDensity,
} from "@itguy614/clean-ui";
import Navigation from "./components/Navigation.vue";
import { ShowDebugKey } from "./keys";
import versionRaw from "../../../VERSION?raw";

const version = versionRaw.trim();

const isDark = ref(false);
const showDebug = ref(false);
const mobileNavOpen = ref(false);
const { theme, presets, setTheme } = useTheme();
const { density, presets: densityPresets, setDensity } = useDensity();

provide(ShowDebugKey, showDebug);

// Close mobile nav on route change
const route = useRoute();
watch(() => route.path, () => {
  mobileNavOpen.value = false;
});

function toggleDark() {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
}
</script>

<template>
  <CuiToastProvider>
  <div
    :style="{
      minHeight: '100vh',
      transition: 'background 0.3s ease, color 0.3s ease',
      background: isDark ? 'var(--color-surface-950)' : 'white',
      color: isDark ? 'var(--color-surface-100)' : 'var(--color-surface-900)',
    }"
  >
    <!-- Desktop layout: sidebar + content -->
    <div :style="{ display: 'flex', minHeight: '100vh' }">

      <!-- Sidebar: hidden on mobile -->
      <aside :style="{
        width: '16rem',
        flexShrink: '0',
        position: 'sticky',
        top: '0',
        height: '100vh',
        overflowY: 'auto',
        display: 'none',
      }" class="lg:!block">
        <Navigation />
      </aside>

      <!-- Main column -->
      <div :style="{ flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column' }">

        <!-- Header -->
        <header :style="{
          position: 'sticky',
          top: '0',
          zIndex: '10',
          background: isDark ? 'color-mix(in srgb, var(--color-surface-950) 80%, transparent)' : 'color-mix(in srgb, white 80%, transparent)',
          backdropFilter: 'blur(8px)',
        }">
          <div :style="{ width: '100%', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">

            <!-- Left: hamburger (mobile only) -->
            <div class="lg:hidden">
              <CuiButton variant="ghost" size="sm" @click="mobileNavOpen = true">
                <template #prefix><CuiIcon name="list" size="1.25rem" /></template>
              </CuiButton>
            </div>

            <!-- Brand + version (links to changelog) -->
            <RouterLink
              to="/changelog"
              :style="{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--cui-text-body)' }"
            >
              <span :style="{ fontWeight: '600', fontSize: '0.9375rem' }">clean-ui</span>
              <CuiBadge color="primary" size="sm">v{{ version }}</CuiBadge>
            </RouterLink>

            <!-- Right: theme / debug / dark toggle -->
            <div :style="{ display: 'flex', alignItems: 'center', gap: '0.5rem' }">
              <CuiDropdown>
                <CuiDropdownTrigger>
                  <CuiButton variant="ghost" size="sm">
                    <template #prefix><CuiIcon name="palette" size="sm" /></template>
                    {{ presets.find(p => p.id === theme)?.label ?? 'Theme' }}
                  </CuiButton>
                </CuiDropdownTrigger>
                <CuiDropdownMenu min-width="10rem">
                  <CuiDropdownHeader>Theme</CuiDropdownHeader>
                  <CuiDropdownRadioGroup :model-value="theme" @update:model-value="setTheme($event as string)">
                    <CuiDropdownRadioItem v-for="preset in presets" :key="preset.id" :value="preset.id">
                      {{ preset.label }}
                    </CuiDropdownRadioItem>
                  </CuiDropdownRadioGroup>
                </CuiDropdownMenu>
              </CuiDropdown>
              <CuiDropdown>
                <CuiDropdownTrigger>
                  <CuiButton variant="ghost" size="sm">
                    <template #prefix><CuiIcon name="rows" size="sm" /></template>
                    {{ densityPresets.find(p => p.id === density)?.label ?? 'Density' }}
                  </CuiButton>
                </CuiDropdownTrigger>
                <CuiDropdownMenu min-width="11rem">
                  <CuiDropdownHeader>Density</CuiDropdownHeader>
                  <CuiDropdownRadioGroup :model-value="density" @update:model-value="setDensity($event as 'compact' | 'default' | 'comfortable')">
                    <CuiDropdownRadioItem v-for="preset in densityPresets" :key="preset.id" :value="preset.id">
                      {{ preset.label }}
                    </CuiDropdownRadioItem>
                  </CuiDropdownRadioGroup>
                </CuiDropdownMenu>
              </CuiDropdown>
              <CuiButton variant="ghost" size="sm" @click="showDebug = !showDebug">
                {{ showDebug ? "Hide Debug" : "Show Debug" }}
              </CuiButton>
              <CuiButton variant="ghost" size="sm" @click="toggleDark">
                <template #prefix><CuiIcon :name="isDark ? 'sun' : 'moon'" size="sm" /></template>
                {{ isDark ? "Light" : "Dark" }}
              </CuiButton>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="cui-typography" :style="{ flex: '1', padding: '1.5rem' }" style="padding: 1.5rem;">
          <div class="lg:px-6 lg:py-6">
            <router-view />
          </div>
        </main>
      </div>
    </div>

    <!-- Mobile nav slideover -->
    <CuiSlideover
      v-model:visible="mobileNavOpen"
      side="left"
      size="sm"
      :no-header="true"
    >
      <Navigation @navigate="mobileNavOpen = false" />
    </CuiSlideover>
  </div>
  </CuiToastProvider>
</template>
