<script setup lang="ts">
import { ref, onMounted, nextTick, useTemplateRef } from "vue";
import { CuiModal, CuiModalHeader, CuiModalBody, CuiModalFooter, CuiButton, CuiInput } from "@itguy614/clean-ui";
import { isAllowedUrl } from "../../../url-policy";
import { pickImageDialogMessages, defaultMarkdownEditorMessages, type ImageDialogMessages } from "../../../messages";

const props = withDefaults(
  defineProps<{
    initialUrl: string;
    initialAlt: string;
    messages?: ImageDialogMessages;
    onSubmit: (values: { url: string; alt: string }) => void;
    onCancel: () => void;
  }>(),
  { messages: () => pickImageDialogMessages(defaultMarkdownEditorMessages) },
);

const url = ref(props.initialUrl);
const alt = ref(props.initialAlt);
const urlError = ref("");
const visible = ref(false);
const urlInputRef = useTemplateRef<{ focus: (opts?: FocusOptions) => void }>("urlInputEl");

onMounted(async () => {
  visible.value = true;
  // See LinkDialog.vue's identical comment: the URL field is what's typed
  // into first, so it should get initial focus, not the modal's own root.
  await nextTick();
  urlInputRef.value?.focus();
});

function submit() {
  const trimmedUrl = url.value.trim();
  if (!trimmedUrl) {
    urlError.value = props.messages.urlRequired;
    return;
  }
  if (!isAllowedUrl(trimmedUrl)) {
    urlError.value = props.messages.urlSchemeNotAllowed;
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
    <CuiModalHeader :title="props.messages.title" @close="cancel" />
    <CuiModalBody>
      <div style="display: flex; flex-direction: column; gap: 0.75rem">
        <div>
          <label for="cui-image-dialog-url" class="cui-lead" style="display: block; margin-bottom: 0.25rem">{{ props.messages.urlLabel }}</label>
          <CuiInput
            id="cui-image-dialog-url"
            ref="urlInputEl"
            v-model="url"
            :placeholder="props.messages.urlPlaceholder"
            :error="Boolean(urlError)"
            :error-message="urlError"
            @keydown.enter="submit"
          />
        </div>
        <div>
          <label for="cui-image-dialog-alt" style="display: block; margin-bottom: 0.25rem">{{ props.messages.altLabel }}</label>
          <CuiInput id="cui-image-dialog-alt" v-model="alt" :placeholder="props.messages.altPlaceholder" @keydown.enter="submit" />
        </div>
      </div>
    </CuiModalBody>
    <CuiModalFooter>
      <CuiButton variant="outline" @click="cancel">{{ props.messages.cancel }}</CuiButton>
      <CuiButton variant="solid" @click="submit">{{ props.messages.insert }}</CuiButton>
    </CuiModalFooter>
  </CuiModal>
</template>
