<script setup lang="ts">
import { ref } from "vue";
import { CuiFileUpload, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const lastUpload = ref<string>("(no upload yet)");
const lastReject = ref<string>("");

function onUpload(files: File[]) {
  lastUpload.value = files.map((f) => f.name).join(", ");
}

function onReject(payload: { file: File; reason: string }) {
  lastReject.value = `${payload.file.name}: ${payload.reason}`;
  setTimeout(() => { lastReject.value = ""; }, 3000);
}
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">File Upload</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A drag-and-drop file upload zone with file list, validation, and optional
        manual upload button. Collects files and emits them — doesn't handle the
        actual HTTP upload.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'accept', type: 'string', default: '—', description: 'Accepted file types (e.g., .pdf,.docx, image/*)' },
          { name: 'multiple', type: 'boolean', default: 'true', description: 'Allow multiple files' },
          { name: 'maxFileSize', type: 'number', default: '0', description: 'Max file size in bytes (0 = unlimited)' },
          { name: 'maxFiles', type: 'number', default: '0', description: 'Max number of files (0 = unlimited)' },
          { name: 'autoUpload', type: 'boolean', default: 'true', description: 'Auto-emit on select/drop (false shows Upload button)' },
          { name: 'color', type: 'primary | ...', default: 'primary', description: 'Color role' },
          { name: 'label', type: 'string', default: '—', description: 'Label text' },
          { name: 'dragText', type: 'string', default: 'Drag and drop files here, or', description: 'Drop zone helper text' },
          { name: 'browseText', type: 'string', default: 'Browse', description: 'Browse button text' },
          { name: 'uploadText', type: 'string', default: 'Upload', description: 'Upload button text (manual mode)' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Events</h2>
      <PropTable
        :props="[
          { name: '@upload', type: '(files: File[]) => void', default: '—', description: 'Emitted when files are ready' },
          { name: '@reject', type: '({ file, reason }) => void', default: '—', description: 'Emitted when a file is rejected' },
          { name: '@change', type: '(files: FileEntry[]) => void', default: '—', description: 'Emitted when file list changes' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic (Auto Upload)" :code="`<CuiFileUpload label=&quot;Attachments&quot; @upload=&quot;onUpload&quot; />`">
          <div style="max-width: 28rem;">
            <CuiFileUpload label="Attachments" @upload="onUpload" />
            <div class="mt-2 text-sm" style="color: var(--cui-text-secondary);">
              Uploaded: {{ lastUpload }}
            </div>
          </div>
        </Example>

        <!-- Manual upload -->
        <Example title="Manual Upload (Review First)" :code="`<CuiFileUpload :auto-upload=&quot;false&quot; />`">
          <div style="max-width: 28rem;">
            <CuiFileUpload label="Documents" :auto-upload="false" @upload="onUpload" />
          </div>
        </Example>

        <!-- With constraints -->
        <Example title="Images Only, Max 5MB" :code="`<CuiFileUpload accept=&quot;image/*&quot; :max-file-size=&quot;5242880&quot; />`">
          <div style="max-width: 28rem;">
            <CuiFileUpload
              label="Profile Photos"
              accept="image/*"
              :max-file-size="5242880"
              :max-files="3"
              @upload="onUpload"
              @reject="onReject"
            />
            <div v-if="lastReject" class="mt-2 text-sm" style="color: var(--cui-error);">
              Rejected: {{ lastReject }}
            </div>
          </div>
        </Example>

        <!-- PDF only -->
        <Example title="PDF Only, Single File" :code="`<CuiFileUpload
  label=&quot;Resume&quot;
  accept=&quot;.pdf&quot;
  :multiple=&quot;false&quot;
  :max-file-size=&quot;10485760&quot;
  drag-text=&quot;Drop your resume here, or&quot;
  @upload=&quot;onUpload&quot;
  @reject=&quot;onReject&quot;
/>`">
          <div style="max-width: 28rem;">
            <CuiFileUpload
              label="Resume"
              accept=".pdf"
              :multiple="false"
              :max-file-size="10485760"
              drag-text="Drop your resume here, or"
              @upload="onUpload"
              @reject="onReject"
            />
          </div>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled" :code="`<CuiFileUpload label=&quot;Locked&quot; disabled />`">
          <div style="max-width: 28rem;">
            <CuiFileUpload label="Locked" disabled />
          </div>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
