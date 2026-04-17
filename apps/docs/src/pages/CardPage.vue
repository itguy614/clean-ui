<script setup lang="ts">
import {
  CuiBadge,
  CuiButton,
  CuiCard,
  CuiCardBody,
  CuiCardFooter,
  CuiCardHeader,
  CuiCardMedia,
  CuiFlex,
  CuiGrid,
  CuiIcon,
  CuiStack,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Card</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Structured container built with sub-components: CuiCard, CuiCardHeader,
        CuiCardBody, CuiCardFooter, CuiCardMedia. Assemble the pieces you need.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiCard Props</h2>
      <PropTable
        :props="[
          { name: 'variant', type: 'default | outline | ghost', default: 'default', description: 'Visual style (default: border + shadow, outline: border only, ghost: none)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Sub-Components</h2>
      <PropTable
        :props="[
          { name: 'CuiCardHeader', type: 'component', default: '-', description: 'Header with title/subtitle props, default + #actions slots' },
          { name: 'CuiCardBody', type: 'component', default: '-', description: 'Padded content area. noPadding prop available.' },
          { name: 'CuiCardFooter', type: 'component', default: '-', description: 'Footer with align prop (left/right/center/between)' },
          { name: 'CuiCardMedia', type: 'component', default: '-', description: 'Image/video area. src, alt, aspect (auto/video/square/custom), position (top/bottom)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Card" :code="`<CuiCard>
  <CuiCardHeader title=&quot;Card Title&quot; subtitle=&quot;Subtitle&quot; />
  <CuiCardBody>Content here</CuiCardBody>
  <CuiCardFooter>
    <CuiButton>Action</CuiButton>
  </CuiCardFooter>
</CuiCard>`">
          <div class="max-w-sm">
            <CuiCard>
              <CuiCardHeader title="Card Title" subtitle="A brief subtitle" />
              <CuiCardBody>
                <p class="text-surface-600 dark:text-surface-400">
                  This is a basic card with a header, body, and footer. Each section is a separate sub-component.
                </p>
              </CuiCardBody>
              <CuiCardFooter>
                <CuiButton size="sm" variant="ghost" color="secondary">Cancel</CuiButton>
                <CuiButton size="sm" variant="solid">Save</CuiButton>
              </CuiCardFooter>
            </CuiCard>
          </div>
        </Example>

        <!-- Variants -->
        <Example title="Variants">
          <CuiGrid :cols="{ sm: 1, md: 3 }" gap="4">
            <CuiCard variant="default">
              <CuiCardHeader title="Default" subtitle="Border + shadow" />
              <CuiCardBody>
                <p class="text-sm text-surface-500">The standard card with subtle elevation.</p>
              </CuiCardBody>
            </CuiCard>
            <CuiCard variant="outline">
              <CuiCardHeader title="Outline" subtitle="Border only" />
              <CuiCardBody>
                <p class="text-sm text-surface-500">Flat card with just a border, no shadow.</p>
              </CuiCardBody>
            </CuiCard>
            <CuiCard variant="ghost">
              <CuiCardHeader title="Ghost" subtitle="No border or shadow" />
              <CuiCardBody>
                <p class="text-sm text-surface-500">Invisible container, groups content visually.</p>
              </CuiCardBody>
            </CuiCard>
          </CuiGrid>
        </Example>

        <!-- Header with Actions -->
        <Example title="Header with Actions Slot">
          <div class="max-w-md">
            <CuiCard>
              <CuiCardHeader title="Notifications" subtitle="3 unread">
                <template #actions>
                  <CuiBadge variant="solid" color="error" animation="pulse">3</CuiBadge>
                  <CuiButton size="xs" variant="ghost" color="secondary">Mark all read</CuiButton>
                </template>
              </CuiCardHeader>
              <CuiCardBody>
                <CuiStack spacing="3">
                  <div class="flex items-center gap-3">
                    <CuiIcon name="envelope" size="sm" color="var(--cui-primary)" />
                    <span class="text-sm">New message from Alice</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <CuiIcon name="bell" size="sm" color="var(--cui-warning)" />
                    <span class="text-sm">Deployment completed</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <CuiIcon name="user-plus" size="sm" color="var(--cui-success)" />
                    <span class="text-sm">New team member joined</span>
                  </div>
                </CuiStack>
              </CuiCardBody>
            </CuiCard>
          </div>
        </Example>

        <!-- With Media -->
        <Example title="Card with Media">
          <CuiGrid :cols="{ sm: 1, md: 3 }" gap="4">
            <CuiCard>
              <CuiCardMedia
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop"
                alt="Mountain landscape"
              />
              <CuiCardBody>
                <h3 class="font-semibold">Mountain Vista</h3>
                <p class="mt-1 text-sm text-surface-500">A breathtaking view from the summit at dawn.</p>
              </CuiCardBody>
            </CuiCard>
            <CuiCard>
              <CuiCardMedia
                src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=225&fit=crop"
                alt="Forest path"
              />
              <CuiCardBody>
                <h3 class="font-semibold">Forest Trail</h3>
                <p class="mt-1 text-sm text-surface-500">Winding through ancient redwoods and ferns.</p>
              </CuiCardBody>
            </CuiCard>
            <CuiCard>
              <CuiCardMedia
                src="https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=225&fit=crop"
                alt="Waterfall"
              />
              <CuiCardBody>
                <h3 class="font-semibold">Hidden Falls</h3>
                <p class="mt-1 text-sm text-surface-500">Discover the secret waterfall deep in the canyon.</p>
              </CuiCardBody>
            </CuiCard>
          </CuiGrid>
        </Example>

        <!-- Media Aspect Ratios -->
        <Example title="Media Aspect Ratios">
          <CuiGrid :cols="{ sm: 1, md: 3 }" gap="4">
            <CuiCard variant="outline">
              <CuiCardMedia aspect="video" src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop" alt="16:9" />
              <CuiCardBody><p class="text-sm text-surface-500">aspect="video" (16:9)</p></CuiCardBody>
            </CuiCard>
            <CuiCard variant="outline">
              <CuiCardMedia aspect="square" src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop" alt="1:1" />
              <CuiCardBody><p class="text-sm text-surface-500">aspect="square" (1:1)</p></CuiCardBody>
            </CuiCard>
            <CuiCard variant="outline">
              <CuiCardMedia aspect="4 / 3" src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop" alt="4:3" />
              <CuiCardBody><p class="text-sm text-surface-500">aspect="4 / 3" (custom)</p></CuiCardBody>
            </CuiCard>
          </CuiGrid>
        </Example>

        <!-- Footer Alignment -->
        <Example title="Footer Alignment">
          <CuiGrid :cols="{ sm: 1, md: 2 }" gap="4">
            <CuiCard variant="outline">
              <CuiCardHeader title="Right (default)" />
              <CuiCardBody><p class="text-sm text-surface-500">Footer actions aligned right.</p></CuiCardBody>
              <CuiCardFooter>
                <CuiButton size="sm" variant="ghost">Cancel</CuiButton>
                <CuiButton size="sm" variant="solid">Submit</CuiButton>
              </CuiCardFooter>
            </CuiCard>
            <CuiCard variant="outline">
              <CuiCardHeader title="Between" />
              <CuiCardBody><p class="text-sm text-surface-500">Footer with space-between.</p></CuiCardBody>
              <CuiCardFooter align="between">
                <CuiButton size="sm" variant="ghost" color="error">Delete</CuiButton>
                <CuiFlex gap="2">
                  <CuiButton size="sm" variant="ghost">Cancel</CuiButton>
                  <CuiButton size="sm" variant="solid">Save</CuiButton>
                </CuiFlex>
              </CuiCardFooter>
            </CuiCard>
          </CuiGrid>
        </Example>

        <!-- Body Only -->
        <Example title="Body Only (minimal card)">
          <div class="max-w-sm">
            <CuiCard>
              <CuiCardBody>
                <p class="text-surface-600 dark:text-surface-400">
                  A card with just a body — no header or footer needed. Use when you just want
                  a bordered container for content.
                </p>
              </CuiCardBody>
            </CuiCard>
          </div>
        </Example>

        <!-- Product Card -->
        <Example title="Real-World: Product Card">
          <CuiGrid :cols="{ sm: 1, md: 3 }" gap="4">
            <CuiCard>
              <CuiCardMedia
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=225&fit=crop"
                alt="Product"
              />
              <CuiCardBody>
                <CuiFlex gap="2" class="items-center mb-2">
                  <CuiBadge color="success" size="sm">In Stock</CuiBadge>
                  <CuiBadge variant="outline" size="sm">New</CuiBadge>
                </CuiFlex>
                <h3 class="font-semibold">Classic Watch</h3>
                <p class="mt-1 text-sm text-surface-500">Minimalist design with premium materials.</p>
                <p class="mt-2 text-lg font-bold" style="color: var(--cui-primary)">$129.99</p>
              </CuiCardBody>
              <CuiCardFooter>
                <CuiButton size="sm" variant="solid" color="primary" class="w-full">Add to Cart</CuiButton>
              </CuiCardFooter>
            </CuiCard>
          </CuiGrid>
        </Example>

        <!-- Profile Card -->
        <Example title="Real-World: Profile Card">
          <div class="max-w-xs">
            <CuiCard>
              <CuiCardBody class="text-center">
                <div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full" style="background: var(--cui-primary-bg)">
                  <CuiIcon name="user" size="xl" color="var(--cui-primary)" />
                </div>
                <h3 class="font-semibold">Kurt Wolf</h3>
                <p class="text-sm text-surface-500">Full Stack Developer</p>
                <CuiFlex gap="2" class="mt-3 justify-center">
                  <CuiBadge>Vue</CuiBadge>
                  <CuiBadge>TypeScript</CuiBadge>
                  <CuiBadge>Laravel</CuiBadge>
                </CuiFlex>
              </CuiCardBody>
              <CuiCardFooter align="center">
                <CuiButton size="sm" variant="outline">View Profile</CuiButton>
                <CuiButton size="sm" variant="solid">Message</CuiButton>
              </CuiCardFooter>
            </CuiCard>
          </div>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
