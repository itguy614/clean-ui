<script setup lang="ts">
import { computed } from "vue";
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
 * they have nothing to show, so a component with no events simply has no Events heading —
 * no per-page conditionals, and nothing to keep in sync. Heading ids come from the same
 * `slug()` that `Example` uses, so `PageNav` can read them straight off the document.
 *
 * A compound component (Card, Modal, Tabs) declares `parts`, and each section then carries
 * an h3 per part that has rows for it. Five top-level "CuiCardHeader Props" headings —
 * what CardPage used to do — would bury Customization and Examples and make the section
 * order differ from every simple component's.
 */
const props = defineProps<{ meta: ComponentMeta }>();

type ApiKey = "props" | "slots" | "events";

/** Rows for one section, as (part name | null, rows) pairs. `null` is the root component. */
function groups(key: ApiKey) {
  const out: Array<{ name: string | null; rows: unknown[] }> = [];
  const own = props.meta[key];
  if (own?.length) out.push({ name: null, rows: own });
  for (const part of props.meta.parts ?? []) {
    const rows = part[key];
    if (rows?.length) out.push({ name: part.name, rows });
  }
  return out;
}

const api = computed(() => ({
  props: groups("props"),
  slots: groups("slots"),
  events: groups("events"),
}));

const id = (s: string) => slug(s);
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

    <!-- One canonical example with its code showing, before the reference material: the
         page's first screen should be the component and the markup that produces it, not
         a ten-row table. -->
    <div v-if="$slots.usage">
      <h2 :id="id('Usage')" class="mb-4 text-2xl font-semibold">Usage</h2>
      <slot name="usage" />
    </div>

    <div v-if="api.props.length">
      <h2 :id="id('Props')" class="mb-4 text-2xl font-semibold">Props</h2>
      <CuiStack spacing="5">
        <div v-for="g in api.props" :key="g.name ?? 'root'">
          <h3 v-if="g.name" :id="id(`${g.name} props`)" class="mb-2 text-lg font-semibold">{{ g.name }}</h3>
          <PropTable :props="(g.rows as never)" />
        </div>
      </CuiStack>
    </div>

    <div v-if="api.slots.length">
      <h2 :id="id('Slots')" class="mb-4 text-2xl font-semibold">Slots</h2>
      <CuiStack spacing="5">
        <div v-for="g in api.slots" :key="g.name ?? 'root'">
          <h3 v-if="g.name" :id="id(`${g.name} slots`)" class="mb-2 text-lg font-semibold">{{ g.name }}</h3>
          <SlotTable :slots="(g.rows as never)" />
        </div>
      </CuiStack>
    </div>

    <div v-if="api.events.length">
      <h2 :id="id('Events')" class="mb-4 text-2xl font-semibold">Events</h2>
      <CuiStack spacing="5">
        <div v-for="g in api.events" :key="g.name ?? 'root'">
          <h3 v-if="g.name" :id="id(`${g.name} events`)" class="mb-2 text-lg font-semibold">{{ g.name }}</h3>
          <EventTable :events="(g.rows as never)" />
        </div>
      </CuiStack>
    </div>

    <div v-if="meta.tokens?.length">
      <h2 :id="id('Customization')" class="mb-4 text-2xl font-semibold">Customization</h2>
      <p class="mb-4 text-surface-600 dark:text-surface-400">
        Set any of these on <code>:root</code>, on a container, or on the component itself —
        no <code>!important</code>, and no dependence on stylesheet order.
      </p>
      <TokenTable :tokens="meta.tokens" />
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
