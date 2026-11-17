<script setup lang="ts">
import { computed, ref, provide, watch, useTemplateRef } from "vue";
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
  CuiKbd,
  CuiNavbar,
  CuiNavbarActions,
  CuiToastProvider,
  useTheme,
  useDensity,
  useColorMode,
  useCommandPalette,
  type ColorMode,
} from "@itguy614/clean-ui";
import Navigation from "./components/Navigation.vue";
import PageNav from "./components/PageNav.vue";
import SitePalette from "./components/SitePalette.vue";
import { ShowDebugKey } from "./keys";

const showDebug = ref(false);
const mobileNavOpen = ref(false);
const nav = useTemplateRef("nav");
const { theme, presets, setTheme } = useTheme();
const { density, presets: densityPresets, setDensity } = useDensity();
const { mode: colorMode, isDark, setMode: setColorMode } = useColorMode();

provide(ShowDebugKey, showDebug);

// The header button opens the site palette (SitePalette.vue) without the shortcut. The hint shows
// the key for this platform; the palette's own default is Mod-K, so the two agree.
const palette = useCommandPalette();
const apple = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

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

// Below sm the header buttons shrink to their icons, so the current choice moves into the name.
const themeLabel = computed(() => presets.find((p) => p.id === theme.value)?.label ?? "Theme");
const densityLabel = computed(() => densityPresets.find((p) => p.id === density.value)?.label ?? "Density");
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

      <!-- Sidebar column: below lg the sidebar collapses into its own drawer, opened from the header's menu button -->
      <aside :style="{
        width: '16rem',
        flexShrink: '0',
        position: 'sticky',
        top: '0',
        height: '100vh',
        overflowY: 'auto',
        display: 'none',
      }" class="lg:!block">
        <Navigation ref="nav" v-model:open="mobileNavOpen" />
      </aside>

      <!-- Main column -->
      <div :style="{ flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column' }">

        <!-- The header is a CuiNavbar with no nav of its own: this site's navigation is the sidebar.
             Below lg the sidebar collapses, and the button here opens its drawer through the
             sidebar's exposed toggleAttrs. The controls on the right are plain actions content. -->
        <CuiNavbar sticky translucent>
          <CuiButton class="lg:!hidden" variant="ghost" size="sm" v-bind="nav?.toggleAttrs" @click="mobileNavOpen = true">
            <template #prefix><CuiIcon name="list" size="1.25rem" /></template>
          </CuiButton>

          <CuiNavbarActions>
            <CuiButton
              class="max-sm:[--cui-button-px:0.125rem]"
              variant="ghost"
              size="sm"
              aria-label="Search documentation"
              :aria-keyshortcuts="apple ? 'Meta+K' : 'Control+K'"
              @click="palette.open()"
            >
              <!-- One wrapper, so the button's own prefix/suffix gaps do not widen it below sm, where only the icon shows -->
              <span class="inline-flex items-center gap-2">
                <CuiIcon name="magnifying-glass" size="sm" />
                <span class="max-sm:hidden">Search</span>
                <span class="max-sm:hidden" aria-hidden="true"><CuiKbd>{{ apple ? "⌘" : "Ctrl" }}</CuiKbd> <CuiKbd>K</CuiKbd></span>
              </span>
            </CuiButton>
            <CuiDropdown>
              <CuiDropdownTrigger>
                <CuiButton variant="ghost" size="sm" :aria-label="`Theme: ${themeLabel}`">
                  <template #prefix><CuiIcon name="palette" size="sm" /></template>
                  <span class="max-sm:sr-only">{{ themeLabel }}</span>
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
                <CuiButton variant="ghost" size="sm" :aria-label="`Density: ${densityLabel}`">
                  <template #prefix><CuiIcon name="rows" size="sm" /></template>
                  <span class="max-sm:sr-only">{{ densityLabel }}</span>
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
              <span class="max-sm:sr-only">{{ MODE_VIEW[colorMode].label }}</span>
            </CuiButton>
          </CuiNavbarActions>
        </CuiNavbar>

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
  </div>
  <SitePalette />
  </CuiToastProvider>
</template>
