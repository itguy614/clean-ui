<script setup lang="ts">
import { ref } from "vue";
import {
  CuiBadge,
  CuiCard,
  CuiCardBody,
  CuiSlider,
  CuiStack,
  CuiTable,
  CuiTableHead,
  CuiTableBody,
  CuiTableFoot,
  CuiTableRow,
  CuiTableCell,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/table";

const employees = [
  { name: "Alice Johnson", role: "Engineering", email: "alice@example.com", status: "Active", salary: "$125,000" },
  { name: "Bob Smith", role: "Design", email: "bob@example.com", status: "Active", salary: "$105,000" },
  { name: "Carol Williams", role: "Marketing", email: "carol@example.com", status: "On Leave", salary: "$95,000" },
  { name: "David Brown", role: "Engineering", email: "david@example.com", status: "Active", salary: "$130,000" },
  { name: "Eva Martinez", role: "Sales", email: "eva@example.com", status: "Inactive", salary: "$88,000" },
];

const stickyStyle = { position: 'sticky' as const, top: '0', zIndex: 10, background: 'var(--color-surface-50)' };

const overflowWidth = ref(343);

const stickyData = [
  ...employees,
  { name: "Frank Lee", role: "Engineering", email: "frank@example.com", status: "Active", salary: "$115,000" },
  { name: "Grace Kim", role: "Design", email: "grace@example.com", status: "Active", salary: "$110,000" },
  { name: "Henry Wilson", role: "Marketing", email: "henry@example.com", status: "Active", salary: "$92,000" },
  { name: "Ivy Chen", role: "Sales", email: "ivy@example.com", status: "Active", salary: "$97,000" },
  { name: "Jack Davis", role: "Engineering", email: "jack@example.com", status: "On Leave", salary: "$128,000" },
];
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiTable>
  <CuiTableHead>
    <CuiTableRow>
      <CuiTableCell>Name</CuiTableCell>
      <CuiTableCell>Role</CuiTableCell>
      <CuiTableCell>Email</CuiTableCell>
    </CuiTableRow>
  </CuiTableHead>
  <CuiTableBody>
    <CuiTableRow v-for=&quot;...&quot;>
      <CuiTableCell>{{ name }}</CuiTableCell>
      ...
    </CuiTableRow>
  </CuiTableBody>
</CuiTable>`">
        <CuiCard variant="outline">
          <CuiCardBody no-padding>
            <CuiTable>
              <CuiTableHead>
                <CuiTableRow>
                  <CuiTableCell>Name</CuiTableCell>
                  <CuiTableCell>Role</CuiTableCell>
                  <CuiTableCell>Email</CuiTableCell>
                  <CuiTableCell>Status</CuiTableCell>
                </CuiTableRow>
              </CuiTableHead>
              <CuiTableBody>
                <CuiTableRow v-for="emp in employees" :key="emp.name">
                  <CuiTableCell>{{ emp.name }}</CuiTableCell>
                  <CuiTableCell>{{ emp.role }}</CuiTableCell>
                  <CuiTableCell>{{ emp.email }}</CuiTableCell>
                  <CuiTableCell>{{ emp.status }}</CuiTableCell>
                </CuiTableRow>
              </CuiTableBody>
            </CuiTable>
          </CuiCardBody>
        </CuiCard>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        These are a real <code>&lt;table&gt;</code>, <code>&lt;thead&gt;</code>,
        <code>&lt;tbody&gt;</code>, <code>&lt;tfoot&gt;</code>, <code>&lt;tr&gt;</code>,
        <code>&lt;th&gt;</code> and <code>&lt;td&gt;</code> — no grid roles reimplemented on
        top of divs. That is what lets a screen reader's table mode work: move by cell, and
        each one is announced with its column header.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          A cell inside <code>CuiTableHead</code> renders as
          <code>&lt;th scope="col"&gt;</code> automatically — the association between a
          column and its header is what most hand-rolled tables get wrong, and here you get
          it by using the right sub-component.
        </li>
        <li>
          Once the table overflows, its wrapper becomes
          <code>role="region"</code> with <code>tabindex="0"</code> and the accessible name
          “Scrollable table” (from the <code>table.scrollRegionLabel</code> message, so it is
          translatable). Without that, a horizontally scrolling table is unreachable by
          keyboard — WCAG 2.1.1. The wrapper stays inert while the table fits, so it never
          becomes a stray tab stop.
        </li>
        <li>
          <code>stickyHeader</code> pins the header cells themselves, not the
          <code>&lt;thead&gt;</code>; the table's semantics are unchanged either way.
        </li>
        <li>
          <code>selected</code> only tints a row. If selection is a state the user controls,
          put a real checkbox in the row and set <code>aria-selected</code> yourself —
          a colour is not a state.
        </li>
        <li>
          Use <code>ariaRowcount</code> only for a windowed table, where the DOM holds a
          fraction of the rows. On a normal table the browser already reports the true count,
          and an <code>aria-rowcount</code> that disagrees is worse than none.
        </li>
        <li>
          Give the table a caption or a heading immediately above it. Neither
          <code>&lt;table&gt;</code> nor the scroll region names what the data is.
        </li>
      </ul>
    </template>

    <template #examples>

      <!-- Sizes -->
      <Example title="Sizes" :code="`<CuiTable size=&quot;sm&quot;>...</CuiTable>
<CuiTable size=&quot;md&quot;>...</CuiTable>
<CuiTable size=&quot;lg&quot;>...</CuiTable>`">
        <CuiStack spacing="4">
          <div v-for="sz in (['sm', 'md', 'lg'] as const)" :key="sz">
            <div class="mb-2 text-sm font-medium" style="color: var(--cui-text-secondary);">{{ sz }}:</div>
            <CuiCard variant="outline">
              <CuiCardBody no-padding>
                <CuiTable :size="sz">
                  <CuiTableHead>
                    <CuiTableRow>
                      <CuiTableCell>Name</CuiTableCell>
                      <CuiTableCell>Role</CuiTableCell>
                      <CuiTableCell>Email</CuiTableCell>
                    </CuiTableRow>
                  </CuiTableHead>
                  <CuiTableBody>
                    <CuiTableRow v-for="emp in employees.slice(0, 3)" :key="emp.name">
                      <CuiTableCell>{{ emp.name }}</CuiTableCell>
                      <CuiTableCell>{{ emp.role }}</CuiTableCell>
                      <CuiTableCell>{{ emp.email }}</CuiTableCell>
                    </CuiTableRow>
                  </CuiTableBody>
                </CuiTable>
              </CuiCardBody>
            </CuiCard>
          </div>
        </CuiStack>
      </Example>

      <!-- Striped -->
      <Example title="Striped Rows" :code="`<CuiTable striped>...</CuiTable>`">
        <CuiCard variant="outline">
          <CuiCardBody no-padding>
            <CuiTable striped>
              <CuiTableHead>
                <CuiTableRow>
                  <CuiTableCell>Name</CuiTableCell>
                  <CuiTableCell>Role</CuiTableCell>
                  <CuiTableCell>Email</CuiTableCell>
                  <CuiTableCell>Status</CuiTableCell>
                </CuiTableRow>
              </CuiTableHead>
              <CuiTableBody>
                <CuiTableRow v-for="emp in employees" :key="emp.name">
                  <CuiTableCell>{{ emp.name }}</CuiTableCell>
                  <CuiTableCell>{{ emp.role }}</CuiTableCell>
                  <CuiTableCell>{{ emp.email }}</CuiTableCell>
                  <CuiTableCell>{{ emp.status }}</CuiTableCell>
                </CuiTableRow>
              </CuiTableBody>
            </CuiTable>
          </CuiCardBody>
        </CuiCard>
      </Example>

      <!-- Hoverable -->
      <Example title="Hoverable Rows" :code="`<CuiTable hoverable>...</CuiTable>`">
        <CuiCard variant="outline">
          <CuiCardBody no-padding>
            <CuiTable hoverable>
              <CuiTableHead>
                <CuiTableRow>
                  <CuiTableCell>Name</CuiTableCell>
                  <CuiTableCell>Role</CuiTableCell>
                  <CuiTableCell>Email</CuiTableCell>
                  <CuiTableCell>Status</CuiTableCell>
                </CuiTableRow>
              </CuiTableHead>
              <CuiTableBody>
                <CuiTableRow v-for="emp in employees" :key="emp.name">
                  <CuiTableCell>{{ emp.name }}</CuiTableCell>
                  <CuiTableCell>{{ emp.role }}</CuiTableCell>
                  <CuiTableCell>{{ emp.email }}</CuiTableCell>
                  <CuiTableCell>{{ emp.status }}</CuiTableCell>
                </CuiTableRow>
              </CuiTableBody>
            </CuiTable>
          </CuiCardBody>
        </CuiCard>
      </Example>

      <!-- Bordered -->
      <Example title="Bordered" :code="`<CuiTable bordered>...</CuiTable>`">
        <CuiCard variant="outline">
          <CuiCardBody no-padding>
            <CuiTable bordered>
              <CuiTableHead>
                <CuiTableRow>
                  <CuiTableCell>Name</CuiTableCell>
                  <CuiTableCell>Role</CuiTableCell>
                  <CuiTableCell>Email</CuiTableCell>
                  <CuiTableCell>Status</CuiTableCell>
                </CuiTableRow>
              </CuiTableHead>
              <CuiTableBody>
                <CuiTableRow v-for="emp in employees" :key="emp.name">
                  <CuiTableCell>{{ emp.name }}</CuiTableCell>
                  <CuiTableCell>{{ emp.role }}</CuiTableCell>
                  <CuiTableCell>{{ emp.email }}</CuiTableCell>
                  <CuiTableCell>{{ emp.status }}</CuiTableCell>
                </CuiTableRow>
              </CuiTableBody>
            </CuiTable>
          </CuiCardBody>
        </CuiCard>
      </Example>

      <!-- Selected rows -->
      <Example title="Selected Rows" :code="`<CuiTableRow selected>...</CuiTableRow>`">
        <CuiCard variant="outline">
          <CuiCardBody no-padding>
            <CuiTable hoverable>
              <CuiTableHead>
                <CuiTableRow>
                  <CuiTableCell>Name</CuiTableCell>
                  <CuiTableCell>Role</CuiTableCell>
                  <CuiTableCell>Email</CuiTableCell>
                  <CuiTableCell>Status</CuiTableCell>
                </CuiTableRow>
              </CuiTableHead>
              <CuiTableBody>
                <CuiTableRow v-for="(emp, i) in employees" :key="emp.name" :selected="i === 0 || i === 3">
                  <CuiTableCell>{{ emp.name }}</CuiTableCell>
                  <CuiTableCell>{{ emp.role }}</CuiTableCell>
                  <CuiTableCell>{{ emp.email }}</CuiTableCell>
                  <CuiTableCell>{{ emp.status }}</CuiTableCell>
                </CuiTableRow>
              </CuiTableBody>
            </CuiTable>
          </CuiCardBody>
        </CuiCard>
      </Example>

      <!-- Column alignment -->
      <Example title="Column Alignment" :code="`<CuiTableCell align=&quot;right&quot;>$125,000</CuiTableCell>`">
        <CuiCard variant="outline">
          <CuiCardBody no-padding>
            <CuiTable>
              <CuiTableHead>
                <CuiTableRow>
                  <CuiTableCell>Name</CuiTableCell>
                  <CuiTableCell align="center">Role</CuiTableCell>
                  <CuiTableCell align="right">Salary</CuiTableCell>
                </CuiTableRow>
              </CuiTableHead>
              <CuiTableBody>
                <CuiTableRow v-for="emp in employees" :key="emp.name">
                  <CuiTableCell>{{ emp.name }}</CuiTableCell>
                  <CuiTableCell align="center">{{ emp.role }}</CuiTableCell>
                  <CuiTableCell align="right" nowrap>{{ emp.salary }}</CuiTableCell>
                </CuiTableRow>
              </CuiTableBody>
            </CuiTable>
          </CuiCardBody>
        </CuiCard>
      </Example>

      <!-- With footer -->
      <Example title="With Footer" :code="`<CuiTable striped>
  <CuiTableHead>
    <CuiTableRow>
      <CuiTableCell>Name</CuiTableCell>
      <CuiTableCell>Role</CuiTableCell>
      <CuiTableCell align=&quot;right&quot;>Salary</CuiTableCell>
    </CuiTableRow>
  </CuiTableHead>
  <CuiTableBody>
    <CuiTableRow v-for=&quot;emp in employees&quot; :key=&quot;emp.name&quot;>
      <CuiTableCell>{{ emp.name }}</CuiTableCell>
      <CuiTableCell>{{ emp.role }}</CuiTableCell>
      <CuiTableCell align=&quot;right&quot; nowrap>{{ emp.salary }}</CuiTableCell>
    </CuiTableRow>
  </CuiTableBody>
  <CuiTableFoot>
    <CuiTableRow>
      <CuiTableCell :colspan=&quot;2&quot;>Total (5 employees)</CuiTableCell>
      <CuiTableCell align=&quot;right&quot; nowrap>$543,000</CuiTableCell>
    </CuiTableRow>
  </CuiTableFoot>
</CuiTable>`">
        <CuiCard variant="outline">
          <CuiCardBody no-padding>
            <CuiTable striped>
              <CuiTableHead>
                <CuiTableRow>
                  <CuiTableCell>Name</CuiTableCell>
                  <CuiTableCell>Role</CuiTableCell>
                  <CuiTableCell align="right">Salary</CuiTableCell>
                </CuiTableRow>
              </CuiTableHead>
              <CuiTableBody>
                <CuiTableRow v-for="emp in employees" :key="emp.name">
                  <CuiTableCell>{{ emp.name }}</CuiTableCell>
                  <CuiTableCell>{{ emp.role }}</CuiTableCell>
                  <CuiTableCell align="right" nowrap>{{ emp.salary }}</CuiTableCell>
                </CuiTableRow>
              </CuiTableBody>
              <CuiTableFoot>
                <CuiTableRow>
                  <CuiTableCell :colspan="2">Total (5 employees)</CuiTableCell>
                  <CuiTableCell align="right" nowrap>$543,000</CuiTableCell>
                </CuiTableRow>
              </CuiTableFoot>
            </CuiTable>
          </CuiCardBody>
        </CuiCard>
      </Example>

      <!-- Sticky header -->
      <Example title="Sticky Header" :code="`<CuiTable sticky-header max-height=&quot;280px&quot; hoverable>
  <CuiTableHead>
    <CuiTableRow>
      <CuiTableCell :style=&quot;stickyStyle&quot;>Name</CuiTableCell>
      ...
    </CuiTableRow>
  </CuiTableHead>
  ...
</CuiTable>`">
        <CuiTable sticky-header hoverable bordered max-height="280px">
          <CuiTableHead>
            <CuiTableRow>
              <CuiTableCell>Name</CuiTableCell>
              <CuiTableCell>Role</CuiTableCell>
              <CuiTableCell>Email</CuiTableCell>
              <CuiTableCell>Status</CuiTableCell>
              <CuiTableCell align="right">Salary</CuiTableCell>
            </CuiTableRow>
          </CuiTableHead>
          <CuiTableBody>
            <CuiTableRow v-for="emp in stickyData" :key="emp.name">
              <CuiTableCell>{{ emp.name }}</CuiTableCell>
              <CuiTableCell>{{ emp.role }}</CuiTableCell>
              <CuiTableCell>{{ emp.email }}</CuiTableCell>
              <CuiTableCell>{{ emp.status }}</CuiTableCell>
              <CuiTableCell align="right" nowrap>{{ emp.salary }}</CuiTableCell>
            </CuiTableRow>
          </CuiTableBody>
        </CuiTable>
      </Example>

      <!-- Combined features -->
      <Example title="Combined: Striped + Hoverable + Bordered" :code="`<CuiTable striped hoverable bordered size=&quot;sm&quot;>
  <CuiTableHead>
    <CuiTableRow>
      <CuiTableCell>Name</CuiTableCell>
      <CuiTableCell align=&quot;center&quot;>Status</CuiTableCell>
      <CuiTableCell align=&quot;right&quot;>Salary</CuiTableCell>
    </CuiTableRow>
  </CuiTableHead>
  <CuiTableBody>
    <CuiTableRow v-for=&quot;emp in employees&quot; :key=&quot;emp.name&quot;>
      <CuiTableCell nowrap>{{ emp.name }}</CuiTableCell>
      <CuiTableCell align=&quot;center&quot;>
        <CuiBadge :color=&quot;emp.status === 'Active' ? 'success' : 'warning'&quot; size=&quot;sm&quot;>
          {{ emp.status }}
        </CuiBadge>
      </CuiTableCell>
      <CuiTableCell align=&quot;right&quot; nowrap>{{ emp.salary }}</CuiTableCell>
    </CuiTableRow>
  </CuiTableBody>
</CuiTable>`">
        <CuiCard variant="outline">
          <CuiCardBody no-padding>
            <CuiTable striped hoverable bordered size="sm">
              <CuiTableHead>
                <CuiTableRow>
                  <CuiTableCell>Name</CuiTableCell>
                  <CuiTableCell>Role</CuiTableCell>
                  <CuiTableCell>Email</CuiTableCell>
                  <CuiTableCell align="center">Status</CuiTableCell>
                  <CuiTableCell align="right">Salary</CuiTableCell>
                </CuiTableRow>
              </CuiTableHead>
              <CuiTableBody>
                <CuiTableRow v-for="emp in employees" :key="emp.name">
                  <CuiTableCell nowrap>{{ emp.name }}</CuiTableCell>
                  <CuiTableCell>{{ emp.role }}</CuiTableCell>
                  <CuiTableCell>{{ emp.email }}</CuiTableCell>
                  <CuiTableCell align="center">
                    <CuiBadge
                      :color="emp.status === 'Active' ? 'success' : emp.status === 'On Leave' ? 'warning' : 'secondary'"
                      size="sm"
                    >
                      {{ emp.status }}
                    </CuiBadge>
                  </CuiTableCell>
                  <CuiTableCell align="right" nowrap>{{ emp.salary }}</CuiTableCell>
                </CuiTableRow>
              </CuiTableBody>
            </CuiTable>
          </CuiCardBody>
        </CuiCard>
      </Example>

      <!-- Fixed layout -->
      <Example title="Fixed Layout" :code="`<CuiTable fixed-layout>...</CuiTable>`">
        <CuiCard variant="outline">
          <CuiCardBody no-padding>
            <CuiTable fixed-layout>
              <CuiTableHead>
                <CuiTableRow>
                  <CuiTableCell width="30%">Name</CuiTableCell>
                  <CuiTableCell width="20%">Role</CuiTableCell>
                  <CuiTableCell width="35%">Email</CuiTableCell>
                  <CuiTableCell width="15%" align="right">Salary</CuiTableCell>
                </CuiTableRow>
              </CuiTableHead>
              <CuiTableBody>
                <CuiTableRow v-for="emp in employees.slice(0, 3)" :key="emp.name">
                  <CuiTableCell>{{ emp.name }}</CuiTableCell>
                  <CuiTableCell>{{ emp.role }}</CuiTableCell>
                  <CuiTableCell>{{ emp.email }}</CuiTableCell>
                  <CuiTableCell align="right" nowrap>{{ emp.salary }}</CuiTableCell>
                </CuiTableRow>
              </CuiTableBody>
            </CuiTable>
          </CuiCardBody>
        </CuiCard>
      </Example>

      <!-- Horizontal overflow -->
      <Example title="Horizontal overflow (automatic)" :code="`<!-- No props needed — a table too wide for its container
     scrolls inside it instead of overflowing the page -->
<CuiTable hoverable>
  <CuiTableHead>…</CuiTableHead>
  <CuiTableBody>…</CuiTableBody>
</CuiTable>`">
        <CuiStack spacing="4">
          <p class="text-sm text-surface-500">
            A table wider than its container scrolls horizontally within it, with a fade on the
            clipped edge. The wrapper only becomes a scroll container when it has to — while the
            table fits it stays inert, so a page-scrolled
            <code class="cui-code">sticky-header</code> keeps working. Drag the width to see it
            engage.
          </p>

          <CuiSlider
            v-model="overflowWidth"
            label="Container width"
            :min="240"
            :max="900"
            :step="1"
            show-value
            :format-value="(v: number) => `${v}px`"
          />

          <div :style="{ width: `${overflowWidth}px`, maxWidth: '100%' }">
            <CuiCard variant="outline">
              <CuiCardBody no-padding>
                <CuiTable hoverable>
                  <CuiTableHead>
                    <CuiTableRow>
                      <CuiTableCell nowrap>Name</CuiTableCell>
                      <CuiTableCell nowrap>Role</CuiTableCell>
                      <CuiTableCell nowrap>Email</CuiTableCell>
                      <CuiTableCell nowrap>Status</CuiTableCell>
                      <CuiTableCell nowrap align="right">Salary</CuiTableCell>
                    </CuiTableRow>
                  </CuiTableHead>
                  <CuiTableBody>
                    <CuiTableRow v-for="emp in employees" :key="emp.name">
                      <CuiTableCell nowrap>{{ emp.name }}</CuiTableCell>
                      <CuiTableCell nowrap>{{ emp.role }}</CuiTableCell>
                      <CuiTableCell nowrap>{{ emp.email }}</CuiTableCell>
                      <CuiTableCell nowrap>{{ emp.status }}</CuiTableCell>
                      <CuiTableCell nowrap align="right">{{ emp.salary }}</CuiTableCell>
                    </CuiTableRow>
                  </CuiTableBody>
                </CuiTable>
              </CuiCardBody>
            </CuiCard>
          </div>

          <p class="text-sm text-surface-500">
            Once it scrolls, the wrapper becomes a keyboard-reachable
            <code class="cui-code">role="region"</code> with a focus ring — tab to it and use the
            arrow keys.
          </p>
        </CuiStack>
      </Example>

    </template>
  </DocPage>
</template>
