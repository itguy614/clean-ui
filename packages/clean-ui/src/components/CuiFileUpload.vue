<script setup lang="ts">
import { ref, computed, nextTick, useTemplateRef } from "vue";
import type { CuiColor, HideableProps, ColorableProps, DisableableProps, NativeControlProps } from "../types/common";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiBadge from "./CuiBadge.vue";
import { useMessages } from "../composables/useMessages";
import { useCuiId } from "../composables/useCuiId";

export interface FileEntry {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface CuiFileUploadProps extends NativeControlProps, HideableProps, ColorableProps, DisableableProps {
  /** Accepted file types (e.g., ".pdf,.docx", "image/*") */
  accept?: string;
  /** Allow multiple files */
  multiple?: boolean;
  /** Maximum file size in bytes (0 = unlimited) */
  maxFileSize?: number;
  /** Maximum number of files (0 = unlimited) */
  maxFiles?: number;
  /** Auto-emit on drop/select (true) or require explicit upload button (false) */
  autoUpload?: boolean;
  /** Label */
  label?: string;
  /** Drag zone helper text */
  dragText?: string;
  /** Browse button text */
  browseText?: string;
  /** Upload button text (when autoUpload is false) */
  uploadText?: string;
}

const props = withDefaults(defineProps<CuiFileUploadProps>(), {
  multiple: true,
  maxFileSize: 0,
  maxFiles: 0,
  autoUpload: true,
  color: "primary",
  disabled: false,
  dragText: "Drag and drop files here, or",
  browseText: "Browse",
  uploadText: "Upload",
  hidden: false,
});

const emit = defineEmits<{
  /** Emitted when files are ready (auto mode: on select/drop, manual mode: on upload click) */
  upload: [files: File[]];
  /** Emitted when a file is rejected (too large, wrong type, too many) */
  reject: [payload: { file: File; reason: string }];
  /** Emitted when files list changes */
  change: [files: FileEntry[]];
}>();

const files = ref<FileEntry[]>([]);
const isDragging = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
let idCounter = 0;

function generateId(): string {
  return `file-${++idCounter}-${Date.now()}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string): string {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video-camera";
  if (type.startsWith("audio/")) return "music-note";
  if (type.includes("pdf")) return "file-pdf";
  if (type.includes("zip") || type.includes("compressed") || type.includes("archive")) return "file-zip";
  if (type.includes("spreadsheet") || type.includes("csv") || type.includes("excel")) return "file-xls";
  if (type.includes("document") || type.includes("word")) return "file-doc";
  if (type.includes("text") || type.includes("json") || type.includes("xml")) return "file-text";
  return "file";
}

function validateFile(file: File): string | null {
  if (props.maxFileSize > 0 && file.size > props.maxFileSize) {
    return `File exceeds maximum size of ${formatSize(props.maxFileSize)}`;
  }
  if (props.accept) {
    const accepts = props.accept.split(",").map((a) => a.trim().toLowerCase());
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const typeMatch = accepts.some((a) => {
      if (a.startsWith(".")) return ext === a;
      if (a.endsWith("/*")) return file.type.startsWith(a.replace("/*", "/"));
      return file.type === a;
    });
    if (!typeMatch) return `File type not accepted`;
  }
  return null;
}

function addFiles(newFiles: FileList | File[]) {
  if (props.disabled) return;

  for (const file of Array.from(newFiles)) {
    // Check max files
    if (props.maxFiles > 0 && files.value.length >= props.maxFiles) {
      emit("reject", { file, reason: `Maximum ${props.maxFiles} files allowed` });
      continue;
    }

    // Validate
    const error = validateFile(file);
    if (error) {
      emit("reject", { file, reason: error });
      continue;
    }

    // Check duplicate
    if (files.value.some((f) => f.name === file.name && f.size === file.size)) continue;

    files.value.push({
      file,
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
    });
  }

  emit("change", [...files.value]);

  if (props.autoUpload) {
    emit("upload", files.value.map((f) => f.file));
  }
}

function removeFile(id: string) {
  files.value = files.value.filter((f) => f.id !== id);
  emit("change", [...files.value]);
}

function clearAll() {
  files.value = [];
  emit("change", []);
}

function onUploadClick() {
  if (files.value.length === 0) return;
  emit("upload", files.value.map((f) => f.file));
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files) addFiles(input.files);
  input.value = ""; // reset so same file can be selected again
}

// Drag events
function onDragEnter(e: DragEvent) {
  e.preventDefault();
  if (!props.disabled) isDragging.value = true;
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
}

function onDragLeave(e: DragEvent) {
  // Only leave if we're leaving the drop zone (not entering a child)
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  if (e.clientX <= rect.left || e.clientX >= rect.right || e.clientY <= rect.top || e.clientY >= rect.bottom) {
    isDragging.value = false;
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
  if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
}

const totalSize = computed(() => formatSize(files.value.reduce((sum, f) => sum + f.size, 0)));

// --- Keyboard and naming (#169) ---
// The file input is the control: visually hidden but focusable (not display:none, which
// took it out of the tab order), so Tab reaches it and Enter/Space open the native dialog.
// The drop zone is a <label for> it, so a click opens the dialog natively and its text
// names the input; it draws the input's focus ring.
const messages = useMessages();
const baseId = useCuiId("file-upload");
const inputId = computed(() => props.id ?? `${baseId}-input`);
const hintId = `${baseId}-hint`;
const labelId = `${baseId}-label`;
// With a label prop, it alone names the input; without one, the drop zone's text does.
const labelledBy = computed(() => props.ariaLabelledby ?? (props.label ? labelId : undefined));
const hasHint = computed(() => !!props.accept || props.maxFileSize > 0);
const describedBy = computed(() => [props.ariaDescribedby, hasHint.value ? hintId : undefined].filter(Boolean).join(" ") || undefined);

// Expose imperative handle — the file input
const rootEl = useTemplateRef<HTMLElement>("rootEl");

function focus(opts?: FocusOptions) {
  inputRef.value?.focus(opts);
}

// Removing a file unmounts the button that had focus: hand focus to the remove button now
// at its place (or the one before), or back to the input once the list is empty.
function onRemove(id: string, index: number) {
  removeFile(id);
  nextTick(() => {
    const buttons = rootEl.value?.querySelectorAll<HTMLElement>(".cui-file-upload__remove") ?? [];
    (buttons[Math.min(index, buttons.length - 1)] ?? inputRef.value)?.focus();
  });
}

function onClearAll() {
  clearAll();
  nextTick(() => inputRef.value?.focus());
}

function blur() {
  inputRef.value?.blur();
}

defineExpose({ el: rootEl, focus, blur });
</script>

<template>
  <div
    class="cui-file-upload"
    ref="rootEl"
    v-show="!hidden"
    :style="{ '--_file-upload-focus-ring': `var(--cui-${color}-focus-ring)` }"
  >
    <label
      v-if="label"
      :id="labelId"
      :for="inputId"
      class="cui-file-upload__label"
      :style="{ display: 'block', marginBottom: 'calc(0.375rem * var(--cui-density-scale, 1))', fontSize: '0.875rem', fontWeight: '500', color: 'var(--cui-text-secondary)' }"
    >{{ label }}</label>

    <!-- The file input: visually hidden, still focusable. The drop zone after it is its
         label and draws its focus ring (a sibling selector, so the order matters). -->
    <input
      ref="inputRef"
      :id="inputId"
      class="cui-sr-only cui-file-upload__input"
      :name="name"
      :autocomplete="autocomplete"
      :aria-describedby="describedBy"
      :aria-required="ariaRequired || undefined"
      :aria-labelledby="labelledBy"
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="onFileSelect"
    />

    <!-- Drop zone -->
    <label
      :for="inputId"
      class="cui-file-upload__zone"
      :style="{
        display: 'block',
        border: `2px dashed ${isDragging ? `var(--cui-${color})` : 'var(--cui-border)'}`,
        borderRadius: '0.625rem',
        padding: 'calc(1.5rem * var(--cui-density-scale, 1))',
        textAlign: 'center',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? '0.5' : '1',
        background: isDragging ? `var(--cui-${color}-bg)` : 'transparent',
        transition: 'border-color 0.15s ease, background 0.15s ease',
      }"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <CuiIcon
        name="cloud-arrow-up"
        size="2rem"
        :style="{ color: isDragging ? `var(--cui-${color})` : 'var(--cui-text-tertiary)', marginBottom: 'calc(0.5rem * var(--cui-density-scale, 1))' }"
      />
      <!-- Spans, not divs: a <label> holds phrasing content only. The hint is out of the name
           (aria-hidden) and is the input's description instead (aria-describedby). -->
      <span :style="{ display: 'block', fontSize: '0.875rem', color: 'var(--cui-text-secondary)' }">
        {{ dragText }}
        <span :style="{ color: `var(--cui-${color})`, fontWeight: '600' }">{{ browseText }}</span>
      </span>
      <span
        v-if="hasHint"
        :id="hintId"
        aria-hidden="true"
        :style="{ display: 'block', fontSize: '0.75rem', color: 'var(--cui-text-tertiary)', marginTop: 'calc(0.375rem * var(--cui-density-scale, 1))' }"
      >
        <span v-if="accept">{{ accept }}</span>
        <span v-if="accept && maxFileSize > 0"> · </span>
        <span v-if="maxFileSize > 0">Max {{ formatSize(maxFileSize) }}</span>
      </span>
    </label>

    <!-- File list -->
    <div v-if="files.length > 0" :style="{ marginTop: 'calc(0.75rem * var(--cui-density-scale, 1))' }">
      <div
        v-for="(entry, i) in files"
        :key="entry.id"
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: 'calc(0.625rem * var(--cui-density-scale, 1))',
          padding: 'calc(0.5rem * var(--cui-density-scale, 1)) calc(0.625rem * var(--cui-density-scale, 1))',
          borderRadius: '0.375rem',
          border: '1px solid var(--cui-border)',
          marginBottom: 'calc(0.375rem * var(--cui-density-scale, 1))',
          background: 'var(--cui-surface-base, white)',
        }"
      >
        <CuiIcon :name="fileIcon(entry.type)" size="1.25rem" :style="{ flexShrink: '0', color: 'var(--cui-text-secondary)' }" />
        <div :style="{ flex: '1', minWidth: '0' }">
          <div :style="{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--cui-text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
            {{ entry.name }}
          </div>
          <div :style="{ fontSize: '0.6875rem', color: 'var(--cui-text-tertiary)' }">
            {{ formatSize(entry.size) }}
          </div>
        </div>
        <button
          type="button"
          :style="{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1.5rem',
            height: '1.5rem',
            border: 'none',
            background: 'none',
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? '0.5' : '1',
            color: 'var(--cui-text-tertiary)',
            borderRadius: '0.25rem',
            flexShrink: '0',
          }"
          class="cui-file-upload__remove"
          :aria-label="messages.fileUpload.removeFile(entry.name)"
          :disabled="disabled"
          @click="onRemove(entry.id, i)"
        >
          <CuiIcon name="x" size="0.75rem" />
        </button>
      </div>

      <!-- Footer: count + total size + actions -->
      <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'calc(0.5rem * var(--cui-density-scale, 1))' }">
        <span :style="{ fontSize: '0.75rem', color: 'var(--cui-text-tertiary)' }">
          {{ files.length }} file{{ files.length === 1 ? '' : 's' }} · {{ totalSize }}
        </span>
        <div :style="{ display: 'flex', gap: 'calc(0.375rem * var(--cui-density-scale, 1))' }">
          <CuiButton variant="ghost" size="xs" :disabled="disabled" @click="onClearAll">{{ messages.clearAll }}</CuiButton>
          <CuiButton v-if="!autoUpload" variant="solid" size="xs" :color="color" :disabled="disabled" @click="onUploadClick">
            <template #prefix><CuiIcon name="upload-simple" size="0.75rem" /></template>
            {{ uploadText }}
          </CuiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Structural --- */
/* Anchors the visually hidden input inside the component, so focusing it can't scroll some
   outer container. */
.cui-file-upload {
  position: relative;
}

/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
/* The input is hidden; the drop zone it is labelled by shows that it has focus. */
:where(.cui-file-upload__input:focus-visible + .cui-file-upload__zone),
:where(.cui-file-upload__remove:focus-visible) {
  outline: 2px solid var(--cui-file-upload-focus-ring, var(--_file-upload-focus-ring));
  outline-offset: 2px;
}
</style>
