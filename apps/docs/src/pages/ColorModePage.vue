<script setup lang="ts">
import { CuiStack, CuiCard, CuiCardBody, CuiButton, CuiFlex, CuiBadge, useColorMode, type ColorMode } from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import PropTable, { type PropRow } from "../components/PropTable.vue";

// The shared singleton: this demo changes the whole site, as the header control does.
const { mode, isDark, setMode, toggle } = useColorMode();

const modes: { id: ColorMode; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

const code = `<script setup>
import { useColorMode } from "@itguy614/clean-ui";

const { mode, isDark, setMode, toggle } = useColorMode();
<\/script>

<template>
  <CuiButton v-for="m in ['light', 'dark', 'system']" :key="m"
             :variant="mode === m ? 'outline' : 'ghost'"
             :aria-pressed="mode === m" @click="setMode(m)">
    {{ m }}
  </CuiButton>
  <CuiButton @click="toggle">{{ isDark ? "Go light" : "Go dark" }}</CuiButton>
</template>`;

const startupCode = `import { restoreColorMode } from "@itguy614/clean-ui";
restoreColorMode(); // before app.mount()`;

const ssrCode = `// nuxt.config.ts
import { ssrThemeInitScript, ssrDensityInitScript, ssrColorModeInitScript } from "@itguy614/clean-ui";

export default defineNuxtConfig({
  app: {
    head: {
      script: [
        { children: ssrThemeInitScript, type: "text/javascript" },
        { children: ssrDensityInitScript, type: "text/javascript" },
        { children: ssrColorModeInitScript, type: "text/javascript" },
      ],
    },
  },
});`;

const returns: PropRow[] = [
  {
    name: "mode",
    type: "Ref<'light' | 'dark' | 'system'>",
    default: "'system'",
    description: "The chosen mode. Stored under cui-color-mode in localStorage; a missing or unknown stored value means system.",
  },
  {
    name: "isDark",
    type: "ComputedRef<boolean>",
    default: "false",
    description: "The scheme in effect: for light and dark the choice, for system what the OS prefers right now. Always false on the server.",
  },
  {
    name: "setMode",
    type: "(mode: ColorMode) => void",
    description: "Choose a mode. Persists it and sets or removes the dark class on <html>.",
  },
  {
    name: "toggle",
    type: "() => void",
    description: "Switch to the opposite of the resolved scheme (system while the OS is dark becomes light) and store it as an explicit mode.",
  },
];
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Color Mode</h1>
      <p class="cui-lead">
        <code class="cui-code">useColorMode()</code> is a persisted light, dark or system choice. It
        sets the <code class="cui-code">dark</code> class on <code class="cui-code">&lt;html&gt;</code> for you.
      </p>
      <p>
        It is a sibling of <router-link to="/foundations/themes">useTheme</router-link> and
        <router-link to="/foundations/density">useDensity</router-link>: one shared state, stored in
        localStorage, restored on first use. In <code class="cui-code">system</code> mode it follows the
        operating system's <code class="cui-code">prefers-color-scheme</code> live, with no reload. The
        listener exists only while the mode is system.
      </p>
    </div>

    <Example title="Choose a mode" :code="code">
      <CuiStack spacing="4">
        <CuiFlex gap="2" wrap="wrap" role="group" aria-label="Color mode">
          <CuiButton
            v-for="m in modes"
            :key="m.id"
            size="sm"
            :variant="mode === m.id ? 'outline' : 'ghost'"
            :aria-pressed="mode === m.id"
            @click="setMode(m.id)"
          >
            {{ m.label }}
          </CuiButton>
          <CuiButton size="sm" variant="ghost" @click="toggle">{{ isDark ? "Go light" : "Go dark" }} (toggle)</CuiButton>
        </CuiFlex>
        <p style="margin: 0">
          Mode: <CuiBadge>{{ mode }}</CuiBadge> Resolved:
          <CuiBadge :color="isDark ? 'primary' : 'surface'">{{ isDark ? "dark" : "light" }}</CuiBadge>
        </p>
      </CuiStack>
    </Example>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Try:</strong></p>
        <ul>
          <li>Pick <em>Dark</em> and hard-reload the page: it stays dark, with no light flash first (this site's <code class="cui-code">index.html</code> carries the init script).</li>
          <li>Pick <em>System</em>, then change your operating system's appearance: the page follows without a reload.</li>
          <li>Pick <em>System</em> while the OS is dark and press the toggle: the mode becomes <em>Light</em>, since the toggle flips the scheme you see.</li>
          <li>Use the color-mode button in the header: it is built on this same composable.</li>
        </ul>
      </CuiCardBody>
    </CuiCard>

    <div>
      <h2>API</h2>
      <p><code class="cui-code">useColorMode()</code> takes no arguments and returns:</p>
      <PropTable :props="returns" />
      <p>
        <code class="cui-code">useColorScheme()</code> still only observes the
        <code class="cui-code">dark</code> class, and sees the changes made here. See
        <router-link to="/composables/color-scheme">Color Scheme</router-link>.
      </p>
    </div>

    <div>
      <h2>Restoring the stored mode</h2>
      <p>
        <strong>Restored on first use, not at import.</strong> Importing the library reads and writes
        no storage, changes no class on <code class="cui-code">&lt;html&gt;</code> and adds no listener. The
        first <code class="cui-code">useColorMode()</code> call restores the stored mode and applies the
        resolved scheme, so a stored <em>Light</em> or <em>Dark</em> wins over a stale class. With nothing
        stored the mode is <em>System</em>, and the class follows the OS (it is left alone where
        <code class="cui-code">matchMedia</code> is missing). An app that doesn't call the composable
        before first paint and doesn't use the init script below should call
        <code class="cui-code">restoreColorMode()</code> at startup. It is safe to call more than once.
        An app that never uses color mode doesn't bundle any of it.
      </p>
      <pre class="cui-pre"><code class="cui-code">{{ startupCode }}</code></pre>
      <p>
        The state and its watchers live for the life of the page, in an effect scope of their own, so the
        component that first calls the composable can unmount without stopping persistence.
      </p>
    </div>

    <div>
      <h2>Server-rendered pages</h2>
      <p>
        The server can't read localStorage, so a server-rendered page would first paint light.
        <code class="cui-code">ssrColorModeInitScript</code> is a small inline script string that sets the
        class from the stored mode (and from <code class="cui-code">prefers-color-scheme</code> for system)
        before the first paint. Put it in the <code class="cui-code">&lt;head&gt;</code>, before any
        stylesheets, beside the theme and density scripts. Under a strict CSP, give it your own nonce or
        hash. On the server <code class="cui-code">mode</code> is <code class="cui-code">system</code> and
        <code class="cui-code">isDark</code> is false.
      </p>
      <pre class="cui-pre"><code class="cui-code">{{ ssrCode }}</code></pre>
    </div>

    <div>
      <h2>When to use it</h2>
      <ul>
        <li>An app with a dark-mode control: this gives it the state, the persistence and the OS follow-through.</li>
        <li>
          Not for a scoped dark panel or for reading the scheme of one subtree: put
          <code class="cui-code">dark</code> on the container, and read it with
          <router-link to="/composables/color-scheme">useColorScheme</router-link> if you need the value.
        </li>
      </ul>
    </div>
  </CuiStack>
</template>
