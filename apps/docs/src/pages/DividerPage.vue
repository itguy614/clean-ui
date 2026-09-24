<script setup lang="ts">
import { CuiBadge, CuiButton, CuiDivider, CuiFlex, CuiIcon, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/divider";
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiDivider />
<CuiDivider label=&quot;OR&quot; />`"
      >
        <CuiStack spacing="4">
          <p class="text-sm" style="color: var(--cui-text-secondary);">Content above the divider</p>
          <CuiDivider />
          <p class="text-sm" style="color: var(--cui-text-secondary);">Content below the divider</p>
          <CuiDivider label="OR" />
          <p class="text-sm" style="color: var(--cui-text-secondary);">A labelled divider breaks the line to make room for the text.</p>
        </CuiStack>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        Every rendering carries <code>role="separator"</code>, and the plain horizontal
        divider is a real <code>&lt;hr&gt;</code> — so the boundary is announced rather
        than being a line only sighted readers can see.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        A divider is a visual grouping device, not a document structure. If the content on
        either side is a distinct section, give it a heading or a landmark as well; a
        screen-reader user navigating by heading will otherwise pass straight through the
        boundary.
      </p>
    </template>

    <template #examples>
      <Example title="Label Positions" :code="`<CuiDivider label=&quot;Start&quot; label-position=&quot;start&quot; />
<CuiDivider label=&quot;Center&quot; label-position=&quot;center&quot; />
<CuiDivider label=&quot;End&quot; label-position=&quot;end&quot; />`">
        <CuiStack spacing="4">
          <CuiDivider label="Start" label-position="start" />
          <CuiDivider label="Center" label-position="center" />
          <CuiDivider label="End" label-position="end" />
        </CuiStack>
      </Example>

      <Example title="Line Styles" :code="`<CuiDivider variant=&quot;solid&quot; />
<CuiDivider variant=&quot;dashed&quot; />
<CuiDivider variant=&quot;dotted&quot; />`">
        <CuiStack spacing="4">
          <div>
            <div class="mb-1 text-xs" style="color: var(--cui-text-tertiary);">Solid:</div>
            <CuiDivider variant="solid" />
          </div>
          <div>
            <div class="mb-1 text-xs" style="color: var(--cui-text-tertiary);">Dashed:</div>
            <CuiDivider variant="dashed" />
          </div>
          <div>
            <div class="mb-1 text-xs" style="color: var(--cui-text-tertiary);">Dotted:</div>
            <CuiDivider variant="dotted" />
          </div>
        </CuiStack>
      </Example>

      <Example title="Custom Colors" :code="`<CuiDivider label=&quot;Primary&quot; color=&quot;var(--cui-primary)&quot; />
<CuiDivider label=&quot;Success&quot; color=&quot;var(--cui-success)&quot; />
<CuiDivider label=&quot;Error&quot; color=&quot;var(--cui-error)&quot; variant=&quot;dashed&quot; />`">
        <CuiStack spacing="4">
          <CuiDivider label="Primary" color="var(--cui-primary)" />
          <CuiDivider label="Success" color="var(--cui-success)" />
          <CuiDivider label="Error" color="var(--cui-error)" variant="dashed" />
        </CuiStack>
      </Example>

      <Example title="Custom Content in Slot" :code="`<CuiDivider>
<CuiBadge>NEW</CuiBadge>
</CuiDivider>`">
        <CuiStack spacing="4">
          <CuiDivider>
            <CuiBadge color="primary" size="sm">NEW</CuiBadge>
          </CuiDivider>
          <CuiDivider>
            <CuiIcon name="star" size="1rem" style="color: var(--cui-warning);" />
          </CuiDivider>
          <CuiDivider>
            <span style="font-size: 0.75rem; color: var(--cui-text-tertiary);">Step 3 of 5</span>
          </CuiDivider>
        </CuiStack>
      </Example>

      <Example title="Vertical" :code="`<CuiFlex gap=&quot;0&quot; class=&quot;items-center&quot;>
<span>Home</span>
<CuiDivider orientation=&quot;vertical&quot; spacing=&quot;0.75rem&quot; />
<span>Products</span>
<CuiDivider orientation=&quot;vertical&quot; spacing=&quot;0.75rem&quot; />
<span>About</span>
</CuiFlex>`">
        <CuiFlex gap="0" class="items-center" style="height: 3rem;">
          <span class="text-sm" style="color: var(--cui-text-secondary);">Home</span>
          <CuiDivider orientation="vertical" spacing="0.75rem" />
          <span class="text-sm" style="color: var(--cui-text-secondary);">Products</span>
          <CuiDivider orientation="vertical" spacing="0.75rem" />
          <span class="text-sm" style="color: var(--cui-text-secondary);">About</span>
          <CuiDivider orientation="vertical" spacing="0.75rem" />
          <span class="text-sm" style="color: var(--cui-text-secondary);">Contact</span>
        </CuiFlex>
      </Example>

      <Example title="Real-World: Login Form Separator" :code="`<CuiButton variant=&quot;outline&quot;>
<template #prefix><CuiIcon name=&quot;google-logo&quot; /></template>
Continue with Google
</CuiButton>
<CuiDivider label=&quot;OR&quot; />
<CuiButton variant=&quot;solid&quot;>Sign in with Email</CuiButton>`">
        <div style="max-width: 20rem;">
          <CuiStack spacing="3">
            <CuiButton variant="outline" class="w-full">
              <template #prefix><CuiIcon name="google-logo" /></template>
              Continue with Google
            </CuiButton>
            <CuiDivider label="OR" />
            <CuiButton variant="solid" class="w-full">Sign in with Email</CuiButton>
          </CuiStack>
        </div>
      </Example>
    </template>
  </DocPage>
</template>
