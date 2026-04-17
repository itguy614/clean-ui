<script setup lang="ts">
import {
  CuiButton,
  CuiButtonGroup,
  CuiDropdown,
  CuiDropdownDivider,
  CuiDropdownItem,
  CuiDropdownMenu,
  CuiDropdownTrigger,
  CuiFlex,
  CuiIcon,
  CuiStack,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Button Group</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Joins multiple buttons into a single visual unit with merged borders
        and shared radius. Works with dropdowns for split-button patterns.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'orientation', type: 'horizontal | vertical', default: 'horizontal', description: 'Layout direction' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic" :code="`<CuiButtonGroup>
  <CuiButton>Left</CuiButton>
  <CuiButton>Center</CuiButton>
  <CuiButton>Right</CuiButton>
</CuiButtonGroup>`">
          <CuiButtonGroup>
            <CuiButton>Left</CuiButton>
            <CuiButton>Center</CuiButton>
            <CuiButton>Right</CuiButton>
          </CuiButtonGroup>
        </Example>

        <!-- Variants -->
        <Example title="Variants">
          <CuiStack spacing="3">
            <CuiButtonGroup>
              <CuiButton variant="outline">One</CuiButton>
              <CuiButton variant="outline">Two</CuiButton>
              <CuiButton variant="outline">Three</CuiButton>
            </CuiButtonGroup>
            <CuiButtonGroup>
              <CuiButton variant="solid">One</CuiButton>
              <CuiButton variant="solid">Two</CuiButton>
              <CuiButton variant="solid">Three</CuiButton>
            </CuiButtonGroup>
            <CuiButtonGroup>
              <CuiButton variant="ghost">One</CuiButton>
              <CuiButton variant="ghost">Two</CuiButton>
              <CuiButton variant="ghost">Three</CuiButton>
            </CuiButtonGroup>
          </CuiStack>
        </Example>

        <!-- Colors -->
        <Example title="Colors">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButtonGroup>
              <CuiButton variant="solid" color="primary">Save</CuiButton>
              <CuiButton variant="solid" color="primary">
                <CuiIcon name="caret-down" size="sm" />
              </CuiButton>
            </CuiButtonGroup>
            <CuiButtonGroup>
              <CuiButton variant="solid" color="success">Approve</CuiButton>
              <CuiButton variant="solid" color="success">
                <CuiIcon name="caret-down" size="sm" />
              </CuiButton>
            </CuiButtonGroup>
            <CuiButtonGroup>
              <CuiButton variant="solid" color="error">Reject</CuiButton>
              <CuiButton variant="solid" color="error">
                <CuiIcon name="caret-down" size="sm" />
              </CuiButton>
            </CuiButtonGroup>
          </CuiFlex>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes">
          <CuiStack spacing="3">
            <CuiButtonGroup>
              <CuiButton size="xs">XS</CuiButton>
              <CuiButton size="xs">XS</CuiButton>
              <CuiButton size="xs">XS</CuiButton>
            </CuiButtonGroup>
            <CuiButtonGroup>
              <CuiButton size="sm">Small</CuiButton>
              <CuiButton size="sm">Small</CuiButton>
              <CuiButton size="sm">Small</CuiButton>
            </CuiButtonGroup>
            <CuiButtonGroup>
              <CuiButton size="md">Medium</CuiButton>
              <CuiButton size="md">Medium</CuiButton>
              <CuiButton size="md">Medium</CuiButton>
            </CuiButtonGroup>
          </CuiStack>
        </Example>

        <!-- With Icons -->
        <Example title="With Icons">
          <CuiButtonGroup>
            <CuiButton variant="outline">
              <template #prefix><CuiIcon name="text-align-left" size="sm" /></template>
            </CuiButton>
            <CuiButton variant="outline">
              <template #prefix><CuiIcon name="text-align-center" size="sm" /></template>
            </CuiButton>
            <CuiButton variant="outline">
              <template #prefix><CuiIcon name="text-align-right" size="sm" /></template>
            </CuiButton>
            <CuiButton variant="outline">
              <template #prefix><CuiIcon name="text-align-justify" size="sm" /></template>
            </CuiButton>
          </CuiButtonGroup>
        </Example>

        <!-- Split Button with Dropdown -->
        <Example title="Split Button with Dropdown" :code="`<CuiButtonGroup>
  <CuiButton variant=&quot;solid&quot;>Save</CuiButton>
  <CuiDropdown>
    <CuiDropdownTrigger>
      <CuiButton variant=&quot;solid&quot;>
        <CuiIcon name=&quot;caret-down&quot; size=&quot;sm&quot; />
      </CuiButton>
    </CuiDropdownTrigger>
    <CuiDropdownMenu>
      <CuiDropdownItem>Save as Draft</CuiDropdownItem>
      <CuiDropdownItem>Save &amp; Publish</CuiDropdownItem>
    </CuiDropdownMenu>
  </CuiDropdown>
</CuiButtonGroup>`">
          <CuiFlex gap="4" class="flex-wrap">
            <CuiButtonGroup>
              <CuiButton variant="solid">Save</CuiButton>
              <CuiDropdown>
                <CuiDropdownTrigger>
                  <CuiButton variant="solid">
                    <CuiIcon name="caret-down" size="sm" />
                  </CuiButton>
                </CuiDropdownTrigger>
                <CuiDropdownMenu>
                  <CuiDropdownItem>
                    <template #icon><CuiIcon name="file" size="sm" /></template>
                    Save as Draft
                  </CuiDropdownItem>
                  <CuiDropdownItem>
                    <template #icon><CuiIcon name="paper-plane-tilt" size="sm" /></template>
                    Save &amp; Publish
                  </CuiDropdownItem>
                  <CuiDropdownItem>
                    <template #icon><CuiIcon name="clock" size="sm" /></template>
                    Schedule Publish
                  </CuiDropdownItem>
                </CuiDropdownMenu>
              </CuiDropdown>
            </CuiButtonGroup>

            <CuiButtonGroup>
              <CuiButton variant="solid" color="error">
                <template #prefix><CuiIcon name="trash" size="sm" /></template>
                Delete
              </CuiButton>
              <CuiDropdown>
                <CuiDropdownTrigger>
                  <CuiButton variant="solid" color="error">
                    <CuiIcon name="caret-down" size="sm" />
                  </CuiButton>
                </CuiDropdownTrigger>
                <CuiDropdownMenu>
                  <CuiDropdownItem>Move to Trash</CuiDropdownItem>
                  <CuiDropdownItem>Delete Permanently</CuiDropdownItem>
                </CuiDropdownMenu>
              </CuiDropdown>
            </CuiButtonGroup>

            <CuiButtonGroup>
              <CuiButton variant="outline">
                <template #prefix><CuiIcon name="download" size="sm" /></template>
                Export
              </CuiButton>
              <CuiDropdown>
                <CuiDropdownTrigger>
                  <CuiButton variant="outline">
                    <CuiIcon name="caret-down" size="sm" />
                  </CuiButton>
                </CuiDropdownTrigger>
                <CuiDropdownMenu>
                  <CuiDropdownItem>
                    <template #icon><CuiIcon name="file-csv" size="sm" /></template>
                    Export as CSV
                  </CuiDropdownItem>
                  <CuiDropdownItem>
                    <template #icon><CuiIcon name="file-pdf" size="sm" /></template>
                    Export as PDF
                  </CuiDropdownItem>
                  <CuiDropdownDivider />
                  <CuiDropdownItem>
                    <template #icon><CuiIcon name="printer" size="sm" /></template>
                    Print
                  </CuiDropdownItem>
                </CuiDropdownMenu>
              </CuiDropdown>
            </CuiButtonGroup>
          </CuiFlex>
        </Example>

        <!-- Vertical -->
        <Example title="Vertical">
          <CuiButtonGroup orientation="vertical">
            <CuiButton variant="outline">Top</CuiButton>
            <CuiButton variant="outline">Middle</CuiButton>
            <CuiButton variant="outline">Bottom</CuiButton>
          </CuiButtonGroup>
        </Example>

        <!-- Real-World: Toolbar -->
        <Example title="Real-World: Toolbar">
          <CuiFlex gap="3" class="flex-wrap items-center">
            <CuiButtonGroup>
              <CuiButton variant="outline" size="sm">
                <CuiIcon name="text-bolder" size="sm" />
              </CuiButton>
              <CuiButton variant="outline" size="sm">
                <CuiIcon name="text-italic" size="sm" />
              </CuiButton>
              <CuiButton variant="outline" size="sm">
                <CuiIcon name="text-underline" size="sm" />
              </CuiButton>
              <CuiButton variant="outline" size="sm">
                <CuiIcon name="text-strikethrough" size="sm" />
              </CuiButton>
            </CuiButtonGroup>

            <CuiButtonGroup>
              <CuiButton variant="outline" size="sm">
                <CuiIcon name="list-bullets" size="sm" />
              </CuiButton>
              <CuiButton variant="outline" size="sm">
                <CuiIcon name="list-numbers" size="sm" />
              </CuiButton>
            </CuiButtonGroup>

            <CuiButtonGroup>
              <CuiButton variant="outline" size="sm">
                <CuiIcon name="arrow-u-up-left" size="sm" />
              </CuiButton>
              <CuiButton variant="outline" size="sm">
                <CuiIcon name="arrow-u-up-right" size="sm" />
              </CuiButton>
            </CuiButtonGroup>
          </CuiFlex>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
