<script setup lang="ts">
import {
  CuiAvatar,
  CuiAvatarGroup,
  CuiCard,
  CuiCardBody,
  CuiFlex,
  CuiStack,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Avatar</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Displays a user image, initials, or icon placeholder with optional status indicator.
        Use CuiAvatarGroup to stack multiple avatars.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiAvatar Props</h2>
      <PropTable
        :props="[
          { name: 'src', type: 'string', default: '—', description: 'Image URL' },
          { name: 'alt', type: 'string', default: '—', description: 'Alt text for image' },
          { name: 'name', type: 'string', default: '—', description: 'Full name — auto-generates initials' },
          { name: 'initials', type: 'string', default: '—', description: 'Explicit initials (overrides name)' },
          { name: 'icon', type: 'string', default: 'user', description: 'Fallback icon when no image or initials' },
          { name: 'size', type: 'xs | sm | md | lg | xl', default: 'md', description: 'Size' },
          { name: 'shape', type: 'circle | rounded', default: 'circle', description: 'Shape' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Color role for initials/icon background' },
          { name: 'status', type: 'online | offline | away | busy', default: '—', description: 'Status indicator dot' },
          { name: 'statusAnimation', type: 'pulse | ping | none', default: 'none', description: 'Animate the status indicator' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiAvatarGroup Props</h2>
      <PropTable
        :props="[
          { name: 'spacing', type: 'string', default: '-0.5rem', description: 'Negative margin overlap between avatars' },
          { name: 'max', type: 'number', default: '—', description: 'Max avatars to show before +N overflow indicator' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Initials from name -->
        <Example title="Initials from Name" :code="`<CuiAvatar name=&quot;Alice Johnson&quot; />`">
          <CuiFlex gap="3" class="items-center">
            <CuiAvatar name="Alice Johnson" />
            <CuiAvatar name="Bob Smith" color="success" />
            <CuiAvatar name="Carol Williams" color="warning" />
            <CuiAvatar name="David Brown" color="error" />
            <CuiAvatar name="Eva Martinez" color="info" />
            <CuiAvatar name="Frank" color="secondary" />
          </CuiFlex>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes" :code="`<CuiAvatar name=&quot;Alice Johnson&quot; size=&quot;xs&quot; />
<CuiAvatar name=&quot;Alice Johnson&quot; size=&quot;sm&quot; />
<CuiAvatar name=&quot;Alice Johnson&quot; size=&quot;md&quot; />
<CuiAvatar name=&quot;Alice Johnson&quot; size=&quot;lg&quot; />
<CuiAvatar name=&quot;Alice Johnson&quot; size=&quot;xl&quot; />`">
          <CuiFlex gap="3" class="items-center">
            <CuiAvatar name="Alice Johnson" size="xs" />
            <CuiAvatar name="Alice Johnson" size="sm" />
            <CuiAvatar name="Alice Johnson" size="md" />
            <CuiAvatar name="Alice Johnson" size="lg" />
            <CuiAvatar name="Alice Johnson" size="xl" />
          </CuiFlex>
        </Example>

        <!-- With images -->
        <Example title="With Images" :code="`<CuiAvatar src=&quot;https://...&quot; name=&quot;Alice&quot; />`">
          <CuiFlex gap="3" class="items-center">
            <CuiAvatar src="https://i.pravatar.cc/100?u=alice" name="Alice Johnson" />
            <CuiAvatar src="https://i.pravatar.cc/100?u=bob" name="Bob Smith" />
            <CuiAvatar src="https://i.pravatar.cc/100?u=carol" name="Carol Williams" />
            <CuiAvatar src="https://broken-url.invalid/no-image.jpg" name="Fallback" />
          </CuiFlex>
          <p class="mt-2 text-xs" style="color: var(--cui-text-tertiary);">
            Last avatar has a broken URL — falls back to initials
          </p>
        </Example>

        <!-- Icon fallback -->
        <Example title="Icon Fallback" :code="`<CuiAvatar icon=&quot;user-circle&quot; />`">
          <CuiFlex gap="3" class="items-center">
            <CuiAvatar />
            <CuiAvatar icon="user-circle" color="secondary" />
            <CuiAvatar icon="robot" color="info" />
            <CuiAvatar icon="buildings" color="warning" />
          </CuiFlex>
        </Example>

        <!-- Shapes -->
        <Example title="Shapes" :code="`<CuiAvatar name=&quot;Circle&quot; shape=&quot;circle&quot; />
<CuiAvatar name=&quot;Rounded&quot; shape=&quot;rounded&quot; />`">
          <CuiFlex gap="3" class="items-center">
            <CuiAvatar name="Circle" shape="circle" size="lg" />
            <CuiAvatar name="Rounded" shape="rounded" size="lg" color="secondary" />
            <CuiAvatar src="https://i.pravatar.cc/100?u=shape1" shape="circle" size="lg" />
            <CuiAvatar src="https://i.pravatar.cc/100?u=shape2" shape="rounded" size="lg" />
          </CuiFlex>
        </Example>

        <!-- Status indicators -->
        <Example title="Status Indicators" :code="`<CuiAvatar name=&quot;Alice&quot; status=&quot;online&quot; />`">
          <CuiFlex gap="4" class="items-center">
            <div class="text-center">
              <CuiAvatar name="Alice Johnson" status="online" size="lg" />
              <div class="mt-1 text-xs" style="color: var(--cui-text-secondary);">Online</div>
            </div>
            <div class="text-center">
              <CuiAvatar name="Bob Smith" status="away" size="lg" color="warning" />
              <div class="mt-1 text-xs" style="color: var(--cui-text-secondary);">Away</div>
            </div>
            <div class="text-center">
              <CuiAvatar name="Carol Williams" status="busy" size="lg" color="error" />
              <div class="mt-1 text-xs" style="color: var(--cui-text-secondary);">Busy</div>
            </div>
            <div class="text-center">
              <CuiAvatar name="David Brown" status="offline" size="lg" color="secondary" />
              <div class="mt-1 text-xs" style="color: var(--cui-text-secondary);">Offline</div>
            </div>
          </CuiFlex>
        </Example>

        <!-- Animated status -->
        <Example title="Animated Status" :code="`<CuiAvatar name=&quot;Alice&quot; status=&quot;online&quot; status-animation=&quot;ping&quot; />
<CuiAvatar name=&quot;Bob&quot; status=&quot;online&quot; status-animation=&quot;pulse&quot; />
<CuiAvatar name=&quot;Carol&quot; status=&quot;busy&quot; status-animation=&quot;ping&quot; />`">
          <CuiFlex gap="4" class="items-center">
            <div class="text-center">
              <CuiAvatar name="Alice Johnson" status="online" size="lg" status-animation="ping" />
              <div class="mt-1 text-xs" style="color: var(--cui-text-secondary);">Ping</div>
            </div>
            <div class="text-center">
              <CuiAvatar name="Bob Smith" status="online" size="lg" status-animation="pulse" />
              <div class="mt-1 text-xs" style="color: var(--cui-text-secondary);">Pulse</div>
            </div>
            <div class="text-center">
              <CuiAvatar name="Carol Williams" status="busy" size="lg" color="error" status-animation="ping" />
              <div class="mt-1 text-xs" style="color: var(--cui-text-secondary);">Busy ping</div>
            </div>
            <div class="text-center">
              <CuiAvatar name="David Brown" status="away" size="lg" color="warning" status-animation="pulse" />
              <div class="mt-1 text-xs" style="color: var(--cui-text-secondary);">Away pulse</div>
            </div>
            <div class="text-center">
              <CuiAvatar name="Eva Martinez" status="online" size="lg" status-animation="none" />
              <div class="mt-1 text-xs" style="color: var(--cui-text-secondary);">None</div>
            </div>
          </CuiFlex>
        </Example>

        <!-- Avatar group -->
        <Example title="Avatar Group" :code="`<CuiAvatarGroup>
  <CuiAvatar name=&quot;Alice&quot; />
  <CuiAvatar name=&quot;Bob&quot; />
  ...
</CuiAvatarGroup>`">
          <CuiStack spacing="4">
            <div>
              <div class="mb-2 text-sm font-medium" style="color: var(--cui-text-secondary);">Small:</div>
              <CuiAvatarGroup>
                <CuiAvatar name="Alice Johnson" size="sm" />
                <CuiAvatar name="Bob Smith" size="sm" color="success" />
                <CuiAvatar name="Carol Williams" size="sm" color="warning" />
                <CuiAvatar name="David Brown" size="sm" color="error" />
              </CuiAvatarGroup>
            </div>
            <div>
              <div class="mb-2 text-sm font-medium" style="color: var(--cui-text-secondary);">Medium:</div>
              <CuiAvatarGroup>
                <CuiAvatar name="Alice Johnson" />
                <CuiAvatar name="Bob Smith" color="success" />
                <CuiAvatar name="Carol Williams" color="warning" />
                <CuiAvatar name="David Brown" color="error" />
                <CuiAvatar name="Eva Martinez" color="info" />
              </CuiAvatarGroup>
            </div>
            <div>
              <div class="mb-2 text-sm font-medium" style="color: var(--cui-text-secondary);">With images:</div>
              <CuiAvatarGroup>
                <CuiAvatar src="https://i.pravatar.cc/100?u=g1" name="Alice" />
                <CuiAvatar src="https://i.pravatar.cc/100?u=g2" name="Bob" />
                <CuiAvatar src="https://i.pravatar.cc/100?u=g3" name="Carol" />
                <CuiAvatar src="https://i.pravatar.cc/100?u=g4" name="David" />
                <CuiAvatar src="https://i.pravatar.cc/100?u=g5" name="Eva" />
                <CuiAvatar initials="+3" color="secondary" />
              </CuiAvatarGroup>
            </div>
            <div>
              <div class="mb-2 text-sm font-medium" style="color: var(--cui-text-secondary);">With status:</div>
              <CuiAvatarGroup>
                <CuiAvatar src="https://i.pravatar.cc/100?u=s1" name="Alice" status="online" status-animation="ping" />
                <CuiAvatar src="https://i.pravatar.cc/100?u=s2" name="Bob" status="online" />
                <CuiAvatar src="https://i.pravatar.cc/100?u=s3" name="Carol" status="away" />
                <CuiAvatar src="https://i.pravatar.cc/100?u=s4" name="David" status="busy" />
                <CuiAvatar src="https://i.pravatar.cc/100?u=s5" name="Eva" status="offline" />
              </CuiAvatarGroup>
            </div>
          </CuiStack>
        </Example>

        <!-- Real-world: User profile -->
        <Example title="Real-World: User Info" :code="`<CuiFlex gap=&quot;3&quot; class=&quot;items-center&quot;>
  <CuiAvatar src=&quot;...&quot; name=&quot;Jane Doe&quot; size=&quot;lg&quot; status=&quot;online&quot; />
  <div>
    <div class=&quot;font-semibold&quot;>Jane Doe</div>
    <div>Product Designer</div>
  </div>
</CuiFlex>`">
          <CuiCard variant="outline" style="max-width: 20rem;">
            <CuiCardBody>
              <CuiFlex gap="3" class="items-center">
                <CuiAvatar src="https://i.pravatar.cc/100?u=profile" name="Jane Doe" size="lg" status="online" />
                <div>
                  <div class="font-semibold">Jane Doe</div>
                  <div class="text-sm" style="color: var(--cui-text-secondary);">Product Designer</div>
                  <div class="text-xs" style="color: var(--cui-text-tertiary);">jane@example.com</div>
                </div>
              </CuiFlex>
            </CuiCardBody>
          </CuiCard>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
