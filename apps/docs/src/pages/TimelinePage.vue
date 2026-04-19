<script setup lang="ts">
import {
  CuiAvatar,
  CuiBadge,
  CuiCard,
  CuiCardBody,
  CuiStack,
  CuiTimeline,
  CuiTimelineItem,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Timeline</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A vertical event timeline for activity feeds, changelogs, and order tracking.
        Composed from CuiTimeline and CuiTimelineItem sub-components.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiTimelineItem Props</h2>
      <PropTable
        :props="[
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Color for the dot/icon' },
          { name: 'icon', type: 'string', default: '—', description: 'Phosphor icon name (replaces the dot)' },
          { name: 'title', type: 'string', default: '—', description: 'Title text' },
          { name: 'timestamp', type: 'string', default: '—', description: 'Timestamp or meta text' },
          { name: 'last', type: 'boolean', default: 'false', description: 'Hide the connector line (use on last item)' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiTimeline Props</h2>
      <PropTable
        :props="[
          { name: 'compact', type: 'boolean', default: 'false', description: 'Compact mode — less spacing between items' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Timeline" :code="`<CuiTimeline>
  <CuiTimelineItem title=&quot;Event&quot; timestamp=&quot;2 hours ago&quot;>
    Description text...
  </CuiTimelineItem>
</CuiTimeline>`">
          <div class="max-w-lg">
            <CuiTimeline>
              <CuiTimelineItem title="Project created" timestamp="Jan 15, 2024">
                The project repository was initialized with the base configuration.
              </CuiTimelineItem>
              <CuiTimelineItem title="First commit" timestamp="Jan 16, 2024">
                Added core components: Button, Input, and Card.
              </CuiTimelineItem>
              <CuiTimelineItem title="v0.1.0 released" timestamp="Jan 20, 2024">
                First public release with 12 components.
              </CuiTimelineItem>
              <CuiTimelineItem title="v1.0.0 released" timestamp="Feb 1, 2024" last>
                Stable release with full documentation site.
              </CuiTimelineItem>
            </CuiTimeline>
          </div>
        </Example>

        <!-- With icons -->
        <Example title="With Icons" :code="`<CuiTimeline>
  <CuiTimelineItem icon=&quot;shopping-cart&quot; title=&quot;Order placed&quot; timestamp=&quot;10:30 AM&quot; color=&quot;primary&quot;>
    Order confirmed.
  </CuiTimelineItem>
  <CuiTimelineItem icon=&quot;check-circle&quot; title=&quot;Delivered&quot; timestamp=&quot;Next day&quot; color=&quot;success&quot; last>
    Left at front door.
  </CuiTimelineItem>
</CuiTimeline>`">
          <div class="max-w-lg">
            <CuiTimeline>
              <CuiTimelineItem icon="shopping-cart" title="Order placed" timestamp="10:30 AM" color="primary">
                Order #ORD-2024-8847 confirmed.
              </CuiTimelineItem>
              <CuiTimelineItem icon="credit-card" title="Payment processed" timestamp="10:31 AM" color="success">
                Visa ending in 4242 charged $129.99.
              </CuiTimelineItem>
              <CuiTimelineItem icon="package" title="Shipped" timestamp="2:15 PM" color="info">
                Tracking number: 1Z999AA10123456784
              </CuiTimelineItem>
              <CuiTimelineItem icon="truck" title="Out for delivery" timestamp="Next day, 8:00 AM" color="warning">
                Expected delivery by 5:00 PM.
              </CuiTimelineItem>
              <CuiTimelineItem icon="check-circle" title="Delivered" timestamp="Next day, 3:22 PM" color="success" last>
                Left at front door.
              </CuiTimelineItem>
            </CuiTimeline>
          </div>
        </Example>

        <!-- Colors -->
        <Example title="Mixed Colors">
          <div class="max-w-lg">
            <CuiTimeline>
              <CuiTimelineItem color="success" title="Build succeeded" timestamp="2 min ago" />
              <CuiTimelineItem color="error" title="Deploy failed" timestamp="5 min ago">
                Error: Container health check timed out after 30s.
              </CuiTimelineItem>
              <CuiTimelineItem color="warning" title="Rollback initiated" timestamp="6 min ago">
                Reverting to previous stable deployment.
              </CuiTimelineItem>
              <CuiTimelineItem color="success" title="Rollback complete" timestamp="7 min ago" last>
                Service restored to v2.3.1.
              </CuiTimelineItem>
            </CuiTimeline>
          </div>
        </Example>

        <!-- Custom icon slot -->
        <Example title="Custom Icon Slot (Avatars)">
          <div class="max-w-lg">
            <CuiTimeline>
              <CuiTimelineItem title="Alice commented" timestamp="1 hour ago">
                <template #icon>
                  <CuiAvatar name="Alice Johnson" size="xs" />
                </template>
                Looks great! Ship it.
              </CuiTimelineItem>
              <CuiTimelineItem title="Bob approved" timestamp="45 min ago">
                <template #icon>
                  <CuiAvatar name="Bob Smith" size="xs" color="success" />
                </template>
                Approved the pull request.
              </CuiTimelineItem>
              <CuiTimelineItem title="Carol merged" timestamp="30 min ago" last>
                <template #icon>
                  <CuiAvatar name="Carol Williams" size="xs" color="info" />
                </template>
                Merged into main branch.
              </CuiTimelineItem>
            </CuiTimeline>
          </div>
        </Example>

        <!-- Rich content -->
        <Example title="Real-World: Activity Feed">
          <div class="max-w-lg">
            <CuiCard variant="outline">
              <CuiCardBody>
                <div class="text-sm font-semibold" style="margin-bottom: 0.75rem;">Recent Activity</div>
                <CuiTimeline>
                  <CuiTimelineItem icon="git-merge" title="PR #142 merged" timestamp="Today, 2:30 PM" color="success">
                    <span>feat: add DataGrid component with sorting, filtering, and pagination</span>
                    <div style="margin-top: 0.375rem;">
                      <CuiBadge color="success" size="sm">+1,847</CuiBadge>
                      <CuiBadge color="error" size="sm" style="margin-left: 0.25rem;">-203</CuiBadge>
                    </div>
                  </CuiTimelineItem>
                  <CuiTimelineItem icon="bug" title="Issue #98 opened" timestamp="Today, 11:00 AM" color="error">
                    Sticky headers don't work when table is inside a CuiCard.
                  </CuiTimelineItem>
                  <CuiTimelineItem icon="check-circle" title="Issue #98 closed" timestamp="Today, 4:15 PM" color="success">
                    Fixed by applying inline styles via CuiTableHead inject.
                  </CuiTimelineItem>
                  <CuiTimelineItem icon="rocket-launch" title="v0.2.0 published" timestamp="Today, 5:00 PM" color="primary" last>
                    Released with 45 components and full docs site.
                  </CuiTimelineItem>
                </CuiTimeline>
              </CuiCardBody>
            </CuiCard>
          </div>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
