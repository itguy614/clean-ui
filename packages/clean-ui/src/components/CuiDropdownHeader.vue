<template>
  <div class="cui-dropdown-header" role="presentation">
    <slot />
  </div>
</template>

<style scoped>
.cui-dropdown-header {
  padding: 0.375rem 0.625rem 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--cui-text-tertiary);
  user-select: none;
}
</style>
