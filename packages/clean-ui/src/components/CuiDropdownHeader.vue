<template>
  <div class="cui-dropdown-header" role="presentation">
    <slot />
  </div>
</template>

<style scoped>
.cui-dropdown-header {
  padding: calc(0.375rem * var(--cui-density-scale, 1)) calc(0.625rem * var(--cui-density-scale, 1)) calc(0.25rem * var(--cui-density-scale, 1));
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--cui-text-tertiary);
  user-select: none;
}
</style>
