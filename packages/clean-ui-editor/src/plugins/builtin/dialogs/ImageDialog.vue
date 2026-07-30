<script setup lang="ts">
import { ref, onMounted } from "vue";
import { CuiModal, CuiModalHeader, CuiModalBody, CuiModalFooter, CuiButton, CuiInput } from "@itguy614/clean-ui";
import { isAllowedUrl } from "./url-policy";

const props = defineProps<{
  initialUrl: string;
  initialAlt: string;
  onSubmit: (values: { url: string; alt: string }) => void;
  onCancel: () => void;
}>();

const url = ref(props.initialUrl);
const alt = ref(props.initialAlt);
const urlError = ref("");
const visible = ref(false);

onMounted(() => {
  visible.value = true;
});

function submit() {
  const trimmedUrl = url.value.trim();
  if (!trimmedUrl) {
    urlError.value = "A URL is required.";
    return;
  }
  if (!isAllowedUrl(trimmedUrl)) {
    urlError.value = "This URL scheme isn't allowed.";
    return;
  }
  props.onSubmit({ url: trimmedUrl, alt: alt.value.trim() });
}

function cancel() {
  props.onCancel();
}
</script>

<template>
  <CuiModal v-model:visible="visible" size="sm" @close="cancel">
    <CuiModalHeader title="Insert image" @close="cancel" />
    <CuiModalBody>
      <div style="display: flex; flex-direction: column; gap: 0.75rem">
        <div>
          <label for="cui-image-dialog-url" class="cui-lead" style="display: block; margin-bottom: 0.25rem">Image URL</label>
          <CuiInput
            id="cui-image-dialog-url"
            v-model="url"
            placeholder="https://example.com/image.png"
            :error="Boolean(urlError)"
            :error-message="urlError"
            @keydown.enter="submit"
          />
        </div>
        <div>
          <label for="cui-image-dialog-alt" style="display: block; margin-bottom: 0.25rem">Alt text</label>
          <CuiInput id="cui-image-dialog-alt" v-model="alt" placeholder="Describes the image" @keydown.enter="submit" />
        </div>
      </div>
    </CuiModalBody>
    <CuiModalFooter>
      <CuiButton variant="outline" @click="cancel">Cancel</CuiButton>
      <CuiButton variant="solid" @click="submit">Insert</CuiButton>
    </CuiModalFooter>
  </CuiModal>
</template>
