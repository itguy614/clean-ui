<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiConfirmDialog, CuiFlex, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const showBasic = ref(false);
const showDanger = ref(false);
const showWarning = ref(false);
const showTyped = ref(false);
const showCustom = ref(false);
const showLoading = ref(false);
const loadingState = ref(false);

const lastAction = ref("(no action yet)");

function onBasicConfirm() {
  lastAction.value = "Basic: confirmed";
  showBasic.value = false;
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
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Confirm Dialog</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A specialized modal for confirming destructive or important actions.
        Supports typed confirmation where users must enter a specific word to proceed.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'modelValue', type: 'boolean', default: 'false', description: 'Control visibility (v-model)' },
          { name: 'title', type: 'string', default: 'Are you sure?', description: 'Dialog title' },
          { name: 'message', type: 'string', default: '—', description: 'Confirmation message' },
          { name: 'variant', type: 'danger | warning | info', default: 'danger', description: 'Affects icon and confirm button color' },
          { name: 'confirmText', type: 'string', default: 'Confirm', description: 'Confirm button text' },
          { name: 'cancelText', type: 'string', default: 'Cancel', description: 'Cancel button text' },
          { name: 'confirmWord', type: 'string', default: '—', description: 'Word user must type to enable confirm button' },
          { name: 'confirmPrompt', type: 'string', default: '—', description: 'Custom prompt text above the input (supports HTML)' },
          { name: 'icon', type: 'string', default: '—', description: 'Custom icon (auto-selected by variant if omitted)' },
          { name: 'loading', type: 'boolean', default: 'false', description: 'Loading state on confirm button' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>

      <p class="mb-4 text-sm" style="color: var(--cui-text-secondary);">Last action: {{ lastAction }}</p>

      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Confirmation" :code="`<CuiConfirmDialog
  v-model=&quot;show&quot;
  title=&quot;Discard changes?&quot;
  message=&quot;You have unsaved changes...&quot;
  @confirm=&quot;onConfirm&quot;
/>`">
          <CuiButton variant="outline" @click="showBasic = true">Discard Changes</CuiButton>
          <CuiConfirmDialog
            v-model="showBasic"
            title="Discard changes?"
            message="You have unsaved changes that will be lost. This action cannot be undone."
            confirm-text="Discard"
            @confirm="onBasicConfirm"
          />
        </Example>

        <!-- Danger -->
        <Example title="Danger — Delete Item">
          <CuiButton variant="solid" color="error" @click="showDanger = true">Delete Account</CuiButton>
          <CuiConfirmDialog
            v-model="showDanger"
            title="Delete account?"
            message="This will permanently delete your account and all associated data. This action cannot be reversed."
            variant="danger"
            confirm-text="Delete Account"
            @confirm="onDangerConfirm"
          />
        </Example>

        <!-- Warning -->
        <Example title="Warning Variant">
          <CuiButton variant="outline" color="warning" @click="showWarning = true">Reset Settings</CuiButton>
          <CuiConfirmDialog
            v-model="showWarning"
            title="Reset to defaults?"
            message="All your custom settings will be restored to their default values."
            variant="warning"
            confirm-text="Reset"
            @confirm="onWarningConfirm"
          />
        </Example>

        <!-- Typed confirmation -->
        <Example title="Typed Confirmation" :code="`<CuiConfirmDialog
  confirm-word=&quot;delete&quot;
  ...
/>`">
          <CuiButton variant="solid" color="error" @click="showTyped = true">Delete Project</CuiButton>
          <CuiConfirmDialog
            v-model="showTyped"
            title="Delete project?"
            message="This will permanently delete the project 'my-app' and all of its resources including databases, deployments, and environment variables."
            variant="danger"
            confirm-text="Delete Project"
            confirm-word="delete"
            @confirm="onTypedConfirm"
          />
        </Example>

        <!-- Custom prompt -->
        <Example title="Custom Typed Prompt">
          <CuiButton variant="outline" color="error" @click="showCustom = true">Transfer Ownership</CuiButton>
          <CuiConfirmDialog
            v-model="showCustom"
            title="Transfer ownership?"
            message="You are about to transfer ownership of this organization. You will lose all admin privileges."
            variant="danger"
            confirm-text="Transfer"
            confirm-word="transfer"
            confirm-prompt="Type <strong>transfer</strong> to confirm this irreversible action."
            @confirm="onCustomConfirm"
          />
        </Example>

        <!-- Loading state -->
        <Example title="With Loading State">
          <CuiButton variant="outline" @click="showLoading = true">Delete with Loading</CuiButton>
          <CuiConfirmDialog
            v-model="showLoading"
            title="Delete item?"
            message="This will remove the item permanently."
            variant="danger"
            confirm-text="Delete"
            :loading="loadingState"
            @confirm="onLoadingConfirm"
          />
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
