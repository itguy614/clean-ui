<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiCard, CuiCardBody, CuiMaskedInput, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/masked-input";

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
  <DocPage :meta="meta">
    <template #intro>
      <CuiCard variant="outline">
        <CuiCardBody>
          <p class="text-sm text-surface-700 dark:text-surface-300">
            <strong>Two values, not one.</strong> <code>v-model</code> is the
            <em>raw</em> value — just the characters the tokens matched, with every
            separator stripped, which is what you store and send. The formatted value, with
            its separators and fill characters, is what the field displays; read it with
            <code>v-model:formattedValue</code> when you need it for display elsewhere.
          </p>
        </CuiCardBody>
      </CuiCard>
    </template>

    <template #usage>
      <Example
        code-open
        :code="`<CuiMaskedInput
  v-model=&quot;ssn&quot;
  mask=&quot;###-##-####&quot;
  placeholder=&quot;SSN&quot;
  @update:formatted-value=&quot;ssnFormatted = $event&quot;
/>`"
      >
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
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The field is an ordinary <code>CuiInput</code> underneath — a real
        <code>&lt;input type="text"&gt;</code> — so focus, selection and
        <code>aria-invalid</code> behave exactly as they do there. What the mask changes is
        the <em>value</em>: the separators and the fill characters are really in the input,
        not drawn beside it, so a screen reader reads them out.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <code>id</code>, <code>name</code>, <code>autocomplete</code>,
          <code>aria-describedby</code> and <code>aria-labelledby</code> are forwarded to
          the native input, so a <code>&lt;label for&gt;</code> pointing at
          <code>id</code> forms a real association — as does
          <code>CuiFormField</code>'s <code>v-bind="f"</code>.
        </li>
        <li>
          Say what the format is in text, not only in the mask. A reader who hears
          “underscore underscore underscore dash underscore underscore” learns nothing;
          “Social Security number, nine digits” does. Put it in
          <code>CuiFormField</code>'s help text so it reaches
          <code>aria-describedby</code>.
        </li>
        <li>
          Typing is filtered, not rejected silently at the field level: a character that
          does not match the token at the caret is simply not inserted, and the caret does
          not move. Pair the mask with a real validation message rather than relying on the
          filtering to explain itself.
        </li>
        <li>
          <code>fillChar</code> is part of the value. Setting it to a space
          (<code>fill-char=" "</code>) leaves the field quieter for a screen reader than
          the default underscore, at the cost of a less obvious format on screen.
        </li>
        <li>
          Set <code>autocomplete</code> where it applies — <code>tel</code>,
          <code>cc-number</code>, <code>postal-code</code>. The browser fills the raw
          characters and the mask formats them (WCAG 1.3.5).
        </li>
      </ul>
    </template>

    <template #extra>
      <div>
        <h2 id="mask-tokens" class="mb-4 text-2xl font-semibold">Mask tokens</h2>
        <CuiCard variant="outline">
          <CuiCardBody>
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
                  <tr class="border-b border-surface-100 dark:border-surface-800">
                    <td class="py-2 pr-4 font-mono font-medium">\</td>
                    <td class="py-2 pr-4">Escapes the next character as a literal</td>
                    <td class="py-2 font-mono text-surface-500">\#HHHHHH → a literal #</td>
                  </tr>
                  <tr>
                    <td class="py-2 pr-4 font-mono font-medium">Other</td>
                    <td class="py-2 pr-4">Literal (auto-inserted)</td>
                    <td class="py-2 font-mono text-surface-500">( ) - + / are separators</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="mt-4 text-sm text-surface-600 dark:text-surface-400">
              <code>tokens</code> is merged <em>over</em> the built-ins, so
              <code>{ '#': { pattern: /[0-9a-f]/ } }</code> redefines <code>#</code> rather
              than adding a sixth token. Pick a letter the mask does not otherwise use.
            </p>
          </CuiCardBody>
        </CuiCard>
      </div>
    </template>

    <template #examples>
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
  mask=&quot;\\#HHHHHH&quot;
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
    </template>
  </DocPage>
</template>
