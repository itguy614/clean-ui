<script setup lang="ts">
import { CuiCard, CuiCardBody, CuiIcon, CuiFlex, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const commonIcons = [
  "house", "gear", "user", "users", "envelope", "bell", "magnifying-glass",
  "plus", "minus", "x", "check", "pencil", "trash", "download", "upload",
  "arrow-left", "arrow-right", "arrow-up", "arrow-down",
  "caret-down", "caret-up", "caret-left", "caret-right",
  "eye", "eye-slash", "lock", "lock-open", "key",
  "heart", "star", "bookmark", "flag", "tag",
  "folder", "file", "copy", "clipboard", "link",
  "image", "camera", "video-camera", "microphone",
  "phone", "chat-circle", "paper-plane-tilt",
  "calendar", "clock", "timer", "alarm",
  "map-pin", "globe", "airplane",
  "sun", "moon", "cloud", "lightning",
  "check-circle", "x-circle", "warning-circle", "info", "question",
  "spinner-gap", "circle-notch", "arrows-clockwise",
];
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Icons</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Wrapper around <code class="cui-code">@phosphor-icons/vue</code> with
        consistent sizing, color inheritance, and duotone support.
        Over 9,000 icons with 6 weight variants.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'name', type: 'string', default: '-', description: 'Phosphor icon name in kebab-case (e.g. check, warning-circle)' },
          { name: 'weight', type: 'thin | light | regular | bold | fill | duotone', default: 'regular', description: 'Icon weight/style' },
          { name: 'size', type: 'xs | sm | md | lg | xl | string', default: 'md', description: 'Size (named or custom CSS value)' },
          { name: 'color', type: 'string', default: 'currentColor', description: 'Icon color (inherits from parent by default)' },
          { name: 'duotoneColor', type: 'string', default: '-', description: 'Secondary color for duotone weight' },
          { name: 'duotoneOpacity', type: 'number', default: '0.2', description: 'Opacity for duotone secondary layer' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic Usage -->
        <Example title="Basic Usage" :code="`<CuiIcon name=&quot;house&quot; />
<CuiIcon name=&quot;gear&quot; />
<CuiIcon name=&quot;user&quot; />`">
          <CuiFlex gap="4" class="items-center">
            <CuiIcon name="house" />
            <CuiIcon name="gear" />
            <CuiIcon name="user" />
            <CuiIcon name="envelope" />
            <CuiIcon name="bell" />
            <CuiIcon name="magnifying-glass" />
          </CuiFlex>
        </Example>

        <!-- Weights -->
        <Example title="Weights" :code="`<CuiIcon name=&quot;house&quot; weight=&quot;thin&quot; />
<CuiIcon name=&quot;house&quot; weight=&quot;bold&quot; />
<CuiIcon name=&quot;house&quot; weight=&quot;duotone&quot; />`">
          <CuiStack spacing="3">
            <CuiFlex gap="6" class="items-center" v-for="icon in ['house', 'heart', 'star', 'bell']" :key="icon">
              <div class="w-20 text-sm text-surface-500">{{ icon }}</div>
              <CuiIcon :name="icon" weight="thin" size="lg" />
              <CuiIcon :name="icon" weight="light" size="lg" />
              <CuiIcon :name="icon" weight="regular" size="lg" />
              <CuiIcon :name="icon" weight="bold" size="lg" />
              <CuiIcon :name="icon" weight="fill" size="lg" />
              <CuiIcon :name="icon" weight="duotone" size="lg" />
            </CuiFlex>
            <CuiFlex gap="6" class="items-center text-xs text-surface-400">
              <div class="w-20" />
              <span>thin</span>
              <span>light</span>
              <span>regular</span>
              <span>bold</span>
              <span>fill</span>
              <span>duotone</span>
            </CuiFlex>
          </CuiStack>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes" :code="`<CuiIcon name=&quot;star&quot; size=&quot;xs&quot; />
<CuiIcon name=&quot;star&quot; size=&quot;sm&quot; />
<CuiIcon name=&quot;star&quot; size=&quot;md&quot; />
<CuiIcon name=&quot;star&quot; size=&quot;lg&quot; />
<CuiIcon name=&quot;star&quot; size=&quot;xl&quot; />
<CuiIcon name=&quot;star&quot; size=&quot;3rem&quot; />`">
          <CuiFlex gap="4" class="items-end">
            <CuiStack spacing="1" class="items-center">
              <CuiIcon name="star" size="xs" />
              <span class="text-xs text-surface-400">xs</span>
            </CuiStack>
            <CuiStack spacing="1" class="items-center">
              <CuiIcon name="star" size="sm" />
              <span class="text-xs text-surface-400">sm</span>
            </CuiStack>
            <CuiStack spacing="1" class="items-center">
              <CuiIcon name="star" size="md" />
              <span class="text-xs text-surface-400">md</span>
            </CuiStack>
            <CuiStack spacing="1" class="items-center">
              <CuiIcon name="star" size="lg" />
              <span class="text-xs text-surface-400">lg</span>
            </CuiStack>
            <CuiStack spacing="1" class="items-center">
              <CuiIcon name="star" size="xl" />
              <span class="text-xs text-surface-400">xl</span>
            </CuiStack>
            <CuiStack spacing="1" class="items-center">
              <CuiIcon name="star" size="3rem" />
              <span class="text-xs text-surface-400">3rem</span>
            </CuiStack>
          </CuiFlex>
        </Example>

        <!-- Colors -->
        <Example title="Colors (inherits from parent)" :code="`<span style=&quot;color: var(--cui-primary)&quot;><CuiIcon name=&quot;check-circle&quot; /></span>
<span style=&quot;color: var(--cui-success)&quot;><CuiIcon name=&quot;check-circle&quot; /></span>
<span style=&quot;color: var(--cui-error)&quot;><CuiIcon name=&quot;x-circle&quot; /></span>`">
          <CuiFlex gap="4" class="items-center">
            <span style="color: var(--cui-primary)"><CuiIcon name="check-circle" size="lg" /></span>
            <span style="color: var(--cui-success)"><CuiIcon name="check-circle" size="lg" /></span>
            <span style="color: var(--cui-error)"><CuiIcon name="x-circle" size="lg" /></span>
            <span style="color: var(--cui-warning)"><CuiIcon name="warning-circle" size="lg" /></span>
            <span style="color: var(--cui-info)"><CuiIcon name="info" size="lg" /></span>
          </CuiFlex>
        </Example>

        <!-- Explicit Color -->
        <Example title="Explicit Color Prop" :code="`<CuiIcon name=&quot;heart&quot; weight=&quot;fill&quot; color=&quot;var(--cui-error)&quot; />
<CuiIcon name=&quot;star&quot; weight=&quot;fill&quot; color=&quot;var(--cui-warning)&quot; />
<CuiIcon name=&quot;check-circle&quot; weight=&quot;fill&quot; color=&quot;var(--cui-success)&quot; />`">
          <CuiFlex gap="4" class="items-center">
            <CuiIcon name="heart" size="lg" weight="fill" color="var(--cui-error)" />
            <CuiIcon name="star" size="lg" weight="fill" color="var(--cui-warning)" />
            <CuiIcon name="check-circle" size="lg" weight="fill" color="var(--cui-success)" />
          </CuiFlex>
        </Example>

        <!-- Duotone -->
        <Example title="Duotone" :code="`<CuiIcon name=&quot;house&quot; weight=&quot;duotone&quot; />
<CuiIcon name=&quot;house&quot; weight=&quot;duotone&quot; duotone-color=&quot;red&quot; :duotone-opacity=&quot;0.4&quot; />`">
          <CuiStack spacing="3">
            <CuiFlex gap="6" class="items-center">
              <CuiIcon name="house" weight="duotone" size="xl" />
              <CuiIcon name="folder" weight="duotone" size="xl" />
              <CuiIcon name="envelope" weight="duotone" size="xl" />
              <CuiIcon name="bell" weight="duotone" size="xl" />
              <CuiIcon name="shield-check" weight="duotone" size="xl" />
            </CuiFlex>
            <div class="text-sm text-surface-500">Custom duotone color + opacity:</div>
            <CuiFlex gap="6" class="items-center">
              <CuiIcon name="heart" weight="duotone" size="xl" color="var(--cui-error)" duotone-color="var(--cui-error)" :duotone-opacity="0.4" />
              <CuiIcon name="star" weight="duotone" size="xl" color="var(--cui-warning)" duotone-color="var(--cui-warning)" :duotone-opacity="0.5" />
              <CuiIcon name="check-circle" weight="duotone" size="xl" color="var(--cui-success)" duotone-color="var(--cui-success)" :duotone-opacity="0.3" />
            </CuiFlex>
          </CuiStack>
        </Example>

        <!-- Role Icons (used internally) -->
        <Example title="Role Icons (used in Alert, Toast)" :code="`<!-- Icons are auto-selected by color role in Alert and Toast -->
<CuiAlert color=&quot;success&quot; title=&quot;Success&quot; />
<CuiAlert color=&quot;error&quot; title=&quot;Error&quot; />
<CuiAlert color=&quot;warning&quot; title=&quot;Warning&quot; />
<CuiAlert color=&quot;info&quot; title=&quot;Info&quot; />`">
          <CuiFlex gap="6" class="items-center">
            <CuiStack spacing="1" class="items-center">
              <span style="color: var(--cui-success)"><CuiIcon name="check-circle" size="lg" /></span>
              <span class="text-xs text-surface-400">success</span>
            </CuiStack>
            <CuiStack spacing="1" class="items-center">
              <span style="color: var(--cui-error)"><CuiIcon name="x-circle" size="lg" /></span>
              <span class="text-xs text-surface-400">error</span>
            </CuiStack>
            <CuiStack spacing="1" class="items-center">
              <span style="color: var(--cui-warning)"><CuiIcon name="warning-circle" size="lg" /></span>
              <span class="text-xs text-surface-400">warning</span>
            </CuiStack>
            <CuiStack spacing="1" class="items-center">
              <span style="color: var(--cui-info)"><CuiIcon name="info" size="lg" /></span>
              <span class="text-xs text-surface-400">info</span>
            </CuiStack>
          </CuiFlex>
        </Example>

        <!-- Common Icons Gallery -->
        <Example title="Common Icons Gallery" :code="`<CuiIcon name=&quot;house&quot; />
<CuiIcon name=&quot;gear&quot; />
<CuiIcon name=&quot;user&quot; />
<!-- Browse all 9,000+ icons at phosphoricons.com -->`">
          <div class="grid grid-cols-6 gap-3 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
            <div
              v-for="icon in commonIcons"
              :key="icon"
              class="flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <CuiIcon :name="icon" size="lg" />
              <span class="text-xs text-surface-400 truncate w-full">{{ icon }}</span>
            </div>
          </div>
        </Example>

      </CuiStack>
    </div>

    <!-- Browse -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Browse All Icons</h2>
      <CuiCard>
        <CuiCardBody>
          <p class="text-surface-600 dark:text-surface-400">
            Phosphor has 9,000+ icons. Browse the full catalog at
            <a href="https://phosphoricons.com" target="_blank" rel="noopener" class="text-primary-500 underline">phosphoricons.com</a>.
            Use the icon name in kebab-case with the <code class="cui-code">name</code> prop.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>
  </CuiStack>
</template>
