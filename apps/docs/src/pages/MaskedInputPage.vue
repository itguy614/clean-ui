<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiFlex, CuiMaskedInput, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const ssn = ref("");
const phone = ref("");
const creditCard = ref("");
const date = ref("");
const hex = ref("");
const zip = ref("");
const license = ref("");
const errorVal = ref("");

const ssnFormatted = ref("");
const phoneFormatted = ref("");
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Masked Input</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Input with a format mask that guides user entry. Wraps
        <code class="cui-code">CuiInput</code> and inherits all its features.
        Returns raw value via <code class="cui-code">v-model</code> and
        formatted value via <code class="cui-code">update:formattedValue</code>.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'v-model', type: 'string', default: 'empty string', description: 'Raw value (no separators)' },
          { name: 'mask', type: 'string', default: '-', description: 'Mask pattern: # = digit, A = letter, * = alphanumeric' },
          { name: 'placeholder', type: 'string', default: '-', description: 'Placeholder text shown when empty and unfocused' },
          { name: 'tokens', type: 'Record<string, { pattern: RegExp }>', default: '-', description: 'Custom token definitions' },
          { name: 'fillChar', type: 'string', default: '_', description: 'Character for unfilled positions' },
          { name: 'color', type: 'ButtonColor', default: 'primary', description: 'Focus border color' },
          { name: 'size', type: 'xs | sm | md | lg | xl', default: 'md', description: 'Input size' },
          { name: 'clearable', type: 'boolean', default: 'false', description: 'Show clear button' },
          { name: 'error', type: 'boolean', default: 'false', description: 'Error state' },
          { name: 'errorMessage', type: 'string', default: '-', description: 'Error message' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'readonly', type: 'boolean', default: 'false', description: 'Readonly state' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Mask Tokens</h2>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-surface-200 dark:border-surface-700">
              <th class="py-2 pr-4 text-left font-semibold">Token</th>
              <th class="py-2 pr-4 text-left font-semibold">Matches</th>
              <th class="py-2 text-left font-semibold">Example</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-surface-100 dark:border-surface-800">
              <td class="py-2 pr-4 font-mono font-medium">#</td>
              <td class="py-2 pr-4">Any digit (0-9)</td>
              <td class="py-2 font-mono text-surface-500">###-##-#### → SSN</td>
            </tr>
            <tr class="border-b border-surface-100 dark:border-surface-800">
              <td class="py-2 pr-4 font-mono font-medium">A</td>
              <td class="py-2 pr-4">Any letter (a-z, A-Z)</td>
              <td class="py-2 font-mono text-surface-500">AAA-#### → License plate</td>
            </tr>
            <tr class="border-b border-surface-100 dark:border-surface-800">
              <td class="py-2 pr-4 font-mono font-medium">*</td>
              <td class="py-2 pr-4">Any alphanumeric</td>
              <td class="py-2 font-mono text-surface-500">**-****-** → Flexible code</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono font-medium">Other</td>
              <td class="py-2 pr-4">Literal (auto-inserted)</td>
              <td class="py-2 font-mono text-surface-500">( ) - + / are separators</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- SSN -->
        <Example title="Social Security Number" :code="`<CuiMaskedInput v-model=&quot;ssn&quot; mask=&quot;###-##-####&quot; />`">
          <CuiStack spacing="2" class="max-w-sm">
            <CuiMaskedInput
              v-model="ssn"
              mask="###-##-####"
              placeholder="SSN"
              @update:formatted-value="ssnFormatted = $event"
            />
            <div class="text-sm text-surface-500">Raw: "{{ ssn }}" | Formatted: "{{ ssnFormatted }}"</div>
          </CuiStack>
        </Example>

        <!-- Phone -->
        <Example title="Phone Number" :code="`<CuiMaskedInput v-model=&quot;phone&quot; mask=&quot;+1 (###) ###-####&quot; />`">
          <CuiStack spacing="2" class="max-w-sm">
            <CuiMaskedInput
              v-model="phone"
              mask="+1 (###) ###-####"
              placeholder="Phone"
              @update:formatted-value="phoneFormatted = $event"
            >
              <template #prefix>📞</template>
            </CuiMaskedInput>
            <div class="text-sm text-surface-500">Raw: "{{ phone }}" | Formatted: "{{ phoneFormatted }}"</div>
          </CuiStack>
        </Example>

        <!-- Credit Card -->
        <Example title="Credit Card" :code="`<CuiMaskedInput v-model=&quot;cc&quot; mask=&quot;#### #### #### ####&quot; />`">
          <CuiStack spacing="2" class="max-w-sm">
            <CuiMaskedInput
              v-model="creditCard"
              mask="#### #### #### ####"
              placeholder="Card number"
            >
              <template #prefix>💳</template>
            </CuiMaskedInput>
            <div class="text-sm text-surface-500">Raw: "{{ creditCard }}"</div>
          </CuiStack>
        </Example>

        <!-- Date -->
        <Example title="Date (MM/DD/YYYY)" :code="`<CuiMaskedInput v-model=&quot;date&quot; mask=&quot;##/##/####&quot; />`">
          <CuiStack spacing="2" class="max-w-xs">
            <CuiMaskedInput
              v-model="date"
              mask="##/##/####"
              placeholder="Date"
            >
              <template #prefix>📅</template>
            </CuiMaskedInput>
            <div class="text-sm text-surface-500">Raw: "{{ date }}"</div>
          </CuiStack>
        </Example>

        <!-- License Plate (letters + digits) -->
        <Example title="License Plate (AAA-####)" :code="`<CuiMaskedInput v-model=&quot;plate&quot; mask=&quot;AAA-####&quot; />`">
          <CuiStack spacing="2" class="max-w-xs">
            <CuiMaskedInput
              v-model="license"
              mask="AAA-####"
              placeholder="License plate"
            />
            <div class="text-sm text-surface-500">Raw: "{{ license }}"</div>
          </CuiStack>
        </Example>

        <!-- ZIP Code -->
        <Example title="ZIP Code (5+4)" :code="`<CuiMaskedInput v-model=&quot;zip&quot; mask=&quot;#####-####&quot; placeholder=&quot;ZIP code&quot; />`">
          <CuiStack spacing="2" class="max-w-xs">
            <CuiMaskedInput
              v-model="zip"
              mask="#####-####"
              placeholder="ZIP code"
            />
            <div class="text-sm text-surface-500">Raw: "{{ zip }}"</div>
          </CuiStack>
        </Example>

        <!-- Custom Token: Hex Color -->
        <Example title="Custom Token — Hex Color Code" :code="`<CuiMaskedInput
  v-model=&quot;hex&quot;
  mask=&quot;#HHHHHH&quot;
  :tokens=&quot;{ H: { pattern: /[0-9a-fA-F]/ } }&quot;
/>`">
          <CuiStack spacing="2" class="max-w-xs">
            <CuiMaskedInput
              v-model="hex"
              mask="\#HHHHHH"
              :tokens="{ H: { pattern: /[0-9a-fA-F]/ } }"
              placeholder="Hex color"
            >
              <template #prefix>
                <span
                  class="inline-block h-4 w-4 rounded-sm border border-surface-300"
                  :style="{ background: hex.length === 6 ? `#${hex}` : '#ccc' }"
                />
              </template>
            </CuiMaskedInput>
            <div class="text-sm text-surface-500">Raw: "{{ hex }}" → #{{ hex || '______' }}</div>
          </CuiStack>
        </Example>

        <!-- Fill Character -->
        <Example title="Custom Fill Character" :code="`<CuiMaskedInput mask=&quot;###-###&quot; fill-char=&quot;•&quot; />`">
          <CuiStack spacing="3" class="max-w-xs">
            <CuiMaskedInput mask="###-###" fill-char="•" placeholder="Dots" />
            <CuiMaskedInput mask="##/##/####" fill-char=" " placeholder="Spaces" />
          </CuiStack>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes" :code="`<CuiMaskedInput mask=&quot;###-##-####&quot; size=&quot;sm&quot; placeholder=&quot;Small&quot; />
<CuiMaskedInput mask=&quot;###-##-####&quot; size=&quot;md&quot; placeholder=&quot;Medium&quot; />
<CuiMaskedInput mask=&quot;###-##-####&quot; size=&quot;lg&quot; placeholder=&quot;Large&quot; />`">
          <CuiStack spacing="3" class="max-w-sm">
            <CuiMaskedInput mask="###-##-####" size="sm" placeholder="Small" />
            <CuiMaskedInput mask="###-##-####" size="md" placeholder="Medium" />
            <CuiMaskedInput mask="###-##-####" size="lg" placeholder="Large" />
          </CuiStack>
        </Example>

        <!-- With Attached Button -->
        <Example title="With Attached Button" :code="`<CuiMaskedInput v-model=&quot;phone&quot; mask=&quot;+1 (###) ###-####&quot; clearable>
  <template #prefix>📞</template>
  <template #suffix-button>
    <CuiButton variant=&quot;solid&quot; color=&quot;success&quot;>Verify</CuiButton>
  </template>
</CuiMaskedInput>`">
          <CuiStack spacing="2" class="max-w-md">
            <CuiMaskedInput v-model="phone" mask="+1 (###) ###-####" clearable placeholder="Phone">
              <template #prefix>📞</template>
              <template #suffix-button>
                <CuiButton variant="solid" size="md" color="success">Verify</CuiButton>
              </template>
            </CuiMaskedInput>
          </CuiStack>
        </Example>

        <!-- Error -->
        <Example title="Error Validation" :code="`<CuiMaskedInput v-model=&quot;errorVal&quot; mask=&quot;###-##-####&quot;
  error error-message=&quot;SSN is required&quot; placeholder=&quot;SSN&quot; />`">
          <CuiStack spacing="3" class="max-w-sm">
            <CuiMaskedInput
              v-model="errorVal"
              mask="###-##-####"
              error
              error-message="SSN is required"
              placeholder="SSN"
            />
          </CuiStack>
        </Example>

        <!-- Disabled / Readonly -->
        <Example title="Disabled &amp; Readonly" :code="`<CuiMaskedInput model-value=&quot;123456789&quot; mask=&quot;###-##-####&quot; disabled />
<CuiMaskedInput model-value=&quot;5551234567&quot; mask=&quot;+1 (###) ###-####&quot; readonly />`">
          <CuiStack spacing="3" class="max-w-sm">
            <CuiMaskedInput model-value="123456789" mask="###-##-####" disabled />
            <CuiMaskedInput model-value="5551234567" mask="+1 (###) ###-####" readonly />
          </CuiStack>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
