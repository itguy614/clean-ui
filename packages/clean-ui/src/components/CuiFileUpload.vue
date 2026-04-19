<script setup lang="ts">
import { ref, computed } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiBadge from "./CuiBadge.vue";

export interface FileEntry {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface CuiFileUploadProps {
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
  /** Color role */
  color?: ButtonColor;
  /** Disabled */
  disabled?: boolean;
  /** Label */
  label?: string;
  /** Drag zone helper text */
  dragText?: string;
  /** Browse button text */
  browseText?: string;
  /** Upload button text (when autoUpload is false) */
  uploadText?: string;
  /** Hidden */
  hidden?: boolean;
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

function onBrowse() {
  inputRef.value?.click();
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
</script>

<template>
  <div v-show="!hidden">
    <label
      v-if="label"
      :style="{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--cui-text-secondary)' }"
    >{{ label }}</label>

    <!-- Hidden file input -->
    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      :multiple="multiple"
      :style="{ display: 'none' }"
      @change="onFileSelect"
    />

    <!-- Drop zone -->
    <div
      :style="{
        border: `2px dashed ${isDragging ? `var(--cui-${color})` : 'var(--cui-border)'}`,
        borderRadius: '0.625rem',
        padding: '1.5rem',
        textAlign: 'center',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? '0.5' : '1',
        background: isDragging ? `var(--cui-${color}-bg)` : 'transparent',
        transition: 'border-color 0.15s ease, background 0.15s ease',
      }"
      @click="onBrowse"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <CuiIcon
        name="cloud-arrow-up"
        size="2rem"
        :style="{ color: isDragging ? `var(--cui-${color})` : 'var(--cui-text-tertiary)', marginBottom: '0.5rem' }"
      />
      <div :style="{ fontSize: '0.875rem', color: 'var(--cui-text-secondary)' }">
        {{ dragText }}
        <span
          :style="{ color: `var(--cui-${color})`, fontWeight: '600', cursor: 'pointer' }"
          @click.stop="onBrowse"
        >{{ browseText }}</span>
      </div>
      <div
        v-if="accept || maxFileSize > 0"
        :style="{ fontSize: '0.75rem', color: 'var(--cui-text-tertiary)', marginTop: '0.375rem' }"
      >
        <span v-if="accept">{{ accept }}</span>
        <span v-if="accept && maxFileSize > 0"> · </span>
        <span v-if="maxFileSize > 0">Max {{ formatSize(maxFileSize) }}</span>
      </div>
    </div>

    <!-- File list -->
    <div v-if="files.length > 0" :style="{ marginTop: '0.75rem' }">
      <div
        v-for="entry in files"
        :key="entry.id"
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.5rem 0.625rem',
          borderRadius: '0.375rem',
          border: '1px solid var(--cui-border)',
          marginBottom: '0.375rem',
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
            cursor: 'pointer',
            color: 'var(--cui-text-tertiary)',
            borderRadius: '0.25rem',
            flexShrink: '0',
          }"
          @click="removeFile(entry.id)"
        >
          <CuiIcon name="x" size="0.75rem" />
        </button>
      </div>

      <!-- Footer: count + total size + actions -->
      <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }">
        <span :style="{ fontSize: '0.75rem', color: 'var(--cui-text-tertiary)' }">
          {{ files.length }} file{{ files.length === 1 ? '' : 's' }} · {{ totalSize }}
        </span>
        <div :style="{ display: 'flex', gap: '0.375rem' }">
          <CuiButton variant="ghost" size="xs" @click="clearAll">Clear All</CuiButton>
          <CuiButton v-if="!autoUpload" variant="solid" size="xs" :color="color" @click="onUploadClick">
            <template #prefix><CuiIcon name="upload-simple" size="0.75rem" /></template>
            {{ uploadText }}
          </CuiButton>
        </div>
      </div>
    </div>
  </div>
</template>
