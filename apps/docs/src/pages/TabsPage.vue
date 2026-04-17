<script setup lang="ts">
import { ref } from "vue";
import {
  CuiAlert,
  CuiButton,
  CuiFlex,
  CuiFormField,
  CuiIcon,
  CuiInput,
  CuiStack,
  CuiTab,
  CuiTabs,
  CuiToggle,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const basic = ref("tab1");
const segmented = ref("overview");
const vertical = ref("profile");
const colored = ref("tab1");
const closeable = ref("file1");
const closeableTabs = ref(["file1", "file2", "file3"]);
const transitionTab = ref("fade");
const lazyTab = ref("tab1");

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
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Tabs</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Tabbed interface with underline and segmented variants, vertical
        orientation, closeable tabs, and animated panel transitions.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiTabs Props</h2>
      <PropTable
        :props="[
          { name: 'v-model', type: 'string', default: '-', description: 'Active tab value' },
          { name: 'variant', type: 'underline | segmented', default: 'underline', description: 'Tab bar style' },
          { name: 'orientation', type: 'horizontal | vertical', default: 'horizontal', description: 'Layout direction' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Active indicator color' },
          { name: 'keepAlive', type: 'boolean', default: 'true', description: 'Keep inactive panels in DOM' },
          { name: 'transition', type: 'fade | slide | none', default: 'fade', description: 'Panel transition animation' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiTab Props</h2>
      <PropTable
        :props="[
          { name: 'value', type: 'string', default: '-', description: 'Unique tab identifier (required)' },
          { name: 'label', type: 'string', default: '-', description: 'Tab label text (required)' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable this tab' },
          { name: 'closeable', type: 'boolean', default: 'false', description: 'Show close button' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic Underline -->
        <Example title="Underline (default)" :code="`<CuiTabs v-model=&quot;active&quot;>
  <CuiTab value=&quot;tab1&quot; label=&quot;Tab 1&quot;>
    Content for tab 1
  </CuiTab>
  <CuiTab value=&quot;tab2&quot; label=&quot;Tab 2&quot;>
    Content for tab 2
  </CuiTab>
</CuiTabs>`">
          <CuiTabs v-model="basic">
            <CuiTab value="tab1" label="Overview">
              <p>This is the overview panel. It contains introductory content about the feature.</p>
            </CuiTab>
            <CuiTab value="tab2" label="Features">
              <p>Features panel with a list of capabilities and details about each one.</p>
            </CuiTab>
            <CuiTab value="tab3" label="Pricing">
              <p>Pricing information with plan comparisons and billing options.</p>
            </CuiTab>
          </CuiTabs>
        </Example>

        <!-- Segmented -->
        <Example title="Segmented Variant">
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
        <Example title="Colors">
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
        <Example title="Vertical Orientation">
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
        <Example title="Vertical + Segmented">
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

        <!-- Closeable -->
        <Example title="Closeable Tabs">
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
          </CuiStack>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled Tab">
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
        <Example title="Panel Transitions">
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
        <Example title="keepAlive: false (lazy panels)">
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
            <p class="text-sm text-surface-500">Panels are destroyed when inactive (v-if instead of v-show). Good for deferring expensive renders or data fetches.</p>
          </CuiStack>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
