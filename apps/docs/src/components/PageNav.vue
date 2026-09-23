<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { slug } from "../utils/slug";

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
const activeId = ref<string>("");

let observer: IntersectionObserver | null = null;

function collect() {
  // Every h2/h3, not only those already carrying an id: `DocPage` and `Example` assign
  // their own, but the pages not yet converted to the shell have none, and the nav is
  // meant to work on all of them from the start. Ids are assigned here from the same
  // `slug()`, deduped, so a converted and an unconverted page anchor identically.
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("main h2, main h3"));
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

  observer?.disconnect();
  if (nodes.length === 0) return;

  // The active entry is the last heading to have crossed the top of the viewport, which is
  // what "where am I" means when scrolling. A plain "is it visible" test picks the
  // *lowest* visible heading, which reads as the nav running ahead of the reader.
  observer = new IntersectionObserver(
    (records) => {
      for (const r of records) {
        if (r.isIntersecting) activeId.value = r.target.id;
      }
    },
    { rootMargin: "0px 0px -80% 0px", threshold: 0 },
  );
  nodes.forEach((el) => observer!.observe(el));
  activeId.value = nodes[0].id;
}

function go(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  activeId.value = id;
  // Move keyboard focus to the section too, or the nav is a mouse-only affordance.
  el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

onMounted(() => nextTick(collect));
onBeforeUnmount(() => observer?.disconnect());
// Headings change wholesale on navigation, and the new page's DOM is a tick away.
watch(() => route.fullPath, () => nextTick(collect));
</script>

<template>
  <nav v-if="entries.length > 1" class="cui-page-nav hidden lg:block" aria-label="On this page">
    <p class="cui-page-nav__title">On this page</p>
    <ul class="cui-page-nav__list">
      <li v-for="e in entries" :key="e.id">
        <a
          :href="`#${e.id}`"
          class="cui-page-nav__link"
          :class="{
            'cui-page-nav__link--sub': e.level === 3,
            'cui-page-nav__link--active': e.id === activeId,
          }"
          :aria-current="e.id === activeId ? 'true' : undefined"
          @click.prevent="go(e.id)"
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
  transition: color 0.15s ease, border-color 0.15s ease;
}

.cui-page-nav__link:hover {
  color: var(--cui-text-body);
}

.cui-page-nav__link--sub {
  padding-left: 1.5rem;
  font-size: 0.78125rem;
}

.cui-page-nav__link--active {
  color: var(--cui-primary);
  border-left-color: var(--cui-primary);
  font-weight: 500;
}

.cui-page-nav__link:focus-visible {
  outline: 2px solid var(--cui-primary-focus-ring);
  outline-offset: -2px;
  border-radius: 2px;
}
</style>
