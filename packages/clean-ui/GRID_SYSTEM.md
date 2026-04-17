# Clean UI Grid System

A comprehensive, flexible layout system for Vue 3 applications using Tailwind CSS v4.

## Overview

The Clean UI grid system provides a hybrid approach with both **CSS Grid** and **Flexbox** layout components, along with convenience wrappers for common patterns. All components are TypeScript-first with strict prop typing and support responsive design using Tailwind's breakpoint system.

## Design Principles

1. **Tailwind-First**: Leverages Tailwind's spacing scale and breakpoints
2. **Minimal API**: Core functionality via props, advanced styling via Tailwind classes
3. **Smart Defaults**: Mobile-first, fail-safe defaults
4. **TypeScript Strict**: Fully typed props with autocomplete
5. **Developer Experience**: Debug mode, nested grid context, responsive objects

## Components

### Core Components

- **`<CuiGrid>`** - CSS Grid layouts (two-dimensional)
- **`<CuiFlex>`** - Flexbox layouts (one-dimensional)
- **`<CuiGridItem>`** - Optional helper for grid item spanning
- **`<CuiFlexItem>`** - Optional helper for flex item properties

### Convenience Components

- **`<CuiStack>`** - Simple vertical/horizontal spacing (wraps Flex)
- **`<CuiContainer>`** - Max-width content containers
- **`<CuiSpacer>`** - Flexible or fixed spacing

---

## CuiGrid

CSS Grid component for two-dimensional layouts.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cols` | `ResponsiveValue<GridColumns>` | `1` | Number of columns (1-12) or responsive object |
| `rows` | `ResponsiveValue<GridRows>` | - | Number of rows (1-6), optional |
| `gap` | `ResponsiveValue<TailwindSpacing>` | - | Gap between all items |
| `rowGap` | `ResponsiveValue<TailwindSpacing>` | - | Row gap (overrides `gap`) |
| `colGap` | `ResponsiveValue<TailwindSpacing>` | - | Column gap (overrides `gap`) |
| `debug` | `boolean` | `false` | Enable debug visualization |

### Examples

```vue
<!-- Simple 3-column grid -->
<CuiGrid :cols="3" gap="4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</CuiGrid>

<!-- Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop -->
<CuiGrid :cols="{ sm: 1, md: 2, lg: 3 }" gap="4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</CuiGrid>

<!-- With Tailwind classes for advanced styling -->
<CuiGrid :cols="3" gap="4" class="items-center justify-items-start">
  <Card>Item 1</Card>
</CuiGrid>

<!-- Debug mode -->
<CuiGrid :cols="3" gap="4" :debug="true">
  <Card>Item 1</Card>
</CuiGrid>
```

### Defaults

- **Columns**: Single column (mobile-first, safe default)
- **Gap**: No gap (must be explicitly set)
- **Debug**: Disabled

---

## CuiGridItem

Optional helper component for grid-specific item properties.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `colSpan` | `ResponsiveValue<GridSpan>` | - | Columns to span (1-12, "full") |
| `rowSpan` | `ResponsiveValue<GridSpan>` | - | Rows to span (1-12, "full") |

### Examples

```vue
<!-- Item spanning 2 columns -->
<CuiGrid :cols="3" gap="4">
  <CuiGridItem :col-span="2">
    <Card>Spans 2 columns</Card>
  </CuiGridItem>
  <Card>Normal width</Card>
</CuiGrid>

<!-- Responsive spanning -->
<CuiGrid :cols="3" gap="4">
  <CuiGridItem :col-span="{ sm: 'full', md: 2, lg: 1 }">
    <Card>Responsive width</Card>
  </CuiGridItem>
</CuiGrid>

<!-- Alternatively, use Tailwind classes directly -->
<CuiGrid :cols="3" gap="4">
  <Card class="col-span-2">Spans 2 columns</Card>
</CuiGrid>
```

---

## CuiFlex

Flexbox component for one-dimensional layouts.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `direction` | `ResponsiveValue<FlexDirection>` | `"row"` | Flex direction: "row", "row-reverse", "col", "col-reverse" |
| `wrap` | `ResponsiveValue<FlexWrap>` | `"wrap"` | Wrap behavior: "wrap", "wrap-reverse", "nowrap" |
| `gap` | `ResponsiveValue<TailwindSpacing>` | - | Gap between items |
| `rowGap` | `ResponsiveValue<TailwindSpacing>` | - | Row gap (for wrapped containers) |
| `colGap` | `ResponsiveValue<TailwindSpacing>` | - | Column gap |
| `debug` | `boolean` | `false` | Enable debug visualization |

### Examples

```vue
<!-- Horizontal flex with gap -->
<CuiFlex gap="4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</CuiFlex>

<!-- Vertical flex -->
<CuiFlex direction="col" gap="4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
</CuiFlex>

<!-- Responsive direction -->
<CuiFlex :direction="{ sm: 'col', lg: 'row' }" gap="4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
</CuiFlex>

<!-- With Tailwind classes for alignment -->
<CuiFlex gap="4" class="items-center justify-between">
  <Card>Left</Card>
  <Card>Right</Card>
</CuiFlex>
```

### Defaults

- **Direction**: Row (horizontal, left-to-right)
- **Wrap**: Wrap enabled (responsive-friendly)
- **Gap**: No gap (must be explicitly set)
- **Debug**: Disabled

---

## CuiFlexItem

Optional helper component for flex item properties.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `flex` | `ResponsiveValue<"1" \| "auto" \| "initial" \| "none">` | - | Flex shorthand |
| `grow` | `ResponsiveValue<0 \| 1>` | - | Flex grow |
| `shrink` | `ResponsiveValue<0 \| 1>` | - | Flex shrink |

### Examples

```vue
<!-- Flex item that grows to fill space -->
<CuiFlex gap="4">
  <Card>Fixed width</Card>
  <CuiFlexItem flex="1">
    <Card>Grows to fill</Card>
  </CuiFlexItem>
  <Card>Fixed width</Card>
</CuiFlex>

<!-- Individual grow/shrink control -->
<CuiFlex gap="4">
  <CuiFlexItem :grow="1" :shrink="0">
    <Card>Grows, doesn't shrink</Card>
  </CuiFlexItem>
</CuiFlex>

<!-- Alternatively, use Tailwind classes -->
<CuiFlex gap="4">
  <Card class="flex-1">Grows to fill</Card>
</CuiFlex>
```

---

## CuiStack

Convenience wrapper for simple vertical/horizontal spacing. Built on top of `CuiFlex`.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `direction` | `"vertical" \| "horizontal"` | `"vertical"` | Stack direction |
| `spacing` | `ResponsiveValue<TailwindSpacing>` | `"4"` | Space between items |
| `debug` | `boolean` | `false` | Enable debug visualization |

### Examples

```vue
<!-- Vertical stack (default) -->
<CuiStack spacing="4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</CuiStack>

<!-- Horizontal stack -->
<CuiStack direction="horizontal" spacing="3">
  <Button>Button 1</Button>
  <Button>Button 2</Button>
</CuiStack>

<!-- Responsive spacing -->
<CuiStack :spacing="{ sm: '2', md: '4', lg: '6' }">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
</CuiStack>
```

### Defaults

- **Direction**: Vertical (column)
- **Spacing**: 4 (1rem / 16px)
- **Wrap**: No wrap (items stay in single line/column)

---

## CuiContainer

Max-width container with responsive padding.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxWidth` | `ResponsiveValue<ContainerSize>` | `"2xl"` | Max width: "sm", "md", "lg", "xl", "2xl", "full" |
| `px` | `ResponsiveValue<TailwindSpacing>` | `"4"` | Horizontal padding |
| `py` | `ResponsiveValue<TailwindSpacing>` | - | Vertical padding |
| `centered` | `boolean` | `true` | Center the container with `mx-auto` |

### Examples

```vue
<!-- Default container (max-width 2xl, centered) -->
<CuiContainer>
  <Content />
</CuiContainer>

<!-- Custom max-width -->
<CuiContainer max-width="lg">
  <Content />
</CuiContainer>

<!-- Responsive max-width -->
<CuiContainer :max-width="{ sm: 'sm', lg: 'xl' }">
  <Content />
</CuiContainer>

<!-- With vertical padding -->
<CuiContainer py="8">
  <Content />
</CuiContainer>

<!-- Not centered -->
<CuiContainer :centered="false">
  <Content />
</CuiContainer>
```

### Container Sizes

| Size | Max Width |
|------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |
| `full` | 100% |

---

## CuiSpacer

Flexible spacer for pushing items apart in flex layouts, or fixed spacing.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `ResponsiveValue<TailwindSpacing>` | - | Fixed size (if not provided, uses flex-grow) |
| `direction` | `"horizontal" \| "vertical"` | `"horizontal"` | Spacer direction (width vs height) |

### Examples

```vue
<!-- Flexible spacer (pushes items to edges) -->
<CuiFlex gap="4">
  <Button>Left</Button>
  <CuiSpacer />
  <Button>Right</Button>
</CuiFlex>

<!-- Fixed size spacer -->
<CuiFlex gap="4">
  <Button>Item 1</Button>
  <CuiSpacer size="20" />
  <Button>Item 2</Button>
</CuiFlex>

<!-- Vertical spacer -->
<CuiFlex direction="col">
  <Card>Top</Card>
  <CuiSpacer direction="vertical" />
  <Card>Bottom</Card>
</CuiFlex>
```

---

## Responsive Values

All spacing, sizing, and layout props support responsive values using Tailwind's breakpoint system.

### Breakpoints

| Breakpoint | Min Width |
|------------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

### Responsive Syntax

```vue
<!-- Single value (applies to all breakpoints) -->
<CuiGrid :cols="3" gap="4" />

<!-- Responsive object -->
<CuiGrid
  :cols="{ sm: 1, md: 2, lg: 3 }"
  :gap="{ sm: '2', md: '4', lg: '6' }"
/>
```

### TypeScript Type

```typescript
type ResponsiveValue<T> = T | Partial<Record<TailwindBreakpoint, T>>;
```

---

## Debug Mode

Enable debug mode to visualize grid and flex structures during development.

### Features

- **Visual Overlay**: Colored border around containers
- **Nested Depth**: Shows nesting level
- **Item Outlines**: Dashed outlines on grid/flex items
- **Color Coding**: Blue for Grid, Green for Flex

### Usage

```vue
<!-- Enable debug on a single component -->
<CuiGrid :cols="3" gap="4" :debug="true">
  <Card>Item 1</Card>
</CuiGrid>

<!-- Debug propagates to nested grids/flexes -->
<CuiGrid :cols="2" :debug="true">
  <Card>Item 1</Card>
  <CuiFlex gap="2">
    <!-- This flex will also show debug overlay -->
    <Card>Nested item</Card>
  </CuiFlex>
</CuiGrid>
```

---

## Nested Grids & Flexes

The grid system has built-in context awareness for nested layouts.

### Features

- **Depth Tracking**: Automatically tracks nesting level
- **Debug Inheritance**: Parent debug mode propagates to children
- **Z-index Management**: Debug overlays stack correctly based on depth

### Example

```vue
<CuiGrid :cols="2" gap="4" :debug="true">
  <Card>Item 1</Card>

  <!-- Nested grid (depth: 1) -->
  <CuiGrid :cols="2" gap="2">
    <Card>Nested 1</Card>
    <Card>Nested 2</Card>

    <!-- Double nested (depth: 2) -->
    <CuiGrid :cols="1" gap="1">
      <Card>Deep nested</Card>
    </CuiGrid>
  </CuiGrid>
</CuiGrid>
```

---

## TypeScript Types

All components are fully typed with exported interfaces.

### Exported Types

```typescript
import type {
  // Spacing
  TailwindSpacing,
  TailwindBreakpoint,
  ResponsiveValue,

  // Grid
  GridColumns,      // 1-12
  GridRows,         // 1-6
  GridSpan,         // 1-12 | "full"

  // Flex
  FlexDirection,    // "row" | "row-reverse" | "col" | "col-reverse"
  FlexWrap,         // "wrap" | "wrap-reverse" | "nowrap"

  // Component Props
  CuiGridProps,
  CuiGridItemProps,
  CuiFlexProps,
  CuiFlexItemProps,
  CuiStackProps,
  CuiContainerProps,
  CuiSpacerProps,
  ContainerSize,
} from '@itguy614/clean-ui';
```

---

## Advanced Usage

### Combining with Tailwind Classes

All components support the `class` prop for additional Tailwind utilities:

```vue
<!-- Grid with custom alignment -->
<CuiGrid :cols="3" gap="4" class="items-center justify-items-start">
  <Card>Item 1</Card>
</CuiGrid>

<!-- Flex with custom positioning -->
<CuiFlex gap="4" class="absolute inset-0 items-center justify-center">
  <Card>Centered content</Card>
</CuiFlex>
```

### Complex Layouts

```vue
<CuiContainer max-width="2xl">
  <CuiStack spacing="8">
    <!-- Header -->
    <CuiFlex gap="4" class="items-center justify-between">
      <h1>Title</h1>
      <Button>Action</Button>
    </CuiFlex>

    <!-- Main content grid -->
    <CuiGrid :cols="{ sm: 1, lg: 3 }" gap="6">
      <CuiGridItem :col-span="{ sm: 'full', lg: 2 }">
        <Card>Main content</Card>
      </CuiGridItem>
      <Card>Sidebar</Card>
    </CuiGrid>

    <!-- Footer -->
    <CuiFlex gap="4" class="justify-center">
      <Button>Cancel</Button>
      <Button>Submit</Button>
    </CuiFlex>
  </CuiStack>
</CuiContainer>
```

---

## Best Practices

### 1. Choose the Right Component

- **Grid**: Two-dimensional layouts, complex card grids, dashboards
- **Flex**: One-dimensional layouts, navigation bars, button groups
- **Stack**: Simple lists, vertical forms, horizontal button groups
- **Container**: Page-level max-width containers

### 2. Mobile-First Design

Always specify mobile layout first, then override for larger screens:

```vue
<!-- Good: Mobile first -->
<CuiGrid :cols="{ sm: 1, md: 2, lg: 3 }" gap="4">

<!-- Avoid: Desktop first -->
<CuiGrid :cols="3" gap="4" class="sm:grid-cols-1">
```

### 3. Use Tailwind for One-Off Styles

Don't create wrapper components for simple styling:

```vue
<!-- Good: Tailwind classes for alignment -->
<CuiFlex gap="4" class="items-center justify-between">

<!-- Avoid: Creating custom props for every CSS property -->
```

### 4. Debug During Development

Enable debug mode when building complex layouts:

```vue
<CuiGrid :cols="3" gap="4" :debug="isDev">
```

### 5. Prefer GridItem/FlexItem for Clarity

Use helper components when spanning/flex properties are core to the design:

```vue
<!-- Good: Clear intent -->
<CuiGridItem :col-span="2">
  <Card>Featured item</Card>
</CuiGridItem>

<!-- Also good: For simple cases -->
<Card class="col-span-2">Featured item</Card>
```

---

## Performance

- **Zero Runtime Overhead**: Components generate static Tailwind classes
- **Tree-Shakeable**: Import only what you need
- **Small Bundle**: ~10kb gzipped for entire grid system
- **SSR Compatible**: Works with Vue SSR and Nuxt

---

## Browser Support

- **CSS Grid**: 96%+ (IE 11 not supported)
- **Flexbox**: 98%+ (full support)
- **CSS Variables**: 96%+ (used in debug mode)

---

## Migration from Other Libraries

### From Bootstrap

```vue
<!-- Bootstrap -->
<div class="container">
  <div class="row">
    <div class="col-md-6">Content</div>
  </div>
</div>

<!-- Clean UI -->
<CuiContainer>
  <CuiGrid :cols="{ md: 2 }" gap="4">
    <Card>Content</Card>
  </CuiGrid>
</CuiContainer>
```

### From Material-UI (MUI)

```vue
<!-- MUI -->
<Grid container spacing={2}>
  <Grid item xs={12} md={6}>
    <Card>Content</Card>
  </Grid>
</Grid>

<!-- Clean UI -->
<CuiGrid :cols="{ sm: 1, md: 2 }" gap="2">
  <Card>Content</Card>
</CuiGrid>
```

---

## Examples

See the docs app (`apps/docs/src/App.vue`) for comprehensive examples of all components.

To run the docs app:

```bash
npm run dev
```

Then open http://localhost:5173 (or next available port).
