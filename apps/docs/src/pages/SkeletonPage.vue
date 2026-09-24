<script setup lang="ts">
import { CuiCard, CuiCardBody, CuiCardHeader, CuiCardMedia, CuiFlex, CuiGrid, CuiSkeleton, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/skeleton";
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example code-open :code="`<CuiSkeleton />`">
        <div class="max-w-lg">
          <CuiSkeleton />
        </div>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        Each skeleton carries <code>role="status"</code> and <code>aria-busy="true"</code>
        with a localized label, so a screen reader hears that content is loading rather
        than nothing at all. The label comes from the message catalog — override it through
        localization, not per instance.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        Use one skeleton per loading region, not one per line. A card that renders a
        heading, an avatar and three text lines as four separate skeletons announces
        "loading" four times; wrap the region instead and let the shapes inside it be
        decorative.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        <code>animation="none"</code> is the right choice when a user has asked for reduced
        motion and you are driving that preference yourself. The shimmer is a background
        animation rather than movement across the screen, so it is mild, but a static
        placeholder is never wrong.
      </p>
    </template>

    <template #examples>
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
        <Example title="Animation Styles" :code="`<CuiSkeleton animation=&quot;shimmer&quot; />
<CuiSkeleton animation=&quot;pulse&quot; />
<CuiSkeleton animation=&quot;none&quot; />`">
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
        <Example title="Real-World: Card Loading" :code="`<CuiCard variant=&quot;outline&quot;>
  <CuiCardMedia>
    <CuiSkeleton variant=&quot;rectangle&quot; height=&quot;10rem&quot; rounded=&quot;none&quot; />
  </CuiCardMedia>
  <CuiCardBody>
    <CuiSkeleton :lines=&quot;1&quot; />
    <CuiSkeleton :lines=&quot;2&quot; last-line-width=&quot;80%&quot; />
  </CuiCardBody>
</CuiCard>`">
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
        <Example title="Real-World: List Items" :code="`<CuiFlex v-for=&quot;i in 4&quot; :key=&quot;i&quot; gap=&quot;3&quot; class=&quot;items-center&quot;>
  <CuiSkeleton variant=&quot;circle&quot; size=&quot;2.5rem&quot; />
  <div style=&quot;flex: 1;&quot;>
    <CuiSkeleton :lines=&quot;1&quot; />
    <CuiSkeleton :lines=&quot;1&quot; last-line-width=&quot;50%&quot; />
  </div>
</CuiFlex>`">
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
        <Example title="Real-World: Profile Header" :code="`<CuiCard variant=&quot;outline&quot;>
  <CuiCardBody>
    <CuiFlex gap=&quot;4&quot; class=&quot;items-center&quot;>
      <CuiSkeleton variant=&quot;circle&quot; size=&quot;4rem&quot; />
      <div style=&quot;flex: 1;&quot;>
        <CuiSkeleton :lines=&quot;1&quot; />
        <CuiSkeleton :lines=&quot;1&quot; last-line-width=&quot;40%&quot; />
      </div>
    </CuiFlex>
    <div class=&quot;mt-4&quot;>
      <CuiSkeleton :lines=&quot;3&quot; />
    </div>
  </CuiCardBody>
</CuiCard>`">
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
    </template>
  </DocPage>
</template>
