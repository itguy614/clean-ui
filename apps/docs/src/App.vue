<script setup lang="ts">
import { computed, ref, provide, watch } from "vue";
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
  CuiSlideover,
  CuiToastProvider,
  useTheme,
  useDensity,
  useColorMode,
  type ColorMode,
} from "@itguy614/clean-ui";
import Navigation from "./components/Navigation.vue";
import PageNav from "./components/PageNav.vue";
import { ShowDebugKey } from "./keys";

const showDebug = ref(false);
const mobileNavOpen = ref(false);
const { theme, presets, setTheme } = useTheme();
const { density, presets: densityPresets, setDensity } = useDensity();
const { mode: colorMode, isDark, setMode: setColorMode } = useColorMode();

provide(ShowDebugKey, showDebug);

// Close mobile nav on route change
const route = useRoute();
watch(() => route.path, () => {
  mobileNavOpen.value = false;
});

// One button cycling light -> dark -> system: the label and icon name the current mode, the
// accessible name says what a press does.
const MODE_CYCLE: ColorMode[] = ["light", "dark", "system"];
const MODE_VIEW: Record<ColorMode, { label: string; icon: string }> = {
  light: { label: "Light", icon: "sun" },
  dark: { label: "Dark", icon: "moon" },
  system: { label: "System", icon: "desktop" },
};
const nextColorMode = computed(() => MODE_CYCLE[(MODE_CYCLE.indexOf(colorMode.value) + 1) % MODE_CYCLE.length]);
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

        <!-- Header: just under the library's overlays (modals, panels), above page content -->
        <header :style="{
          position: 'sticky',
          top: '0',
          zIndex: 'calc(var(--cui-z-overlay, 9990) - 1)',
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

            <!-- Spacer on desktop where hamburger would be -->
            <div class="hidden lg:block" />

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
              <CuiButton
                variant="ghost"
                size="sm"
                :aria-label="`Color mode: ${MODE_VIEW[colorMode].label}. Switch to ${MODE_VIEW[nextColorMode].label}`"
                @click="setColorMode(nextColorMode)"
              >
                <template #prefix><CuiIcon :name="MODE_VIEW[colorMode].icon" size="sm" /></template>
                {{ MODE_VIEW[colorMode].label }}
              </CuiButton>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <div :style="{ flex: '1', display: 'flex', alignItems: 'flex-start', minWidth: '0' }">
          <main class="cui-typography" :style="{ flex: '1', minWidth: '0', padding: '1.5rem' }">
            <div class="lg:px-6 lg:py-6">
              <router-view />
            </div>
          </main>
          <PageNav />
        </div>
      </div>
    </div>

    <!-- Mobile nav slideover -->
    <CuiSlideover
      v-model:visible="mobileNavOpen"
      side="left"
      size="sm"
    >
      <Navigation @navigate="mobileNavOpen = false" />
    </CuiSlideover>
  </div>
  </CuiToastProvider>
</template>
