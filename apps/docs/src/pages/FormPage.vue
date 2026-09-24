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
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/form";

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
  <DocPage :meta="meta">
    <template #intro>
      <CuiCard variant="outline">
        <CuiCardHeader title="How field binding works" />
        <CuiCardBody>
          <p class="text-sm" style="color: var(--cui-text-secondary);">
            Give <code class="cui-code">CuiFormField</code> a <code class="cui-code">name</code> and
            nest it in a <code class="cui-code">CuiForm</code>. The field then exposes ready-to-bind
            props through its default slot — spread them onto any Cui field component with
            <code class="cui-code">v-bind</code>. Nothing else injects the form context: the field
            components stay standalone, and only <code class="cui-code">CuiFormField</code> knows
            the form exists.
          </p>
          <pre class="cui-pre" style="margin-top: 0.75rem;"><code class="cui-code">&lt;CuiForm :resolver="resolver" v-model="values" @submit="save"&gt;
  &lt;CuiFormField name="email" label="Email" v-slot="f"&gt;
    &lt;CuiInput v-bind="f" type="email" /&gt;
  &lt;/CuiFormField&gt;
&lt;/CuiForm&gt;

// f = { id, ariaLabelledby, ariaDescribedby, modelValue,
//       "onUpdate:modelValue", error, disabled, readonly }
// CuiFormField renders the label + error message; the field shows the red border.</code></pre>
        </CuiCardBody>
      </CuiCard>
    </template>

    <template #usage>
      <Example
        code-open
        :code="`<CuiForm :resolver=&quot;resolver&quot; v-model=&quot;values&quot;
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

// validates on submit, then live-revalidates each field as you fix it`"
      >
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
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The root is a real <code>&lt;form&gt;</code>, so a submit button of
        <code>type="submit"</code> works and <code>Enter</code> in a text field submits —
        neither needs a click handler. It carries <code>novalidate</code>, which turns off
        the browser's own bubbles so validation speaks with one voice: your resolver's,
        rendered by <code>CuiFormField</code> and pointed at by
        <code>aria-describedby</code>.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Because the native validation UI is off, a required field is only required as
          far as your resolver says so. <code>CuiFormField</code>'s
          <code>required</code> prop draws the marker; it does not set
          <code>required</code> or <code>aria-required</code> on the control. Pass that to
          the control yourself when it matters.
        </li>
        <li>
          Nothing moves focus on an invalid submit, and no error is announced. Handle
          <code>submit-invalid</code> and focus the first failing field — you have the
          error map, and the field ids are the ones you gave
          <code>CuiFormField</code> through <code>for</code>.
        </li>
        <li>
          <code>submitting</code> comes off the default slot, so a submit button can be
          disabled for the whole round trip without a flag of your own. Concurrent submits
          are refused internally as well.
        </li>
        <li>
          <code>disabled</code> and <code>readonly</code> on the form reach only
          name-bound fields, via the slot bindings. To disable a whole section including
          unbound controls, use <code>CuiFieldset</code>'s native
          <code>disabled</code> instead.
        </li>
        <li>
          A field that unmounts drops its error from the map, so a conditionally-shown
          field cannot leave behind an error nobody can act on.
        </li>
      </ul>
    </template>

    <template #extra>
      <div>
        <h2 id="validation-recipes" class="mb-4 text-2xl font-semibold">Validation recipes</h2>
        <CuiStack spacing="4">
          <p class="text-surface-600 dark:text-surface-400">
            <code>resolver</code> is one function with one shape — values in, an errors map
            out. Anything that can produce that map works, so the choice of validation
            library stays yours and is not baked into the component.
          </p>

          <CuiCard variant="outline">
            <CuiCardHeader title="zod" />
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
            <CuiCardHeader title="valibot" />
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
            <CuiCardHeader title="No library — hand-write it" />
            <CuiCardBody>
              <pre class="cui-pre"><code class="cui-code">function resolver(values) {
  const errors = {};
  if (!values.email) errors.email = "Email is required";
  if (!values.role) errors.role = "Pick a role";
  return errors; // {} means valid
}</code></pre>
              <p class="mt-3 text-sm" style="color: var(--cui-text-secondary);">
                A resolver validates the whole object each time it runs, so under
                <code class="cui-code">validateOn="change"</code> it runs once per
                keystroke — keep it synchronous and cheap, or stay on
                <code class="cui-code">"submit"</code>.
              </p>
            </CuiCardBody>
          </CuiCard>
        </CuiStack>
      </div>
    </template>

    <template #examples>
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
          The demo simulates the request (≈900ms). The submit button is driven by the
          form's <code class="cui-code">submitting</code> state, and a “taken” email
          returns a 422 that lands on the Email field via
          <code class="cui-code">setErrors</code> — which also bumps the validation token,
          so an in-flight resolver run cannot wipe the server's message.
        </p>
      </Example>
    </template>
  </DocPage>
</template>
