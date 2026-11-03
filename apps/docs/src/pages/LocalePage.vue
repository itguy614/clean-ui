<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
import { CuiStack, CuiSelect, CuiConfigProvider, CuiDatePicker, CuiFileUpload, CuiTimePicker, useLocale } from "@itguy614/clean-ui";
import Example from "../components/Example.vue";

const locales = [
  { value: "en", label: "English (en)" },
  { value: "de", label: "Deutsch (de)" },
  { value: "fr", label: "Francais (fr)" },
  { value: "ja", label: "Japanese (ja)" },
];
const locale = ref("de");
const date = ref("2026-10-20");
const time = ref("09:30 AM");

// What the library resolved at this point in the tree, to show beside the demo.
const Resolved = defineComponent({ setup() { const l = useLocale(); return () => h("code", l.value); } });

const setupCode = `// One locale for the whole app
app.use(createCleanUI({ locale: "de" }));

// A subtree
<CuiConfigProvider locale="ja"> ... </CuiConfigProvider>

// No app to hand (a test setup)
configureCleanUI({ locale: "de" });

// Read it
const locale = useLocale(); // ComputedRef<string>`;
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Locale</h1>
      <p class="cui-lead">
        <code class="cui-code">useLocale()</code> returns the locale the library formats in: month and weekday
        names, a day's spoken label, file sizes and the AM/PM labels all go through
        <code>Intl.DateTimeFormat</code> and <code>Intl.NumberFormat</code>, so no translations ship.
      </p>
      <p>
        The locale is the nearest <code>CuiConfigProvider</code>'s <code>locale</code>, else the
        <code>locale</code> given to <code>createCleanUI()</code>, else <code>configureCleanUI({ locale })</code>,
        else the document's <code>lang</code> (read when a component is set up), else <code>en</code>.
        A tag <code>Intl</code> rejects is skipped. On the server there is no document, so the
        configured locale or <code>en</code> applies. The words around the numbers
        (&ldquo;Today&rdquo;, &ldquo;Max&rdquo;) are the message catalogue's, translated through
        <code>CuiConfigProvider</code>'s <code>messages</code> as before.
      </p>
      <p>
        Weeks stay Sunday-first and the numeric tokens of a picker's <code>format</code> are unchanged;
        <code>MMM</code> and <code>MMMM</code> are written (and parsed) in the locale.
        The value a control emits never depends on the locale: dates are ISO, and the time picker emits
        <code>hh:mm AM/PM</code> in every locale.
      </p>
    </div>

    <Example title="Setting it" :code="setupCode">
      <p style="margin: 0">Resolved here: <Resolved /></p>
    </Example>

    <Example title="Live switch" :code="`<CuiConfigProvider :locale=&quot;locale&quot;>
  <CuiDatePicker v-model=&quot;date&quot; format=&quot;D MMMM YYYY&quot; />
  <CuiFileUpload :max-file-size=&quot;1572864&quot; />
  <CuiTimePicker v-model=&quot;time&quot; />
</CuiConfigProvider>`">
      <CuiStack spacing="4">
        <CuiSelect v-model="locale" :options="locales" label="Locale" style="max-width: 16rem" />
        <CuiConfigProvider :locale="locale">
          <CuiStack spacing="4" style="max-width: 28rem">
            <CuiDatePicker v-model="date" format="D MMMM YYYY" label="Date" />
            <CuiTimePicker v-model="time" label="Time" />
            <CuiFileUpload label="Upload" :max-file-size="1572864" />
          </CuiStack>
        </CuiConfigProvider>
      </CuiStack>
    </Example>
  </CuiStack>
</template>
