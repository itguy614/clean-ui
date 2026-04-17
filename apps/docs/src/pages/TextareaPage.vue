<script setup lang="ts">
import { ref } from "vue";
import { CuiStack, CuiTextarea } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const text = ref("");
const bio = ref("I'm a software developer who enjoys building component libraries.");
const feedback = ref("");
const notes = ref("");
const errorVal = ref("");
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Textarea</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Multiline text input with auto-resize and character counting.
        Shares the same visual patterns as <code class="cui-code">CuiInput</code>.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'v-model', type: 'string', default: 'empty string', description: 'Textarea value' },
          { name: 'placeholder', type: 'string', default: '-', description: 'Placeholder text' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Focus border color role' },
          { name: 'size', type: 'xs | sm | md | lg | xl', default: 'md', description: 'Text size (matches input/button scale)' },
          { name: 'rows', type: 'number', default: '3', description: 'Initial/minimum visible rows' },
          { name: 'autoResize', type: 'boolean', default: 'false', description: 'Grow height to fit content' },
          { name: 'maxRows', type: 'number', default: '-', description: 'Max rows when auto-resizing' },
          { name: 'maxLength', type: 'number', default: '-', description: 'Max characters — shows counter when set' },
          { name: 'error', type: 'boolean', default: 'false', description: 'Red border error state' },
          { name: 'errorMessage', type: 'string', default: '-', description: 'Error message below textarea' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'readonly', type: 'boolean', default: 'false', description: 'Readonly state' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Textarea" :code="`<CuiTextarea v-model=&quot;text&quot; placeholder=&quot;Write something...&quot; />`">
          <CuiStack spacing="2" class="max-w-lg">
            <CuiTextarea v-model="text" placeholder="Write something..." />
            <div class="text-sm text-surface-500">Value length: {{ text.length }}</div>
          </CuiStack>
        </Example>

        <!-- Rows -->
        <Example title="Custom Row Count">
          <CuiStack spacing="3" class="max-w-lg">
            <CuiTextarea placeholder="2 rows" :rows="2" />
            <CuiTextarea placeholder="5 rows" :rows="5" />
            <CuiTextarea placeholder="8 rows" :rows="8" />
          </CuiStack>
        </Example>

        <!-- Auto Resize -->
        <Example title="Auto Resize" :code="`<CuiTextarea v-model=&quot;bio&quot; auto-resize :max-rows=&quot;8&quot; />`">
          <CuiStack spacing="3" class="max-w-lg">
            <div>
              <div class="mb-1 text-sm font-medium">Grows with content (no max):</div>
              <CuiTextarea v-model="bio" auto-resize placeholder="Type to see it grow..." />
            </div>
            <div>
              <div class="mb-1 text-sm font-medium">Grows up to 6 rows, then scrolls:</div>
              <CuiTextarea v-model="bio" auto-resize :max-rows="6" placeholder="Type to see it grow..." />
            </div>
          </CuiStack>
        </Example>

        <!-- Character Counter -->
        <Example title="Character Counter" :code="`<CuiTextarea v-model=&quot;feedback&quot; :max-length=&quot;200&quot; />`">
          <CuiStack spacing="3" class="max-w-lg">
            <CuiTextarea
              v-model="feedback"
              :max-length="200"
              placeholder="Share your feedback (max 200 characters)..."
              auto-resize
            />
            <CuiTextarea
              v-model="notes"
              :max-length="50"
              placeholder="Short note (max 50)..."
              :rows="2"
            />
          </CuiStack>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes">
          <CuiStack spacing="3" class="max-w-lg">
            <CuiTextarea placeholder="Extra small" size="xs" :rows="2" />
            <CuiTextarea placeholder="Small" size="sm" :rows="2" />
            <CuiTextarea placeholder="Medium (default)" size="md" :rows="2" />
            <CuiTextarea placeholder="Large" size="lg" :rows="2" />
            <CuiTextarea placeholder="Extra large" size="xl" :rows="2" />
          </CuiStack>
        </Example>

        <!-- Focus Colors -->
        <Example title="Focus Colors (click to see)">
          <CuiStack spacing="3" class="max-w-lg">
            <CuiTextarea placeholder="Primary focus" color="primary" :rows="2" />
            <CuiTextarea placeholder="Success focus" color="success" :rows="2" />
            <CuiTextarea placeholder="Error focus" color="error" :rows="2" />
            <CuiTextarea placeholder="Info focus" color="info" :rows="2" />
          </CuiStack>
        </Example>

        <!-- Error Validation -->
        <Example title="Error Validation">
          <CuiStack spacing="3" class="max-w-lg">
            <CuiTextarea
              v-model="errorVal"
              error
              error-message="Please provide a description"
              placeholder="Required field..."
            />
            <CuiTextarea
              v-model="errorVal"
              error
              error-message="Description must be at least 20 characters"
              :max-length="500"
              placeholder="Too short..."
            />
          </CuiStack>
        </Example>

        <!-- Disabled / Readonly -->
        <Example title="Disabled &amp; Readonly">
          <CuiStack spacing="3" class="max-w-lg">
            <CuiTextarea model-value="This textarea is disabled" disabled />
            <CuiTextarea model-value="This textarea is read-only. You can select and copy the text but cannot edit it." readonly />
          </CuiStack>
        </Example>

        <!-- Real-world: Bio editor -->
        <Example title="Real-World: Profile Bio">
          <div class="max-w-lg">
            <div class="mb-1 text-sm font-medium">Bio</div>
            <CuiTextarea
              v-model="bio"
              auto-resize
              :max-rows="10"
              :max-length="500"
              placeholder="Tell us about yourself..."
              color="primary"
            />
          </div>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
