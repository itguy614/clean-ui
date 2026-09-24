<script setup lang="ts">
import { computed } from "vue";
import type { HideableProps } from "../types/common";

export interface CuiCardMediaProps extends HideableProps {
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
  hidden: false,
});

const aspectMap: Record<string, string> = {
  auto: "auto",
  video: "16 / 9",
  square: "1 / 1",
};

/** Emitted as a private property so the whole Card family overrides the same way. */
const aspectStyle = computed(() => ({
  "--_card-media-aspect": aspectMap[props.aspect] ?? props.aspect,
}));
</script>

<template>
  <div v-show="!hidden" class="cui-card-media" :class="`cui-card-media--${position}`">
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

:where(.cui-card-media__img) {
  aspect-ratio: var(--cui-card-media-aspect, var(--_card-media-aspect));
  object-fit: var(--cui-card-media-fit, cover);
}

.cui-card-media__img {
  display: block;
  width: 100%;
}
</style>
