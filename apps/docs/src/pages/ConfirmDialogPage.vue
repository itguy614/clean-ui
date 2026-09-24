<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiConfirmDialog } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/confirm-dialog";

const showUsage = ref(false);
const showDanger = ref(false);
const showWarning = ref(false);
const showTyped = ref(false);
const showCustom = ref(false);
const showHeading = ref(false);
const showLoading = ref(false);
const loadingState = ref(false);

const lastAction = ref("(no action yet)");

function onUsageConfirm() {
  lastAction.value = "Basic: confirmed";
  showUsage.value = false;
}

function onDangerConfirm() {
  lastAction.value = "Danger: item deleted";
  showDanger.value = false;
}

function onWarningConfirm() {
  lastAction.value = "Warning: action confirmed";
  showWarning.value = false;
}

function onTypedConfirm() {
  lastAction.value = "Typed: project deleted";
  showTyped.value = false;
}

function onCustomConfirm() {
  lastAction.value = "Custom: confirmed";
  showCustom.value = false;
}

function onHeadingConfirm() {
  lastAction.value = "Heading level: confirmed";
  showHeading.value = false;
}

function onLoadingConfirm() {
  loadingState.value = true;
  setTimeout(() => {
    loadingState.value = false;
    showLoading.value = false;
    lastAction.value = "Loading: completed after delay";
  }, 2000);
}
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiConfirmDialog
  v-model:visible=&quot;show&quot;
  title=&quot;Discard changes?&quot;
  message=&quot;You have unsaved changes that will be lost.&quot;
  confirm-text=&quot;Discard&quot;
  @confirm=&quot;onConfirm&quot;
/>`"
      >
        <CuiButton variant="outline" @click="showUsage = true">Discard Changes</CuiButton>
        <CuiConfirmDialog
          v-model:visible="showUsage"
          title="Discard changes?"
          message="You have unsaved changes that will be lost. This action cannot be undone."
          confirm-text="Discard"
          @confirm="onUsageConfirm"
        />
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        It renders a <code>CuiModal</code>, so the dialog semantics and the overlay behaviour
        are the Modal's: <code>role="dialog"</code>, <code>aria-modal="true"</code>, focus moved
        onto the panel on open and returned to the opener on close, Tab wrapping inside it, and
        a background scroll lock while it is up.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Escape and a backdrop click both close it. They emit <code>update:visible</code> only,
          <em>not</em> <code>cancel</code> — so put clean-up in the <code>update:visible</code>
          handler rather than in <code>@cancel</code>, which fires only for the Cancel and X
          buttons. <code>persistent</code> is not forwarded, so there is no way to make the
          dialog unclosable, which for a confirmation is the right default.
        </li>
        <li>
          <code>confirm</code> fires but the dialog does not close itself. That is deliberate —
          it leaves room to run the work, show <code>loading</code>, and close on success.
        </li>
        <li>
          <code>titleAs</code> sets the element the title renders as, defaulting to
          <code>h2</code>. Match the heading level of whatever the dialog was opened from.
        </li>
        <li>
          The variant icon is decorative and marked <code>aria-hidden</code>, so the meaning has
          to be carried by the words. Write a title and message that still read correctly with
          no icon: “Delete account?”, not “Warning”.
        </li>
        <li>
          The type-to-confirm input is not focused on open — focus lands on the panel, and Tab
          reaches the input. Its prompt is rendered as plain text, so markup passed to
          <code>confirmPrompt</code> appears literally.
        </li>
        <li>
          The dialog carries no accessible name today: the inner modal is used in
          sub-component mode, so no <code>aria-labelledby</code> is emitted and the title is not
          associated with the dialog.
        </li>
      </ul>
    </template>

    <template #examples>
        <p class="text-sm" style="color: var(--cui-text-secondary);">Last action: {{ lastAction }}</p>

        <!-- Danger -->
        <Example title="Danger — Delete Item" :code="`<CuiConfirmDialog
  v-model:visible=&quot;show&quot;
  title=&quot;Delete account?&quot;
  message=&quot;This will permanently delete your account and all associated data.&quot;
  variant=&quot;danger&quot;
  confirm-text=&quot;Delete Account&quot;
  @confirm=&quot;onConfirm&quot;
/>`">
          <CuiButton variant="solid" color="error" @click="showDanger = true">Delete Account</CuiButton>
          <CuiConfirmDialog
            v-model:visible="showDanger"
            title="Delete account?"
            message="This will permanently delete your account and all associated data. This action cannot be reversed."
            variant="danger"
            confirm-text="Delete Account"
            @confirm="onDangerConfirm"
          />
        </Example>

        <!-- Warning -->
        <Example title="Warning Variant" :code="`<CuiConfirmDialog
  v-model:visible=&quot;show&quot;
  title=&quot;Reset to defaults?&quot;
  message=&quot;All your custom settings will be restored to their default values.&quot;
  variant=&quot;warning&quot;
  confirm-text=&quot;Reset&quot;
  @confirm=&quot;onConfirm&quot;
/>`">
          <CuiButton variant="outline" color="warning" @click="showWarning = true">Reset Settings</CuiButton>
          <CuiConfirmDialog
            v-model:visible="showWarning"
            title="Reset to defaults?"
            message="All your custom settings will be restored to their default values."
            variant="warning"
            confirm-text="Reset"
            @confirm="onWarningConfirm"
          />
        </Example>

        <!-- Typed confirmation -->
        <Example title="Typed Confirmation" :code="`<CuiConfirmDialog
  v-model:visible=&quot;show&quot;
  title=&quot;Delete project?&quot;
  message=&quot;This will permanently delete the project and all of its resources.&quot;
  variant=&quot;danger&quot;
  confirm-text=&quot;Delete Project&quot;
  confirm-word=&quot;delete&quot;
  @confirm=&quot;onConfirm&quot;
/>`">
          <CuiButton variant="solid" color="error" @click="showTyped = true">Delete Project</CuiButton>
          <CuiConfirmDialog
            v-model:visible="showTyped"
            title="Delete project?"
            message="This will permanently delete the project 'my-app' and all of its resources including databases, deployments, and environment variables."
            variant="danger"
            confirm-text="Delete Project"
            confirm-word="delete"
            @confirm="onTypedConfirm"
          />
        </Example>

        <!-- Custom prompt -->
        <Example title="Custom Typed Prompt" :code="`<!-- confirmPrompt is plain text — markup in it is not parsed -->
<CuiConfirmDialog
  v-model:visible=&quot;show&quot;
  title=&quot;Transfer ownership?&quot;
  message=&quot;You are about to transfer ownership of this organization.&quot;
  variant=&quot;danger&quot;
  confirm-text=&quot;Transfer&quot;
  confirm-word=&quot;transfer&quot;
  confirm-prompt=&quot;Type transfer below to confirm this irreversible action.&quot;
  @confirm=&quot;onConfirm&quot;
/>`">
          <CuiButton variant="outline" color="error" @click="showCustom = true">Transfer Ownership</CuiButton>
          <CuiConfirmDialog
            v-model:visible="showCustom"
            title="Transfer ownership?"
            message="You are about to transfer ownership of this organization. You will lose all admin privileges."
            variant="danger"
            confirm-text="Transfer"
            confirm-word="transfer"
            confirm-prompt="Type transfer below to confirm this irreversible action."
            @confirm="onCustomConfirm"
          />
        </Example>

        <!-- Heading level -->
        <Example title="Heading level (titleAs)" :code="`<!-- opened from a section already under an h2 -->
<CuiConfirmDialog
  v-model:visible=&quot;show&quot;
  title=&quot;Revoke API key?&quot;
  message=&quot;Anything using this key will stop working immediately.&quot;
  title-as=&quot;h3&quot;
  confirm-text=&quot;Revoke&quot;
  @confirm=&quot;onConfirm&quot;
/>`">
          <CuiButton variant="outline" @click="showHeading = true">Revoke API Key</CuiButton>
          <CuiConfirmDialog
            v-model:visible="showHeading"
            title="Revoke API key?"
            message="Anything using this key will stop working immediately. The title here is an h3 rather than the default h2, because this example already sits under one."
            title-as="h3"
            confirm-text="Revoke"
            @confirm="onHeadingConfirm"
          />
        </Example>

        <!-- Loading state -->
        <Example title="With Loading State" :code="`<CuiConfirmDialog
  v-model:visible=&quot;show&quot;
  title=&quot;Delete item?&quot;
  message=&quot;This will remove the item permanently.&quot;
  variant=&quot;danger&quot;
  confirm-text=&quot;Delete&quot;
  :loading=&quot;loadingState&quot;
  @confirm=&quot;onConfirm&quot;
/>`">
          <CuiButton variant="outline" @click="showLoading = true">Delete with Loading</CuiButton>
          <CuiConfirmDialog
            v-model:visible="showLoading"
            title="Delete item?"
            message="This will remove the item permanently."
            variant="danger"
            confirm-text="Delete"
            :loading="loadingState"
            @confirm="onLoadingConfirm"
          />
        </Example>
    </template>
  </DocPage>
</template>
