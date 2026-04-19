<script setup lang="ts">
import { ref, computed, type Component } from "vue";
import {
  CuiCard,
  CuiCardHeader,
  CuiFlex,
  CuiStack,
  CuiSelect,
  CuiToggle,
  CuiInput,
} from "@itguy614/clean-ui";

export interface PlaygroundPropDef {
  type: "select" | "boolean" | "string" | "number";
  options?: string[];
  default: unknown;
  label?: string;
}

export interface PlaygroundProps {
  /** The component to render (pass the actual component, not a string) */
  component: Component;
  /** Component name for code generation */
  componentName: string;
  /** Configurable prop definitions */
  props: Record<string, PlaygroundPropDef>;
  /** Default slot content (string) */
  slotContent?: string;
}

const props = defineProps<PlaygroundProps>();

// Build a reactive map of prop name -> current value ref
const propValues = ref<Record<string, unknown>>(
  Object.fromEntries(
    Object.entries(props.props).map(([key, def]) => [key, def.default])
  )
);

// Bound props passed to the live component
const boundProps = computed<Record<string, unknown>>(() => ({ ...propValues.value }));

// Human-readable label for a prop key
function toLabel(key: string, def: PlaygroundPropDef): string {
  if (def.label) return def.label;
  // camelCase → "Camel Case"
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

// Stringify a single prop value for the code snippet
function serializePropValue(key: string, value: unknown, def: PlaygroundPropDef): string {
  if (def.type === "boolean") {
    // boolean true = `:propName="true"` or just `:propName`, false = omit
    return value === true ? `:${key}="true"` : "";
  }
  if (def.type === "number") {
    return `:${key}="${value}"`;
  }
  // string / select
  return `${key}="${value}"`;
}

// Generate the full Vue template snippet
const generatedCode = computed<string>(() => {
  const attrs: string[] = [];

  for (const [key, def] of Object.entries(props.props)) {
    const value = propValues.value[key];
    // Skip props that match their default
    if (value === def.default) continue;
    // Skip false booleans
    if (def.type === "boolean" && value === false) continue;

    const serialized = serializePropValue(key, value, def);
    if (serialized) attrs.push(serialized);
  }

  const attrsStr = attrs.length > 0 ? " " + attrs.join(" ") : "";
  const tagOpen = `<${props.componentName}${attrsStr}>`;
  const tagClose = `</${props.componentName}>`;

  if (props.slotContent) {
    return `${tagOpen}\n  ${props.slotContent}\n${tagClose}`;
  }
  return `${tagOpen}${tagClose}`;
});

// Select options must be { value, label } objects for CuiSelect
function toSelectOptions(options: string[]) {
  return options.map((o) => ({ value: o, label: o }));
}
</script>

<template>
  <CuiCard variant="outline">
    <CuiCardHeader title="Playground" />

    <!-- Live Preview -->
    <div
      :style="{
        padding: '2rem 1.5rem',
        borderBottom: '1px solid var(--cui-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '7rem',
        backgroundImage:
          'radial-gradient(circle, var(--cui-border) 1px, transparent 1px)',
        backgroundSize: '1.25rem 1.25rem',
      }"
    >
      <component
        :is="component"
        v-bind="boundProps"
      >
        <template v-if="slotContent">{{ slotContent }}</template>
      </component>
    </div>

    <!-- Controls + Code -->
    <CuiFlex gap="0" wrap="nowrap">
      <!-- Left: Controls -->
      <div
        :style="{
          flex: '0 0 14rem',
          minWidth: '0',
          padding: '1rem 1.125rem',
          borderRight: '1px solid var(--cui-border)',
        }"
      >
        <p
          :style="{
            fontSize: '0.6875rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--cui-text-tertiary)',
            marginBottom: '0.875rem',
          }"
        >
          Props
        </p>
        <CuiStack spacing="4">
          <div v-for="(def, key) in props.props" :key="String(key)">
            <!-- Label -->
            <label
              :style="{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: 'var(--cui-text-secondary)',
                marginBottom: '0.375rem',
                fontFamily: 'var(--cui-font-mono, monospace)',
              }"
            >
              {{ toLabel(String(key), def) }}
            </label>

            <!-- Boolean: CuiToggle -->
            <CuiToggle
              v-if="def.type === 'boolean'"
              :model-value="propValues[String(key)] as boolean"
              size="sm"
              @update:model-value="propValues[String(key)] = $event"
            />

            <!-- Select: CuiSelect -->
            <CuiSelect
              v-else-if="def.type === 'select' && def.options"
              :model-value="propValues[String(key)] as string"
              :options="toSelectOptions(def.options)"
              size="sm"
              @update:model-value="propValues[String(key)] = $event"
            />

            <!-- Number: CuiInput with inputmode -->
            <CuiInput
              v-else-if="def.type === 'number'"
              :model-value="String(propValues[String(key)])"
              size="sm"
              @update:model-value="propValues[String(key)] = Number($event)"
            />

            <!-- String: CuiInput -->
            <CuiInput
              v-else
              :model-value="propValues[String(key)] as string"
              size="sm"
              @update:model-value="propValues[String(key)] = $event"
            />
          </div>
        </CuiStack>
      </div>

      <!-- Right: Generated Code -->
      <div
        :style="{
          flex: '1',
          minWidth: '0',
          padding: '1rem 1.125rem',
          overflow: 'auto',
        }"
      >
        <p
          :style="{
            fontSize: '0.6875rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--cui-text-tertiary)',
            marginBottom: '0.875rem',
          }"
        >
          Generated Code
        </p>
        <pre
          class="cui-pre"
          :style="{ margin: '0', fontSize: '0.8125rem' }"
        ><code class="cui-code">{{ generatedCode }}</code></pre>
      </div>
    </CuiFlex>
  </CuiCard>
</template>
