<script setup lang="ts">
import { ref } from "vue";
import {
  CuiForm,
  CuiFormField,
  CuiInput,
  CuiSelect,
  CuiButton,
  CuiStack,
  CuiCard,
  CuiCardBody,
  CuiCardHeader,
  CuiAlert,
  type FormValues,
  type FormErrors,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import EventTable from "../components/EventTable.vue";
import Example from "../components/Example.vue";

const roleOptions = [
  { value: "engineering", label: "Engineering" },
  { value: "design", label: "Design" },
  { value: "product", label: "Product" },
];

// A plain hand-written resolver — no validation library needed. Returns an
// errors map keyed by field name; an empty object means "valid".
function resolver(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const email = String(values.email ?? "");
  const password = String(values.password ?? "");
  if (!email) errors.email = "Email is required";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Enter a valid email";
  if (!values.role) errors.role = "Pick a role";
  if (password.length < 8) errors.password = "Must be at least 8 characters";
  return errors;
}

const formValues = ref<FormValues>({ email: "", role: null, password: "" });
const result = ref("(submit the form)");

function onSubmit(values: FormValues) {
  result.value = `✅ Submitted: ${JSON.stringify(values)}`;
}
function onInvalid(errors: FormErrors) {
  result.value = `❌ Invalid: ${Object.keys(errors).length} field(s) need attention`;
}

// --- AJAX submit example -----------------------------------------------------
// Template ref to the form so we can map server errors back onto the fields.
const ajaxForm = ref<{ setErrors: (e: FormErrors) => void; reset: () => void } | null>(null);
const ajaxValues = ref<FormValues>({ email: "", username: "" });
const ajaxResult = ref("(submit to POST — try taken@example.com)");

function ajaxResolver(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.email) errors.email = "Email is required";
  if (!values.username) errors.username = "Username is required";
  return errors;
}

// Stands in for a real `fetch` — returns 201, or a 422 with field errors when
// the email is "taken", so the demo works offline.
function fakePost(values: FormValues): Promise<{ ok: boolean; status: number; errors?: FormErrors }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (values.email === "taken@example.com") {
        resolve({ ok: false, status: 422, errors: { email: "That email is already registered" } });
      } else {
        resolve({ ok: true, status: 201 });
      }
    }, 900);
  });
}

async function onAjaxSubmit(values: FormValues) {
  ajaxResult.value = "⏳ POSTing…";
  try {
    const res = await fakePost(values);
    if (res.ok) {
      ajaxResult.value = `✅ Created (HTTP ${res.status})`;
      ajaxForm.value?.reset();
    } else if (res.status === 422 && res.errors) {
      ajaxForm.value?.setErrors(res.errors);
      ajaxResult.value = "❌ Server rejected the form (422) — see the field errors";
    }
  } catch {
    ajaxResult.value = "❌ Network error — please try again";
  }
}
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Form</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        <code class="cui-code">CuiForm</code> adds a form-level layer over the field components:
        value tracking, error aggregation, submit handling, and a library-agnostic validation
        hook. Fields stay fully usable standalone — the form binding is opt-in via a
        <code class="cui-code">name</code> on <code class="cui-code">CuiFormField</code>.
      </p>
    </div>

    <!-- How binding works -->
    <CuiCard variant="outline">
      <CuiCardHeader title="How field binding works" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          Give <code class="cui-code">CuiFormField</code> a <code class="cui-code">name</code> and
          nest it in a <code class="cui-code">CuiForm</code>. The field then exposes ready-to-bind
          props through its default slot — spread them onto any Cui field component with
          <code class="cui-code">v-bind</code>:
        </p>
        <pre class="cui-pre" style="margin-top: 0.75rem;"><code class="cui-code">&lt;CuiForm :resolver="resolver" v-model="values" @submit="save"&gt;
  &lt;CuiFormField name="email" label="Email" v-slot="f"&gt;
    &lt;CuiInput v-bind="f" type="email" /&gt;
  &lt;/CuiFormField&gt;
&lt;/CuiForm&gt;

// f = { id, modelValue, "onUpdate:modelValue", error, disabled }
// CuiFormField renders the label + error message; the field shows the red border.</code></pre>
      </CuiCardBody>
    </CuiCard>

    <!-- CuiForm props -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiForm Props</h2>
      <PropTable
        :props="[
          { name: 'modelValue', type: 'FormValues', default: '{}', description: 'Form values (v-model). Seeds initial values and stays in sync.' },
          { name: 'resolver', type: '(values) => FormErrors | Promise<FormErrors>', default: '—', description: 'Library-agnostic validation. Returns an errors map keyed by field name; {} = valid.' },
          { name: 'validateOn', type: 'submit | change', default: 'submit', description: '\'submit\' validates on submit then revalidates a field on change; \'change\' validates eagerly from the first keystroke.' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable every bound field.' },
          { name: 'readonly', type: 'boolean', default: 'false', description: 'Mark every bound field readonly.' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the form (v-show).' },
        ]"
      />
      <p class="mt-3 text-sm" style="color: var(--cui-text-secondary);">
        Exposes via <code class="cui-code">ref</code>: <code class="cui-code">validate()</code>,
        <code class="cui-code">reset(values?)</code>, <code class="cui-code">submit()</code>,
        <code class="cui-code">setErrors(errors)</code> (for server-side errors),
        plus reactive <code class="cui-code">values</code>, <code class="cui-code">errors</code>, and
        <code class="cui-code">submitting</code>. The default slot also receives
        <code class="cui-code">{ values, errors, submitted, submitting }</code>.
      </p>
    </div>

    <!-- New CuiFormField props -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiFormField — form binding</h2>
      <PropTable
        :props="[
          { name: 'name', type: 'string', default: '—', description: 'Field name. With a name + a parent CuiForm, the field auto-binds value & error. Omit to use standalone.' },
        ]"
      />
      <p class="mt-3 text-sm" style="color: var(--cui-text-secondary);">
        All existing <code class="cui-code">CuiFormField</code> props (<code class="cui-code">label</code>,
        <code class="cui-code">required</code>, <code class="cui-code">helpText</code>,
        <code class="cui-code">error</code>, <code class="cui-code">errorMessage</code>, …) still work.
        When form-bound, <code class="cui-code">error</code>/<code class="cui-code">errorMessage</code>
        come from the form and the manual props are ignored.
      </p>
    </div>

    <!-- Events -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Events</h2>
      <EventTable
        :events="[
          { name: 'submit', payload: 'FormValues', description: 'Fires after a submit that passed validation' },
          { name: 'submit-invalid', payload: 'FormErrors', description: 'Fires after a submit that failed validation' },
          { name: 'update:modelValue', payload: 'FormValues', description: 'Fires whenever a bound field changes' },
        ]"
      />
    </div>

    <!-- Live example -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">
        <Example title="Validated form" :code="`<CuiForm :resolver=&quot;resolver&quot; v-model=&quot;values&quot;
  @submit=&quot;onSubmit&quot; @submit-invalid=&quot;onInvalid&quot;>
  <CuiFormField name=&quot;email&quot; label=&quot;Email&quot; required v-slot=&quot;f&quot;>
    <CuiInput v-bind=&quot;f&quot; type=&quot;email&quot; placeholder=&quot;you@example.com&quot; />
  </CuiFormField>

  <CuiFormField name=&quot;role&quot; label=&quot;Role&quot; required v-slot=&quot;f&quot;>
    <CuiSelect v-bind=&quot;f&quot; :options=&quot;roleOptions&quot; placeholder=&quot;Choose…&quot; />
  </CuiFormField>

  <CuiFormField name=&quot;password&quot; label=&quot;Password&quot; required
    help-text=&quot;At least 8 characters&quot; v-slot=&quot;f&quot;>
    <CuiInput v-bind=&quot;f&quot; type=&quot;password&quot; />
  </CuiFormField>

  <CuiButton type=&quot;submit&quot; variant=&quot;solid&quot;>Create account</CuiButton>
</CuiForm>

// validates on submit, then live-revalidates each field as you fix it`">
          <CuiForm
            :resolver="resolver"
            v-model="formValues"
            @submit="onSubmit"
            @submit-invalid="onInvalid"
          >
            <CuiStack spacing="4">
              <CuiFormField name="email" label="Email" required v-slot="f">
                <CuiInput v-bind="f" type="email" placeholder="you@example.com" />
              </CuiFormField>

              <CuiFormField name="role" label="Role" required v-slot="f">
                <CuiSelect v-bind="f" :options="roleOptions" placeholder="Choose…" />
              </CuiFormField>

              <CuiFormField name="password" label="Password" required help-text="At least 8 characters" v-slot="f">
                <CuiInput v-bind="f" type="password" />
              </CuiFormField>

              <div>
                <CuiButton type="submit" variant="solid" color="primary">Create account</CuiButton>
              </div>

              <CuiAlert :color="result.startsWith('✅') ? 'success' : result.startsWith('❌') ? 'error' : 'info'" variant="subtle" :title="result" />
            </CuiStack>
          </CuiForm>
        </Example>

        <Example title="AJAX submit (loading state + server errors)" :code="`<script setup>
const form = ref()
const values = ref({ email: '', username: '' })

async function onSubmit(values) {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  if (res.ok) {
    form.value.reset()           // success — toast / navigate / reset
    return
  }
  if (res.status === 422) {
    // map server-side field errors back onto the form
    const { errors } = await res.json()   // { email: 'Already registered' }
    form.value.setErrors(errors)
  }
}
&lt;/script>

<template>
  <CuiForm ref=&quot;form&quot; :resolver=&quot;resolver&quot; v-model=&quot;values&quot;
           @submit=&quot;onSubmit&quot; v-slot=&quot;{ submitting }&quot;>
    <CuiFormField name=&quot;email&quot; label=&quot;Email&quot; required v-slot=&quot;f&quot;>
      <CuiInput v-bind=&quot;f&quot; type=&quot;email&quot; />
    </CuiFormField>
    <CuiFormField name=&quot;username&quot; label=&quot;Username&quot; required v-slot=&quot;f&quot;>
      <CuiInput v-bind=&quot;f&quot; />
    </CuiFormField>
    <!-- submitting comes from the form — no manual loading flag -->
    <CuiButton type=&quot;submit&quot; :disabled=&quot;submitting&quot;>
      {{ submitting ? 'Saving…' : 'Create account' }}
    </CuiButton>
  </CuiForm>
</template>`">
          <CuiForm
            ref="ajaxForm"
            :resolver="ajaxResolver"
            v-model="ajaxValues"
            @submit="onAjaxSubmit"
            v-slot="{ submitting }"
          >
            <CuiStack spacing="4">
              <CuiFormField name="email" label="Email" required help-text="Use taken@example.com to see a 422 mapped back" v-slot="f">
                <CuiInput v-bind="f" type="email" placeholder="you@example.com" />
              </CuiFormField>

              <CuiFormField name="username" label="Username" required v-slot="f">
                <CuiInput v-bind="f" placeholder="yourhandle" />
              </CuiFormField>

              <div>
                <CuiButton type="submit" variant="solid" color="primary" :disabled="submitting">
                  {{ submitting ? "Saving…" : "Create account" }}
                </CuiButton>
              </div>

              <CuiAlert :color="ajaxResult.startsWith('✅') ? 'success' : ajaxResult.startsWith('❌') ? 'error' : 'info'" variant="subtle" :title="ajaxResult" />
            </CuiStack>
          </CuiForm>
          <p class="mt-2 text-sm" style="color: var(--cui-text-secondary);">
            The live demo simulates the request (≈900ms) — the submit button is driven by the
            form's <code class="cui-code">submitting</code> state, and a “taken” email returns a
            422 that maps onto the Email field via <code class="cui-code">setErrors</code>.
          </p>
        </Example>

        <!-- Validation recipes -->
        <CuiCard variant="outline">
          <CuiCardHeader title="Validation recipe: zod" />
          <CuiCardBody>
            <pre class="cui-pre"><code class="cui-code">import { z } from "zod";
import { CuiForm, zodResolver } from "@itguy614/clean-ui";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.string().min(1, "Pick a role"),
  password: z.string().min(8, "Must be at least 8 characters"),
});

const resolver = zodResolver(schema);
// &lt;CuiForm :resolver="resolver" /&gt;</code></pre>
          </CuiCardBody>
        </CuiCard>

        <CuiCard variant="outline">
          <CuiCardHeader title="Validation recipe: valibot" />
          <CuiCardBody>
            <pre class="cui-pre"><code class="cui-code">import * as v from "valibot";
import { CuiForm, valibotResolver } from "@itguy614/clean-ui";

const schema = v.object({
  email: v.pipe(v.string(), v.email("Enter a valid email")),
  role: v.pipe(v.string(), v.minLength(1, "Pick a role")),
  password: v.pipe(v.string(), v.minLength(8, "Must be at least 8 characters")),
});

const resolver = valibotResolver((values) => v.safeParse(schema, values));
// &lt;CuiForm :resolver="resolver" /&gt;</code></pre>
          </CuiCardBody>
        </CuiCard>

        <CuiCard variant="outline">
          <CuiCardHeader title="No library? Hand-write a resolver" />
          <CuiCardBody>
            <pre class="cui-pre"><code class="cui-code">function resolver(values) {
  const errors = {};
  if (!values.email) errors.email = "Email is required";
  if (!values.role) errors.role = "Pick a role";
  return errors; // {} means valid
}</code></pre>
          </CuiCardBody>
        </CuiCard>
      </CuiStack>
    </div>
  </CuiStack>
</template>
