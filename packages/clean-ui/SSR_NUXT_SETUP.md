# SSR / Nuxt Setup Guide

## 1. Prevent Flash of Wrong Theme (FOUC)

Add the inline init script to your `<head>` **before** any stylesheets in `nuxt.config.ts`:

```ts
import { ssrThemeInitScript } from '@itguy614/clean-ui'

export default defineNuxtConfig({
  app: {
    head: {
      script: [
        {
          children: ssrThemeInitScript,
          type: 'text/javascript',
        },
      ],
    },
  },
})
```

This reads `cui-theme` and `cui-dark` from `localStorage` and applies the
correct classes to `<html>` before the first paint — no flash.

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

## 4. What `useTheme` returns

```ts
const { theme, isDark, setTheme, toggleDark, setDark } = useTheme()
```

- `theme` — reactive ref to the current preset ID (e.g. `"forest"`, `"mono"`, `"default"`)
- `isDark` — reactive boolean for dark mode
- `setTheme(id)` — switch theme preset
- `toggleDark()` / `setDark(bool)` — toggle or explicitly set dark mode
