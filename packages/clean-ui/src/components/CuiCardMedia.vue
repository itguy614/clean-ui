<script setup lang="ts">
import { computed } from "vue";

export interface CuiCardMediaProps {
  /** Image URL */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Aspect ratio */
  aspect?: "auto" | "video" | "square" | string;
  /** Position in the card */
  position?: "top" | "bottom";
}

const props = withDefaults(defineProps<CuiCardMediaProps>(), {
  alt: "",
  aspect: "video",
  position: "top",
});

const aspectMap: Record<string, string> = {
  auto: "auto",
  video: "16 / 9",
  square: "1 / 1",
};

const aspectStyle = computed(() => ({
  aspectRatio: aspectMap[props.aspect] ?? props.aspect,
}));
</script>

<template>
  <div class="cui-card-media" :class="`cui-card-media--${position}`">
    <slot>
      <img
        v-if="src"
        :src="src"
        :alt="alt"
        class="cui-card-media__img"
        :style="aspectStyle"
      />
    </slot>
  </div>
</template>

<style scoped>
.cui-card-media {
  overflow: hidden;
}

.cui-card-media__img {
  display: block;
  width: 100%;
  object-fit: cover;
}
</style>
