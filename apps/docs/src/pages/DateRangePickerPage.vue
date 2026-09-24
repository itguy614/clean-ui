<script setup lang="ts">
import { ref } from "vue";
import { CuiDateRangePicker, CuiFlex, type DateRangeValue } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/date-range-picker";

const range1 = ref<DateRangeValue>({ start: "2025-04-01", end: "2025-04-15" });
const range2 = ref<DateRangeValue>({ start: null, end: null });
const range3 = ref<DateRangeValue>({ start: null, end: null });
const range4 = ref<DateRangeValue>({ start: null, end: null });
const range5 = ref<DateRangeValue>({ start: null, end: null });
</script>

<template>
  <DocPage :meta="meta">
    <template #intro>
      <p class="text-surface-700 dark:text-surface-300">
        One calendar, picked twice: the first click sets the start, the second the end. If
        the second date is earlier than the first, the two swap rather than being refused.
        The range only reaches <code>v-model</code> once both ends exist — there is no
        half-emitted state.
      </p>
    </template>

    <template #usage>
      <Example
        code-open
        :code="`<CuiDateRangePicker v-model=&quot;range&quot; label=&quot;Travel Dates&quot; />`"
      >
        <CuiFlex gap="4" class="items-start">
          <CuiDateRangePicker v-model="range1" label="Travel Dates" />
          <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
            <div>Start: <code class="cui-code">{{ range1.start ?? 'null' }}</code></div>
            <div>End: <code class="cui-code">{{ range1.end ?? 'null' }}</code></div>
          </div>
        </CuiFlex>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The calendar is the same <code>role="grid"</code> with roving focus as
        <code>CuiDatePicker</code>'s — the navigation is one shared composable, not two
        implementations that can drift.
      </p>

      <p class="text-surface-700 dark:text-surface-300">
        <strong>Opening and closing.</strong> <code>↓</code> on the start field opens the
        calendar. <code>Enter</code> is deliberately not bound — in a form it submits.
        Opening puts focus on the start date, or today when the range is empty;
        <code>Escape</code> closes and hands focus back to the field.
      </p>

      <p class="text-surface-700 dark:text-surface-300">
        <strong>Inside the grid.</strong> <code>←</code>/<code>→</code> move a day,
        <code>↑</code>/<code>↓</code> a week, <code>Home</code>/<code>End</code> to the
        ends of the week, <code>PageUp</code>/<code>PageDown</code> a month, and
        <code>Shift</code> with those a year. <code>Enter</code> or <code>Space</code>
        picks — once for the start, again for the end, exactly as two clicks do.
      </p>

      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          While you are choosing the end, the range preview follows the focused cell, not
          just the pointer. Without that the highlight simply stopped moving for anyone
          not using a mouse.
        </li>
        <li>
          Movement does not skip disabled dates — a calendar is a grid whose shape carries
          meaning. Blacked-out cells are reachable and carry <code>aria-disabled</code>;
          selection is what refuses.
        </li>
        <li>
          Moving past the edge of a month pages the calendar, so the focused cell is
          always visible.
        </li>
        <li>
          The "Select start date" / "Select end date" line above the grid is plain text,
          not a live region. If that distinction matters to your users, announce the
          change yourself.
        </li>
        <li>
          With <code>block-spanning-blackout</code>, a range containing a disabled date
          silently fails to commit — nothing is announced and no error is emitted. Pair it
          with your own message when the constraint is not obvious from the grid.
        </li>
      </ul>

      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> The <code>label</code> prop renders plain text with no
        <code>for</code> attribute, so it names nothing. Wrap the picker in a
        <code>CuiFormField</code>, or pass <code>aria-labelledby</code> yourself — both
        land on the start field. The end field takes no <code>id</code> or
        <code>aria-*</code> of its own, so give the control a single name that covers the
        pair rather than trying to label each half.
      </p>
    </template>

    <template #examples>
      <!-- Future only -->
      <Example title="Future Dates Only" :code="`<CuiDateRangePicker
  v-model=&quot;range&quot;
  label=&quot;Booking Window&quot;
  :min-date=&quot;new Date().toISOString().slice(0, 10)&quot;
/>`">
        <CuiDateRangePicker
          v-model="range2"
          label="Booking Window"
          :min-date="new Date().toISOString().slice(0, 10)"
        />
      </Example>

      <!-- With range constraint -->
      <Example title="Within 2025 Only" :code="`<CuiDateRangePicker
  v-model=&quot;range&quot;
  label=&quot;Fiscal Year 2025&quot;
  min-date=&quot;2025-01-01&quot;
  max-date=&quot;2025-12-31&quot;
/>`">
        <CuiDateRangePicker
          v-model="range3"
          label="Fiscal Year 2025"
          min-date="2025-01-01"
          max-date="2025-12-31"
        />
      </Example>

      <!-- Blackout dates blocking range -->
      <Example title="Blackout Dates (No Weekends, Blocks Spanning)" :code="`<CuiDateRangePicker
  :disabled-date=&quot;(d) => d.getDay() === 0 || d.getDay() === 6&quot;
  block-spanning-blackout
/>`">
        <CuiFlex gap="4" class="items-start">
          <CuiDateRangePicker
            v-model="range4"
            label="Business Days Only"
            :disabled-date="(d: Date) => d.getDay() === 0 || d.getDay() === 6"
            block-spanning-blackout
          />
          <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem; max-width: 14rem;">
            Weekends are disabled, and a range that would contain one will not commit.
          </div>
        </CuiFlex>
      </Example>

      <!-- Specific blackout dates -->
      <Example title="Holiday Blackouts" :code="`<CuiDateRangePicker
  v-model=&quot;range&quot;
  label=&quot;Vacation Request&quot;
  :disabled-dates=&quot;['2025-07-04', { from: '2025-12-24', to: '2025-12-26' }]&quot;
  block-spanning-blackout
/>`">
        <CuiDateRangePicker
          v-model="range5"
          label="Vacation Request"
          :disabled-dates="[
            '2025-07-04',
            { from: '2025-12-24', to: '2025-12-26' },
            '2025-01-01',
          ]"
          block-spanning-blackout
        />
      </Example>

      <!-- EU format -->
      <Example title="EU Format (DD/MM/YYYY)" :code="`<CuiDateRangePicker
  v-model=&quot;range&quot;
  format=&quot;DD/MM/YYYY&quot;
  label=&quot;European Format&quot;
/>`">
        <CuiDateRangePicker
          :model-value="{ start: '2025-06-01', end: '2025-06-14' }"
          format="DD/MM/YYYY"
          label="European Format"
        />
      </Example>
    </template>
  </DocPage>
</template>
