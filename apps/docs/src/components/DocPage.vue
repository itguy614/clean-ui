<script setup lang="ts">
import { CuiStack } from "@itguy614/clean-ui";
import PropTable from "./PropTable.vue";
import SlotTable from "./SlotTable.vue";
import EventTable from "./EventTable.vue";
import TokenTable from "./TokenTable.vue";
import type { ComponentMeta } from "../meta/types";
import { slug } from "../utils/slug";

/**
 * The shell every component page uses.
 *
 * Section order is fixed here rather than left to each page to remember:
 *
 *   Props → Slots → Events → Customization → Accessibility → (extra) → Examples
 *
 * The four API sections render from the component's metadata module and disappear when
 * their array is empty, so a component with no events simply has no Events heading — no
 * per-page conditionals, and nothing to keep in sync. Heading ids come from the same
 * `slug()` that `Example` uses, so `PageNav` can read them straight off the document.
 */
const props = defineProps<{ meta: ComponentMeta }>();

const sections = ["Props", "Slots", "Events", "Customization", "Accessibility", "Examples"] as const;
const id = (s: (typeof sections)[number]) => slug(s);

const has = {
  props: () => (props.meta.props?.length ?? 0) > 0,
  slots: () => (props.meta.slots?.length ?? 0) > 0,
  events: () => (props.meta.events?.length ?? 0) > 0,
  tokens: () => (props.meta.tokens?.length ?? 0) > 0,
};
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">{{ meta.name }}</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">{{ meta.description }}</p>
    </div>

    <!-- Anything that has to sit above the API tables — a caveat the reader needs before
         anything else. Deliberately not a section: it carries no heading. -->
    <slot name="intro" />

    <div v-if="has.props()">
      <h2 :id="id('Props')" class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable :props="meta.props!" />
    </div>

    <div v-if="has.slots()">
      <h2 :id="id('Slots')" class="mb-4 text-2xl font-semibold">Slots</h2>
      <SlotTable :slots="meta.slots!" />
    </div>

    <div v-if="has.events()">
      <h2 :id="id('Events')" class="mb-4 text-2xl font-semibold">Events</h2>
      <EventTable :events="meta.events!" />
    </div>

    <div v-if="has.tokens()">
      <h2 :id="id('Customization')" class="mb-4 text-2xl font-semibold">Customization</h2>
      <p class="mb-4 text-surface-600 dark:text-surface-400">
        Set any of these on <code>:root</code>, on a container, or on the component itself —
        no <code>!important</code>, and no dependence on stylesheet order.
      </p>
      <TokenTable :tokens="meta.tokens!" />
      <slot name="customization" />
    </div>

    <div v-if="$slots.accessibility">
      <h2 :id="id('Accessibility')" class="mb-4 text-2xl font-semibold">Accessibility</h2>
      <slot name="accessibility" />
    </div>

    <!-- One-off sections that do not fit the fixed set. They come last before Examples so
         the canonical order stays readable in the on-page nav. -->
    <slot name="extra" />

    <div v-if="$slots.examples">
      <h2 :id="id('Examples')" class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">
        <slot name="examples" />
      </CuiStack>
    </div>
  </CuiStack>
</template>
