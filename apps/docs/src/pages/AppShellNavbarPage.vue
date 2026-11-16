<script setup lang="ts">
import { ref } from "vue";
import {
  CuiBadge,
  CuiButton,
  CuiCard,
  CuiCardBody,
  CuiContainer,
  CuiGrid,
  CuiNavbar,
  CuiNavbarActions,
  CuiNavbarBrand,
  CuiNavbarLink,
  CuiNavbarMenu,
  CuiNavbarNav,
  CuiPanel,
  CuiStack,
} from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import ShellFrame from "../components/ShellFrame.vue";
import ShellPage from "../components/ShellPage.vue";
import pageCode from "../shell-snippets/navbar-page.vue?raw";
import ownButtonCode from "../shell-snippets/navbar-own-button.vue?raw";

const current = ref("home");
const drawerOpen = ref(false);

const features = [
  { title: "Fast by default", text: "Components that load only what they draw." },
  { title: "Themeable", text: "Every token is a CSS custom property you can override." },
  { title: "Accessible", text: "Keyboard, focus and screen reader support throughout." },
];

const frameCode = `<!-- The demo: the container scrolls, so the bar is not sticky and sits above the scroller -->
<div style="display: flex; flex-direction: column; height: 32rem; overflow: hidden">
  <CuiNavbar>…</CuiNavbar>
  <div style="flex: 1; min-height: 0; overflow: auto">…</div>
</div>`;

</script>

<template>
  <ShellPage
    title="Top navbar and content"
    description="A bar across the top with the site's main links, menus and actions, and the content below it. The shell of marketing sites and simple apps."
  >
    <template #when>
      <p>
        Choose it when there are a few top-level destinations, some of which group several pages, and
        the page should have all its width for content: a marketing site, a product or portfolio
        site, a small app with a handful of screens.
      </p>
      <ul class="list-disc pl-5">
        <li>Use <code>CuiNavbarMenu</code> for a group of related links: a dropdown in the bar, a collapsible group in the drawer.</li>
        <li>Skip it when the site has dozens of pages to move between: a <router-link to="/app-shells/sidebar">sidebar</router-link> shows more of the map at once.</li>
        <li>Past a handful of links, or when the app has its own tools and filters, move to <router-link to="/app-shells/navbar-sidebar">navbar and sidebar</router-link>.</li>
      </ul>
      <p>
        <strong>The brand lives in the navbar.</strong> There is no sidebar to hold it, so the bar's
        first item is the product's name, linking home. (With a sidebar, the brand moves: see
        <router-link to="/app-shells/sidebar">sidebar and content</router-link>.)
      </p>
      <p>
        Built from <router-link to="/components/navbar">CuiNavbar</router-link> (with
        <code>CuiNavbarMenu</code> and <code>CuiNavbarLink</code>),
        <router-link to="/components/container">CuiContainer</router-link>,
        <router-link to="/components/grid">CuiGrid</router-link> and
        <router-link to="/components/panel">CuiPanel</router-link> for the hero.
      </p>
    </template>

    <template #demo>
      <ShellFrame label="Top navbar and content">
        <CuiNavbar v-model:open="drawerOpen" label="Demo main">
          <CuiNavbarBrand>Acme</CuiNavbarBrand>
          <CuiNavbarNav>
            <CuiNavbarLink href="#home" icon="house" :active="current === 'home'" @click.prevent="current = 'home'">
              Home
            </CuiNavbarLink>
            <CuiNavbarMenu label="Products" icon="package">
              <CuiNavbarLink
                href="#editor"
                icon="pencil-simple"
                :active="current === 'editor'"
                @click.prevent="current = 'editor'"
              >
                Editor
              </CuiNavbarLink>
              <CuiNavbarLink href="#charts" icon="chart-bar" :active="current === 'charts'" @click.prevent="current = 'charts'">
                Charts
                <template #suffix><CuiBadge size="sm">Beta</CuiBadge></template>
              </CuiNavbarLink>
            </CuiNavbarMenu>
            <CuiNavbarLink href="#pricing" icon="tag" :active="current === 'pricing'" @click.prevent="current = 'pricing'">
              Pricing
            </CuiNavbarLink>
          </CuiNavbarNav>
          <CuiNavbarActions>
            <CuiButton variant="ghost" size="sm">Sign in</CuiButton>
            <CuiButton size="sm">Get started</CuiButton>
          </CuiNavbarActions>
        </CuiNavbar>

        <div class="cui-shell-frame__main" role="region" tabindex="0" aria-label="Demo content">
          <CuiPanel from="var(--cui-primary-bg)" to="var(--cui-surface-base)" :angle="135">
            <CuiContainer max-width="xl" py="10" px="6">
              <h3 class="cui-shell-title">Build something people keep</h3>
              <p class="cui-shell-text">
                A hero on a quiet gradient of the theme's own tint: text stays at body contrast in
                light and dark. Current page: <strong>{{ current }}</strong>.
              </p>
              <CuiButton size="sm">Get started</CuiButton>
            </CuiContainer>
          </CuiPanel>
          <CuiContainer max-width="xl" py="8" px="6">
            <CuiGrid :cols="{ sm: 1, lg: 3 }" gap="4">
              <CuiCard v-for="f in features" :key="f.title" variant="outline">
                <CuiCardBody>
                  <CuiStack spacing="1">
                    <h4 class="cui-shell-title">{{ f.title }}</h4>
                    <p class="cui-shell-text">{{ f.text }}</p>
                  </CuiStack>
                </CuiCardBody>
              </CuiCard>
            </CuiGrid>
          </CuiContainer>
        </div>
      </ShellFrame>
    </template>

    <template #code>
      <Example title="The page" code-open :code="pageCode">
        <p class="text-surface-700 dark:text-surface-300">
          <code>sticky</code> keeps the bar at the top, adds a border and shadow once the page has
          scrolled, and publishes its height as <code>--cui-navbar-height</code>. The hero is a
          <code>CuiPanel</code> gradient between the theme's own tint and the page surface.
        </p>
      </Example>
      <Example title="Inside a container" :code="frameCode">
        <p class="text-surface-700 dark:text-surface-300">
          What the demo above runs: the same navbar without <code>sticky</code>, above a region that
          scrolls on its own.
        </p>
      </Example>
    </template>

    <template #mobile>
      <p>
        This shell has a navbar nav, so it relies on the navbar's <strong>built-in menu button</strong>.
        Below <code>collapse-below</code> (<code>lg</code> by default) the nav leaves the bar and
        moves into a slideover behind a labelled button. Brand and actions stay in the bar.
      </p>
      <ul class="list-disc pl-5">
        <li>The nav is written once. Links become rows, with their icon and suffix, and a <code>CuiNavbarMenu</code> becomes a collapsible group.</li>
        <li>Following a link closes the drawer and focus returns to the menu button.</li>
        <li>Keep the actions few: they have to fit beside the brand and the button on a phone.</li>
      </ul>
      <Example title="Your own button" :code="ownButtonCode">
        <p class="text-surface-700 dark:text-surface-300">
          To put the button somewhere else, set <code>:toggle="false"</code> and bind the navbar's
          exposed <code>toggleAttrs</code> on a button of your own, as the
          <router-link to="/app-shells/sidebar">sidebar shell</router-link> does for its drawer. A
          site whose navigation is a sidebar has no <code>CuiNavbarNav</code>, so the navbar has no
          built-in button at all.
        </p>
      </Example>
    </template>

    <template #accessibility>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <strong>Landmarks.</strong> The navbar is a <code>&lt;header&gt;</code> and its nav a
          <code>&lt;nav&gt;</code> named by <code>label</code>. Wrap the content in one
          <code>&lt;main&gt;</code>. If the page gains a second navigation (a footer's, a sidebar),
          give each a distinct name.
        </li>
        <li>
          <strong>Skip link.</strong> The bar is first in the tab order: add a "Skip to content" link
          before it that targets <code>&lt;main id="main" tabindex="-1"&gt;</code>. A sticky bar also
          sets <code>scroll-padding-top</code>, so the target is never left under it.
        </li>
        <li>
          <strong><code>aria-current</code>.</strong> Mark the current link with
          <code>aria-current="page"</code> (a <code>router-link</code> does, or set
          <code>active</code>). Icons are decorative; an icon-only link needs an
          <code>aria-label</code>.
        </li>
        <li>
          <strong>Menus.</strong> A <code>CuiNavbarMenu</code> trigger has <code>aria-haspopup</code> and
          <code>aria-expanded</code>; arrows, Home and End move between its links, Escape closes it and
          returns focus to the trigger.
        </li>
        <li>
          <strong>Focus order.</strong> Brand, nav, actions, then content. The drawer is a dialog that
          traps focus and returns it to the menu button on close.
        </li>
      </ul>
    </template>
  </ShellPage>
</template>
