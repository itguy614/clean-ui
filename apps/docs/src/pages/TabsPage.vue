<script setup lang="ts">
import { ref } from "vue";
import {
  CuiAlert,
  CuiBadge,
  CuiButton,
  CuiFlex,
  CuiFormField,
  CuiIcon,
  CuiInput,
  CuiSlideover,
  CuiSlider,
  CuiStack,
  CuiTab,
  CuiTabs,
  CuiToggle,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/tabs";

const usage = ref("overview");
const basic = ref("tab1");
const segmented = ref("overview");
const vertical = ref("profile");
const colored = ref("tab1");
const closeable = ref("file1");
const closeableTabs = ref(["file1", "file2", "file3"]);
const transitionTab = ref("fade");
const lazyTab = ref("tab1");

const overflowTabs = [
  { value: "general", label: "General" },
  { value: "notifications", label: "Notifications" },
  { value: "appearance", label: "Appearance" },
  { value: "integrations", label: "Integrations" },
  { value: "billing", label: "Billing & Invoices" },
  { value: "advanced", label: "Advanced" },
];
const customContent = ref("clients");
const pendingClients = ref(3);

const overflow = ref("general");
const overflowWidth = ref(343);
const overflowVariant = ref<"underline" | "segmented">("underline");
const slideoverOpen = ref(false);
const slideoverTab = ref("general");

function removeTab(value: string) {
  closeableTabs.value = closeableTabs.value.filter((t) => t !== value);
  if (closeable.value === value) {
    closeable.value = closeableTabs.value[0] ?? "";
  }
}

function resetTabs() {
  closeableTabs.value = ["file1", "file2", "file3"];
  closeable.value = "file1";
}
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiTabs v-model=&quot;active&quot;>
  <CuiTab value=&quot;overview&quot; label=&quot;Overview&quot;>
    Introductory content about the feature.
  </CuiTab>
  <CuiTab value=&quot;features&quot; label=&quot;Features&quot;>
    A list of capabilities.
  </CuiTab>
  <CuiTab value=&quot;pricing&quot; label=&quot;Pricing&quot;>
    Plan comparisons and billing options.
  </CuiTab>
</CuiTabs>`"
      >
        <CuiTabs v-model="usage">
          <CuiTab value="overview" label="Overview">
            <p>This is the overview panel. It contains introductory content about the feature.</p>
          </CuiTab>
          <CuiTab value="features" label="Features">
            <p>Features panel with a list of capabilities and details about each one.</p>
          </CuiTab>
          <CuiTab value="pricing" label="Pricing">
            <p>Pricing information with plan comparisons and billing options.</p>
          </CuiTab>
        </CuiTabs>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The bar is a <code>role="tablist"</code> of <code>role="tab"</code> buttons with
        <code>aria-orientation</code> matching the <code>orientation</code> prop, and each
        panel is a <code>role="tabpanel"</code>. The active tab is the only one with
        <code>aria-selected="true"</code>.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <strong>One tab stop.</strong> Roving <code>tabindex</code>: the active tab is
          <code>0</code> and every other is <code>-1</code>, so <code>Tab</code> enters the
          bar once and the next <code>Tab</code> leaves it, rather than walking through
          every tab.
        </li>
        <li>
          <strong>Arrow keys move between tabs</strong>, wrapping at both ends —
          <code>ArrowRight</code>/<code>ArrowLeft</code> when horizontal,
          <code>ArrowDown</code>/<code>ArrowUp</code> when vertical.
          <code>Home</code> goes to the first tab, <code>End</code> to the last. Disabled
          tabs are skipped.
        </li>
        <li>
          <strong>Activation follows focus.</strong> Moving to a tab selects it
          immediately; there is no separate <code>Enter</code> step. That is the right
          pattern only while panels are cheap to render — with
          <code>:keep-alive="false"</code> and a panel that fetches on mount, arrowing
          across the bar fires a request per tab.
        </li>
        <li>
          A disabled tab uses <code>aria-disabled</code> rather than the
          <code>disabled</code> attribute, so it stays announced and is simply not
          activatable.
        </li>
        <li>
          A tab's accessible name is whatever its button renders. With a
          <code>#label</code> slot, keep real text inside it — an icon on its own leaves
          the tab unnamed, because <code>CuiIcon</code> is <code>aria-hidden</code>.
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> The tab and its panel are not wired to each other:
        panels set <code>aria-labelledby</code> to the tab's <code>value</code>, but no
        element carries that as an <code>id</code>, and the tabs have no
        <code>aria-controls</code>. So the relationship a screen reader would use to move
        from a tab to its panel is missing. A closeable tab's close button is also
        <code>tabindex="-1"</code>, which makes closing a tab pointer-only — offer a
        keyboard route to the same action.
      </p>
    </template>

    <template #examples>
      <!-- Segmented -->
      <Example title="Segmented Variant" :code="`<CuiTabs v-model=&quot;active&quot; variant=&quot;segmented&quot;>
<CuiTab value=&quot;overview&quot; label=&quot;Overview&quot;>Overview content.</CuiTab>
<CuiTab value=&quot;activity&quot; label=&quot;Activity&quot;>Activity content.</CuiTab>
<CuiTab value=&quot;settings&quot; label=&quot;Settings&quot;>Settings content.</CuiTab>
</CuiTabs>`">
        <CuiTabs v-model="segmented" variant="segmented">
          <CuiTab value="overview" label="Overview">
            <p>Overview of the project with key metrics and status indicators.</p>
          </CuiTab>
          <CuiTab value="activity" label="Activity">
            <p>Recent activity log showing changes, comments, and updates.</p>
          </CuiTab>
          <CuiTab value="settings" label="Settings">
            <p>Project settings including visibility, permissions, and integrations.</p>
          </CuiTab>
        </CuiTabs>
      </Example>

      <!-- Colors -->
      <Example title="Colors" :code="`<CuiTabs v-model=&quot;active&quot; color=&quot;primary&quot;>...</CuiTabs>
<CuiTabs v-model=&quot;active&quot; color=&quot;success&quot;>...</CuiTabs>
<CuiTabs v-model=&quot;active&quot; color=&quot;error&quot; variant=&quot;segmented&quot;>...</CuiTabs>`">
        <CuiStack spacing="4">
          <CuiTabs v-model="colored" color="primary">
            <CuiTab value="tab1" label="Primary">
              <p>Primary colored active indicator.</p>
            </CuiTab>
            <CuiTab value="tab2" label="Second" />
          </CuiTabs>
          <CuiTabs v-model="colored" color="success">
            <CuiTab value="tab1" label="Success">
              <p>Success colored active indicator.</p>
            </CuiTab>
            <CuiTab value="tab2" label="Second" />
          </CuiTabs>
          <CuiTabs v-model="colored" color="error" variant="segmented">
            <CuiTab value="tab1" label="Error">
              <p>Error colored segmented tab.</p>
            </CuiTab>
            <CuiTab value="tab2" label="Second" />
          </CuiTabs>
        </CuiStack>
      </Example>

      <!-- Vertical -->
      <Example title="Vertical Orientation" :code="`<CuiTabs v-model=&quot;active&quot; orientation=&quot;vertical&quot;>
<CuiTab value=&quot;profile&quot; label=&quot;Profile&quot;>Profile settings.</CuiTab>
<CuiTab value=&quot;security&quot; label=&quot;Security&quot;>Security settings.</CuiTab>
</CuiTabs>`">
        <CuiTabs v-model="vertical" orientation="vertical">
          <CuiTab value="profile" label="Profile">
            <CuiStack spacing="3">
              <h3 class="text-lg font-semibold">Profile Settings</h3>
              <CuiFormField label="Display Name">
                <CuiInput placeholder="John Doe" />
              </CuiFormField>
              <CuiFormField label="Email">
                <CuiInput placeholder="you@example.com" type="email" />
              </CuiFormField>
            </CuiStack>
          </CuiTab>
          <CuiTab value="security" label="Security">
            <CuiStack spacing="3">
              <h3 class="text-lg font-semibold">Security Settings</h3>
              <CuiFormField label="Current Password">
                <CuiInput type="password" placeholder="Enter current password" />
              </CuiFormField>
              <CuiFormField label="New Password">
                <CuiInput type="password" placeholder="Enter new password" />
              </CuiFormField>
            </CuiStack>
          </CuiTab>
          <CuiTab value="notifications" label="Notifications">
            <CuiStack spacing="3">
              <h3 class="text-lg font-semibold">Notification Preferences</h3>
              <CuiToggle label="Email notifications" :model-value="true" />
              <CuiToggle label="Push notifications" :model-value="false" />
            </CuiStack>
          </CuiTab>
          <CuiTab value="billing" label="Billing">
            <h3 class="text-lg font-semibold">Billing Information</h3>
            <p class="mt-2 text-surface-600 dark:text-surface-400">Manage your subscription and payment methods.</p>
          </CuiTab>
        </CuiTabs>
      </Example>

      <!-- Vertical Segmented -->
      <Example title="Vertical + Segmented" :code="`<CuiTabs v-model=&quot;active&quot; orientation=&quot;vertical&quot; variant=&quot;segmented&quot; color=&quot;info&quot;>
<CuiTab value=&quot;profile&quot; label=&quot;Profile&quot;>Profile content.</CuiTab>
<CuiTab value=&quot;security&quot; label=&quot;Security&quot;>Security content.</CuiTab>
</CuiTabs>`">
        <CuiTabs v-model="vertical" orientation="vertical" variant="segmented" color="info">
          <CuiTab value="profile" label="Profile">
            <p>Profile content here.</p>
          </CuiTab>
          <CuiTab value="security" label="Security">
            <p>Security content here.</p>
          </CuiTab>
          <CuiTab value="notifications" label="Notifications">
            <p>Notifications content here.</p>
          </CuiTab>
        </CuiTabs>
      </Example>

      <!-- Custom tab content -->
      <Example title="Custom Tab Content (#label slot)" :code="`<CuiTab value=&quot;clients&quot; label=&quot;Clients&quot;>
<template #label>
  Clients <CuiBadge color=&quot;warning&quot; size=&quot;sm&quot;>{{ pending }}</CuiBadge>
</template>
<!-- panel content -->
<ClientList />
</CuiTab>`">
        <CuiStack spacing="3">
          <p class="text-sm text-surface-500">
            A <code class="cui-code">#label</code> slot on <code class="cui-code">CuiTab</code>
            renders inside the tab button, for counts, icons, or status dots. The
            <code class="cui-code">label</code> prop stays required and is used whenever no slot
            is given — as on the last tab below.
          </p>

          <CuiTabs v-model="customContent">
            <CuiTab value="clients" label="Clients">
              <template #label>
                Clients
                <CuiBadge color="warning" size="sm">{{ pendingClients }}</CuiBadge>
              </template>
              <CuiFlex gap="2" align="center">
                <CuiButton size="sm" @click="pendingClients++">Add a pending client</CuiButton>
                <span class="text-sm text-surface-500">The badge updates in place.</span>
              </CuiFlex>
            </CuiTab>
            <CuiTab value="reports" label="Reports">
              <template #label>
                <CuiIcon name="chart-bar" size="1rem" />
                Reports
              </template>
              <p>An icon alongside the tab text.</p>
            </CuiTab>
            <CuiTab value="archive" label="Archive">
              <p>No slot here — the label prop is rendered as plain text.</p>
            </CuiTab>
          </CuiTabs>

          <p class="text-sm text-surface-500">
            Keep the tab's text inside the slot: the button's accessible name comes from what it
            renders, so <code class="cui-code">Clients 3</code> is announced in full. A slot with
            no text at all (an icon on its own) would leave the tab unnamed — include
            visually-hidden text in that case.
          </p>
        </CuiStack>
      </Example>

      <!-- Closeable -->
      <Example title="Closeable Tabs" :code="`<CuiTabs v-model=&quot;active&quot; @close=&quot;removeTab&quot;>
<CuiTab
  v-for=&quot;tab in tabs&quot;
  :key=&quot;tab&quot;
  :value=&quot;tab&quot;
  :label=&quot;tab&quot;
  closeable
>
  Content of {{ tab }}
</CuiTab>
</CuiTabs>`">
        <CuiStack spacing="3">
          <CuiTabs v-model="closeable" @close="removeTab">
            <CuiTab
              v-for="tab in closeableTabs"
              :key="tab"
              :value="tab"
              :label="tab === 'file1' ? 'index.ts' : tab === 'file2' ? 'App.vue' : 'styles.css'"
              closeable
            >
              <p>Content of {{ tab }}</p>
            </CuiTab>
          </CuiTabs>
          <CuiButton v-if="closeableTabs.length < 3" size="xs" variant="ghost" @click="resetTabs">Reset tabs</CuiButton>
          <p class="text-sm text-surface-500">
            <code class="cui-code">@close</code> only tells you which tab was closed — removing it
            from your list is yours to do, as <code class="cui-code">removeTab</code> does here.
          </p>
        </CuiStack>
      </Example>

      <!-- Disabled -->
      <Example title="Disabled Tab" :code="`<CuiTabs v-model=&quot;active&quot;>
<CuiTab value=&quot;tab1&quot; label=&quot;Active&quot;>Active content.</CuiTab>
<CuiTab value=&quot;tab3&quot; label=&quot;Disabled&quot; disabled>Hidden content.</CuiTab>
</CuiTabs>`">
        <CuiTabs v-model="basic">
          <CuiTab value="tab1" label="Active">
            <p>This tab is active and working.</p>
          </CuiTab>
          <CuiTab value="tab2" label="Also Active">
            <p>This tab also works.</p>
          </CuiTab>
          <CuiTab value="tab3" label="Disabled" disabled>
            <p>You should not see this.</p>
          </CuiTab>
        </CuiTabs>
      </Example>

      <!-- Transitions -->
      <Example title="Panel Transitions" :code="`<CuiTabs v-model=&quot;active&quot; transition=&quot;fade&quot;>...</CuiTabs>
<CuiTabs v-model=&quot;active&quot; transition=&quot;slide&quot;>...</CuiTabs>
<CuiTabs v-model=&quot;active&quot; transition=&quot;none&quot;>...</CuiTabs>`">
        <CuiStack spacing="4">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton size="xs" :variant="transitionTab === 'fade' ? 'solid' : 'outline'" @click="transitionTab = 'fade'">Fade</CuiButton>
            <CuiButton size="xs" :variant="transitionTab === 'slide' ? 'solid' : 'outline'" @click="transitionTab = 'slide'">Slide</CuiButton>
            <CuiButton size="xs" :variant="transitionTab === 'none' ? 'solid' : 'outline'" @click="transitionTab = 'none'">None</CuiButton>
          </CuiFlex>
          <CuiTabs
            v-model="basic"
            :transition="transitionTab as any"
          >
            <CuiTab value="tab1" label="First">
              <CuiAlert color="primary" title="First Panel" entrance="none">Switch tabs to see the transition effect.</CuiAlert>
            </CuiTab>
            <CuiTab value="tab2" label="Second">
              <CuiAlert color="success" title="Second Panel" entrance="none">This is the second panel content.</CuiAlert>
            </CuiTab>
            <CuiTab value="tab3" label="Third">
              <CuiAlert color="info" title="Third Panel" entrance="none">And this is the third.</CuiAlert>
            </CuiTab>
          </CuiTabs>
        </CuiStack>
      </Example>

      <!-- Keep Alive: false -->
      <Example title="keepAlive: false (lazy panels)" :code="`<CuiTabs v-model=&quot;active&quot; :keep-alive=&quot;false&quot;>
<CuiTab value=&quot;tab1&quot; label=&quot;Eager Tab&quot;>Mounted on switch.</CuiTab>
<CuiTab value=&quot;tab2&quot; label=&quot;Lazy Data&quot;>Data fetched on mount.</CuiTab>
</CuiTabs>`">
        <CuiStack spacing="2">
          <CuiTabs v-model="lazyTab" :keep-alive="false">
            <CuiTab value="tab1" label="Eager Tab">
              <p>This panel was mounted when you switched to it. Switch away and back — the component remounts each time.</p>
            </CuiTab>
            <CuiTab value="tab2" label="Lazy Data">
              <CuiAlert color="info" title="Data Loading" entrance="fade">
                In a real app, this panel could fetch data on mount since it's destroyed when inactive.
              </CuiAlert>
            </CuiTab>
          </CuiTabs>
          <p class="text-sm text-surface-500">
            Panels are destroyed when inactive (v-if instead of v-show). Good for deferring expensive
            renders or data fetches — but remember arrow-key navigation activates each tab it lands on,
            so a fetch-on-mount panel fires a request per tab the user arrows past.
          </p>
        </CuiStack>
      </Example>

      <!-- Overflow -->
      <Example title="Overflow in narrow containers" :code="`<!-- Nothing to configure — the tab bar scrolls when the tabs don't fit -->
<div style=&quot;width: 343px&quot;>
<CuiTabs v-model=&quot;active&quot;>
  <CuiTab value=&quot;general&quot; label=&quot;General&quot;>…</CuiTab>
  <CuiTab value=&quot;notifications&quot; label=&quot;Notifications&quot;>…</CuiTab>
  <!-- …more tabs than fit… -->
</CuiTabs>
</div>`">
        <CuiStack spacing="4">
          <p class="text-sm text-surface-500">
            When the tabs are wider than their container the bar scrolls horizontally, and the
            clipped edge fades to show there's more. Drag the width to see it engage — the active
            tab is always scrolled into view.
          </p>

          <CuiSlider
            v-model="overflowWidth"
            label="Container width"
            :min="240"
            :max="720"
            :step="1"
            show-value
            :format-value="(v: number) => `${v}px`"
          />

          <div
            class="rounded-lg border border-dashed p-3"
            style="border-color: var(--cui-border)"
            :style="{ width: `${overflowWidth}px`, maxWidth: '100%' }"
          >
            <CuiTabs v-model="overflow" :variant="overflowVariant">
              <CuiTab
                v-for="tab in overflowTabs"
                :key="tab.value"
                :value="tab.value"
                :label="tab.label"
              >
                <p>{{ tab.label }} panel.</p>
              </CuiTab>
            </CuiTabs>
          </div>

          <CuiFlex gap="4" align="center" wrap="wrap">
            <CuiToggle
              :model-value="overflowVariant === 'segmented'"
              label="Segmented variant"
              @update:model-value="overflowVariant = $event ? 'segmented' : 'underline'"
            />
            <CuiButton
              size="sm"
              @click="overflow = overflowTabs[overflowTabs.length - 1].value"
            >
              Activate last tab
            </CuiButton>
          </CuiFlex>
        </CuiStack>
      </Example>

      <!-- Overflow inside a clipping overlay -->
      <Example title="Overflow inside a Slideover" :code="`<CuiSlideover v-model:visible=&quot;open&quot; title=&quot;Settings&quot; size=&quot;sm&quot;>
<CuiTabs v-model=&quot;active&quot;>
  <!-- Tabs stay reachable even though the panel is overflow: hidden -->
</CuiTabs>
</CuiSlideover>`">
        <CuiStack spacing="3">
          <p class="text-sm text-surface-500">
            The original bug report: overlay panels are
            <code class="cui-code">overflow: hidden</code>, so
            before this fix the trailing tabs were clipped away with no way to reach them.
          </p>
          <div>
            <CuiButton @click="slideoverOpen = true">
              <template #prefix><CuiIcon name="sidebar" /></template>
              Open settings panel
            </CuiButton>
          </div>
          <CuiSlideover v-model:visible="slideoverOpen" title="Settings" size="sm">
            <CuiTabs v-model="slideoverTab">
              <CuiTab
                v-for="tab in overflowTabs"
                :key="tab.value"
                :value="tab.value"
                :label="tab.label"
              >
                <p>{{ tab.label }} settings go here.</p>
              </CuiTab>
            </CuiTabs>
          </CuiSlideover>
        </CuiStack>
      </Example>
    </template>
  </DocPage>
</template>
