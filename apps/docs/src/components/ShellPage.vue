<script setup lang="ts">
import { CuiAlert, CuiCard, CuiCardBody, CuiStack } from "@itguy614/clean-ui";
import { slug } from "../utils/slug";

/**
 * The shell every app-shell recipe page uses: the same sections in the same order, so the
 * four recipes read as a set and `PageNav` finds the same headings on each.
 *
 *   When to use it -> Demo -> In a page -> On a small screen -> Accessibility -> (extra)
 *
 * The framed-demo note sits under the demo on every page: that is where a reader wonders why
 * the navbar here is not `sticky`.
 */
defineProps<{ title: string; description: string }>();

const id = (s: string) => slug(s);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">{{ title }}</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">{{ description }}</p>
    </div>

    <div>
      <h2 :id="id('When to use it')" class="mb-4 text-2xl font-semibold">When to use it</h2>
      <CuiStack spacing="3"><slot name="when" /></CuiStack>
    </div>

    <div>
      <h2 :id="id('Demo')" class="mb-4 text-2xl font-semibold">Demo</h2>
      <CuiStack spacing="4">
        <slot name="demo" />
        <CuiAlert color="info" title="The demos run in a frame, not a page">
          Each demo is a fixed-height box that scrolls on its own, so a shell can be shown whole.
          Inside it nothing is <code>sticky</code>: a sticky <code>CuiNavbar</code> publishes
          <code>--cui-navbar-height</code> and a <code>scroll-padding-top</code> on
          <code>&lt;html&gt;</code> and follows the <em>page's</em> scroll, so one in a frame would
          fight this site's own header. The code under "In a page" is the page version, with
          <code>sticky</code>; the frame only swaps the page's scroll for its own. Breakpoints
          follow the browser window, not the frame, so narrow the window to see a demo collapse.
        </CuiAlert>
      </CuiStack>
    </div>

    <div>
      <h2 :id="id('In a page')" class="mb-4 text-2xl font-semibold">In a page</h2>
      <CuiStack spacing="4"><slot name="code" /></CuiStack>
    </div>

    <div>
      <h2 :id="id('On a small screen')" class="mb-4 text-2xl font-semibold">On a small screen</h2>
      <CuiStack spacing="3"><slot name="mobile" /></CuiStack>
    </div>

    <div>
      <h2 :id="id('Accessibility')" class="mb-4 text-2xl font-semibold">Accessibility</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <CuiStack spacing="3"><slot name="accessibility" /></CuiStack>
        </CuiCardBody>
      </CuiCard>
    </div>

    <slot name="extra" />
  </CuiStack>
</template>
