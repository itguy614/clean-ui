<script setup lang="ts">
import { CuiCard, CuiCardBody, CuiCardHeader, CuiCardMedia, CuiFlex, CuiGrid, CuiSkeleton, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Skeleton</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Placeholder loading indicators that hint at the shape of content before it arrives.
        Supports text lines, rectangles, and circles with shimmer or pulse animations.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'variant', type: 'text | rectangle | circle', default: 'text', description: 'Shape variant' },
          { name: 'animation', type: 'shimmer | pulse | none', default: 'shimmer', description: 'Animation style' },
          { name: 'lines', type: 'number', default: '3', description: 'Number of lines (text variant only)' },
          { name: 'lastLineWidth', type: 'string', default: '60%', description: 'Width of the last text line for a natural trailing-off look' },
          { name: 'width', type: 'string', default: '100%', description: 'CSS width (rectangle variant)' },
          { name: 'height', type: 'string', default: '1rem', description: 'CSS height (rectangle variant)' },
          { name: 'size', type: 'string', default: '3rem', description: 'Diameter (circle variant)' },
          { name: 'rounded', type: 'none | sm | md | lg | full', default: 'sm', description: 'Border radius (rectangle variant only)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic text -->
        <Example title="Text Lines (Default)" :code="`<CuiSkeleton />\n<CuiSkeleton :lines=&quot;2&quot; />\n<CuiSkeleton :lines=&quot;5&quot; />`">
          <CuiStack spacing="6" class="max-w-lg">
            <div>
              <div class="mb-2 text-sm font-medium text-surface-600 dark:text-surface-400">3 lines (default):</div>
              <CuiSkeleton />
            </div>
            <div>
              <div class="mb-2 text-sm font-medium text-surface-600 dark:text-surface-400">2 lines:</div>
              <CuiSkeleton :lines="2" />
            </div>
            <div>
              <div class="mb-2 text-sm font-medium text-surface-600 dark:text-surface-400">5 lines:</div>
              <CuiSkeleton :lines="5" />
            </div>
          </CuiStack>
        </Example>

        <!-- Single line -->
        <Example title="Single Line" :code="`<CuiSkeleton :lines=&quot;1&quot; />`">
          <div class="max-w-lg">
            <CuiSkeleton :lines="1" />
          </div>
        </Example>

        <!-- Rectangle -->
        <Example title="Rectangle" :code="`<CuiSkeleton variant=&quot;rectangle&quot; height=&quot;8rem&quot; />\n<CuiSkeleton variant=&quot;rectangle&quot; width=&quot;12rem&quot; height=&quot;3rem&quot; rounded=&quot;lg&quot; />`">
          <CuiStack spacing="4" class="max-w-lg">
            <CuiSkeleton variant="rectangle" height="8rem" />
            <CuiSkeleton variant="rectangle" width="12rem" height="3rem" rounded="lg" />
            <CuiSkeleton variant="rectangle" width="6rem" height="6rem" rounded="full" />
          </CuiStack>
        </Example>

        <!-- Circle -->
        <Example title="Circle" :code="`<CuiSkeleton variant=&quot;circle&quot; />\n<CuiSkeleton variant=&quot;circle&quot; size=&quot;4rem&quot; />`">
          <CuiFlex gap="4" class="items-center">
            <CuiSkeleton variant="circle" size="2rem" />
            <CuiSkeleton variant="circle" />
            <CuiSkeleton variant="circle" size="4rem" />
            <CuiSkeleton variant="circle" size="5rem" />
          </CuiFlex>
        </Example>

        <!-- Animation variants -->
        <Example title="Animation Styles" :code="`<CuiSkeleton animation=&quot;shimmer&quot; />\n<CuiSkeleton animation=&quot;pulse&quot; />\n<CuiSkeleton animation=&quot;none&quot; />`">
          <CuiStack spacing="6" class="max-w-lg">
            <div>
              <div class="mb-2 text-sm font-medium text-surface-600 dark:text-surface-400">Shimmer (default):</div>
              <CuiSkeleton animation="shimmer" />
            </div>
            <div>
              <div class="mb-2 text-sm font-medium text-surface-600 dark:text-surface-400">Pulse:</div>
              <CuiSkeleton animation="pulse" />
            </div>
            <div>
              <div class="mb-2 text-sm font-medium text-surface-600 dark:text-surface-400">None:</div>
              <CuiSkeleton animation="none" />
            </div>
          </CuiStack>
        </Example>

        <!-- Border radius options -->
        <Example title="Border Radius (Rectangle)" :code="`<CuiSkeleton variant=&quot;rectangle&quot; rounded=&quot;none&quot; />\n<CuiSkeleton variant=&quot;rectangle&quot; rounded=&quot;md&quot; />\n<CuiSkeleton variant=&quot;rectangle&quot; rounded=&quot;full&quot; />`">
          <CuiStack spacing="4" class="max-w-sm">
            <div>
              <div class="mb-1 text-sm font-medium text-surface-600 dark:text-surface-400">none:</div>
              <CuiSkeleton variant="rectangle" height="2.5rem" rounded="none" />
            </div>
            <div>
              <div class="mb-1 text-sm font-medium text-surface-600 dark:text-surface-400">sm (default):</div>
              <CuiSkeleton variant="rectangle" height="2.5rem" rounded="sm" />
            </div>
            <div>
              <div class="mb-1 text-sm font-medium text-surface-600 dark:text-surface-400">md:</div>
              <CuiSkeleton variant="rectangle" height="2.5rem" rounded="md" />
            </div>
            <div>
              <div class="mb-1 text-sm font-medium text-surface-600 dark:text-surface-400">lg:</div>
              <CuiSkeleton variant="rectangle" height="2.5rem" rounded="lg" />
            </div>
            <div>
              <div class="mb-1 text-sm font-medium text-surface-600 dark:text-surface-400">full:</div>
              <CuiSkeleton variant="rectangle" height="2.5rem" rounded="full" />
            </div>
          </CuiStack>
        </Example>

        <!-- Real-world: Card loading -->
        <Example title="Real-World: Card Loading">
          <CuiGrid :cols="{ sm: 1, md: 3 }" gap="4">
            <CuiCard v-for="i in 3" :key="i" variant="outline">
              <CuiCardMedia>
                <CuiSkeleton variant="rectangle" height="10rem" rounded="none" />
              </CuiCardMedia>
              <CuiCardBody>
                <CuiStack spacing="3">
                  <CuiSkeleton :lines="1" />
                  <CuiSkeleton :lines="2" last-line-width="80%" />
                </CuiStack>
              </CuiCardBody>
            </CuiCard>
          </CuiGrid>
        </Example>

        <!-- Real-world: List items -->
        <Example title="Real-World: List Items">
          <CuiStack spacing="4" class="max-w-md">
            <CuiFlex v-for="i in 4" :key="i" gap="3" class="items-center">
              <CuiSkeleton variant="circle" size="2.5rem" />
              <div style="flex: 1;">
                <CuiStack spacing="2">
                  <CuiSkeleton :lines="1" />
                  <CuiSkeleton :lines="1" last-line-width="50%" />
                </CuiStack>
              </div>
            </CuiFlex>
          </CuiStack>
        </Example>

        <!-- Real-world: Profile -->
        <Example title="Real-World: Profile Header">
          <div class="max-w-sm">
            <CuiCard variant="outline">
              <CuiCardBody>
                <CuiFlex gap="4" class="items-center">
                  <CuiSkeleton variant="circle" size="4rem" />
                  <div style="flex: 1;">
                    <CuiStack spacing="2">
                      <CuiSkeleton :lines="1" />
                      <CuiSkeleton :lines="1" last-line-width="40%" />
                    </CuiStack>
                  </div>
                </CuiFlex>
                <div class="mt-4">
                  <CuiSkeleton :lines="3" />
                </div>
              </CuiCardBody>
            </CuiCard>
          </div>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
