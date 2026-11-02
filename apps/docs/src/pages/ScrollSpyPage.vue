<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { CuiStack, CuiCard, CuiCardBody, CuiButton, CuiToggle, CuiFlex, CuiBadge, useScrollSpy } from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import PropTable from "../components/PropTable.vue";
import { isPlainClick } from "../utils/link";

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

const { activeId: current, scrollTo } = useScrollSpy(() => sections.value.map((s) => s.id), {
  root: scroller,
  offset: () => (withOffset.value ? HEADER : 0),
  initial: () => sections.value[0].id,
});

function go(e: MouseEvent, id: string) {
  if (!isPlainClick(e)) return;
  e.preventDefault();
  scrollTo(id);
}

let added = 0;
function addSection() {
  added++;
  sections.value.push({ id: `spy-appendix-${added}`, title: `Appendix ${added}` });
}

const articleCode = `<script setup>
const scroller = useTemplateRef("scroller");
const sections = ref([{ id: "overview", title: "Overview" }, …]);

const { activeId, scrollTo } = useScrollSpy(
  () => sections.value.map((s) => s.id),   // a getter: sections can come and go
  {
    root: scroller,
    offset: 48,                             // 48px sticky header inside the scroller
    initial: () => sections.value[0].id,    // marked on first paint, and above the first heading
  },
);

function go(e, id) {
  e.preventDefault();
  scrollTo(id);   // current now, held while the scroll runs; lands 48px down, below the header
}
<\/script>

<template>
  <nav aria-label="Article sections">
    <a v-for="s in sections" :key="s.id" :href="\`#\${s.id}\`"
       :aria-current="s.id === activeId ? 'location' : undefined"
       @click="go($event, s.id)">{{ s.title }}</a>
  </nav>
  <div ref="scroller" style="overflow: auto; height: 20rem; position: relative">
    <header style="position: sticky; top: 0; height: 48px">…</header>
    <section v-for="s in sections" :key="s.id"><h3 :id="s.id">{{ s.title }}</h3>…</section>
  </div>
</template>`;

const pageCode = `// The whole page scrolls: leave root out. 72px clears the 56px header with some air.
const { activeId, scrollTo } = useScrollSpy(
  () => headings.value.map((h) => h.id),
  { rootMargin: "0px 0px -80% 0px", offset: 72, initial: () => headings.value[0]?.id },
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
      "Pixels taken off the top of the band, for a sticky header: a heading hidden under it is not in view. Added to rootMargin's top inset when that is in pixels; replaces it when that is a percentage. scrollTo() lands a section this far below the scroller's top.",
  },
  {
    name: "options.root",
    type: "MaybeRefOrGetter<HTMLElement | null>",
    default: "viewport",
    description: "The element that scrolls. Leave it out when the page itself scrolls.",
  },
  {
    name: "options.initial",
    type: "MaybeRefOrGetter<string | null>",
    default: "null",
    description:
      "The id reported while no section has reached the band: on first paint before the observer has run, during SSR, and above the first section. Usually the first section, so the nav always marks something. A getter follows a list that changes.",
  },
];

const returns = [
  {
    name: "activeId",
    type: "Readonly<Ref<string | null>>",
    description: "The current section's id, or initial (null unless set) until a section has reached the band.",
  },
  {
    name: "scrollTo",
    type: "(id: string) => void",
    description:
      "Scrolls section id into view, offset pixels below the scroller's top, and makes it current at once, held like setActive so the highlight doesn't pass through the sections in between. Smooth, or instant under prefers-reduced-motion. Does nothing if no element has that id. Moving focus to the section is up to you.",
  },
  {
    name: "setActive",
    type: "(id: string) => void",
    description:
      "Makes id current immediately without scrolling, for when you scroll yourself. The observer leaves activeId alone until that scroll ends (scrollend) or the reader scrolls themselves (wheel, touch, a pointer press or a scrolling key), which also re-reads where they are at once.",
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
          <nav aria-label="Article sections" style="flex-shrink: 0; width: 9rem">
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
            aria-label="Article text"
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
          <li>
            Scroll back to the top. <em>Overview</em> stays marked even before its heading reaches the
            band: that is <code class="cui-code">initial</code>, which is also what the nav shows on
            first paint.
          </li>
          <li>
            Click <em>FAQ</em>. <code class="cui-code">scrollTo</code> marks it at once, keeps it
            marked while the scroll passes the others, and stops with the heading just below the
            sticky header.
          </li>
          <li>
            Turn the toggle off and click <em>Usage</em>: the heading now stops under the header,
            since <code class="cui-code">scrollTo</code> uses the same offset as the spy.
          </li>
          <li>With your system set to reduce motion, the clicks jump instead of gliding.</li>
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
      <pre class="cui-pre"><code class="cui-code">useScrollSpy(targets, options?): { activeId, scrollTo, setActive, refresh }</code></pre>
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
            Call it during a component's setup. It is SSR-safe: on the server nothing is observed,
            <code class="cui-code">activeId</code> is <code class="cui-code">initial</code> (or null),
            and <code class="cui-code">scrollTo</code> does nothing. The observer and its listeners go
            away when the component unmounts.
          </li>
          <li>
            Where <code class="cui-code">scrollend</code> isn't supported, a section set by
            <code class="cui-code">scrollTo</code> or <code class="cui-code">setActive</code> stays
            current until the reader scrolls.
          </li>
          <li>
            The last sections of a short page may never reach the band. Use a band that reaches
            further down (a smaller negative bottom margin), or pad the end of the page.
          </li>
          <li>
            It doesn't render the nav. Make it real links
            (<code class="cui-code">href="#id"</code>) that call <code class="cui-code">scrollTo</code>
            on a plain click, give it an accessible name, and mark the current entry with
            <code class="cui-code">aria-current="location"</code> and something besides colour.
            <code class="cui-code">scrollTo</code> doesn't move focus: give the heading
            <code class="cui-code">tabindex="-1"</code> and focus it with
            <code class="cui-code">preventScroll</code>, as this site's rail does.
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
