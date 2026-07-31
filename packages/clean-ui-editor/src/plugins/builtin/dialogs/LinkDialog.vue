<script setup lang="ts">
import { ref, onMounted, nextTick, useTemplateRef } from "vue";
import { CuiModal, CuiModalHeader, CuiModalBody, CuiModalFooter, CuiButton, CuiInput } from "@itguy614/clean-ui";
import { isAllowedUrl } from "../../../url-policy";
import { pickLinkDialogMessages, defaultMarkdownEditorMessages, type LinkDialogMessages } from "../../../messages";

const props = withDefaults(
  defineProps<{
    initialUrl: string;
    initialLabel: string;
    messages?: LinkDialogMessages;
    onSubmit: (values: { url: string; label: string }) => void;
    onCancel: () => void;
  }>(),
  { messages: () => pickLinkDialogMessages(defaultMarkdownEditorMessages) },
);

const url = ref(props.initialUrl);
const label = ref(props.initialLabel);
const urlError = ref("");
const visible = ref(false);
const urlInputRef = useTemplateRef<{ focus: (opts?: FocusOptions) => void }>("urlInputEl");

onMounted(async () => {
  visible.value = true;
  // The URL field is what a user opening this dialog almost always wants
  // to type into first — without this, focus lands on the modal's own
  // root (its initial-focus target), costing a keyboard user two Tab
  // presses (past the header's close button) to reach it. `nextTick`
  // because `CuiModal` only renders its body once `visible` flips true.
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
  props.onSubmit({ url: trimmedUrl, label: label.value.trim() || trimmedUrl });
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
          <label for="cui-link-dialog-url" class="cui-lead" style="display: block; margin-bottom: 0.25rem">{{ props.messages.urlLabel }}</label>
          <CuiInput
            id="cui-link-dialog-url"
            ref="urlInputEl"
            v-model="url"
            :placeholder="props.messages.urlPlaceholder"
            :error="Boolean(urlError)"
            :error-message="urlError"
            @keydown.enter="submit"
          />
        </div>
        <div>
          <label for="cui-link-dialog-label" style="display: block; margin-bottom: 0.25rem">{{ props.messages.textLabel }}</label>
          <CuiInput id="cui-link-dialog-label" v-model="label" :placeholder="props.messages.textPlaceholder" @keydown.enter="submit" />
        </div>
      </div>
    </CuiModalBody>
    <CuiModalFooter>
      <CuiButton variant="outline" @click="cancel">{{ props.messages.cancel }}</CuiButton>
      <CuiButton variant="solid" @click="submit">{{ props.messages.insert }}</CuiButton>
    </CuiModalFooter>
  </CuiModal>
</template>
