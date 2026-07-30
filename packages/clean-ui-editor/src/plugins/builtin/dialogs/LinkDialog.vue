<script setup lang="ts">
import { ref, onMounted } from "vue";
import { CuiModal, CuiModalHeader, CuiModalBody, CuiModalFooter, CuiButton, CuiInput } from "@itguy614/clean-ui";
import { isAllowedUrl } from "./url-policy";

const props = defineProps<{
  initialUrl: string;
  initialLabel: string;
  onSubmit: (values: { url: string; label: string }) => void;
  onCancel: () => void;
}>();

const url = ref(props.initialUrl);
const label = ref(props.initialLabel);
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
  props.onSubmit({ url: trimmedUrl, label: label.value.trim() || trimmedUrl });
}

function cancel() {
  props.onCancel();
}
</script>

<template>
  <CuiModal v-model:visible="visible" size="sm" @close="cancel">
    <CuiModalHeader title="Insert link" @close="cancel" />
    <CuiModalBody>
      <div style="display: flex; flex-direction: column; gap: 0.75rem">
        <div>
          <label for="cui-link-dialog-url" class="cui-lead" style="display: block; margin-bottom: 0.25rem">URL</label>
          <CuiInput
            id="cui-link-dialog-url"
            v-model="url"
            placeholder="https://example.com"
            :error="Boolean(urlError)"
            :error-message="urlError"
            @keydown.enter="submit"
          />
        </div>
        <div>
          <label for="cui-link-dialog-label" style="display: block; margin-bottom: 0.25rem">Text</label>
          <CuiInput id="cui-link-dialog-label" v-model="label" placeholder="Link text" @keydown.enter="submit" />
        </div>
      </div>
    </CuiModalBody>
    <CuiModalFooter>
      <CuiButton variant="outline" @click="cancel">Cancel</CuiButton>
      <CuiButton variant="solid" @click="submit">Insert</CuiButton>
    </CuiModalFooter>
  </CuiModal>
</template>
