<script setup lang="ts">
import { ref } from "vue";
import {
  CuiButton,
  CuiCheckbox,
  CuiFieldset,
  CuiFlex,
  CuiFormField,
  CuiInput,
  CuiMaskedInput,
  CuiRadio,
  CuiRadioGroup,
  CuiSelect,
  CuiStack,
  CuiToggle,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const name = ref("");
const email = ref("");
const phone = ref("");
const street = ref("");
const city = ref("");
const state = ref<string | null>(null);
const zip = ref("");
const cardNumber = ref("");
const expiry = ref("");
const cvv = ref("");
const shipping = ref("standard");
const newsletter = ref(false);
const smsAlerts = ref(false);
const billingExpanded = ref(true);
const prefsExpanded = ref(false);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Fieldset</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Groups related form fields with a bordered container and legend.
        Supports collapsible sections with animated expand/collapse.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'legend', type: 'string', default: '-', description: 'Legend text (required)' },
          { name: 'description', type: 'string', default: '-', description: 'Description below the legend' },
          { name: 'collapsible', type: 'boolean', default: 'false', description: 'Allow expand/collapse' },
          { name: 'expanded', type: 'boolean', default: 'true', description: 'Expanded state (v-model:expanded)' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable all controls inside' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Fieldset" :code="`<CuiFieldset legend=&quot;Personal Information&quot;>
  <CuiFormField label=&quot;Name&quot;>
    <CuiInput v-model=&quot;name&quot; />
  </CuiFormField>
</CuiFieldset>`">
          <div class="max-w-lg">
            <CuiFieldset legend="Personal Information">
              <CuiFormField label="Full Name" required>
                <CuiInput v-model="name" placeholder="John Doe" />
              </CuiFormField>
              <CuiFormField label="Email" required>
                <CuiInput v-model="email" type="email" placeholder="you@example.com" />
              </CuiFormField>
            </CuiFieldset>
          </div>
        </Example>

        <!-- With Description -->
        <Example title="With Description" :code="`<CuiFieldset legend=&quot;Shipping Address&quot;
  description=&quot;Enter the address for your delivery.&quot;>
  <CuiFormField label=&quot;Street&quot;>
    <CuiInput v-model=&quot;street&quot; placeholder=&quot;123 Main St&quot; />
  </CuiFormField>
</CuiFieldset>`">
          <div class="max-w-lg">
            <CuiFieldset legend="Shipping Address" description="Enter the address where you would like your order delivered.">
              <CuiFormField label="Street">
                <CuiInput v-model="street" placeholder="123 Main St" />
              </CuiFormField>
              <CuiFlex gap="4">
                <CuiFormField label="City" class="flex-1">
                  <CuiInput v-model="city" placeholder="Springfield" />
                </CuiFormField>
                <CuiFormField label="State" class="w-32">
                  <CuiSelect v-model="state" :options="['CA', 'NY', 'TX', 'FL', 'IL']" placeholder="State" />
                </CuiFormField>
                <CuiFormField label="ZIP" class="w-36">
                  <CuiMaskedInput v-model="zip" mask="#####" placeholder="ZIP" />
                </CuiFormField>
              </CuiFlex>
            </CuiFieldset>
          </div>
        </Example>

        <!-- Collapsible -->
        <Example title="Collapsible" :code="`<CuiFieldset legend=&quot;Details&quot; collapsible :expanded=&quot;false&quot;>
  ...
</CuiFieldset>`">
          <CuiStack spacing="4" class="max-w-lg">
            <CuiFieldset
              legend="Billing Information"
              collapsible
              v-model:expanded="billingExpanded"
            >
              <CuiFormField label="Card Number" required>
                <CuiMaskedInput v-model="cardNumber" mask="#### #### #### ####" placeholder="Card number">
                  <template #prefix>💳</template>
                </CuiMaskedInput>
              </CuiFormField>
              <CuiFlex gap="4">
                <CuiFormField label="Expiry" class="flex-1">
                  <CuiMaskedInput v-model="expiry" mask="##/##" placeholder="MM/YY" />
                </CuiFormField>
                <CuiFormField label="CVV" class="w-28">
                  <CuiMaskedInput v-model="cvv" mask="###" placeholder="CVV" />
                </CuiFormField>
              </CuiFlex>
            </CuiFieldset>

            <CuiFieldset
              legend="Preferences"
              description="Optional notification settings"
              collapsible
              v-model:expanded="prefsExpanded"
            >
              <CuiFormField label="Notifications">
                <CuiToggle v-model="newsletter" label="Email newsletter" />
              </CuiFormField>
              <CuiFormField label="SMS">
                <CuiToggle v-model="smsAlerts" label="SMS shipping alerts" />
              </CuiFormField>
            </CuiFieldset>

            <div class="text-sm text-surface-500">
              Billing: {{ billingExpanded ? 'expanded' : 'collapsed' }},
              Preferences: {{ prefsExpanded ? 'expanded' : 'collapsed' }}
            </div>
          </CuiStack>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled" :code="`<CuiFieldset legend=&quot;Locked Section&quot; disabled>
  <CuiFormField label=&quot;Name&quot;>
    <CuiInput model-value=&quot;John Doe&quot; />
  </CuiFormField>
</CuiFieldset>`">
          <div class="max-w-lg">
            <CuiFieldset legend="Locked Section" disabled>
              <CuiFormField label="Name">
                <CuiInput model-value="John Doe" />
              </CuiFormField>
              <CuiFormField label="Email">
                <CuiInput model-value="john@example.com" />
              </CuiFormField>
            </CuiFieldset>
          </div>
        </Example>

        <!-- Nested Fieldsets -->
        <Example title="Nested Fieldsets" :code="`<CuiFieldset legend=&quot;Account Setup&quot;>
  <CuiFormField label=&quot;Username&quot; required>
    <CuiInput v-model=&quot;name&quot; />
  </CuiFormField>
  <CuiFieldset legend=&quot;Contact Details&quot;>
    <CuiFormField label=&quot;Email&quot;>
      <CuiInput v-model=&quot;email&quot; type=&quot;email&quot; />
    </CuiFormField>
  </CuiFieldset>
</CuiFieldset>`">
          <div class="max-w-lg">
            <CuiFieldset legend="Account Setup">
              <CuiFormField label="Username" required>
                <CuiInput v-model="name" placeholder="Choose a username" />
              </CuiFormField>

              <CuiFieldset legend="Contact Details" description="At least one contact method required">
                <CuiFormField label="Email">
                  <CuiInput v-model="email" type="email" placeholder="you@example.com" />
                </CuiFormField>
                <CuiFormField label="Phone">
                  <CuiMaskedInput v-model="phone" mask="+1 (###) ###-####" />
                </CuiFormField>
              </CuiFieldset>
            </CuiFieldset>
          </div>
        </Example>

        <!-- Real-world: Checkout Form -->
        <Example title="Real-World: Checkout Form" :code="`<CuiFieldset legend=&quot;Contact&quot;>
  <CuiFormField label=&quot;Email&quot; required>
    <CuiInput v-model=&quot;email&quot; type=&quot;email&quot; />
  </CuiFormField>
</CuiFieldset>
<CuiFieldset legend=&quot;Payment&quot; collapsible>
  <CuiFormField label=&quot;Card Number&quot; required>
    <CuiMaskedInput v-model=&quot;cardNumber&quot; mask=&quot;#### #### #### ####&quot; />
  </CuiFormField>
</CuiFieldset>`">
          <CuiStack spacing="4" class="max-w-lg">
            <CuiFieldset legend="Contact">
              <CuiFormField label="Email" required>
                <CuiInput v-model="email" type="email" placeholder="you@example.com" />
              </CuiFormField>
              <CuiFormField label="Phone" help-text="For delivery updates">
                <CuiMaskedInput v-model="phone" mask="+1 (###) ###-####" />
              </CuiFormField>
            </CuiFieldset>

            <CuiFieldset legend="Shipping">
              <CuiFormField label="Address" required>
                <CuiInput v-model="street" placeholder="Street address" />
              </CuiFormField>
              <CuiFlex gap="4">
                <CuiFormField label="City" required class="flex-1">
                  <CuiInput v-model="city" />
                </CuiFormField>
                <CuiFormField label="State" class="w-32">
                  <CuiSelect v-model="state" :options="['CA', 'NY', 'TX']" placeholder="..." />
                </CuiFormField>
                <CuiFormField label="ZIP" required class="w-36">
                  <CuiMaskedInput v-model="zip" mask="#####" />
                </CuiFormField>
              </CuiFlex>
              <CuiFormField label="Shipping Method" required>
                <CuiRadioGroup v-model="shipping">
                  <CuiRadio value="standard" label="Standard (5-7 days)" description="Free" />
                  <CuiRadio value="express" label="Express (1-2 days)" description="$12.99" />
                </CuiRadioGroup>
              </CuiFormField>
            </CuiFieldset>

            <CuiFieldset legend="Payment" collapsible>
              <CuiFormField label="Card Number" required>
                <CuiMaskedInput v-model="cardNumber" mask="#### #### #### ####">
                  <template #prefix>💳</template>
                </CuiMaskedInput>
              </CuiFormField>
              <CuiFlex gap="4">
                <CuiFormField label="Expiry" required class="flex-1">
                  <CuiMaskedInput v-model="expiry" mask="##/##" placeholder="MM/YY" />
                </CuiFormField>
                <CuiFormField label="CVV" required class="w-28">
                  <CuiMaskedInput v-model="cvv" mask="###" />
                </CuiFormField>
              </CuiFlex>
            </CuiFieldset>

            <CuiFlex gap="3">
              <CuiButton variant="solid" color="success" size="lg">Place Order</CuiButton>
              <CuiButton variant="ghost" color="secondary">Back to Cart</CuiButton>
            </CuiFlex>
          </CuiStack>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
