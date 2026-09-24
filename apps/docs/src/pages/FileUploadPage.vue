<script setup lang="ts">
import { ref } from "vue";
import { CuiFileUpload } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/file-upload";

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
  <DocPage :meta="meta">
    <template #intro>
      <p class="text-surface-700 dark:text-surface-300">
        The component collects files and hands them to you — it performs no HTTP request of
        its own. <code>upload</code> is your cue to <code>POST</code> them; what happens
        after that, including progress and failure, is yours to render.
      </p>
    </template>

    <template #usage>
      <Example
        code-open
        :code="`<CuiFileUpload label=&quot;Attachments&quot; @upload=&quot;onUpload&quot; />`"
      >
        <div style="max-width: 28rem;">
          <CuiFileUpload label="Attachments" @upload="onUpload" />
          <div class="mt-2 text-sm" style="color: var(--cui-text-secondary);">
            Uploaded: {{ lastUpload }}
          </div>
        </div>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        There is a real <code>&lt;input type="file"&gt;</code> behind the drop zone, and it
        is what carries <code>id</code>, <code>name</code>, <code>accept</code>,
        <code>multiple</code> and the <code>aria-*</code> props — so a
        <code>CuiFormField</code> wrapping the component labels and describes something
        that genuinely exists. The drop zone is a presentation layer over it, not a
        replacement for it.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Validation runs in JavaScript as well as through <code>accept</code>, because a
          drop bypasses the file dialog's filter entirely. Every rejection emits
          <code>reject</code> with a human-readable reason.
        </li>
        <li>
          Nothing is announced when a file is rejected — there is no live region. Render
          the <code>reject</code> payload yourself, in a <code>CuiAlert</code> or a
          <code>CuiToast</code>, both of which are live regions.
        </li>
        <li>
          The file list is plain markup, not a <code>&lt;ul&gt;</code>, and the number of
          files is not announced when it changes. Where the list is the point — an
          attachment tray a user works through — put your own count somewhere polite.
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> The drop zone carries no <code>tabindex</code> and no
        key handler, and the file input behind it is <code>display: none</code>, which
        takes it out of the tab order too — so today the component cannot be operated from
        the keyboard. Until that is fixed, pair it with your own <code>CuiButton</code>
        that opens the same input, and treat the drop zone as the pointer-only convenience
        it currently is. The per-file remove button is an icon with no
        <code>aria-label</code>, so it announces as an unnamed button, and the
        <code>label</code> prop renders plain text with no <code>for</code> attribute —
        use <code>CuiFormField</code> for a label that actually associates.
      </p>
    </template>

    <template #examples>
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

      <!-- Color -->
      <Example title="Color Role" :code="`<CuiFileUpload color=&quot;success&quot; label=&quot;Approved Docs&quot; />`">
        <div style="max-width: 28rem;">
          <CuiFileUpload color="success" label="Approved Docs" />
        </div>
      </Example>

      <!-- Disabled -->
      <Example title="Disabled" :code="`<CuiFileUpload label=&quot;Locked&quot; disabled />`">
        <div style="max-width: 28rem;">
          <CuiFileUpload label="Locked" disabled />
        </div>
      </Example>
    </template>
  </DocPage>
</template>
