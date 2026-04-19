<script setup lang="ts">
import {
  CuiBreadcrumb,
  CuiBreadcrumbItem,
  CuiIcon,
  CuiStack,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Breadcrumb</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Navigation trail showing the current page's location within the site hierarchy.
        Semantic <code class="cui-code">&lt;nav&gt;</code> + <code class="cui-code">&lt;ol&gt;</code>
        with configurable separator.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiBreadcrumb Props</h2>
      <PropTable
        :props="[
          { name: 'separator', type: 'string', default: '/', description: 'Separator character between items' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiBreadcrumbItem Props</h2>
      <PropTable
        :props="[
          { name: 'href', type: 'string', default: '—', description: 'Link URL (renders as &lt;a&gt;)' },
          { name: 'to', type: 'string | object', default: '—', description: 'Vue Router route (renders as &lt;router-link&gt;)' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic (slash separator)" :code="`<CuiBreadcrumb>
  <CuiBreadcrumbItem href=&quot;/&quot;>Home</CuiBreadcrumbItem>
  <CuiBreadcrumbItem href=&quot;/products&quot;>Products</CuiBreadcrumbItem>
  <CuiBreadcrumbItem>Widget Pro</CuiBreadcrumbItem>
</CuiBreadcrumb>`">
          <CuiBreadcrumb>
            <CuiBreadcrumbItem href="#">Home</CuiBreadcrumbItem>
            <CuiBreadcrumbItem href="#">Products</CuiBreadcrumbItem>
            <CuiBreadcrumbItem>Widget Pro</CuiBreadcrumbItem>
          </CuiBreadcrumb>
        </Example>

        <!-- Chevron separator -->
        <Example title="Chevron Separator" :code="`<CuiBreadcrumb separator=&quot;›&quot;>
  <CuiBreadcrumbItem href=&quot;#&quot;>Home</CuiBreadcrumbItem>
  <CuiBreadcrumbItem href=&quot;#&quot;>Dashboard</CuiBreadcrumbItem>
  <CuiBreadcrumbItem>Profile</CuiBreadcrumbItem>
</CuiBreadcrumb>`">
          <CuiBreadcrumb separator="›">
            <CuiBreadcrumbItem href="#">Home</CuiBreadcrumbItem>
            <CuiBreadcrumbItem href="#">Dashboard</CuiBreadcrumbItem>
            <CuiBreadcrumbItem href="#">Settings</CuiBreadcrumbItem>
            <CuiBreadcrumbItem>Profile</CuiBreadcrumbItem>
          </CuiBreadcrumb>
        </Example>

        <!-- Arrow separator -->
        <Example title="Arrow Separator" :code="`<CuiBreadcrumb separator=&quot;→&quot;>
  <CuiBreadcrumbItem href=&quot;#&quot;>Store</CuiBreadcrumbItem>
  <CuiBreadcrumbItem href=&quot;#&quot;>Electronics</CuiBreadcrumbItem>
  <CuiBreadcrumbItem>MacBook Pro</CuiBreadcrumbItem>
</CuiBreadcrumb>`">
          <CuiBreadcrumb separator="→">
            <CuiBreadcrumbItem href="#">Store</CuiBreadcrumbItem>
            <CuiBreadcrumbItem href="#">Electronics</CuiBreadcrumbItem>
            <CuiBreadcrumbItem href="#">Laptops</CuiBreadcrumbItem>
            <CuiBreadcrumbItem>MacBook Pro</CuiBreadcrumbItem>
          </CuiBreadcrumb>
        </Example>

        <!-- Dot separator -->
        <Example title="Dot Separator" :code="`<CuiBreadcrumb separator=&quot;·&quot;>
  <CuiBreadcrumbItem href=&quot;#&quot;>Blog</CuiBreadcrumbItem>
  <CuiBreadcrumbItem href=&quot;#&quot;>2024</CuiBreadcrumbItem>
  <CuiBreadcrumbItem>Building a Component Library</CuiBreadcrumbItem>
</CuiBreadcrumb>`">
          <CuiBreadcrumb separator="·">
            <CuiBreadcrumbItem href="#">Blog</CuiBreadcrumbItem>
            <CuiBreadcrumbItem href="#">2024</CuiBreadcrumbItem>
            <CuiBreadcrumbItem>Building a Component Library</CuiBreadcrumbItem>
          </CuiBreadcrumb>
        </Example>

        <!-- With router-link (to prop) -->
        <Example title="Router Links (to prop)" :code="`<CuiBreadcrumb>
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
    <CuiIcon name=&quot;house&quot; size=&quot;sm&quot; />
  </CuiBreadcrumbItem>
  <CuiBreadcrumbItem href=&quot;#&quot;>
    <span class=&quot;flex items-center gap-1&quot;><CuiIcon name=&quot;folder&quot; size=&quot;sm&quot; /> Projects</span>
  </CuiBreadcrumbItem>
  <CuiBreadcrumbItem>
    <span class=&quot;flex items-center gap-1&quot;><CuiIcon name=&quot;file&quot; size=&quot;sm&quot; /> CuiButton.vue</span>
  </CuiBreadcrumbItem>
</CuiBreadcrumb>`">
          <CuiBreadcrumb separator="›">
            <CuiBreadcrumbItem href="#">
              <CuiIcon name="house" size="sm" />
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

      </CuiStack>
    </div>
  </CuiStack>
</template>
