<script setup lang="ts">
import { ref } from "vue";
import { CuiFileUpload, CuiConfigProvider, CuiSelect, CuiCard, CuiCardBody } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/file-upload";

const lastUpload = ref<string>("(no upload yet)");
const lastReject = ref<string>("");
// Locale demo (#337)
const demoLocales = [
  { value: "en", label: "English (en)" },
  { value: "de", label: "Deutsch (de)" },
  { value: "fr", label: "Francais (fr)" },
  { value: "ja", label: "Japanese (ja)" },
];
const demoLocale = ref("de");

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
          The input is visually hidden but stays in the tab order, so Tab reaches it and Enter
          or Space opens the file dialog. The drop zone is a <code>&lt;label&gt;</code> for it
          — a click opens the dialog natively, its text names the input, and it draws the
          focus ring while the input has focus. The <code>label</code> prop is a second
          <code>&lt;label for&gt;</code> the same input, and the accept and size hint is
          linked through <code>aria-describedby</code>. <code>focus()</code> focuses the input.
        </li>
        <li>
          Each file's remove button is named after the file — “Remove report.pdf”
          (<code>fileUpload.removeFile</code> in the message catalogue).
          <code>disabled</code> disables the input and every button in the list.
        </li>
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
    </template>

    <template #extra>
      <div>
        <h2 id="locale" class="mb-4 text-2xl font-semibold">Locale</h2>
        <CuiCard variant="outline">
          <CuiCardBody>
            <p class="mb-3 text-surface-600 dark:text-surface-400">
              Sizes (&ldquo;Max 1.5 MB&rdquo;, each file's size, the rejection message) are written
              with <code>Intl.NumberFormat</code> in the library's
              <router-link to="/composables/locale">locale</router-link>, so the decimal separator and
              unit names follow it: 1,5 MB in German, 1,5 Mo in French. The words around them are the
              message catalogue's.
            </p>
            <CuiSelect v-model="demoLocale" :options="demoLocales" label="Locale" style="max-width: 16rem" class="mb-4" />
            <CuiConfigProvider :locale="demoLocale">
              <div style="max-width: 28rem">
                <CuiFileUpload label="Upload" :max-file-size="1572864" />
              </div>
            </CuiConfigProvider>
          </CuiCardBody>
        </CuiCard>
      </div>
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
