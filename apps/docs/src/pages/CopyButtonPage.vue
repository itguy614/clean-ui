<script setup lang="ts">
import {
  CuiCard,
  CuiCardBody,
  CuiCopyButton,
  CuiFlex,
  CuiInput,
  CuiStack,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/copy-button";

const apiKey = "sk_live_4eC39HqLyjWDarjtT1zdp7dc";
const inviteLink = "https://app.example.com/invite/abc123";
const codeSnippet = `npm install @itguy614/clean-ui`;
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example code-open :code="`<CuiCopyButton value=&quot;Hello world&quot; />`">
        <CuiFlex gap="3" class="items-center">
          <CuiCopyButton value="Hello world" />
        </CuiFlex>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        The default is icon-only, so the button takes its accessible name from
        <code>tooltip</code> — give it something specific when the page has several
        ("Copy API key", not four buttons all called "Copy"). With
        <code>show-label</code> the visible text is the name and no
        <code>aria-label</code> is set, since one would override the text rather than add
        to it.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        A successful copy is announced through a polite live region carrying
        <code>copiedTooltip</code>. Without it the only confirmation is the colour change,
        the icon swap and the tooltip — all of them visual, which is a
        <abbr title="Web Content Accessibility Guidelines">WCAG</abbr> 1.4.1 problem as
        well as a usability one.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        The button is a real <code>&lt;button&gt;</code>: reachable with
        <kbd class="cui-kbd">Tab</kbd>, activated with
        <kbd class="cui-kbd">Enter</kbd> or <kbd class="cui-kbd">Space</kbd>, and it draws
        the standard focus ring. The tooltip opens on focus as well as hover.
      </p>
    </template>

    <template #extra>
      <div>
        <h2 id="usecopytoclipboard" class="mb-4 text-2xl font-semibold">useCopyToClipboard</h2>
        <p class="mb-4 text-surface-600 dark:text-surface-400">
          The composable behind the button, for when you want the behaviour without this
          button — a copy action in a dropdown, a whole row that copies on click.
        </p>
        <Example
          code-open
          :code="`import { useCopyToClipboard } from '@itguy614/clean-ui';

const { copied, copy } = useCopyToClipboard(2000); // reset delay in ms

await copy('text'); // resolves true on success, false if both paths fail`"
        >
          <p class="text-sm text-surface-700 dark:text-surface-300">
            <code>copied</code> is a ref that flips to <code>true</code> and resets itself
            after the delay. <code>copy()</code> uses the async Clipboard API and falls
            back to a hidden textarea plus <code>document.execCommand</code> on insecure
            origins, where the Clipboard API is unavailable.
          </p>
        </Example>
      </div>
    </template>

    <template #examples>
      <CuiStack spacing="6">
        <!-- Basic -->
        <Example title="Basic" :code="`<CuiCopyButton value=&quot;Hello world&quot; />`">
          <CuiFlex gap="3" class="items-center">
            <CuiCopyButton value="Hello world" />
            <CuiCopyButton value="Hello world" variant="outline" />
            <CuiCopyButton value="Hello world" show-label />
            <CuiCopyButton value="Hello world" show-label variant="outline" />
          </CuiFlex>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes" :code="`<CuiCopyButton value=&quot;text&quot; size=&quot;xs&quot; show-label />
<CuiCopyButton value=&quot;text&quot; size=&quot;sm&quot; show-label />
<CuiCopyButton value=&quot;text&quot; size=&quot;md&quot; show-label />`">
          <CuiFlex gap="3" class="items-center">
            <CuiCopyButton value="test" size="xs" show-label />
            <CuiCopyButton value="test" size="sm" show-label />
            <CuiCopyButton value="test" size="md" show-label />
          </CuiFlex>
        </Example>

        <!-- Inside an input -->
        <Example title="Inside an Input (suffix slot)" :code="`<CuiInput :model-value=&quot;apiKey&quot; readonly>
  <template #suffix>
    <CuiCopyButton :value=&quot;apiKey&quot; size=&quot;xs&quot; />
  </template>
</CuiInput>`">
          <div class="max-w-md">
            <CuiStack spacing="3">
              <CuiInput :model-value="apiKey" readonly label="API Key">
                <template #suffix>
                  <CuiCopyButton :value="apiKey" size="xs" tooltip="Copy API key" />
                </template>
              </CuiInput>
              <CuiInput :model-value="inviteLink" readonly label="Invite Link">
                <template #suffix>
                  <CuiCopyButton :value="inviteLink" size="xs" tooltip="Copy invite link" />
                </template>
              </CuiInput>
            </CuiStack>
          </div>
        </Example>

        <!-- Next to a code block -->
        <Example title="Code Block with Copy">
          <div style="position: relative; max-width: 28rem;">
            <pre class="cui-pre" style="padding-right: 3rem;"><code class="cui-code">{{ codeSnippet }}</code></pre>
            <div style="position: absolute; top: 0.5rem; right: 0.5rem;">
              <CuiCopyButton :value="codeSnippet" size="xs" variant="outline" tooltip="Copy install command" />
            </div>
          </div>
        </Example>

        <!-- Inline with text -->
        <Example title="Inline with Text" :code="`<CuiFlex gap=&quot;2&quot; class=&quot;items-center&quot;>
  <span>Order ID:</span>
  <code>ORD-2024-8847</code>
  <CuiCopyButton value=&quot;ORD-2024-8847&quot; size=&quot;xs&quot; />
</CuiFlex>`">
          <CuiStack spacing="3">
            <CuiFlex gap="2" class="items-center">
              <span class="text-sm font-medium">Order ID:</span>
              <code class="cui-code" style="font-size: 0.8125rem;">ORD-2024-8847</code>
              <CuiCopyButton value="ORD-2024-8847" size="xs" tooltip="Copy order ID" />
            </CuiFlex>
            <CuiFlex gap="2" class="items-center">
              <span class="text-sm font-medium">Tracking:</span>
              <code class="cui-code" style="font-size: 0.8125rem;">1Z999AA10123456784</code>
              <CuiCopyButton value="1Z999AA10123456784" size="xs" tooltip="Copy tracking number" />
            </CuiFlex>
          </CuiStack>
        </Example>

        <!-- Card with copyable content -->
        <Example title="Real-World: Credentials Card" :code="`<CuiCard variant=&quot;outline&quot;>
  <CuiCardBody>
    <div>
      <div>Host</div>
      <CuiFlex gap=&quot;2&quot; class=&quot;items-center&quot;>
        <code>db.example.com:5432</code>
        <CuiCopyButton value=&quot;db.example.com:5432&quot; size=&quot;xs&quot; />
      </CuiFlex>
    </div>
  </CuiCardBody>
</CuiCard>`">
          <CuiCard variant="outline" style="max-width: 24rem;">
            <CuiCardBody>
              <CuiStack spacing="3">
                <div class="text-sm font-semibold">Database Credentials</div>
                <div>
                  <div class="text-xs font-medium" style="color: var(--cui-text-tertiary); margin-bottom: 0.25rem;">Host</div>
                  <CuiFlex gap="2" class="items-center">
                    <code class="cui-code" style="font-size: 0.8125rem; flex: 1;">db.example.com:5432</code>
                    <CuiCopyButton value="db.example.com:5432" size="xs" tooltip="Copy host" />
                  </CuiFlex>
                </div>
                <div>
                  <div class="text-xs font-medium" style="color: var(--cui-text-tertiary); margin-bottom: 0.25rem;">Username</div>
                  <CuiFlex gap="2" class="items-center">
                    <code class="cui-code" style="font-size: 0.8125rem; flex: 1;">app_readonly</code>
                    <CuiCopyButton value="app_readonly" size="xs" tooltip="Copy username" />
                  </CuiFlex>
                </div>
                <div>
                  <div class="text-xs font-medium" style="color: var(--cui-text-tertiary); margin-bottom: 0.25rem;">Connection String</div>
                  <CuiFlex gap="2" class="items-center">
                    <code class="cui-code" style="font-size: 0.8125rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">postgresql://app_readonly@db.example.com:5432/prod</code>
                    <CuiCopyButton value="postgresql://app_readonly@db.example.com:5432/prod" size="xs" tooltip="Copy connection string" />
                  </CuiFlex>
                </div>
              </CuiStack>
            </CuiCardBody>
          </CuiCard>
        </Example>

      </CuiStack>
    </template>
  </DocPage>
</template>
