<script setup lang="ts">
import { ref } from "vue";
import { CuiBadge, CuiList, CuiListItem, CuiStack, CuiStatusDot, CuiToggle } from "@itguy614/clean-ui";
import type { StatusDotTone } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/list";

interface Printer {
  name: string;
  status: "ready" | "printing" | "low" | "offline";
}

const printers: Printer[] = [
  { name: "Front Desk LaserJet", status: "ready" },
  { name: "Warehouse Label Printer", status: "printing" },
  { name: "Finance Colour MFP — Second Floor, East Wing", status: "low" },
  { name: "Shipping Dock Zebra", status: "offline" },
];

const STATUS: Record<Printer["status"], { tone: StatusDotTone; text: string }> = {
  ready: { tone: "success", text: "Ready" },
  printing: { tone: "info", text: "Printing · 3 jobs in the queue" },
  low: { tone: "warning", text: "Toner low — replace the black cartridge soon" },
  offline: { tone: "error", text: "Offline since 09:41" },
};

const opened = ref<string | null>(null);
const wifi = ref(true);
const bluetooth = ref(false);
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiList variant=&quot;inset&quot;>
  <CuiListItem
    v-for=&quot;p in printers&quot;
    :key=&quot;p.name&quot;
    :title=&quot;p.name&quot;
    :subtitle=&quot;statusText(p)&quot;
    icon=&quot;printer&quot;
    chevron
    @click=&quot;open(p)&quot;
  >
    <template #subtitle-prefix>
      <CuiStatusDot :tone=&quot;statusTone(p)&quot; />
    </template>
  </CuiListItem>
</CuiList>`"
      >
        <CuiStack spacing="3" class="max-w-md">
          <CuiList variant="inset">
            <CuiListItem
              v-for="p in printers"
              :key="p.name"
              :title="p.name"
              :subtitle="STATUS[p.status].text"
              icon="printer"
              chevron
              @click="opened = p.name"
            >
              <template #subtitle-prefix>
                <CuiStatusDot :tone="STATUS[p.status].tone" />
              </template>
            </CuiListItem>
          </CuiList>
          <p class="text-sm text-surface-700 dark:text-surface-300" aria-live="polite">
            {{ opened ? `Opened: ${opened}` : "Click a printer." }}
          </p>
        </CuiStack>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        A list renders a real <code>&lt;ul&gt;</code> of <code>&lt;li&gt;</code>, so a screen
        reader announces "list, 4 items" and lets the user move item by item. It carries
        <code>role="list"</code> as well: Safari drops a list's semantics once its markers are
        removed with CSS.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Dividers are drawn with a pseudo-element, never an element, so they are not list items
          and the announced count is the number of rows.
        </li>
        <li>
          Each row is the element its job calls for: a link with <code>href</code> or
          <code>to</code>, a <code>&lt;button&gt;</code> with a <code>click</code> listener, plain
          content otherwise. Interactive rows are ordinary tab stops with a visible focus ring;
          arrow keys are not used, since this is not a selection list.
        </li>
        <li>
          The chevron and a decorative <code>CuiStatusDot</code> are <code>aria-hidden</code>,
          so a status is announced through the subtitle text, never by colour alone.
        </li>
        <li>
          The default subtitle colour holds WCAG AAA (7:1) on the list fill and under the hover
          fill, in light and dark mode and in every theme.
        </li>
        <li>
          A disabled link loses its target (an <code>&lt;a&gt;</code> without
          <code>href</code>, with <code>aria-disabled</code>), so it cannot be followed or
          focused. A disabled button row is a disabled <code>&lt;button&gt;</code>.
        </li>
        <li>
          Attributes go on the row itself, so <code>aria-current="page"</code> on a navigation
          item lands on its link.
        </li>
      </ul>
    </template>

    <template #examples>
      <Example
        title="Plain list with links"
        :code="`<nav aria-label=&quot;Account&quot;>
  <CuiList divided rounded=&quot;md&quot;>
    <CuiListItem title=&quot;Profile&quot; icon=&quot;user&quot; href=&quot;#profile&quot; aria-current=&quot;page&quot; />
    <CuiListItem title=&quot;Notifications&quot; icon=&quot;bell&quot; href=&quot;#notifications&quot; />
    <CuiListItem title=&quot;Billing&quot; icon=&quot;credit-card&quot; href=&quot;#billing&quot; />
  </CuiList>
</nav>`"
      >
        <nav aria-label="Account" class="max-w-xs">
          <CuiList divided rounded="md">
            <CuiListItem title="Profile" icon="user" href="#profile" aria-current="page" />
            <CuiListItem title="Notifications" icon="bell" href="#notifications" />
            <CuiListItem title="Billing" icon="credit-card" href="#billing" />
          </CuiList>
        </nav>
      </Example>

      <Example
        title="Static content"
        :code="`<CuiList divided>
  <CuiListItem title=&quot;Model&quot; subtitle=&quot;LaserJet Pro M404dn&quot; />
  <CuiListItem title=&quot;Serial number&quot; subtitle=&quot;VNB3R12345&quot; />
  <CuiListItem title=&quot;Firmware&quot; subtitle=&quot;20240117&quot; />
</CuiList>`"
      >
        <CuiList divided class="max-w-sm">
          <CuiListItem title="Model" subtitle="LaserJet Pro M404dn" />
          <CuiListItem title="Serial number" subtitle="VNB3R12345" />
          <CuiListItem title="Firmware" subtitle="20240117" />
        </CuiList>
      </Example>

      <Example
        title="Trailing content"
        :code="`<CuiList variant=&quot;inset&quot;>
  <CuiListItem title=&quot;Wi-Fi&quot; icon=&quot;wifi-high&quot;>
    <template #trailing><CuiToggle v-model=&quot;wifi&quot; aria-label=&quot;Wi-Fi&quot; /></template>
  </CuiListItem>
  <CuiListItem title=&quot;Bluetooth&quot; icon=&quot;bluetooth&quot;>
    <template #trailing><CuiToggle v-model=&quot;bluetooth&quot; aria-label=&quot;Bluetooth&quot; /></template>
  </CuiListItem>
  <CuiListItem title=&quot;Software update&quot; icon=&quot;arrow-circle-up&quot; @click=&quot;…&quot;>
    <template #trailing><CuiBadge color=&quot;error&quot;>1</CuiBadge></template>
  </CuiListItem>
</CuiList>`"
      >
        <CuiList variant="inset" class="max-w-md">
          <CuiListItem title="Wi-Fi" icon="wifi-high">
            <template #trailing><CuiToggle v-model="wifi" aria-label="Wi-Fi" /></template>
          </CuiListItem>
          <CuiListItem title="Bluetooth" icon="bluetooth">
            <template #trailing><CuiToggle v-model="bluetooth" aria-label="Bluetooth" /></template>
          </CuiListItem>
          <CuiListItem title="Software update" icon="arrow-circle-up" @click="opened = 'Software update'">
            <template #trailing><CuiBadge color="error">1</CuiBadge></template>
          </CuiListItem>
        </CuiList>
      </Example>

      <Example
        title="A single row, and a disabled one"
        :code="`<CuiList variant=&quot;inset&quot;>
  <CuiListItem title=&quot;Sign out&quot; icon=&quot;sign-out&quot; @click=&quot;…&quot; />
</CuiList>
<CuiList variant=&quot;inset&quot;>
  <CuiListItem title=&quot;Export data&quot; subtitle=&quot;Available on the Business plan&quot; chevron disabled href=&quot;#export&quot; />
  <CuiListItem title=&quot;Delete account&quot; chevron @click=&quot;…&quot; />
</CuiList>`"
      >
        <CuiStack spacing="4" class="max-w-md">
          <CuiList variant="inset">
            <CuiListItem title="Sign out" icon="sign-out" @click="opened = 'Sign out'" />
          </CuiList>
          <CuiList variant="inset">
            <CuiListItem title="Export data" subtitle="Available on the Business plan" chevron disabled href="#export" />
            <CuiListItem title="Delete account" chevron @click="opened = 'Delete account'" />
          </CuiList>
        </CuiStack>
      </Example>

      <Example
        title="Theming"
        :code="`<CuiList
  variant=&quot;inset&quot;
  style=&quot;--cui-list-radius: 1rem; --cui-list-py: 1rem; --cui-list-hover-bg: var(--cui-primary-bg)&quot;
>
  …
</CuiList>`"
      >
        <CuiList
          variant="inset"
          class="max-w-md"
          style="--cui-list-radius: 1rem; --cui-list-py: 1rem; --cui-list-hover-bg: var(--cui-primary-bg)"
        >
          <CuiListItem title="Appearance" icon="palette" chevron @click="opened = 'Appearance'" />
          <CuiListItem title="Language" subtitle="English (United Kingdom)" icon="globe" chevron @click="opened = 'Language'" />
        </CuiList>
      </Example>
    </template>
  </DocPage>
</template>
