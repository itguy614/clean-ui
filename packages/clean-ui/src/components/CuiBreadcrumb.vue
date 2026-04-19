<script setup lang="ts">
import { provide } from "vue";
import { BreadcrumbContextKey } from "./breadcrumb-context";

export interface CuiBreadcrumbProps {
  /** Separator character between items */
  separator?: string;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiBreadcrumbProps>(), {
  separator: "/",
  hidden: false,
});

provide(BreadcrumbContextKey, {
  separator: props.separator,
});
</script>

<template>
  <nav v-show="!hidden" aria-label="Breadcrumb" class="cui-breadcrumb">
    <ol class="cui-breadcrumb__list">
      <slot />
    </ol>
  </nav>
</template>

<style scoped>
.cui-breadcrumb {
  font-size: 0.875rem;
}

.cui-breadcrumb__list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
