<script setup lang="ts">
import { ref, provide } from "vue";
import {
  CuiButton,
  CuiDropdown,
  CuiDropdownTrigger,
  CuiDropdownMenu,
  CuiDropdownRadioGroup,
  CuiDropdownRadioItem,
  CuiDropdownHeader,
  CuiGrid,
  CuiGridItem,
  CuiIcon,
  CuiToastProvider,
  useTheme,
} from "@itguy614/clean-ui";
import Navigation from "./components/Navigation.vue";
import { ShowDebugKey } from "./keys";

const isDark = ref(false);
const showDebug = ref(false);
const { theme, presets, setTheme } = useTheme();

provide(ShowDebugKey, showDebug);

function toggleDark() {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
}
</script>

<template>
  <CuiToastProvider>
  <div
    :class="[
      'min-h-screen transition-colors duration-300',
      isDark ? 'bg-surface-950 text-surface-100' : 'bg-white text-surface-900',
    ]"
  >
    <CuiGrid :cols="{ sm: 1, lg: 12 }" class="min-h-screen">
      <!-- Sidebar Navigation -->
      <CuiGridItem :col-span="{ sm: 'full', lg: 2 }" class="lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <Navigation />
      </CuiGridItem>

      <!-- Main Content -->
      <CuiGridItem :col-span="{ sm: 'full', lg: 10 }">
        <!-- Header -->
        <header class="sticky top-0 z-10 border-b border-surface-200 bg-white/80 backdrop-blur-sm dark:border-surface-800 dark:bg-surface-950/80">
          <div class="mx-auto w-full px-6 py-4">
            <div class="flex items-center justify-end gap-3">
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
        <main class="cui-typography p-6 lg:p-12">
          <div class="mx-auto w-full">
            <router-view />
          </div>
        </main>
      </CuiGridItem>
    </CuiGrid>
  </div>
  </CuiToastProvider>
</template>
