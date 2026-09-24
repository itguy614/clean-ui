<script setup lang="ts">
import { CuiBreadcrumb, CuiBreadcrumbItem, CuiIcon, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/breadcrumb";
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiBreadcrumb>
  <CuiBreadcrumbItem href=&quot;/&quot;>Home</CuiBreadcrumbItem>
  <CuiBreadcrumbItem href=&quot;/products&quot;>Products</CuiBreadcrumbItem>
  <CuiBreadcrumbItem>Widget Pro</CuiBreadcrumbItem>
</CuiBreadcrumb>`"
      >
        <CuiBreadcrumb>
          <CuiBreadcrumbItem href="#">Home</CuiBreadcrumbItem>
          <CuiBreadcrumbItem href="#">Products</CuiBreadcrumbItem>
          <CuiBreadcrumbItem>Widget Pro</CuiBreadcrumbItem>
        </CuiBreadcrumb>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The trail renders as a <code>&lt;nav&gt;</code> labelled "Breadcrumb" wrapping an
        <code>&lt;ol&gt;</code> of <code>&lt;li&gt;</code> items, so screen-reader users can
        jump to it from the landmarks list and hear how many levels deep the page sits.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          The last item carries <code>aria-current="page"</code> and is rendered as a
          <code>&lt;span&gt;</code>, not a link — a link to the page you are already on is
          noise in a link list.
        </li>
        <li>
          The separator is a <code>&lt;span aria-hidden="true"&gt;</code>, so
          <code>Home / Products</code> is not read as "Home slash Products". Choosing a
          different <code>separator</code> changes nothing for assistive technology.
        </li>
        <li>
          The <code>&lt;nav&gt;</code> label comes from the message catalogue
          (<code>breadcrumb.label</code>), so it translates with the rest of the library.
        </li>
        <li>
          An item whose content is only an icon has no accessible name — the icon is
          <code>aria-hidden</code>. Put text beside the icon, as the example below does,
          rather than leaving a link that announces as nothing.
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known limitation:</strong> which item is "last" is measured once, in
        <code>onMounted</code>, by counting siblings in the DOM. A trail whose items are
        added, removed or <code>hidden</code> after mount keeps the original item marked as
        the current page.
      </p>
    </template>

    <template #examples>
      <!-- Separators -->
      <Example title="Separators" :code="`<CuiBreadcrumb separator=&quot;›&quot;>…</CuiBreadcrumb>
<CuiBreadcrumb separator=&quot;→&quot;>…</CuiBreadcrumb>
<CuiBreadcrumb separator=&quot;·&quot;>…</CuiBreadcrumb>`">
        <CuiStack spacing="3">
          <CuiBreadcrumb separator="›">
            <CuiBreadcrumbItem href="#">Home</CuiBreadcrumbItem>
            <CuiBreadcrumbItem href="#">Dashboard</CuiBreadcrumbItem>
            <CuiBreadcrumbItem href="#">Settings</CuiBreadcrumbItem>
            <CuiBreadcrumbItem>Profile</CuiBreadcrumbItem>
          </CuiBreadcrumb>
          <CuiBreadcrumb separator="→">
            <CuiBreadcrumbItem href="#">Store</CuiBreadcrumbItem>
            <CuiBreadcrumbItem href="#">Electronics</CuiBreadcrumbItem>
            <CuiBreadcrumbItem href="#">Laptops</CuiBreadcrumbItem>
            <CuiBreadcrumbItem>MacBook Pro</CuiBreadcrumbItem>
          </CuiBreadcrumb>
          <CuiBreadcrumb separator="·">
            <CuiBreadcrumbItem href="#">Blog</CuiBreadcrumbItem>
            <CuiBreadcrumbItem href="#">2024</CuiBreadcrumbItem>
            <CuiBreadcrumbItem>Building a Component Library</CuiBreadcrumbItem>
          </CuiBreadcrumb>
        </CuiStack>
      </Example>

      <!-- With router-link (to prop) -->
      <Example title="Router Links (to prop)" :code="`<CuiBreadcrumb separator=&quot;›&quot;>
<CuiBreadcrumbItem to=&quot;/&quot;>Home</CuiBreadcrumbItem>
<CuiBreadcrumbItem to=&quot;/foundations/colors&quot;>Colors</CuiBreadcrumbItem>
<CuiBreadcrumbItem>Primary</CuiBreadcrumbItem>
</CuiBreadcrumb>`">
        <CuiBreadcrumb separator="›">
          <CuiBreadcrumbItem to="/">Home</CuiBreadcrumbItem>
          <CuiBreadcrumbItem to="/foundations/colors">Colors</CuiBreadcrumbItem>
          <CuiBreadcrumbItem>Primary</CuiBreadcrumbItem>
        </CuiBreadcrumb>
      </Example>

      <!-- With icons in slot -->
      <Example title="With Icons" :code="`<CuiBreadcrumb separator=&quot;›&quot;>
<CuiBreadcrumbItem href=&quot;#&quot;>
  <span class=&quot;flex items-center gap-1&quot;><CuiIcon name=&quot;house&quot; size=&quot;sm&quot; /> Home</span>
</CuiBreadcrumbItem>
<CuiBreadcrumbItem href=&quot;#&quot;>
  <span class=&quot;flex items-center gap-1&quot;><CuiIcon name=&quot;folder&quot; size=&quot;sm&quot; /> Projects</span>
</CuiBreadcrumbItem>
<CuiBreadcrumbItem>
  <span class=&quot;flex items-center gap-1&quot;><CuiIcon name=&quot;file&quot; size=&quot;sm&quot; /> CuiButton.vue</span>
</CuiBreadcrumbItem>
</CuiBreadcrumb>`">
        <CuiStack spacing="3">
          <CuiBreadcrumb separator="›">
            <CuiBreadcrumbItem href="#">
              <span class="flex items-center gap-1"><CuiIcon name="house" size="sm" /> Home</span>
            </CuiBreadcrumbItem>
            <CuiBreadcrumbItem href="#">
              <span class="flex items-center gap-1"><CuiIcon name="folder" size="sm" /> Projects</span>
            </CuiBreadcrumbItem>
            <CuiBreadcrumbItem href="#">
              <span class="flex items-center gap-1"><CuiIcon name="code" size="sm" /> clean-ui</span>
            </CuiBreadcrumbItem>
            <CuiBreadcrumbItem>
              <span class="flex items-center gap-1"><CuiIcon name="file" size="sm" /> CuiButton.vue</span>
            </CuiBreadcrumbItem>
          </CuiBreadcrumb>
          <p class="text-sm text-surface-500">
            The icons are decorative and are not announced — each item keeps its text so the
            link has an accessible name.
          </p>
        </CuiStack>
      </Example>

      <!-- Long breadcrumbs -->
      <Example title="Long Path" :code="`<CuiBreadcrumb>
<CuiBreadcrumbItem href=&quot;#&quot;>Home</CuiBreadcrumbItem>
<CuiBreadcrumbItem href=&quot;#&quot;>Organization</CuiBreadcrumbItem>
<CuiBreadcrumbItem href=&quot;#&quot;>Projects</CuiBreadcrumbItem>
<CuiBreadcrumbItem>Breadcrumb</CuiBreadcrumbItem>
</CuiBreadcrumb>`">
        <CuiBreadcrumb>
          <CuiBreadcrumbItem href="#">Home</CuiBreadcrumbItem>
          <CuiBreadcrumbItem href="#">Organization</CuiBreadcrumbItem>
          <CuiBreadcrumbItem href="#">Team</CuiBreadcrumbItem>
          <CuiBreadcrumbItem href="#">Projects</CuiBreadcrumbItem>
          <CuiBreadcrumbItem href="#">Clean UI</CuiBreadcrumbItem>
          <CuiBreadcrumbItem href="#">Components</CuiBreadcrumbItem>
          <CuiBreadcrumbItem>Breadcrumb</CuiBreadcrumbItem>
        </CuiBreadcrumb>
      </Example>

      <!-- Single item -->
      <Example title="Single Item (root)" :code="`<CuiBreadcrumb>
<CuiBreadcrumbItem>Home</CuiBreadcrumbItem>
</CuiBreadcrumb>`">
        <CuiBreadcrumb>
          <CuiBreadcrumbItem>Home</CuiBreadcrumbItem>
        </CuiBreadcrumb>
      </Example>
    </template>
  </DocPage>
</template>
