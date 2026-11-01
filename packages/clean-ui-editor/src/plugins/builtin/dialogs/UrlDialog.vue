<script setup lang="ts">
import { ref, onMounted, nextTick, useTemplateRef } from "vue";
import {
  CuiModal,
  CuiModalHeader,
  CuiModalBody,
  CuiModalFooter,
  CuiButton,
  CuiInput,
  CuiFormField,
  CuiStack,
} from "@itguy614/clean-ui";
import { isAllowedUrl } from "../../../url-policy";
import type { UrlDialogKind, UrlDialogMessages } from "../../../messages";

/**
 * The link and image dialogs (#222): a URL plus one text field — the link's text, the
 * image's alt text. `kind` picks the field ids; `messages` (from `pickUrlDialogMessages`)
 * the strings. Everything else is the same dialog.
 */
const props = withDefaults(
  defineProps<{
    kind: UrlDialogKind;
    initialUrl?: string;
    initialText?: string;
    messages: UrlDialogMessages;
    onSubmit: (values: { url: string; text: string }) => void;
    onCancel: () => void;
  }>(),
  { initialUrl: "", initialText: "" },
);

// Kept from the two dialogs this replaced, so a host's tests that query them still work.
const FIELD_IDS: Record<UrlDialogKind, { url: string; text: string }> = {
  link: { url: "cui-link-dialog-url", text: "cui-link-dialog-label" },
  image: { url: "cui-image-dialog-url", text: "cui-image-dialog-alt" },
};
const ids = FIELD_IDS[props.kind];

const url = ref(props.initialUrl);
const text = ref(props.initialText);
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
  props.onSubmit({ url: trimmedUrl, text: text.value.trim() });
}
</script>

<template>
  <CuiModal v-model:visible="visible" size="sm" @close="props.onCancel">
    <CuiModalHeader :title="props.messages.title" @close="props.onCancel" />
    <CuiModalBody>
      <CuiStack spacing="3">
        <CuiFormField
          v-slot="field"
          :label="props.messages.urlLabel"
          :for="ids.url"
          :error="Boolean(urlError)"
          :error-message="urlError"
        >
          <CuiInput
            ref="urlInputEl"
            v-bind="field"
            v-model="url"
            :placeholder="props.messages.urlPlaceholder"
            @keydown.enter="submit"
          />
        </CuiFormField>
        <CuiFormField v-slot="field" :label="props.messages.textLabel" :for="ids.text">
          <CuiInput v-bind="field" v-model="text" :placeholder="props.messages.textPlaceholder" @keydown.enter="submit" />
        </CuiFormField>
      </CuiStack>
    </CuiModalBody>
    <CuiModalFooter>
      <CuiButton variant="outline" @click="props.onCancel">{{ props.messages.cancel }}</CuiButton>
      <CuiButton variant="solid" @click="submit">{{ props.messages.insert }}</CuiButton>
    </CuiModalFooter>
  </CuiModal>
</template>
