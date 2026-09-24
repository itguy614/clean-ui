<script setup lang="ts">
import { ref } from "vue";
import { CuiFlex, CuiTimePicker } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/time-picker";

const time1 = ref("09:30 AM");
const time2 = ref("14:45");
const time3 = ref("");
const time4 = ref("02:00 PM");
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiTimePicker v-model=&quot;time&quot; label=&quot;Start Time&quot; />`"
      >
        <CuiFlex gap="4" class="items-start">
          <CuiTimePicker v-model="time1" label="Start Time" />
          <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
            Value: <code class="cui-code">{{ time1 || 'empty' }}</code>
          </div>
        </CuiFlex>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The trigger is a <code>div</code> with <code>role="combobox"</code>,
        <code>aria-haspopup="dialog"</code> and <code>aria-expanded</code>, in the tab
        order at <code>tabindex="0"</code> — and out of it when <code>disabled</code>.
        Inside the panel, the hour and minute fields are real
        <code>role="spinbutton"</code> inputs with
        <code>aria-valuenow</code>/<code>-valuemin</code>/<code>-valuemax</code>.
      </p>

      <p class="text-surface-700 dark:text-surface-300">
        <strong>Opening and closing.</strong> <code>Enter</code>, <code>Space</code> or
        <code>↓</code> opens the panel; <code>Escape</code> closes it. Opening moves focus
        into the hours field — the panel is teleported to <code>&lt;body&gt;</code>, so it
        sits nowhere near the trigger in tab order, and leaving focus behind meant
        <code>Tab</code> went off to whatever follows the component in the document.
        Closing returns focus to the trigger.
      </p>

      <p class="text-surface-700 dark:text-surface-300">
        <strong>Inside the panel.</strong> <code>↑</code>/<code>↓</code> step by one,
        <code>PageUp</code>/<code>PageDown</code> by ten steps, <code>Home</code>/<code>End</code>
        jump to that field's bounds — all honouring <code>minuteStep</code> and wrapping at
        the ends. <code>←</code>/<code>→</code> move between hour, minute and AM/PM the way
        the segments of a native <code>&lt;input type="time"&gt;</code> do, stopping at the
        ends rather than wrapping. <code>Enter</code> commits and closes.
      </p>

      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <code>Tab</code> also moves between the fields. The stepper's <code>+</code> and
          <code>−</code> buttons are not tab stops — the input is the control and is fully
          keyboard-operable, which is how a native number input treats its spinners — so
          <code>Tab</code> goes straight from hour to minute.
        </li>
        <li>
          <code>Enter</code> on an AM/PM button is not prevented: a button's click is the
          default action of <code>Enter</code>, so swallowing it would swallow the AM/PM
          change. The close is deferred a frame instead, and both happen.
        </li>
        <li>
          Because the trigger is a <code>div</code>, a <code>&lt;label for&gt;</code> forms
          no association with it. <code>aria-labelledby</code> is what actually names it,
          which is why the component takes that prop and why
          <code>CuiFormField</code> is the easiest way to supply it.
        </li>
        <li>
          Every value change emits immediately, not only on close — a picker abandoned
          mid-edit still leaves <code>v-model</code> consistent with what is on screen.
        </li>
      </ul>

      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> The <code>label</code> prop renders plain text that
        names nothing. Use <code>CuiFormField</code>, or pass
        <code>aria-labelledby</code> pointing at your own label element.
      </p>
    </template>

    <template #examples>
      <!-- 24-hour -->
      <Example title="24-Hour Clock" :code="`<CuiTimePicker v-model=&quot;time&quot; format=&quot;24&quot; />`">
        <CuiFlex gap="4" class="items-start">
          <CuiTimePicker v-model="time2" format="24" label="Departure" />
          <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
            Value: <code class="cui-code">{{ time2 || 'empty' }}</code>
          </div>
        </CuiFlex>
      </Example>

      <!-- 15-minute steps -->
      <Example title="15-Minute Steps" :code="`<CuiTimePicker :minute-step=&quot;15&quot; />`">
        <CuiTimePicker v-model="time3" :minute-step="15" label="Meeting Slot" />
      </Example>

      <!-- Side by side -->
      <Example title="Side by Side: 12h vs 24h" :code="`<CuiTimePicker v-model=&quot;time&quot; label=&quot;12-Hour&quot; />
<CuiTimePicker v-model=&quot;time&quot; format=&quot;24&quot; label=&quot;24-Hour&quot; />`">
        <CuiFlex gap="4" class="items-end">
          <CuiTimePicker v-model="time4" label="12-Hour" />
          <CuiTimePicker v-model="time2" format="24" label="24-Hour" />
        </CuiFlex>
      </Example>

      <!-- Sizes -->
      <Example title="Sizes" :code="`<CuiTimePicker size=&quot;sm&quot; />
<CuiTimePicker size=&quot;md&quot; />
<CuiTimePicker size=&quot;lg&quot; />`">
        <CuiFlex gap="4" class="items-end flex-wrap">
          <CuiTimePicker model-value="09:00 AM" size="sm" label="Small" />
          <CuiTimePicker model-value="09:00 AM" size="md" label="Medium" />
          <CuiTimePicker model-value="09:00 AM" size="lg" label="Large" />
        </CuiFlex>
      </Example>

      <!-- Disabled -->
      <Example title="Disabled" :code="`<CuiTimePicker model-value=&quot;10:00 AM&quot; label=&quot;Locked Time&quot; disabled />`">
        <CuiTimePicker model-value="10:00 AM" label="Locked Time" disabled />
      </Example>
    </template>
  </DocPage>
</template>
