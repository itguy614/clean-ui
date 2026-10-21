<script setup lang="ts">
import { computed, ref } from "vue";
import {
  CuiCard,
  CuiCardBody,
  CuiDatePicker,
  CuiFlex,
  CuiGrid,
  dateToIso,
  formatDate,
  isoToDate,
  parseFormattedDate,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/date-picker";

const date1 = ref("2025-01-15");
const date2 = ref("2025-03-20");
const date3 = ref("2025-06-01");
const date4 = ref("");
const date5 = ref("2025-04-01");
const date6 = ref("2025-07-31");
const dateObj = ref<Date | null>(new Date());

// Date utilities demo
const utilDate = ref("2025-01-15");
const utilFormatted = computed(() => {
  const d = isoToDate(utilDate.value);
  return d ? formatDate(d, "DD/MM/YYYY") : "";
});
const utilRoundTrip = computed(() => {
  const d = parseFormattedDate(utilFormatted.value, "DD/MM/YYYY");
  return d ? dateToIso(d) : "null";
});
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiDatePicker v-model=&quot;date&quot; label=&quot;Start Date&quot; />`"
      >
        <CuiFlex gap="4" class="items-start">
          <CuiDatePicker v-model="date1" label="Start Date" />
          <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
            Value: <code class="cui-code">{{ date1 }}</code>
          </div>
        </CuiFlex>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The field is a real text input — you can type a date into it without ever opening
        the calendar. The calendar itself is a <code>role="grid"</code> of
        <code>role="gridcell"</code> cells with roving focus: exactly one cell is in the
        tab order at a time, and the arrow keys move it.
      </p>

      <p class="text-surface-700 dark:text-surface-300">
        <strong>Opening and closing.</strong> <code>↓</code> on the field opens the
        calendar. <code>Enter</code> is deliberately <em>not</em> bound: in a form it
        submits, and the field accepts typed input, so taking it would cost more than it
        gives. Opening puts focus on the selected date, or today when there is none, so
        the arrows start somewhere meaningful rather than at the first cell.
        <code>Escape</code> closes and hands focus back to the field — as does selecting a
        date.
      </p>

      <p class="text-surface-700 dark:text-surface-300">
        <strong>Inside the grid.</strong> <code>←</code>/<code>→</code> move a day,
        <code>↑</code>/<code>↓</code> a week, <code>Home</code>/<code>End</code> to the
        ends of the week, <code>PageUp</code>/<code>PageDown</code> a month, and
        <code>Shift</code> with those a year. <code>Enter</code> or <code>Space</code>
        selects the focused cell. The month and year grids use the same keys in their own
        units — a month, three months to a row, a page of twelve years.
      </p>

      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Moving past the edge of a month pages the calendar, so the focused cell is
          always one you can see.
        </li>
        <li>
          Movement does not skip disabled dates. A calendar is a grid whose shape carries
          meaning, and holes in it make it impossible to navigate predictably — so a
          blacked-out date is reachable and carries <code>aria-disabled</code>. It is
          <em>selection</em> that refuses, not movement.
        </li>
        <li>
          The selected cell carries <code>aria-selected</code>, and every cell an
          <code>aria-label</code> with its full date, so a cell is announced as a date
          rather than as a bare number.
        </li>
        <li>
          Each grid has an <code>aria-label</code> naming what is on screen — the month
          and year, the year, or the year range.
        </li>
        <li>
          Focus is only reclaimed on close when it is the picker's to reclaim: still
          inside its own panel, or already on <code>&lt;body&gt;</code>. With two pickers
          on a page, opening the second no longer yanks the ring back to the first.
        </li>
      </ul>

      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> The <code>label</code> prop renders plain text with no
        <code>for</code> attribute, so it forms no association with the field — clicking it
        does nothing and assistive technology does not read it with the input. Wrap the
        picker in a <code>CuiFormField</code> instead, which supplies <code>id</code>,
        <code>aria-labelledby</code> and <code>aria-describedby</code> through its slot
        bindings, or pass those props yourself.
      </p>
    </template>

    <template #extra>
      <div>
        <h2 id="date-utilities" class="mb-4 text-2xl font-semibold">Date utilities</h2>
        <CuiCard variant="outline">
          <CuiCardBody>
            <p class="mb-3 text-surface-600 dark:text-surface-400">
              The picker's own conversions are exported, so a value can be formatted or parsed
              outside the component — in a table cell, a summary line or a form's submit
              handler — with exactly the rules the picker uses. All four work on
              <em>local</em> calendar dates: no time of day and no UTC shift, so
              <code>2025-01-15</code> stays the 15th in every timezone.
            </p>
            <ul class="mb-3 list-disc pl-5 text-surface-600 dark:text-surface-400">
              <li>
                <code>formatDate(date: Date, format: string): string</code> — renders a
                <code>Date</code> with the same tokens as the <code>format</code> prop:
                <code>YYYY</code>/<code>YY</code>, <code>MMMM</code>/<code>MMM</code>/<code>MM</code>/<code>M</code>,
                <code>DD</code>/<code>D</code>. Each token is replaced once; everything else
                is copied through.
              </li>
              <li>
                <code>parseFormattedDate(value: string, format: string): Date | null</code> —
                the reverse. It reads each field at the position its token holds in
                <code>format</code>, so it expects fixed-width input (<code>DD</code>,
                <code>MM</code>, <code>YYYY</code>, <code>MMM</code>). <code>YY</code> is read
                as 20xx; the day is read only from <code>DD</code>, so a format without it
                (including one using a bare <code>D</code>) yields the 1st; and an unreadable
                year or month returns <code>null</code>.
              </li>
              <li>
                <code>dateToIso(date: Date): string</code> — a <code>Date</code> to the
                <code>YYYY-MM-DD</code> string the picker emits by default.
              </li>
              <li>
                <code>isoToDate(iso: string): Date | null</code> — a <code>YYYY-MM-DD</code>
                string to a local <code>Date</code>; <code>null</code> for an empty or
                malformed string.
              </li>
            </ul>
            <pre class="cui-pre"><code class="cui-code">import { formatDate, parseFormattedDate, dateToIso, isoToDate } from "@itguy614/clean-ui";

const d = isoToDate("2025-01-15");               // Date, 15 Jan 2025 (local)
formatDate(d!, "DD/MM/YYYY");                    // "15/01/2025"
formatDate(d!, "MMM D, YYYY");                   // "Jan 15, 2025"

const parsed = parseFormattedDate("15/01/2025", "DD/MM/YYYY");
dateToIso(parsed!);                              // "2025-01-15"

parseFormattedDate("", "DD/MM/YYYY");            // null
isoToDate("not a date");                         // null</code></pre>
          </CuiCardBody>
        </CuiCard>
        <div class="mt-4">
          <Example title="Round trip" :code="`const d = isoToDate(date);                       // v-model value
const shown = formatDate(d, &quot;DD/MM/YYYY&quot;);
const back = dateToIso(parseFormattedDate(shown, &quot;DD/MM/YYYY&quot;));`">
            <CuiFlex gap="4" class="items-start flex-wrap">
              <CuiDatePicker v-model="utilDate" label="Pick a date" />
              <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
                <div>formatDate: <code class="cui-code">{{ utilFormatted }}</code></div>
                <div>parsed back with dateToIso: <code class="cui-code">{{ utilRoundTrip }}</code></div>
              </div>
            </CuiFlex>
          </Example>
        </div>
      </div>
    </template>

    <template #examples>
      <!-- Different formats -->
      <Example title="Custom Formats" :code="`<CuiDatePicker v-model=&quot;date&quot; format=&quot;MM/DD/YYYY&quot; label=&quot;US Format&quot; />
<CuiDatePicker v-model=&quot;date&quot; format=&quot;DD/MM/YYYY&quot; label=&quot;EU Format&quot; />
<CuiDatePicker v-model=&quot;date&quot; format=&quot;YYYY-MM-DD&quot; label=&quot;ISO Format&quot; />`">
        <CuiGrid :cols="{ sm: 1, md: 3 }" gap="4">
          <CuiDatePicker v-model="date2" format="MM/DD/YYYY" label="US Format" />
          <CuiDatePicker v-model="date2" format="DD/MM/YYYY" label="EU Format" />
          <CuiDatePicker v-model="date2" format="YYYY-MM-DD" label="ISO Format" />
        </CuiGrid>
      </Example>

      <!-- Min/max range -->
      <Example title="Min/Max Range" :code="`<CuiDatePicker min-date=&quot;2025-01-01&quot; max-date=&quot;2025-12-31&quot; />`">
        <CuiDatePicker
          v-model="date3"
          label="2025 Only"
          min-date="2025-01-01"
          max-date="2025-12-31"
        />
      </Example>

      <!-- No past dates -->
      <Example title="No Past Dates (Today Onward)" :code="`<CuiDatePicker
  v-model=&quot;date&quot;
  label=&quot;Future Date&quot;
  :min-date=&quot;new Date().toISOString().slice(0, 10)&quot;
/>`">
        <CuiDatePicker
          v-model="date4"
          label="Future Date"
          :min-date="new Date().toISOString().slice(0, 10)"
        />
      </Example>

      <!-- Blackout dates -->
      <Example title="Blackout Dates" :code="`<CuiDatePicker
  :disabled-dates=&quot;['2025-04-15', { from: '2025-04-20', to: '2025-04-25' }]&quot;
  :disabled-date=&quot;(d) => d.getDay() === 0 || d.getDay() === 6&quot;
/>`">
        <CuiDatePicker
          v-model="date5"
          label="No Weekends, No Apr 15, No Apr 20-25"
          :disabled-dates="['2025-04-15', { from: '2025-04-20', to: '2025-04-25' }]"
          :disabled-date="(d: Date) => d.getDay() === 0 || d.getDay() === 6"
        />
      </Example>

      <!-- Month-only mode -->
      <Example title="Month-Only (Fill Last Day)" :code="`<CuiDatePicker mode=&quot;month&quot; fill-day=&quot;last&quot; format=&quot;MM/YYYY&quot; />`">
        <CuiFlex gap="4" class="items-start">
          <CuiDatePicker
            v-model="date6"
            mode="month"
            fill-day="last"
            format="MM/YYYY"
            label="Reporting Period End"
          />
          <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
            Value: <code class="cui-code">{{ date6 }}</code>
          </div>
        </CuiFlex>
      </Example>

      <!-- Month-only first day -->
      <Example title="Month-Only (Fill First Day)" :code="`<CuiDatePicker
  v-model=&quot;date&quot;
  mode=&quot;month&quot;
  fill-day=&quot;first&quot;
  format=&quot;MMM YYYY&quot;
  label=&quot;Billing Start&quot;
/>`">
        <CuiFlex gap="4" class="items-start">
          <CuiDatePicker
            v-model="date5"
            mode="month"
            fill-day="first"
            format="MMM YYYY"
            label="Billing Start"
          />
          <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
            Value: <code class="cui-code">{{ date5 }}</code>
          </div>
        </CuiFlex>
      </Example>

      <!-- Date object value type -->
      <Example title="Date Object Output" :code="`<CuiDatePicker value-type=&quot;date&quot; />`">
        <CuiFlex gap="4" class="items-start">
          <CuiDatePicker
            v-model="dateObj"
            value-type="date"
            label="Date Object"
          />
          <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
            Value: <code class="cui-code">{{ dateObj?.toLocaleDateString() ?? 'null' }}</code>
          </div>
        </CuiFlex>
      </Example>

      <!-- Sizes -->
      <Example title="Sizes" :code="`<CuiDatePicker size=&quot;sm&quot; label=&quot;Small&quot; />
<CuiDatePicker size=&quot;md&quot; label=&quot;Medium&quot; />
<CuiDatePicker size=&quot;lg&quot; label=&quot;Large&quot; />`">
        <CuiFlex gap="4" class="items-end flex-wrap">
          <CuiDatePicker :model-value="'2025-06-15'" size="sm" label="Small" />
          <CuiDatePicker :model-value="'2025-06-15'" size="md" label="Medium" />
          <CuiDatePicker :model-value="'2025-06-15'" size="lg" label="Large" />
        </CuiFlex>
      </Example>
    </template>
  </DocPage>
</template>
