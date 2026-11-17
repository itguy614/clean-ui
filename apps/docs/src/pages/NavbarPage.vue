<script setup lang="ts">
import { ref } from "vue";
import {
  CuiBadge,
  CuiButton,
  CuiIcon,
  CuiNavbar,
  CuiNavbarActions,
  CuiNavbarBrand,
  CuiNavbarLink,
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

const iconsCode = `<CuiNavbarNav>
  <!-- icon: a registered name or an icon component -->
  <CuiNavbarLink to="/" icon="house" active>Home</CuiNavbarLink>
  <CuiNavbarLink to="/projects" icon="folder">Projects</CuiNavbarLink>
  <CuiNavbarLink to="/settings" icon="gear">Settings</CuiNavbarLink>
</CuiNavbarNav>`;

const suffixCode = `<CuiNavbarNav>
  <!-- #suffix: a badge, a count, a chevron or an external-link marker -->
  <CuiNavbarLink to="/inbox" icon="bell">
    Notifications
    <template #suffix><CuiBadge size="sm" color="primary">3</CuiBadge></template>
  </CuiNavbarLink>
  <CuiNavbarLink href="https://example.com/status" icon="heartbeat">
    Status
    <template #suffix><CuiIcon name="arrow-square-out" size="sm" /></template>
  </CuiNavbarLink>
  <CuiNavbarLink to="/more">
    More
    <template #suffix><CuiIcon name="caret-right" size="sm" /></template>
  </CuiNavbarLink>
</CuiNavbarNav>`;

const iconOnlyCode = `<!-- No text to read: the name comes from aria-label -->
<CuiNavbarLink to="/search" icon="magnifying-glass" aria-label="Search" />
<CuiNavbarLink to="/inbox" icon="bell" aria-label="Notifications, 3 unread">
  <template #suffix><CuiBadge size="sm" color="primary">3</CuiBadge></template>
</CuiNavbarLink>`;

const menuLinksCode = `<CuiNavbarMenu label="Products" icon="package">
  <template #suffix><CuiBadge size="sm" color="success">New</CuiBadge></template>

  <CuiNavbarLink to="/products/editor" icon="pencil-simple">Editor</CuiNavbarLink>
  <CuiNavbarLink to="/products/charts" icon="chart-bar">
    Charts
    <template #suffix><CuiBadge size="sm">Beta</CuiBadge></template>
  </CuiNavbarLink>
  <CuiNavbarLink href="https://example.com/docs" icon="book-open">
    Docs
    <template #suffix><CuiIcon name="arrow-square-out" size="sm" /></template>
  </CuiNavbarLink>
</CuiNavbarMenu>`;

const drawerLinksCode = `<!-- The same nav, written once. Below collapse-below it is a drawer: each
     link a row with its icon and its suffix at the end, the menu a collapsible
     group with its own icon and suffix on the heading. -->
<CuiNavbar collapse-below="2xl">
  <CuiNavbarNav>
    <CuiNavbarLink to="/" icon="house" active>Home</CuiNavbarLink>
    <CuiNavbarLink to="/inbox" icon="bell">
      Notifications
      <template #suffix><CuiBadge size="sm" color="primary">3</CuiBadge></template>
    </CuiNavbarLink>
    <CuiNavbarMenu label="Products" icon="package">…</CuiNavbarMenu>
  </CuiNavbarNav>
</CuiNavbar>`;

const stickyCode = `<CuiNavbar sticky>
  …
</CuiNavbar>

/* sticky sets --cui-navbar-height on <html>, plus scroll-padding-top to match, so anything
   that reads it clears the bar: a sticky CuiSidebar, a focused link, an anchor jump. */
<CuiSidebar sticky>…</CuiSidebar>`;

const translucentCode = `<CuiNavbar sticky translucent>
  …
</CuiNavbar>

/* A softer or stronger frost */
.my-header { --cui-navbar-blur: 16px; }`;

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
          fill and border, never by color alone.
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

      <Example title="Links with icons" :code="iconsCode">
        <p class="mb-3 text-surface-700 dark:text-surface-300">
          <code>CuiNavbarLink</code> is a link with an <code>icon</code> (a registered name or an
          icon component), a label and a <code>#suffix</code>. It is a <code>router-link</code>
          with <code>to</code> and an <code>&lt;a&gt;</code> with <code>href</code>; the router
          marks the current page, or set <code>active</code> yourself. The icon is decorative.
        </p>
        <div class="overflow-hidden rounded-lg border border-[var(--cui-border)]">
          <CuiNavbar label="Icons demo" collapse-below="never">
            <CuiNavbarNav>
              <CuiNavbarLink href="#home" icon="house" active @click.prevent>Home</CuiNavbarLink>
              <CuiNavbarLink href="#projects" icon="folder" @click.prevent>Projects</CuiNavbarLink>
              <CuiNavbarLink href="#settings" icon="gear" @click.prevent>Settings</CuiNavbarLink>
            </CuiNavbarNav>
          </CuiNavbar>
        </div>
      </Example>

      <Example title="Suffixes: a badge, an external marker, a chevron" :code="suffixCode">
        <div class="overflow-hidden rounded-lg border border-[var(--cui-border)]">
          <CuiNavbar label="Suffix demo" collapse-below="never">
            <CuiNavbarNav>
              <CuiNavbarLink href="#inbox" icon="bell" @click.prevent>
                Notifications
                <template #suffix><CuiBadge size="sm" color="primary">3</CuiBadge></template>
              </CuiNavbarLink>
              <CuiNavbarLink href="https://example.com/status" icon="heartbeat" target="_blank" rel="noopener">
                Status
                <template #suffix><CuiIcon name="arrow-square-out" size="sm" /></template>
              </CuiNavbarLink>
              <CuiNavbarLink href="#more" @click.prevent>
                More
                <template #suffix><CuiIcon name="caret-right" size="sm" /></template>
              </CuiNavbarLink>
            </CuiNavbarNav>
          </CuiNavbar>
        </div>
      </Example>

      <Example title="An icon-only link needs a name" :code="iconOnlyCode">
        <p class="mb-3 text-surface-700 dark:text-surface-300">
          With no label there is no text for a screen reader to announce, and an icon is hidden
          from assistive technology, so the link would be read as just "link". Give it
          <code>aria-label</code> (or <code>aria-labelledby</code>): a link with neither warns in
          development. A name that includes the suffix's meaning ("3 unread") is announced
          where a badge alone might not be.
        </p>
        <div class="overflow-hidden rounded-lg border border-[var(--cui-border)]">
          <CuiNavbar label="Icon-only demo" collapse-below="never">
            <CuiNavbarNav>
              <CuiNavbarLink href="#search" icon="magnifying-glass" aria-label="Search" @click.prevent />
              <CuiNavbarLink href="#inbox" icon="bell" aria-label="Notifications, 3 unread" @click.prevent>
                <template #suffix><CuiBadge size="sm" color="primary">3</CuiBadge></template>
              </CuiNavbarLink>
            </CuiNavbarNav>
          </CuiNavbar>
        </div>
      </Example>

      <Example title="A menu with an icon, a suffix and rich items" :code="menuLinksCode">
        <p class="mb-3 text-surface-700 dark:text-surface-300">
          A <code>CuiNavbarMenu</code> takes an <code>icon</code> and a <code>#suffix</code> for
          its trigger (the suffix sits before the caret) and, in the drawer, for its group
          heading. Its <code>CuiNavbarLink</code>s become menu items in the dropdown.
        </p>
        <div class="overflow-hidden rounded-lg border border-[var(--cui-border)]">
          <CuiNavbar label="Menu demo" collapse-below="never">
            <CuiNavbarNav>
              <CuiNavbarMenu label="Products" icon="package">
                <template #suffix><CuiBadge size="sm" color="success">New</CuiBadge></template>
                <CuiNavbarLink href="#editor" icon="pencil-simple" @click.prevent>Editor</CuiNavbarLink>
                <CuiNavbarLink href="#charts" icon="chart-bar" @click.prevent>
                  Charts
                  <template #suffix><CuiBadge size="sm">Beta</CuiBadge></template>
                </CuiNavbarLink>
                <CuiNavbarLink href="https://example.com/docs" icon="book-open" target="_blank" rel="noopener">
                  Docs
                  <template #suffix><CuiIcon name="arrow-square-out" size="sm" /></template>
                </CuiNavbarLink>
              </CuiNavbarMenu>
            </CuiNavbarNav>
          </CuiNavbar>
        </div>
      </Example>

      <Example title="The same nav in the drawer" :code="drawerLinksCode">
        <p class="mb-3 text-surface-700 dark:text-surface-300">
          Below <code>collapse-below</code> the nav is a drawer: each link a row with its icon
          leading and its suffix at the end, the menu a collapsible group. This navbar collapses
          under <code>2xl</code>, so on most screens press its menu button (narrow the window
          if you see the bar).
        </p>
        <div class="overflow-hidden rounded-lg border border-[var(--cui-border)]">
          <CuiNavbar label="Drawer rows demo" collapse-below="2xl">
            <CuiNavbarBrand>Rows</CuiNavbarBrand>
            <CuiNavbarNav>
              <CuiNavbarLink href="#home" icon="house" active @click.prevent>Home</CuiNavbarLink>
              <CuiNavbarLink href="#inbox" icon="bell" @click.prevent>
                Notifications
                <template #suffix><CuiBadge size="sm" color="primary">3</CuiBadge></template>
              </CuiNavbarLink>
              <CuiNavbarMenu label="Products" icon="package">
                <template #suffix><CuiBadge size="sm" color="success">New</CuiBadge></template>
                <CuiNavbarLink href="#editor" icon="pencil-simple" @click.prevent>Editor</CuiNavbarLink>
                <CuiNavbarLink href="https://example.com/docs" icon="book-open" target="_blank" rel="noopener">
                  Docs
                  <template #suffix><CuiIcon name="arrow-square-out" size="sm" /></template>
                </CuiNavbarLink>
              </CuiNavbarMenu>
            </CuiNavbarNav>
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

      <Example title="Translucent" :code="translucentCode">
        <p class="mb-3 text-surface-700 dark:text-surface-300">
          Opt in with <code>translucent</code> (together with <code>sticky</code>) for a frosted
          bar: the background is <code>--cui-navbar-bg</code> at about 80% over a blur, so the
          page shows through as it scrolls. This site's own header is one: scroll this page and
          watch the content pass under it. There is no line under it, only a soft shadow once the page
          has scrolled (set <code>--cui-navbar-border</code> to bring a line back). The bar goes solid where
          <code>backdrop-filter</code> is unsupported, under
          <code>prefers-reduced-transparency</code> and in forced-colors mode. The blur is
          <code>--cui-navbar-blur</code> (8px).
        </p>
        <p class="text-surface-700 dark:text-surface-300">
          Mind the contrast: the library's contrast audit checks the bar against its own
          background, not against whatever scrolls beneath a translucent one. Check your own
          content, or keep the default solid bar.
        </p>
      </Example>

      <Example title="A navbar and a sidebar together" :code="shellCode">
        <p class="text-surface-700 dark:text-surface-300">
          A page with a sidebar usually keeps its navigation there, so the navbar has no
          <code>CuiNavbarNav</code> and no menu button of its own. Put a button in the bar and bind
          it to the sidebar's <code>toggleAttrs</code> and <code>toggle()</code>: below the
          sidebar's breakpoint it opens the sidebar's drawer. This site works that way, and its
          theme switcher, color-mode button and debug toggle are plain
          <code>CuiNavbarActions</code> content.
        </p>
      </Example>
    </template>
  </DocPage>
</template>
