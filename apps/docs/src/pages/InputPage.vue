<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiFlex, CuiInput, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const text = ref("");
const email = ref("");
const search = ref("");
const password = ref("");
const url = ref("https://");
const errorVal = ref("");
const sized = ref("Hello");
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Input</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Text input with prefix/suffix slots, attached buttons, clearable,
        password visibility toggle, and validation states.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'v-model', type: 'string', default: 'empty string', description: 'Input value' },
          { name: 'type', type: 'text | password | email | url | tel | search', default: 'text', description: 'HTML input type' },
          { name: 'placeholder', type: 'string', default: '-', description: 'Placeholder text' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Focus border color role' },
          { name: 'size', type: 'xs | sm | md | lg | xl', default: 'md', description: 'Input size (matches button scale)' },
          { name: 'clearable', type: 'boolean', default: 'false', description: 'Show clear button when input has value' },
          { name: 'error', type: 'boolean', default: 'false', description: 'Red border error state' },
          { name: 'errorMessage', type: 'string', default: '-', description: 'Error message below input' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'readonly', type: 'boolean', default: 'false', description: 'Readonly state' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Slots</h2>
      <PropTable
        :props="[
          { name: '#prefix', type: 'slot', default: '-', description: 'Icon or text inside the input (left side)' },
          { name: '#suffix', type: 'slot', default: '-', description: 'Icon or text inside the input (right side)' },
          { name: '#prefix-button', type: 'slot', default: '-', description: 'Button merged into the left border' },
          { name: '#suffix-button', type: 'slot', default: '-', description: 'Button merged into the right border' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Input" :code="`<CuiInput v-model=&quot;text&quot; placeholder=&quot;Enter text...&quot; />`">
          <CuiStack spacing="2" class="max-w-md">
            <CuiInput v-model="text" placeholder="Enter some text..." />
            <div class="text-sm text-surface-500">Value: "{{ text }}"</div>
          </CuiStack>
        </Example>

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

      </CuiStack>
    </div>
  </CuiStack>
</template>
