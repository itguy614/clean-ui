<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiInput, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/input";

const text = ref("");
const email = ref("");
const search = ref("");
const password = ref("");
const url = ref("https://");
const errorVal = ref("");
const sized = ref("Hello");
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiInput v-model=&quot;text&quot; placeholder=&quot;Enter some text...&quot; />`"
      >
        <CuiStack spacing="2" class="max-w-md">
          <CuiInput v-model="text" placeholder="Enter some text..." />
          <div class="text-sm text-surface-500">Value: "{{ text }}"</div>
        </CuiStack>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The focusable element is a real <code>&lt;input&gt;</code>, so typing, selection,
        autofill and the mobile keyboard all behave natively. The border and focus ring are
        drawn on the wrapper via <code>:focus-within</code>, which is why the input itself
        sets <code>outline: none</code> — the visible ring is still there, one element out.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <code>error</code> sets <code>aria-invalid</code> on the native input and recolors
          the border. The message below carries the reason, so the failure is never
          signalled by colour alone.
        </li>
        <li>
          <code>id</code>, <code>name</code>, <code>autocomplete</code>,
          <code>aria-describedby</code> and <code>aria-labelledby</code> are declared props
          rather than fall-through attributes, so they land on the native input instead of
          the wrapper <code>&lt;div&gt;</code> — a <code>&lt;label for&gt;</code> pointing at
          <code>id</code> forms a real association.
        </li>
        <li>
          There is no <code>label</code> prop. Wrap the input in
          <code>CuiFormField</code>, which supplies <code>id</code>,
          <code>aria-labelledby</code> and <code>aria-describedby</code> through
          <code>v-bind="f"</code>, or pass your own <code>id</code> and label the input
          yourself. A <code>placeholder</code> is not a label: it disappears as soon as
          anything is typed.
        </li>
        <li>
          Set <code>autocomplete</code> on anything that asks for information about the
          person filling the form — <code>email</code>, <code>name</code>,
          <code>street-address</code>, <code>one-time-code</code>. It is what makes
          browser and password-manager autofill work (WCAG 1.3.5).
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> The clear button and the password reveal toggle carry
        <code>tabindex="-1"</code>, so neither is reachable by keyboard. Clearing is still
        possible by selecting the text and deleting it, but there is no keyboard route to
        revealing a password — where that matters, render your own toggle in the
        <code>#suffix-button</code> slot and drive <code>type</code> yourself. The error
        message is also not wired to <code>aria-describedby</code>, so it is not announced
        on focus; <code>CuiFormField</code>'s own error message is, which is the reason to
        prefer it for validated fields.
      </p>
    </template>

    <template #examples>
      <!-- Sizes -->
      <Example title="Sizes">
        <CuiStack spacing="3" class="max-w-md">
          <CuiInput v-model="sized" size="xs" placeholder="Extra small" />
          <CuiInput v-model="sized" size="sm" placeholder="Small" />
          <CuiInput v-model="sized" size="md" placeholder="Medium (default)" />
          <CuiInput v-model="sized" size="lg" placeholder="Large" />
          <CuiInput v-model="sized" size="xl" placeholder="Extra large" />
        </CuiStack>
      </Example>

      <!-- Rounded -->
      <Example title="Rounded" :code="`<CuiInput rounded=&quot;none&quot; placeholder=&quot;Square&quot; />
<CuiInput rounded=&quot;lg&quot; placeholder=&quot;Large radius&quot; />
<CuiInput rounded=&quot;full&quot; placeholder=&quot;Pill&quot; />`">
        <CuiStack spacing="3" class="max-w-md">
          <CuiInput rounded="none" placeholder="Square (none)" />
          <CuiInput rounded="lg" placeholder="Large radius" />
          <CuiInput rounded="full" placeholder="Pill (full)" />
        </CuiStack>
      </Example>

      <!-- Focus Colors -->
      <Example title="Focus Colors (click to see)">
        <CuiStack spacing="3" class="max-w-md">
          <CuiInput placeholder="Primary focus" color="primary" />
          <CuiInput placeholder="Success focus" color="success" />
          <CuiInput placeholder="Error focus" color="error" />
          <CuiInput placeholder="Info focus" color="info" />
        </CuiStack>
      </Example>

      <!-- Clearable -->
      <Example title="Clearable" :code="`<CuiInput v-model=&quot;search&quot; clearable placeholder=&quot;Search...&quot; />`">
        <CuiStack spacing="2" class="max-w-md">
          <CuiInput v-model="search" clearable placeholder="Type something, then clear it..." />
          <div class="text-sm text-surface-500">Value: "{{ search }}"</div>
        </CuiStack>
      </Example>

      <!-- Password -->
      <Example title="Password (auto show/hide toggle)" :code="`<CuiInput v-model=&quot;password&quot; type=&quot;password&quot; />`">
        <CuiStack spacing="2" class="max-w-md">
          <CuiInput v-model="password" type="password" placeholder="Enter password..." />
          <div class="text-sm text-surface-500">Value: "{{ password }}"</div>
        </CuiStack>
      </Example>

      <!-- Prefix / Suffix icons -->
      <Example title="Prefix &amp; Suffix (icons/text inside input)" :code="`<CuiInput placeholder=&quot;Search...&quot;>
  <template #prefix>🔍</template>
</CuiInput>
<CuiInput placeholder=&quot;0.00&quot;>
  <template #prefix>$</template>
  <template #suffix>USD</template>
</CuiInput>`">
        <CuiStack spacing="3" class="max-w-md">
          <CuiInput v-model="search" clearable placeholder="Search...">
            <template #prefix>🔍</template>
          </CuiInput>
          <CuiInput placeholder="0.00">
            <template #prefix>$</template>
            <template #suffix>USD</template>
          </CuiInput>
          <CuiInput placeholder="you@example.com" type="email">
            <template #prefix>@</template>
          </CuiInput>
        </CuiStack>
      </Example>

      <!-- Prefix / Suffix buttons -->
      <Example title="Attached Buttons (merged into border)" :code="`<CuiInput v-model=&quot;url&quot; placeholder=&quot;https://...&quot;>
  <template #suffix-button>
    <CuiButton variant=&quot;solid&quot;>Copy</CuiButton>
  </template>
</CuiInput>`">
        <CuiStack spacing="3" class="max-w-lg">
          <CuiInput v-model="search" clearable placeholder="Search...">
            <template #suffix-button>
              <CuiButton variant="solid" size="md">Search</CuiButton>
            </template>
          </CuiInput>
          <CuiInput v-model="url" placeholder="https://...">
            <template #prefix-button>
              <CuiButton variant="ghost" size="md" color="secondary">https://</CuiButton>
            </template>
            <template #suffix-button>
              <CuiButton variant="solid" size="md" color="success">Go</CuiButton>
            </template>
          </CuiInput>
          <CuiInput placeholder="Enter invite code...">
            <template #suffix-button>
              <CuiButton variant="solid" size="md" color="info">Redeem</CuiButton>
            </template>
          </CuiInput>
        </CuiStack>
      </Example>

      <!-- Error Validation -->
      <Example title="Error Validation" :code="`<CuiInput v-model=&quot;email&quot; error errorMessage=&quot;Invalid email&quot; />`">
        <CuiStack spacing="3" class="max-w-md">
          <CuiInput
            v-model="errorVal"
            error
            error-message="This field is required"
            placeholder="Required field..."
          />
          <CuiInput
            v-model="email"
            type="email"
            error
            error-message="Please enter a valid email address"
            placeholder="you@example.com"
          />
        </CuiStack>
      </Example>

      <!-- Disabled / Readonly -->
      <Example title="Disabled &amp; Readonly">
        <CuiStack spacing="3" class="max-w-md">
          <CuiInput model-value="Can't edit this" disabled placeholder="Disabled" />
          <CuiInput model-value="Read only content" readonly placeholder="Readonly" />
        </CuiStack>
      </Example>

      <!-- Combined: Real-world examples -->
      <Example title="Real-World Combinations">
        <CuiStack spacing="4" class="max-w-lg">
          <div>
            <div class="mb-1 text-sm font-medium">Search with filter</div>
            <CuiInput v-model="search" clearable placeholder="Search users...">
              <template #prefix>🔍</template>
              <template #suffix-button>
                <CuiButton variant="ghost" color="secondary" size="md">Filter</CuiButton>
              </template>
            </CuiInput>
          </div>
          <div>
            <div class="mb-1 text-sm font-medium">Password with strength</div>
            <CuiInput v-model="password" type="password" placeholder="Create a strong password" color="success" />
          </div>
          <div>
            <div class="mb-1 text-sm font-medium">API key (readonly + copy)</div>
            <CuiInput model-value="sk-proj-abc123xyz789" readonly>
              <template #prefix>🔑</template>
              <template #suffix-button>
                <CuiButton variant="solid" size="md" color="primary">Copy</CuiButton>
              </template>
            </CuiInput>
          </div>
        </CuiStack>
      </Example>
    </template>
  </DocPage>
</template>
