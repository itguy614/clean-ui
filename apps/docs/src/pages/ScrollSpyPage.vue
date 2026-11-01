<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { CuiStack, CuiCard, CuiCardBody, CuiButton, CuiToggle, CuiFlex, CuiBadge, useScrollSpy } from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import PropTable from "../components/PropTable.vue";
import { isPlainClick, scrollBehavior } from "../utils/link";

// --- A scrolling article with a sticky header and an on-page nav beside it ---
const HEADER = 48;
const sections = ref([
  { id: "spy-overview", title: "Overview" },
  { id: "spy-install", title: "Installation" },
  { id: "spy-config", title: "Configuration" },
  { id: "spy-usage", title: "Usage" },
  { id: "spy-faq", title: "FAQ" },
]);
const withOffset = ref(true);
const scroller = useTemplateRef<HTMLElement>("scroller");

const { activeId, setActive } = useScrollSpy(() => sections.value.map((s) => s.id), {
  root: scroller,
  offset: () => (withOffset.value ? HEADER : 0),
});
const current = computed(() => activeId.value ?? sections.value[0].id);

function go(e: MouseEvent, id: string) {
  if (!isPlainClick(e)) return;
  const el = document.getElementById(id);
  if (!el || !scroller.value) return;
  e.preventDefault();
  setActive(id);
  scroller.value.scrollTo({ top: el.offsetTop - HEADER, behavior: scrollBehavior() });
}

let added = 0;
function addSection() {
  added++;
  sections.value.push({ id: `spy-appendix-${added}`, title: `Appendix ${added}` });
}

const articleCode = `<script setup>
const scroller = useTemplateRef("scroller");
const sections = ref([{ id: "overview", title: "Overview" }, …]);

const { activeId, setActive } = useScrollSpy(
  () => sections.value.map((s) => s.id),   // a getter: sections can come and go
  { root: scroller, offset: 48 },           // 48px sticky header inside the scroller
);

function go(e, id) {
  e.preventDefault();
  setActive(id);                            // current now, held while the scroll runs
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  scroller.value.scrollTo({ top: document.getElementById(id).offsetTop - 48, behavior: reduce ? "auto" : "smooth" });
}
<\/script>

<template>
  <nav aria-label="Article">
    <a v-for="s in sections" :key="s.id" :href="\`#\${s.id}\`"
       :aria-current="s.id === activeId ? 'location' : undefined"
       @click="go($event, s.id)">{{ s.title }}</a>
  </nav>
  <div ref="scroller" style="overflow: auto; height: 20rem; position: relative">
    <header style="position: sticky; top: 0; height: 48px">…</header>
    <section v-for="s in sections" :key="s.id"><h3 :id="s.id">{{ s.title }}</h3>…</section>
  </div>
</template>`;

const pageCode = `// The whole page scrolls: leave root out. The docs header is 56px tall.
const { activeId, setActive } = useScrollSpy(
  () => headings.value.map((h) => h.id),
  { rootMargin: "0px 0px -80% 0px", offset: 56 },
);`;

const params = [
  {
    name: "targets",
    type: "MaybeRefOrGetter<readonly (string | HTMLElement)[]>",
    description:
      "The sections, as element ids or elements (an element needs an id, since that is what activeId reports). A ref or getter is followed: change the list and the observer is rebuilt. Ids are looked up after mount; call refresh() if their elements appear later without the list changing.",
  },
  {
    name: "options.rootMargin",
    type: "MaybeRefOrGetter<string>",
    default: '"0px 0px -50% 0px"',
    description: "The band a section must reach to count, as an IntersectionObserver rootMargin. The default is the top half of the scroller.",
  },
  {
    name: "options.offset",
    type: "MaybeRefOrGetter<number>",
    default: "0",
    description:
      "Pixels taken off the top of the band, for a sticky header: a heading hidden under it is not in view. Added to rootMargin's top inset when that is in pixels; replaces it when that is a percentage.",
  },
  {
    name: "options.root",
    type: "MaybeRefOrGetter<HTMLElement | null>",
    default: "viewport",
    description: "The element that scrolls. Leave it out when the page itself scrolls.",
  },
];

const returns = [
  {
    name: "activeId",
    type: "Readonly<Ref<string | null>>",
    description:
      "The current section's id. Null until a section has reached the band, so fall back to the first one if your nav should always mark something.",
  },
  {
    name: "setActive",
    type: "(id: string) => void",
    description:
      "Makes id current immediately, for a click on a nav entry. The observer leaves activeId alone until that scroll ends (scrollend) or the reader scrolls themselves (wheel, touch or a key).",
  },
  {
    name: "refresh",
    type: "() => void",
    description: "Looks the targets up again, for ids whose elements were rendered after the list was set.",
  },
];
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Scroll Spy</h1>
      <p class="cui-lead">
        <code class="cui-code">useScrollSpy()</code> tracks which section of a page the reader is in,
        so an on-page nav can mark it.
      </p>
      <p>
        It watches the sections with an IntersectionObserver, never a scroll listener. Of the sections
        inside the observed band, the <strong>topmost</strong> is current. Between two headings, when
        none is inside it, the last one to have scrolled above the band stays current. The "On this
        page" nav beside every page of this site is built on it.
      </p>
    </div>

    <Example title="Article with a sticky header" :code="articleCode">
      <CuiStack spacing="4">
        <CuiFlex gap="4" wrap="wrap" align="center">
          <CuiToggle v-model="withOffset" label="Account for the sticky header" />
          <CuiButton size="sm" @click="addSection">Add a section</CuiButton>
          <span>Current: <CuiBadge>{{ sections.find((s) => s.id === current)?.title }}</CuiBadge></span>
        </CuiFlex>
        <div style="display: flex; gap: 1.5rem; align-items: flex-start">
          <nav aria-label="Article" style="flex-shrink: 0; width: 9rem">
            <ul style="list-style: none; margin: 0; padding: 0; border-left: 1px solid var(--cui-border)">
              <li v-for="s in sections" :key="s.id" style="margin: 0">
                <a
                  :href="`#${s.id}`"
                  :aria-current="s.id === current ? 'location' : undefined"
                  :style="{
                    display: 'block',
                    padding: '0.25rem 0 0.25rem 0.75rem',
                    marginLeft: '-1px',
                    borderLeft: s.id === current ? '4px solid var(--cui-primary)' : '2px solid transparent',
                    fontWeight: s.id === current ? 600 : 400,
                    color: s.id === current ? 'var(--cui-primary)' : 'var(--cui-text-secondary)',
                    textDecoration: 'none',
                  }"
                  @click="go($event, s.id)"
                >
                  {{ s.title }}
                </a>
              </li>
            </ul>
          </nav>
          <div
            ref="scroller"
            tabindex="0"
            aria-label="Article"
            role="region"
            style="flex: 1; min-width: 0; height: 20rem; overflow: auto; position: relative; border: 1px solid var(--cui-border); border-radius: var(--cui-radius-lg, 0.5rem)"
          >
            <div
              :style="{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                height: `${HEADER}px`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 1rem',
                background: 'var(--cui-surface-bg)',
                borderBottom: '1px solid var(--cui-border)',
                fontWeight: 600,
              }"
            >
              Sticky header ({{ HEADER }}px)
            </div>
            <section v-for="s in sections" :key="s.id" style="padding: 0.75rem 1rem 1.5rem">
              <h3 :id="s.id" style="margin: 0 0 0.5rem">{{ s.title }}</h3>
              <p style="margin: 0">
                Scroll slowly and watch the nav follow the heading that reaches the top half of the
                box. With the toggle on, the band starts below the sticky header.
              </p>
            </section>
            <div style="height: 12rem" />
          </div>
        </div>
      </CuiStack>
    </Example>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Try:</strong></p>
        <ul style="margin-bottom: 0">
          <li>Scroll the article slowly. The nav marks the topmost heading in the top half of the box.</li>
          <li>Stop between two headings: the one you scrolled past stays current.</li>
          <li>
            Scroll until a heading is hidden behind the sticky header. With the toggle on, the next
            heading is current. Turn the toggle off and the hidden heading wins again.
          </li>
          <li>Click <em>FAQ</em>. It is marked at once and stays marked while the scroll passes the others.</li>
          <li>Press <em>Add a section</em>: the new heading joins the nav and is tracked straight away.</li>
          <li>The current entry is bold, with a wider bar, and carries <code class="cui-code">aria-current="location"</code>: not colour alone.</li>
        </ul>
      </CuiCardBody>
    </CuiCard>

    <Example title="Following the whole page" :code="pageCode">
      <p style="margin: 0">
        Leave <code class="cui-code">root</code> out and the viewport is the scroller. This site's
        "On this page" rail does exactly this. Scroll this page and watch it.
      </p>
    </Example>

    <!-- API -->
    <div>
      <h2>API</h2>
      <pre class="cui-pre"><code class="cui-code">useScrollSpy(targets, options?): { activeId, setActive, refresh }</code></pre>
    </div>

    <CuiCard variant="outline">
      <CuiCardBody>
        <PropTable :props="params" />
      </CuiCardBody>
    </CuiCard>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Returns</strong></p>
        <PropTable :props="returns" />
      </CuiCardBody>
    </CuiCard>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Things to know:</strong></p>
        <ul style="margin-bottom: 0">
          <li>
            "Topmost" means first in document order, whatever order the targets are listed in.
          </li>
          <li>
            Call it during a component's setup. It is SSR-safe: on the server nothing is observed and
            <code class="cui-code">activeId</code> stays null. The observer and its listeners go away
            when the component unmounts.
          </li>
          <li>
            Where <code class="cui-code">scrollend</code> isn't supported, a section set by
            <code class="cui-code">setActive</code> stays current until the reader scrolls.
          </li>
          <li>
            The last sections of a short page may never reach the band. Use a band that reaches
            further down (a smaller negative bottom margin), or pad the end of the page.
          </li>
          <li>
            It tracks; it doesn't scroll or render. Make the nav real links
            (<code class="cui-code">href="#id"</code>), give it an accessible name, and mark the current
            entry with <code class="cui-code">aria-current="location"</code> and something besides colour.
          </li>
        </ul>
      </CuiCardBody>
    </CuiCard>

    <!-- When to use it -->
    <div>
      <h2>When to use it</h2>
      <p>
        Use it for an on-page table of contents, a documentation rail, or a long settings page whose
        side nav follows the section being edited.
      </p>
      <p style="margin-bottom: 0">
        Don't use it to switch content. If only one section is shown at a time, use
        <router-link :to="{ name: 'tabs' }">Tabs</router-link>, whose selection is the state rather
        than a reflection of the scroll position.
      </p>
    </div>
  </CuiStack>
</template>
