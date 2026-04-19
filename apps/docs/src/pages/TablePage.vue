<script setup lang="ts">
import {
  CuiBadge,
  CuiCard,
  CuiCardBody,
  CuiStack,
  CuiTable,
  CuiTableHead,
  CuiTableBody,
  CuiTableFoot,
  CuiTableRow,
  CuiTableCell,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const employees = [
  { name: "Alice Johnson", role: "Engineering", email: "alice@example.com", status: "Active", salary: "$125,000" },
  { name: "Bob Smith", role: "Design", email: "bob@example.com", status: "Active", salary: "$105,000" },
  { name: "Carol Williams", role: "Marketing", email: "carol@example.com", status: "On Leave", salary: "$95,000" },
  { name: "David Brown", role: "Engineering", email: "david@example.com", status: "Active", salary: "$130,000" },
  { name: "Eva Martinez", role: "Sales", email: "eva@example.com", status: "Inactive", salary: "$88,000" },
];

const stickyStyle = { position: 'sticky' as const, top: '0', zIndex: 10, background: 'var(--color-surface-50)' };

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
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Table</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Styled table primitives for building data displays. Composed from CuiTable, CuiTableHead,
        CuiTableBody, CuiTableFoot, CuiTableRow, and CuiTableCell sub-components.
      </p>
    </div>

    <!-- CuiTable props -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiTable Props</h2>
      <PropTable
        :props="[
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Cell padding scale' },
          { name: 'striped', type: 'boolean', default: 'false', description: 'Alternating row backgrounds' },
          { name: 'hoverable', type: 'boolean', default: 'false', description: 'Row hover highlight' },
          { name: 'bordered', type: 'boolean', default: 'false', description: 'Borders between all cells' },
          { name: 'stickyHeader', type: 'boolean', default: 'false', description: 'Sticky thead' },
          { name: 'fixedLayout', type: 'boolean', default: 'false', description: 'table-layout: fixed for consistent column widths' },
          { name: 'maxHeight', type: 'string', default: '—', description: 'Max height — enables vertical scrolling (e.g., &quot;400px&quot;)' },
        ]"
      />
    </div>

    <!-- CuiTableRow props -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiTableRow Props</h2>
      <PropTable
        :props="[
          { name: 'selected', type: 'boolean', default: 'false', description: 'Highlight row with primary-bg tint' },
        ]"
      />
    </div>

    <!-- CuiTableCell props -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiTableCell Props</h2>
      <PropTable
        :props="[
          { name: 'header', type: 'boolean', default: '—', description: 'Explicit override: force <th> or <td>. Auto-detects from CuiTableHead context.' },
          { name: 'align', type: 'left | center | right', default: 'left', description: 'Text alignment' },
          { name: 'width', type: 'string', default: '—', description: 'CSS width' },
          { name: 'colspan', type: 'number', default: '—', description: 'HTML colspan' },
          { name: 'rowspan', type: 'number', default: '—', description: 'HTML rowspan' },
          { name: 'nowrap', type: 'boolean', default: 'false', description: 'Prevent text wrapping' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Table" :code="`<CuiTable>
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

        <!-- Sizes -->
        <Example title="Sizes">
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
        <Example title="With Footer">
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
        <Example title="Combined: Striped + Hoverable + Bordered">
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

      </CuiStack>
    </div>
  </CuiStack>
</template>
