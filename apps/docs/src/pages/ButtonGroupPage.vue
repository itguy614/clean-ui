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
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/button-group";
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiButtonGroup label=&quot;Text alignment&quot;>
  <CuiButton>Left</CuiButton>
  <CuiButton>Center</CuiButton>
  <CuiButton>Right</CuiButton>
</CuiButtonGroup>`"
      >
        <CuiButtonGroup label="Text alignment">
          <CuiButton>Left</CuiButton>
          <CuiButton>Center</CuiButton>
          <CuiButton>Right</CuiButton>
        </CuiButtonGroup>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        The group renders <code>role="group"</code>, which tells a screen reader the buttons
        belong together — but a group with no accessible name is announced as an unnamed
        group, which is worse than no grouping at all. Give it <code>label</code>, or point
        <code>aria-labelledby</code> at visible text.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        Grouping is presentational, so focus behaves exactly as it does for loose buttons:
        <kbd class="cui-kbd">Tab</kbd> moves to each one in turn. That is deliberate — a
        single tab stop with arrow-key movement is the ARIA <em>toolbar</em> pattern, and a
        button group is not a toolbar. Reach for <code>CuiTabs</code> or
        <code>CuiRadioGroup variant="buttons"</code> when the buttons are a single choice.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        A pressed or selected member — <code>aria-pressed="true"</code> or
        <code>aria-checked="true"</code> — is lifted above its siblings so its border and
        focus ring draw complete rather than being clipped by the next button. Hover and
        <code>:focus-visible</code> do the same.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        Icon-only members need their own accessible name: pass <code>aria-label</code> to the
        button, since the group's name describes the set, not any one control.
      </p>
    </template>

    <template #examples>
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
              <CuiButton icon variant="solid" color="primary" aria-label="More save options">
                <CuiIcon name="caret-down" size="sm" />
              </CuiButton>
            </CuiButtonGroup>
            <CuiButtonGroup>
              <CuiButton variant="solid" color="success">Approve</CuiButton>
              <CuiButton icon variant="solid" color="success" aria-label="More approve options">
                <CuiIcon name="caret-down" size="sm" />
              </CuiButton>
            </CuiButtonGroup>
            <CuiButtonGroup>
              <CuiButton variant="solid" color="error">Reject</CuiButton>
              <CuiButton icon variant="solid" color="error" aria-label="More reject options">
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
          <CuiButtonGroup label="Text alignment">
            <CuiButton icon variant="outline" aria-label="Align left">
              <CuiIcon name="text-align-left" size="sm" />
            </CuiButton>
            <CuiButton icon variant="outline" aria-label="Align center">
              <CuiIcon name="text-align-center" size="sm" />
            </CuiButton>
            <CuiButton icon variant="outline" aria-label="Align right">
              <CuiIcon name="text-align-right" size="sm" />
            </CuiButton>
            <CuiButton icon variant="outline" aria-label="Justify">
              <CuiIcon name="text-align-justify" size="sm" />
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
                  <CuiButton icon variant="solid" aria-label="More save options">
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
                  <CuiButton icon variant="solid" color="error" aria-label="More delete options">
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
                  <CuiButton icon variant="outline" aria-label="More export options">
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
            <CuiButtonGroup label="Text formatting">
              <CuiButton icon variant="outline" size="sm" aria-label="Bold">
                <CuiIcon name="text-bolder" size="sm" />
              </CuiButton>
              <CuiButton icon variant="outline" size="sm" aria-label="Italic">
                <CuiIcon name="text-italic" size="sm" />
              </CuiButton>
              <CuiButton icon variant="outline" size="sm" aria-label="Underline">
                <CuiIcon name="text-underline" size="sm" />
              </CuiButton>
              <CuiButton icon variant="outline" size="sm" aria-label="Strikethrough">
                <CuiIcon name="text-strikethrough" size="sm" />
              </CuiButton>
            </CuiButtonGroup>

            <CuiButtonGroup label="Lists">
              <CuiButton icon variant="outline" size="sm" aria-label="Bulleted list">
                <CuiIcon name="list-bullets" size="sm" />
              </CuiButton>
              <CuiButton icon variant="outline" size="sm" aria-label="Numbered list">
                <CuiIcon name="list-numbers" size="sm" />
              </CuiButton>
            </CuiButtonGroup>

            <CuiButtonGroup label="History">
              <CuiButton icon variant="outline" size="sm" aria-label="Undo">
                <CuiIcon name="arrow-u-up-left" size="sm" />
              </CuiButton>
              <CuiButton icon variant="outline" size="sm" aria-label="Redo">
                <CuiIcon name="arrow-u-up-right" size="sm" />
              </CuiButton>
            </CuiButtonGroup>
          </CuiFlex>
        </Example>

      </CuiStack>
    </template>
  </DocPage>
</template>
