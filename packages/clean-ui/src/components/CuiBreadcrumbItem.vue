<script setup lang="ts">
import { inject, computed, useSlots, onMounted, ref } from "vue";
import { BreadcrumbContextKey } from "./breadcrumb-context";

export interface CuiBreadcrumbItemProps {
  /** Link URL (renders as <a>) */
  href?: string;
  /** Vue Router route (renders as <router-link>) */
  to?: string | object;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiBreadcrumbItemProps>(), {
  hidden: false,
});

const sepCtx = inject(BreadcrumbContextKey, { separator: "/" });

// Detect if this is the last item
const elRef = ref<HTMLElement>();
const isLast = ref(false);

onMounted(() => {
  if (elRef.value?.parentElement) {
    const items = elRef.value.parentElement.querySelectorAll(".cui-breadcrumb-item");
    isLast.value = items[items.length - 1] === elRef.value;
  }
});

const tag = computed(() => {
  if (isLast.value) return "span";
  if (props.to) return "router-link";
  if (props.href) return "a";
  return "span";
});

const linkProps = computed(() => {
  if (isLast.value) return {};
  if (props.to) return { to: props.to };
  if (props.href) return { href: props.href };
  return {};
});
</script>

<template>
  <li ref="elRef" v-show="!hidden" class="cui-breadcrumb-item">
    <component
      :is="tag"
      v-bind="linkProps"
      class="cui-breadcrumb-item__link"
      :class="{ 'cui-breadcrumb-item__link--current': isLast }"
      :aria-current="isLast ? 'page' : undefined"
    >
      <slot />
    </component>
    <span v-if="!isLast" class="cui-breadcrumb-item__separator" aria-hidden="true">
      {{ sepCtx.separator }}
    </span>
  </li>
</template>

<style scoped>
.cui-breadcrumb-item {
  display: flex;
  align-items: center;
}

.cui-breadcrumb-item__link {
  color: var(--cui-text-secondary);
  text-decoration: none;
  transition: color 0.15s ease;
}

.cui-breadcrumb-item__link:hover:not(.cui-breadcrumb-item__link--current) {
  color: var(--cui-text-body);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.cui-breadcrumb-item__link--current {
  color: var(--cui-text-emphasis);
  font-weight: 500;
  cursor: default;
}

.cui-breadcrumb-item__separator {
  color: var(--cui-text-tertiary);
  margin: 0 0.5rem;
  user-select: none;
}
</style>
