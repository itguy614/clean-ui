# SSR / Nuxt Setup Guide

## 1. Prevent Flash of Wrong Theme (FOUC)

Add the inline init script to your `<head>` **before** any stylesheets in `nuxt.config.ts`:

```ts
import { ssrThemeInitScript, ssrDensityInitScript, ssrColorModeInitScript } from '@itguy614/clean-ui'

export default defineNuxtConfig({
  app: {
    head: {
      script: [
        { children: ssrThemeInitScript, type: 'text/javascript' },
        { children: ssrDensityInitScript, type: 'text/javascript' },
        { children: ssrColorModeInitScript, type: 'text/javascript' },
      ],
    },
  },
})
```

This reads `cui-theme`, `cui-density` and `cui-color-mode` from `localStorage` and
applies the matching classes to `<html>` before the first paint — no flash. A
colour mode of `system` (or none stored) follows `prefers-color-scheme`.

Importing the library applies neither setting: the stored theme and density are
restored on the first `useTheme()` / `useDensity()` / `useColorMode()` call. With
the scripts above you need nothing more. Without them, call `restoreTheme()`,
`restoreDensity()` and `restoreColorMode()` at startup if the stored choice must apply before anything calls the composables.

> Under a strict CSP, give each inline script your own nonce or hash.

## 2. Icon rendering under SSR

`CuiIcon` loads icon components inside `onMounted`, which only runs in the
browser. This means:

- On the server, icons render nothing (no hydration mismatch)
- On the client, the icon is fetched and rendered once the page hydrates
- No extra configuration needed

## 3. No SSR-unsafe DOM access

All `window`, `document`, and `localStorage` access across the library is
guarded by one of:

- `typeof window !== 'undefined'` checks at module scope
- `onMounted` / `onUnmounted` lifecycle hooks (never at module scope)
- `try/catch` around `localStorage` calls in case of private browsing or
  SSR environments

## 4. What the composables return

```ts
const { theme, setTheme } = useTheme()
const { mode, isDark, setMode, toggle } = useColorMode()
```

- `theme` — reactive ref to the current preset ID (e.g. `"forest"`, `"mono"`, `"default"`)
- `setTheme(id)` — switch theme preset
- `mode` — `"light"`, `"dark"` or `"system"` (the default)
- `isDark` — the resolved scheme as a reactive boolean; on the server it is `false`
- `setMode(mode)` / `toggle()` — choose a mode, or flip the resolved scheme
