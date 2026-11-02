<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { useScrollSpy } from "@itguy614/clean-ui";
import { slug } from "../utils/slug";
import { isPlainClick, scrollBehavior } from "../utils/link";

/**
 * Sticky on-page nav, right rail.
 *
 * Reads the headings off the rendered page rather than being handed a list: a declared
 * list is a second description of the same sections, and it drifts.
 *
 * Two levels only — h2 for sections, h3 for the individual examples.
 */
interface Entry {
  id: string;
  text: string;
  level: 2 | 3;
}

const route = useRoute();
const entries = ref<Entry[]>([]);

// The current entry is the topmost heading in the top fifth of the viewport, below the
// 56px sticky header, or else the last heading to have scrolled above that band: "where am
// I" when reading. A plain "is it visible" test picks the lowest visible heading, which
// reads as the nav running ahead of the reader.
const { activeId: spied, setActive } = useScrollSpy(
  () => entries.value.map((e) => e.id),
  { rootMargin: "0px 0px -80% 0px", offset: 56 },
);
// Above the first heading nothing has reached the band yet: the first entry is current.
const activeId = computed(() => spied.value ?? entries.value[0]?.id ?? null);

function collect() {
  // Every h2/h3, not only those already carrying an id: `DocPage` and `Example` assign
  // their own, but the pages not yet converted to the shell have none, and the nav is
  // meant to work on all of them from the start. Ids are assigned here from the same
  // `slug()`, deduped, so a converted and an unconverted page anchor identically.
  //
  // Headings inside an example's *preview* are content, not page structure — a product
  // card demo has an <h3> for the product name, and listing it here reads as a section
  // that does not exist. `Example` puts its own title in the card header and the demo in
  // the body, so excluding card bodies keeps exactly the structural headings, on
  // converted and unconverted pages alike.
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("main h2, main h3")).filter(
    (el) => !el.closest(".cui-card-body"),
  );
  const seen = new Set<string>();

  entries.value = nodes.map((el) => {
    const text = el.textContent?.trim() ?? "";
    if (!el.id) {
      let candidate = slug(text) || "section";
      for (let i = 2; seen.has(candidate); i++) candidate = `${slug(text)}-${i}`;
      el.id = candidate;
    }
    seen.add(el.id);
    return { id: el.id, text, level: el.tagName === "H2" ? 2 : 3 };
  });
}

function go(e: MouseEvent, id: string) {
  // A real link: a modified or middle click still opens it in a new tab or window.
  if (!isPlainClick(e)) return;
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  // Current at once, and held while the smooth scroll passes the sections in between.
  setActive(id);
  el.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  // Move keyboard focus to the section too, or the nav is a mouse-only affordance.
  el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

onMounted(() => nextTick(collect));
// Headings change wholesale on navigation, and the new page's DOM is a tick away.
watch(() => route.fullPath, () => nextTick(collect));
</script>

<template>
  <nav v-if="entries.length > 1" class="cui-page-nav hidden lg:block" aria-labelledby="cui-page-nav-title">
    <p id="cui-page-nav-title" class="cui-page-nav__title">On this page</p>
    <ul class="cui-page-nav__list">
      <li v-for="e in entries" :key="e.id">
        <a
          :href="`#${e.id}`"
          class="cui-page-nav__link"
          :class="{
            'cui-page-nav__link--sub': e.level === 3,
            'cui-page-nav__link--active': e.id === activeId,
          }"
          :aria-current="e.id === activeId ? 'location' : undefined"
          @click="go($event, e.id)"
        >
          {{ e.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.cui-page-nav {
  position: sticky;
  top: 1.5rem;
  align-self: flex-start;
  width: 15rem;
  flex-shrink: 0;
  max-height: calc(100vh - 3rem);
  overflow-y: auto;
  padding: 1.5rem 1rem 1.5rem 0;
  font-size: 0.8125rem;
}

.cui-page-nav__title {
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--cui-text-tertiary);
}

.cui-page-nav__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-left: 1px solid var(--cui-border);
}

.cui-page-nav__link {
  display: block;
  padding: 0.25rem 0 0.25rem 0.75rem;
  margin-left: -1px;
  border-left: 2px solid transparent;
  color: var(--cui-text-secondary);
  text-decoration: none;
  line-height: 1.4;
  transition: color var(--cui-duration-fast) ease, border-color var(--cui-duration-fast) ease;
}

.cui-page-nav__link:hover {
  color: var(--cui-text-body);
}

.cui-page-nav__link--sub {
  padding-left: 1.5rem;
  font-size: 0.78125rem;
}

/* Not colour alone (WCAG 1.4.1): a bar four times the rail's width and a heavier weight
   mark the current entry too, so it still reads in greyscale. */
.cui-page-nav__link--active {
  color: var(--cui-primary);
  border-left-width: 4px;
  border-left-color: var(--cui-primary);
  padding-left: calc(0.75rem - 2px);
  font-weight: 600;
}

.cui-page-nav__link--sub.cui-page-nav__link--active {
  padding-left: calc(1.5rem - 2px);
}

.cui-page-nav__link:focus-visible {
  outline: 2px solid var(--cui-primary-focus-ring);
  outline-offset: -2px;
  border-radius: 2px;
}
</style>
