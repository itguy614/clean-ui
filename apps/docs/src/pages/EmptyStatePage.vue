<script setup lang="ts">
import { CuiButton, CuiCard, CuiCardBody, CuiEmptyState, CuiGrid, CuiIcon, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Empty State</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A centered placeholder for when there's no content to display — empty lists, search results, tables, or first-time experiences.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'icon', type: 'string', default: '—', description: 'Phosphor icon name' },
          { name: 'title', type: 'string', default: '—', description: 'Heading text' },
          { name: 'description', type: 'string', default: '—', description: 'Supporting text below the title' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Controls icon size, font sizes, and spacing' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Color role for the icon area' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Slots</h2>
      <PropTable
        :props="[
          { name: 'icon', type: 'slot', default: '—', description: 'Override the icon area (custom illustration, image, etc.)' },
          { name: 'default', type: 'slot', default: '—', description: 'Override everything below the icon (replaces title + description + actions)' },
          { name: 'actions', type: 'slot', default: '—', description: 'Action buttons below the description' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic" :code="`<CuiEmptyState
  icon=&quot;package&quot;
  title=&quot;No items yet&quot;
  description=&quot;Add your first item to get started.&quot;
/>`">
          <CuiCard variant="outline">
            <CuiCardBody>
              <CuiEmptyState
                icon="package"
                title="No items yet"
                description="Add your first item to get started."
              />
            </CuiCardBody>
          </CuiCard>
        </Example>

        <!-- With actions -->
        <Example title="With Actions" :code="`<CuiEmptyState
  icon=&quot;plus-circle&quot;
  title=&quot;Create your first project&quot;
  description=&quot;Projects help you organize your work.&quot;
>
  <template #actions>
    <CuiButton variant=&quot;solid&quot; size=&quot;sm&quot;>
      <template #prefix><CuiIcon name=&quot;plus&quot; /></template>
      New Project
    </CuiButton>
    <CuiButton variant=&quot;ghost&quot; size=&quot;sm&quot;>Learn More</CuiButton>
  </template>
</CuiEmptyState>`">
          <CuiCard variant="outline">
            <CuiCardBody>
              <CuiEmptyState
                icon="plus-circle"
                title="Create your first project"
                description="Projects help you organize your work and collaborate with your team."
              >
                <template #actions>
                  <CuiButton variant="solid" size="sm">
                    <template #prefix><CuiIcon name="plus" /></template>
                    New Project
                  </CuiButton>
                  <CuiButton variant="ghost" size="sm">Learn More</CuiButton>
                </template>
              </CuiEmptyState>
            </CuiCardBody>
          </CuiCard>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes">
          <CuiGrid :cols="{ sm: 1, md: 3 }" gap="4">
            <CuiCard variant="outline">
              <CuiCardBody>
                <CuiEmptyState
                  icon="magnifying-glass"
                  title="No results"
                  description="Try a different search."
                  size="sm"
                />
              </CuiCardBody>
            </CuiCard>
            <CuiCard variant="outline">
              <CuiCardBody>
                <CuiEmptyState
                  icon="magnifying-glass"
                  title="No results"
                  description="Try a different search."
                  size="md"
                />
              </CuiCardBody>
            </CuiCard>
            <CuiCard variant="outline">
              <CuiCardBody>
                <CuiEmptyState
                  icon="magnifying-glass"
                  title="No results"
                  description="Try a different search."
                  size="lg"
                />
              </CuiCardBody>
            </CuiCard>
          </CuiGrid>
        </Example>

        <!-- Colors -->
        <Example title="Colors">
          <CuiGrid :cols="{ sm: 1, md: 3 }" gap="4">
            <CuiCard variant="outline">
              <CuiCardBody>
                <CuiEmptyState
                  icon="bell-slash"
                  title="All caught up"
                  description="No new notifications."
                  color="success"
                  size="sm"
                />
              </CuiCardBody>
            </CuiCard>
            <CuiCard variant="outline">
              <CuiCardBody>
                <CuiEmptyState
                  icon="warning"
                  title="Connection lost"
                  description="Check your internet."
                  color="warning"
                  size="sm"
                />
              </CuiCardBody>
            </CuiCard>
            <CuiCard variant="outline">
              <CuiCardBody>
                <CuiEmptyState
                  icon="x-circle"
                  title="Something went wrong"
                  description="Please try again later."
                  color="error"
                  size="sm"
                />
              </CuiCardBody>
            </CuiCard>
          </CuiGrid>
        </Example>

        <!-- Custom icon slot -->
        <Example title="Custom Icon Slot" :code="`<CuiEmptyState title=&quot;No messages&quot; description=&quot;...&quot;>
  <template #icon>
    <img src=&quot;...&quot; alt=&quot;...&quot; />
  </template>
</CuiEmptyState>`">
          <CuiCard variant="outline">
            <CuiCardBody>
              <CuiEmptyState
                title="No messages"
                description="Your inbox is empty. When someone sends you a message it will appear here."
              >
                <template #icon>
                  <div style="font-size: 3rem; line-height: 1;">
                    &#x1F4EC;
                  </div>
                </template>
              </CuiEmptyState>
            </CuiCardBody>
          </CuiCard>
        </Example>

        <!-- Real-world: Search results -->
        <Example title="Real-World: Empty Search Results">
          <CuiCard variant="outline">
            <CuiCardBody>
              <CuiEmptyState
                icon="magnifying-glass"
                title="No results found"
                description="We couldn't find anything matching &quot;fluxcapacitor&quot;. Check your spelling or try broader terms."
                color="secondary"
              >
                <template #actions>
                  <CuiButton variant="outline" size="sm">Clear Search</CuiButton>
                </template>
              </CuiEmptyState>
            </CuiCardBody>
          </CuiCard>
        </Example>

        <!-- Real-world: First-time experience -->
        <Example title="Real-World: First-Time Experience">
          <CuiCard variant="outline">
            <CuiCardBody>
              <CuiEmptyState
                icon="rocket-launch"
                title="Welcome to your dashboard"
                description="This is where you'll see your projects, tasks, and team activity. Let's get you set up."
                size="lg"
                color="primary"
              >
                <template #actions>
                  <CuiButton variant="solid">
                    <template #prefix><CuiIcon name="plus" /></template>
                    Create First Project
                  </CuiButton>
                  <CuiButton variant="ghost">Watch a Tour</CuiButton>
                </template>
              </CuiEmptyState>
            </CuiCardBody>
          </CuiCard>
        </Example>

        <!-- Real-world: Error state -->
        <Example title="Real-World: Error State">
          <CuiCard variant="outline">
            <CuiCardBody>
              <CuiEmptyState
                icon="wifi-slash"
                title="Unable to load data"
                description="We're having trouble connecting to the server. This is usually temporary."
                color="error"
              >
                <template #actions>
                  <CuiButton variant="outline" size="sm" color="error">
                    <template #prefix><CuiIcon name="arrow-counter-clockwise" /></template>
                    Retry
                  </CuiButton>
                </template>
              </CuiEmptyState>
            </CuiCardBody>
          </CuiCard>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
