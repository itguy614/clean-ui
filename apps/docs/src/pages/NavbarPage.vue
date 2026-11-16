<script setup lang="ts">
import { ref } from "vue";
import {
  CuiButton,
  CuiNavbar,
  CuiNavbarActions,
  CuiNavbarBrand,
  CuiNavbarMenu,
  CuiNavbarNav,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/navbar";

/** The "current page" of the demos, which a real app takes from its router. */
const current = ref("docs");
const drawerOpen = ref(false);

const usageCode = `<CuiNavbar label="Main">
  <CuiNavbarBrand href="/">Clean UI</CuiNavbarBrand>

  <!-- Written once: links, and menus that change shape below the breakpoint -->
  <CuiNavbarNav>
    <router-link to="/docs">Docs</router-link>
    <CuiNavbarMenu label="Components">
      <router-link to="/components/button">Button</router-link>
      <router-link to="/components/modal">Modal</router-link>
    </CuiNavbarMenu>
    <router-link to="/changelog">Changelog</router-link>
  </CuiNavbarNav>

  <!-- Plain content: no special support from the navbar -->
  <CuiNavbarActions>
    <CuiButton variant="ghost" size="sm">Sign in</CuiButton>
  </CuiNavbarActions>
</CuiNavbar>`;

const collapseCode = `<!-- Below xl: brand and actions stay in the bar, the nav moves into a slideover
     behind a labelled menu button, and the menu becomes a collapsible group -->
<CuiNavbar collapse-below="xl" v-model:open="drawerOpen">
  …
</CuiNavbar>

<!-- Or open it from your own button and hide the built-in one.
     toggleAttrs: aria-expanded, aria-controls and the translated name -->
<CuiButton v-bind="navbar?.toggleAttrs" @click="navbar?.toggle()">…</CuiButton>
<CuiNavbar ref="navbar" :toggle="false">…</CuiNavbar>`;

const stickyCode = `<CuiNavbar sticky>
  …
</CuiNavbar>

/* sticky sets --cui-navbar-height on <html>, plus scroll-padding-top to match, so anything
   that reads it clears the bar: a sticky CuiSidebar, a focused link, an anchor jump. */
<CuiSidebar sticky>…</CuiSidebar>`;

const shellCode = `<CuiNavbar sticky>
  <!-- A page that has a sidebar of its own: this button opens THAT drawer -->
  <CuiButton class="lg:!hidden" variant="ghost" size="sm" v-bind="sidebar?.toggleAttrs" @click="sidebar?.toggle()">
    <template #prefix><CuiIcon name="list" /></template>
  </CuiButton>
  <CuiNavbarActions>…</CuiNavbarActions>
</CuiNavbar>`;
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example code-open :code="usageCode">
        <!-- `collapse-below="never"`: this one sits in a card on the page, not at the top of it. -->
        <div class="overflow-hidden rounded-lg border border-[var(--cui-border)]">
          <CuiNavbar label="Demo" collapse-below="never">
            <CuiNavbarBrand>Clean UI</CuiNavbarBrand>
            <CuiNavbarNav>
              <a href="#docs" :aria-current="current === 'docs' ? 'page' : undefined" @click.prevent="current = 'docs'">Docs</a>
              <CuiNavbarMenu label="Components">
                <a href="#button" @click.prevent="current = 'button'">Button</a>
                <a href="#modal" @click.prevent="current = 'modal'">Modal</a>
              </CuiNavbarMenu>
              <a href="#changelog" :aria-current="current === 'changelog' ? 'page' : undefined" @click.prevent="current = 'changelog'">Changelog</a>
            </CuiNavbarNav>
            <CuiNavbarActions>
              <CuiButton variant="ghost" size="sm">Sign in</CuiButton>
            </CuiNavbarActions>
          </CuiNavbar>
        </div>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The navbar is a <code>&lt;header&gt;</code> landmark holding a <code>&lt;nav&gt;</code>
        named by <code>label</code>, because a page with a navbar and a sidebar has two navigations
        and they must be told apart.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          The current page's link carries <code>aria-current="page"</code> (a
          <code>router-link</code> sets it itself when exactly active) and is marked by a subtle
          fill and border, never by colour alone.
        </li>
        <li>
          A <code>CuiNavbarMenu</code> in the bar is a <code>CuiDropdown</code>: its trigger is a
          button with <code>aria-haspopup</code> and <code>aria-expanded</code>, Arrow keys, Home
          and End move between its links, Escape and Tab close it, and focus returns to the
          trigger. Choosing a link closes it.
        </li>
        <li>
          Below <code>collapse-below</code> the nav is not merely invisible: it is not in the page
          at all until the drawer opens, so nothing in it can take focus. The menu button has an
          accessible name, <code>aria-expanded</code> and <code>aria-controls</code> naming the
          drawer; the drawer traps focus, closes on Escape or when a link is followed, and returns
          focus to the button. The nav is rendered once, in the bar or in the drawer, so there are
          no duplicate ids or double tab stops.
        </li>
        <li>
          A sticky navbar sets <code>scroll-padding-top</code> from its measured height, so
          tabbing to a link or following an anchor never leaves the target under the bar (WCAG
          2.4.11 Focus Not Obscured).
        </li>
      </ul>
    </template>

    <template #examples>
      <Example title="Collapsing into a drawer" :code="collapseCode">
        <p class="mb-3 text-surface-700 dark:text-surface-300">
          Below the <code>collapse-below</code> viewport (<code>lg</code> by default) the nav
          moves into a slideover behind a menu button, and the <em>Components</em> menu becomes a
          collapsible group. The navbar below collapses under <code>2xl</code>, so it does on most
          screens; narrow this window to see the other form.
        </p>
        <div class="overflow-hidden rounded-lg border border-[var(--cui-border)]">
          <CuiNavbar v-model:open="drawerOpen" label="Collapsing demo" collapse-below="2xl">
            <CuiNavbarBrand>Collapses</CuiNavbarBrand>
            <CuiNavbarNav>
              <a href="#docs" aria-current="page" @click.prevent>Docs</a>
              <CuiNavbarMenu label="Components">
                <a href="#button" @click.prevent>Button</a>
                <a href="#modal" @click.prevent>Modal</a>
              </CuiNavbarMenu>
              <a href="#changelog" @click.prevent>Changelog</a>
            </CuiNavbarNav>
            <CuiNavbarActions>
              <CuiButton variant="ghost" size="sm">Sign in</CuiButton>
            </CuiNavbarActions>
          </CuiNavbar>
        </div>
      </Example>

      <Example title="Sticky" :code="stickyCode">
        <p class="text-surface-700 dark:text-surface-300">
          Off by default. With <code>sticky</code> the bar sticks to the top, gains a border and a
          shadow once the page has scrolled, and publishes its height as
          <code>--cui-navbar-height</code> on the document. This site's own header is one:
          scroll this page and watch it. There is no hide-on-scroll.
        </p>
      </Example>

      <Example title="A navbar and a sidebar together" :code="shellCode">
        <p class="text-surface-700 dark:text-surface-300">
          A page with a sidebar usually keeps its navigation there, so the navbar has no
          <code>CuiNavbarNav</code> and no menu button of its own. Put a button in the bar and bind
          it to the sidebar's <code>toggleAttrs</code> and <code>toggle()</code>: below the
          sidebar's breakpoint it opens the sidebar's drawer. This site works that way, and its
          theme switcher, colour-mode button and debug toggle are plain
          <code>CuiNavbarActions</code> content.
        </p>
      </Example>
    </template>
  </DocPage>
</template>
