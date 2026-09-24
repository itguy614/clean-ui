<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiFlex, CuiStack, CuiToggle, CuiToggleGroup } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/toggle";

const darkMode = ref(false);
const notifications = ref(true);
const features = ref<string[]>(["analytics"]);
const errorVal = ref<string[]>([]);
const errorTwo = ref<string[]>([]);

// Dynamic form
const dynamicField = ref({
  name: "settings",
  label: "Notification Preferences",
  value: ["email"] as string[],
  options: [
    { value: "email", label: "Email Notifications", description: "Receive updates via email" },
    { value: "push", label: "Push Notifications", description: "Browser push notifications" },
    { value: "sms", label: "SMS Notifications", description: "Text messages for critical alerts" },
    { value: "slack", label: "Slack Integration", description: "Post to a Slack channel" },
  ],
});
</script>

<template>
  <DocPage :meta="meta">
    <template #intro>
      <p class="text-surface-700 dark:text-surface-300">
        A toggle is for a setting that takes effect the moment it is flipped. When the
        change only applies once a form is submitted, use a
        <router-link class="underline" to="/components/checkbox">checkbox</router-link>
        instead — a switch that needs a Save button afterwards misrepresents what it does.
      </p>
    </template>

    <template #usage>
      <Example
        code-open
        :code="`<!-- standalone: v-model is a boolean -->
<CuiToggle v-model=&quot;darkMode&quot; label=&quot;Dark Mode&quot; />

<!-- group mode: v-model is an array, each child carries a value -->
<CuiToggleGroup v-model=&quot;features&quot; label=&quot;Features&quot;>
  <CuiToggle value=&quot;analytics&quot; label=&quot;Analytics&quot; />
  <CuiToggle value=&quot;export&quot; label=&quot;Data Export&quot; />
</CuiToggleGroup>`"
      >
        <CuiStack spacing="4">
          <CuiToggle v-model="darkMode" label="Dark Mode" />
          <CuiToggleGroup v-model="features" label="Features" color="success">
            <CuiToggle value="analytics" label="Analytics" />
            <CuiToggle value="export" label="Data Export" />
          </CuiToggleGroup>
          <div class="text-sm text-surface-500">
            Standalone: {{ darkMode }} · Group: {{ features.join(", ") || "none" }}
          </div>
        </CuiStack>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The root is a <code>&lt;label&gt;</code> carrying <code>role="switch"</code> and
        <code>tabindex="0"</code>. The <code>&lt;input type="checkbox"&gt;</code> inside it
        is <code>aria-hidden</code> and exists only so the value serializes with a native
        form post — the visible label text is what forms the accessible name.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <code>aria-checked</code> tracks the state, so a screen reader announces “on” or
          “off” rather than “checked”. Space and Enter both flip it.
        </li>
        <li>
          The focus ring is on the root, which is why
          <code>--cui-&#123;color&#125;-focus-ring</code> is set there rather than on the
          track.
        </li>
        <li>
          <code>disabled</code> and <code>readonly</code> both set
          <code>aria-disabled</code> and block the flip; only <code>disabled</code> drops
          the switch out of the tab order.
        </li>
        <li>
          The hidden input carries <code>@click.stop.prevent</code>. A
          <code>&lt;label&gt;</code> forwards its click to the input it wraps, so without
          the guard every click would flip twice.
        </li>
        <li>
          On/off is never signalled by the track colour alone — the knob moves, and
          <code>showLabels</code> can print the state inside the track as well.
        </li>
        <li>
          <code>CuiToggleGroup</code> is a <code>div[role="group"]</code> with
          <code>aria-invalid</code> when <code>error</code> is set. Its <code>label</code>
          prop becomes <code>aria-label</code> and renders nothing; when the label is on
          screen, point <code>aria-labelledby</code> at it instead —
          <code>CuiFormField</code> does that for you.
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> <code>id</code>, <code>aria-describedby</code> and
        <code>aria-labelledby</code> land on the hidden <code>aria-hidden</code> input, so
        they do not reach the element carrying <code>role="switch"</code>. Use the
        <code>description</code> prop for per-switch help text, and put anything a screen
        reader must associate on the surrounding <code>CuiFormField</code>.
      </p>
    </template>

    <template #examples>
      <!-- Sizes -->
      <Example title="Sizes" :code="`<CuiToggle v-model=&quot;val&quot; size=&quot;sm&quot; label=&quot;Small&quot; />
<CuiToggle v-model=&quot;val&quot; size=&quot;md&quot; label=&quot;Medium (default)&quot; />
<CuiToggle v-model=&quot;val&quot; size=&quot;lg&quot; label=&quot;Large (mobile-friendly)&quot; />`">
        <CuiFlex gap="6" class="items-center flex-wrap">
          <CuiToggle v-model="darkMode" size="sm" label="Small" />
          <CuiToggle v-model="darkMode" size="md" label="Medium (default)" />
          <CuiToggle v-model="darkMode" size="lg" label="Large (mobile-friendly)" />
        </CuiFlex>
      </Example>

      <!-- On/Off Labels -->
      <Example title="Track Labels" :code="`<CuiToggle v-model=&quot;val&quot; show-labels label=&quot;With labels&quot; />
<CuiToggle v-model=&quot;val&quot; label=&quot;Without labels&quot; />`">
        <CuiStack spacing="4">
          <div class="text-sm font-medium text-surface-600 dark:text-surface-400">Printed on md and lg only (sm has no room):</div>
          <CuiFlex gap="6" class="items-center flex-wrap">
            <CuiToggle v-model="darkMode" show-labels label="Small (hidden)" size="sm" />
            <CuiToggle v-model="darkMode" show-labels label="Medium" size="md" />
            <CuiToggle v-model="darkMode" show-labels label="Large" size="lg" />
          </CuiFlex>
          <div class="text-sm font-medium text-surface-600 dark:text-surface-400">Comparison — with vs without:</div>
          <CuiFlex gap="6" class="items-center flex-wrap">
            <CuiToggle v-model="notifications" show-labels label="Labels on" color="success" size="lg" />
            <CuiToggle v-model="notifications" label="Labels off" color="success" size="lg" />
          </CuiFlex>
        </CuiStack>
      </Example>

      <!-- Colors -->
      <Example title="Color Roles" :code="`<CuiToggle v-model=&quot;notifications&quot; color=&quot;primary&quot; label=&quot;Primary&quot; />
<CuiToggle v-model=&quot;notifications&quot; color=&quot;success&quot; label=&quot;Success&quot; />
<CuiToggle v-model=&quot;notifications&quot; color=&quot;error&quot; label=&quot;Error&quot; />`">
        <CuiStack spacing="3">
          <CuiToggle v-model="notifications" color="primary" label="Primary" />
          <CuiToggle v-model="notifications" color="secondary" label="Secondary" />
          <CuiToggle v-model="notifications" color="success" label="Success" />
          <CuiToggle v-model="notifications" color="error" label="Error" />
          <CuiToggle v-model="notifications" color="warning" label="Warning" />
          <CuiToggle v-model="notifications" color="info" label="Info" />
        </CuiStack>
      </Example>

      <!-- With Descriptions -->
      <Example title="With Descriptions" :code="`<CuiToggle v-model=&quot;darkMode&quot; label=&quot;Dark Mode&quot;
  description=&quot;Switch between light and dark themes&quot; />`">
        <CuiStack spacing="4">
          <CuiToggle
            v-model="darkMode"
            label="Dark Mode"
            description="Switch between light and dark themes across the interface"
            color="primary"
          />
          <CuiToggle
            v-model="notifications"
            label="Email Digest"
            description="Receive a daily summary of activity instead of individual notifications"
            color="info"
          />
        </CuiStack>
      </Example>

      <!-- Group with descriptions -->
      <Example title="Group with Descriptions" :code="`<CuiToggleGroup v-model=&quot;features&quot; color=&quot;success&quot;>
  <CuiToggle value=&quot;analytics&quot; label=&quot;Analytics&quot; description=&quot;Track user behavior and events&quot; />
  <CuiToggle value=&quot;export&quot; label=&quot;Data Export&quot; description=&quot;Export reports as CSV or PDF&quot; />
</CuiToggleGroup>`">
        <CuiStack spacing="2">
          <CuiToggleGroup v-model="features" label="Features" color="success">
            <CuiToggle value="analytics" label="Analytics" description="Track user behavior and events" />
            <CuiToggle value="export" label="Data Export" description="Export reports as CSV or PDF" />
            <CuiToggle value="api" label="API Access" description="Enable REST API for integrations" />
          </CuiToggleGroup>
          <div class="text-sm text-surface-500">Enabled: {{ features.join(', ') || 'none' }}</div>
        </CuiStack>
      </Example>

      <!-- Dynamic Form -->
      <Example title="Dynamic Form (JSON-driven)" :code="`<CuiToggleGroup v-model=&quot;field.value&quot; :label=&quot;field.label&quot;>
  <CuiToggle v-for=&quot;opt in field.options&quot;
    :key=&quot;opt.value&quot;
    :value=&quot;opt.value&quot;
    :label=&quot;opt.label&quot;
    :description=&quot;opt.description&quot;
  />
</CuiToggleGroup>`">
        <CuiStack spacing="2">
          <div class="text-sm font-medium">{{ dynamicField.label }}</div>
          <CuiToggleGroup v-model="dynamicField.value" :label="dynamicField.label">
            <CuiToggle
              v-for="opt in dynamicField.options"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
              :description="opt.description"
            />
          </CuiToggleGroup>
          <div class="text-sm text-surface-500">Enabled: {{ dynamicField.value.join(', ') || 'none' }}</div>
        </CuiStack>
      </Example>

      <!-- Disabled -->
      <Example title="Disabled State" :code="`<CuiToggle :model-value=&quot;true&quot; disabled label=&quot;On (disabled)&quot; />
<CuiToggle :model-value=&quot;false&quot; disabled label=&quot;Off (disabled)&quot; />`">
        <CuiFlex gap="6" class="flex-wrap">
          <CuiToggle :model-value="true" disabled label="On (disabled)" />
          <CuiToggle :model-value="false" disabled label="Off (disabled)" />
        </CuiFlex>
      </Example>

      <!-- Readonly -->
      <Example title="Readonly State" :code="`<CuiToggle :model-value=&quot;true&quot; readonly label=&quot;On (readonly)&quot; />
<CuiToggle :model-value=&quot;false&quot; readonly label=&quot;Off (readonly)&quot; />`">
        <CuiFlex gap="6" class="flex-wrap">
          <CuiToggle :model-value="true" readonly label="On (readonly)" />
          <CuiToggle :model-value="false" readonly label="Off (readonly)" />
        </CuiFlex>
      </Example>

      <!-- Error (vertical) -->
      <Example title="Error Validation (vertical)">
        <CuiStack spacing="3">
          <CuiToggleGroup
            v-model="errorVal"
            error
            error-message="At least one notification channel must be enabled"
            label="Required settings"
          >
            <CuiToggle value="email" label="Email" />
            <CuiToggle value="push" label="Push" />
            <CuiToggle value="sms" label="SMS" />
          </CuiToggleGroup>
          <CuiButton size="sm" variant="solid" @click="errorVal = ['email']">Fix: Enable Email</CuiButton>
        </CuiStack>
      </Example>

      <!-- Error (horizontal) -->
      <Example title="Error Validation (horizontal)">
        <CuiStack spacing="3">
          <CuiToggleGroup
            v-model="errorTwo"
            error
            error-message="You must enable at least one option"
            label="Required"
          >
            <CuiToggle value="a" label="Option A" />
            <CuiToggle value="b" label="Option B" />
          </CuiToggleGroup>
          <CuiButton size="sm" variant="solid" @click="errorTwo = ['a']">Fix: Enable A</CuiButton>
        </CuiStack>
      </Example>
    </template>
  </DocPage>
</template>
