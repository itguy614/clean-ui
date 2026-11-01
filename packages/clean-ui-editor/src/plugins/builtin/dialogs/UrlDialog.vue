<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, useTemplateRef } from "vue";
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
import { pickUrlDialogMessages, type UrlDialogKind } from "../../../messages";
import { useMarkdownEditorMessages } from "../../../composables/useMarkdownEditorMessages";

/**
 * The link and image dialogs (#222): a URL plus one text field — the link's text, the
 * image's alt text. `kind` picks the strings and the field ids; everything else is the
 * same dialog.
 */
const props = withDefaults(
  defineProps<{
    kind: UrlDialogKind;
    initialUrl?: string;
    initialText?: string;
    onSubmit: (values: { url: string; text: string }) => void;
    onCancel: () => void;
  }>(),
  { initialUrl: "", initialText: "" },
);

// Injected, not passed in: the app this dialog mounts in is given the host's clean-ui
// context (#326), so the editor's catalog resolves here exactly as in the editor, and
// stays live with the strings of the clean-ui components around it.
const editorMessages = useMarkdownEditorMessages();
const messages = computed(() => pickUrlDialogMessages(editorMessages.value, props.kind));

// Kept from the two dialogs this replaced, so a host's tests that query them still work.
const FIELD_IDS: Record<UrlDialogKind, { url: string; text: string }> = {
  link: { url: "cui-link-dialog-url", text: "cui-link-dialog-label" },
  image: { url: "cui-image-dialog-url", text: "cui-image-dialog-alt" },
};
const ids = FIELD_IDS[props.kind];

const url = ref(props.initialUrl);
const text = ref(props.initialText);
// The failed check, not its text, so the message follows a locale change.
const urlError = ref<"urlRequired" | "urlSchemeNotAllowed" | null>(null);
// A stale error would keep flagging a URL that has since been corrected.
// Sync, so an edit and a submit in the same tick (a paste-and-Enter) keep the submit's error.
watch(url, () => (urlError.value = null), { flush: "sync" });
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

function submit(e?: KeyboardEvent) {
  // Enter that confirms an IME candidate is not a submit.
  if (e?.isComposing) return;
  const trimmedUrl = url.value.trim();
  if (!trimmedUrl) {
    urlError.value = "urlRequired";
    return;
  }
  if (!isAllowedUrl(trimmedUrl)) {
    urlError.value = "urlSchemeNotAllowed";
    return;
  }
  props.onSubmit({ url: trimmedUrl, text: text.value.trim() });
}
</script>

<template>
  <CuiModal class="cui-url-dialog" v-model:visible="visible" size="sm" @close="props.onCancel">
    <CuiModalHeader :title="messages.title" @close="props.onCancel" />
    <CuiModalBody>
      <CuiStack spacing="3">
        <CuiFormField
          v-slot="field"
          :label="messages.urlLabel"
          :for="ids.url"
          :error="Boolean(urlError)"
          :error-message="urlError ? messages[urlError] : undefined"
        >
          <CuiInput
            ref="urlInputEl"
            v-bind="field"
            v-model="url"
            :placeholder="messages.urlPlaceholder"
            @keydown.enter="submit"
          />
        </CuiFormField>
        <CuiFormField v-slot="field" :label="messages.textLabel" :for="ids.text">
          <CuiInput v-bind="field" v-model="text" :placeholder="messages.textPlaceholder" @keydown.enter="submit" />
        </CuiFormField>
      </CuiStack>
    </CuiModalBody>
    <CuiModalFooter>
      <CuiButton variant="outline" @click="props.onCancel">{{ messages.cancel }}</CuiButton>
      <CuiButton variant="solid" @click="submit()">{{ messages.insert }}</CuiButton>
    </CuiModalFooter>
  </CuiModal>
</template>
