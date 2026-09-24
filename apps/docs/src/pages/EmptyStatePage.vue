<script setup lang="ts">
import { CuiButton, CuiCard, CuiCardBody, CuiEmptyState, CuiGrid, CuiIcon, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/empty-state";
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiEmptyState
  icon=&quot;package&quot;
  title=&quot;No items yet&quot;
  description=&quot;Add your first item to get started.&quot;
/>`"
      >
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
    </template>

    <template #accessibility>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        The title renders as an <code>&lt;h3&gt;</code>, so an empty state is reachable by
        heading navigation and appears in the document outline — it is a real region
        heading, not decoration. Set <code>titleAs</code> so the level fits where the empty
        state sits: <code>h2</code> when it replaces a whole page's content,
        <code>h4</code> inside an already-nested panel.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        The icon is decorative and is not announced. The title and description carry the
        meaning, so write them to stand on their own — "No invoices match this filter"
        rather than a bare "Nothing here" beside a magnifying glass.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        An empty state is a dead end without a way out. Put the next action in the
        <code>#actions</code> slot — creating the first item, clearing the filter — rather
        than leaving the user to find it elsewhere on the page.
      </p>
    </template>

    <template #examples>
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

    </template>
  </DocPage>
</template>
