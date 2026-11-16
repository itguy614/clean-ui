<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRouter } from "vue-router";
import {
  CuiBadge,
  CuiInput,
  CuiList,
  CuiListItem,
  CuiSidebar,
  CuiSidebarContent,
  CuiSidebarGroup,
  CuiSidebarHeader,
} from "@itguy614/clean-ui";
import versionRaw from "../../../../VERSION?raw";
import { PAGES, STANDALONE_GROUP, type DocPage } from "../navigation/pages";
import {
  groupResults,
  highlightSegments,
  isSearchShortcut,
  resultsMessage,
  searchPages,
} from "../navigation/search";

/** Whether the mobile drawer is open (`v-model:open`): the header's menu button drives it. */
const open = defineModel<boolean>("open", { default: false });

// The header's menu button binds these (aria-expanded, aria-controls and the translated menu
// name) instead of hard-coding them.
const sidebar = useTemplateRef("sidebar");
defineExpose({ toggleAttrs: computed(() => sidebar.value?.toggleAttrs) });

const version = versionRaw.trim();
const router = useRouter();

// The docs site is English-only: its few strings live here, together.
const TEXT = {
  searchName: "Search documentation",
  inputLabel: "Filter pages",
  placeholder: "Filter pages",
  noMatches: "No matches",
  noMatchesHint: "Try a component name or what it does, such as select, dialog or calendar.",
};

// Links outside any group stand alone at the top; everything else is a collapsible group.
const standalone = PAGES.filter((p) => p.group === STANDALONE_GROUP);
const groups: Array<{ label: string; items: DocPage[] }> = [];
for (const page of PAGES) {
  if (page.group === STANDALONE_GROUP) continue;
  const group = groups.find((g) => g.label === page.group);
  if (group) group.items.push(page);
  else groups.push({ label: page.group, items: [page] });
}

// --- Search (#516) -----------------------------------------------------------------------
//
// While a query is typed the filtered results replace the navigation. The navigation itself
// stays mounted underneath, only hidden, so clearing the box brings it back exactly as it was:
// which groups were open, and what the user toggled by hand. The results are their own groups,
// each open until the user shuts it, and all open again when the query changes.

const query = ref("");
const searching = computed(() => query.value.trim() !== "");
const results = computed(() => searchPages(PAGES, query.value));
const resultGroups = computed(() => (searching.value ? groupResults(results.value) : []));

const shutGroups = ref(new Set<string>());

function setGroupOpen(label: string, value: boolean) {
  const next = new Set(shutGroups.value);
  if (value) next.delete(label);
  else next.add(label);
  shutGroups.value = next;
}

// A screen reader hears the count once typing pauses, not on every keystroke.
const announcement = ref("");
let announceTimer: ReturnType<typeof setTimeout> | undefined;
watch(query, () => {
  shutGroups.value = new Set();
  clearTimeout(announceTimer);
  if (!searching.value) {
    announcement.value = "";
    return;
  }
  announceTimer = setTimeout(() => (announcement.value = resultsMessage(results.value.length)), 500);
});
onBeforeUnmount(() => clearTimeout(announceTimer));

// A drawer that was shut has finished with its search.
watch(open, (isOpen) => {
  if (!isOpen) query.value = "";
});

// --- Keyboard ----------------------------------------------------------------------------

const input = useTemplateRef("input");
const resultsEl = useTemplateRef<HTMLElement>("resultsEl");

const resultLinks = () => Array.from(resultsEl.value?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []);

// Below the sidebar's breakpoint it is a drawer, and the box exists only while that is open:
// `/` opens it, and the box takes focus when it appears.
let focusWhenMounted = false;
function focusSearch() {
  if (input.value) {
    input.value.focus();
    input.value.el?.select();
    return;
  }
  focusWhenMounted = true;
  open.value = true;
}
watch(input, async (field) => {
  if (!field || !focusWhenMounted) return;
  focusWhenMounted = false;
  await nextTick();
  field.focus();
});

function onWindowKeydown(event: KeyboardEvent) {
  if (!isSearchShortcut(event)) return;
  event.preventDefault();
  focusSearch();
}
onMounted(() => window.addEventListener("keydown", onWindowKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onWindowKeydown));

function openFirstMatch() {
  const first = resultGroups.value[0]?.results[0];
  if (!first) return;
  void router.push(first.page.path);
  open.value = false;
}

function onSearchKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  const inField = target === input.value?.el;
  const links = resultLinks();
  // From the box, index -1 makes "next" the first result.
  const index = inField ? -1 : links.indexOf(target as HTMLAnchorElement);

  if (event.key === "Escape") {
    // Clearing is this keystroke's whole job: say so, or the drawer closes around it.
    if (query.value) {
      event.preventDefault();
      query.value = "";
      input.value?.focus();
    } else if (inField) {
      input.value?.blur();
    }
  } else if (event.key === "Enter" && inField) {
    event.preventDefault();
    openFirstMatch();
  } else if (event.key === "ArrowDown" && (inField ? links.length : index !== -1)) {
    event.preventDefault();
    links[index + 1]?.focus();
  } else if (event.key === "ArrowUp" && index !== -1) {
    event.preventDefault();
    if (index === 0) input.value?.focus();
    else links[index - 1]?.focus();
  }
}
</script>

<template>
  <CuiSidebar ref="sidebar" v-model:open="open" label="Documentation" :toggle="false" :style="{ width: '100%' }">
    <CuiSidebarHeader title="Clean UI" subtitle="Vue Component Library">
      <template #suffix><CuiBadge color="primary" size="sm">v{{ version }}</CuiBadge></template>
    </CuiSidebarHeader>

    <!-- The same handler is on the results below: arrows and Escape work from a result link too. -->
    <div role="search" :aria-label="TEXT.searchName" class="px-3 pb-2" @keydown="onSearchKeydown">
      <span id="docs-search-label" class="cui-sr-only">{{ TEXT.inputLabel }}</span>
      <CuiInput
        ref="input"
        v-model="query"
        id="docs-search"
        type="search"
        size="sm"
        clearable
        autocomplete="off"
        aria-labelledby="docs-search-label"
        :placeholder="TEXT.placeholder"
      />
      <div role="status" class="cui-sr-only">{{ announcement }}</div>
    </div>

    <CuiSidebarContent>
      <div v-show="!searching" data-docs-nav class="flex flex-col gap-3">
        <CuiList>
          <CuiListItem v-for="page in standalone" :key="page.id" :to="page.path" :title="page.label" />
        </CuiList>

        <!-- The group holding the current page opens by itself, and follows the route. -->
        <CuiSidebarGroup v-for="group in groups" :key="group.label" :label="group.label">
          <CuiList>
            <CuiListItem v-for="page in group.items" :key="page.id" :to="page.path" :title="page.label" />
          </CuiList>
        </CuiSidebarGroup>
      </div>

      <div v-if="searching" ref="resultsEl" data-docs-search-results class="flex flex-col gap-3" @keydown="onSearchKeydown">
        <template v-if="resultGroups.length">
          <CuiSidebarGroup
            v-for="group in resultGroups"
            :key="group.label"
            :label="group.label"
            :expanded="!shutGroups.has(group.label)"
            @update:expanded="setGroupOpen(group.label, $event)"
          >
            <CuiList>
              <CuiListItem
                v-for="result in group.results"
                :key="result.page.id"
                :to="result.page.path"
              >
                <span class="cui-list-item__title">
                  <template v-for="(segment, i) in highlightSegments(result.page.label, result.ranges)" :key="i">
                    <mark v-if="segment.match" class="docs-search-mark">{{ segment.text }}</mark>
                    <template v-else>{{ segment.text }}</template>
                  </template>
                </span>
                <span v-if="result.keyword" class="cui-list-item__subtitle">{{ result.keyword }}</span>
              </CuiListItem>
            </CuiList>
          </CuiSidebarGroup>
        </template>

        <div v-else class="px-2.5 py-3 text-sm">
          <p class="font-medium">{{ TEXT.noMatches }}</p>
          <p class="mt-1">{{ TEXT.noMatchesHint }}</p>
        </div>
      </div>
    </CuiSidebarContent>
  </CuiSidebar>
</template>
