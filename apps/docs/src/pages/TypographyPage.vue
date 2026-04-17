<script setup lang="ts">
import { CuiCard, CuiCardBody, CuiStack } from "@itguy614/clean-ui";
</script>

<template>
  <CuiStack spacing="10">
    <div>
      <h1 class="text-4xl font-bold">Typography</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        CSS foundation layer for headings, body text, display text, code, lists,
        and blockquotes. Not a component — just add the
        <code class="cui-code">cui-typography</code> class to an ancestor.
      </p>
    </div>

    <!-- Usage -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Usage</h2>
      <CuiCard>
        <CuiCardBody>
          <p class="mb-3 text-surface-600 dark:text-surface-400">
            Wrap any content area with <code class="cui-code">cui-typography</code>
            to opt in to the type system. All heading, paragraph, link, list, code,
            and blockquote styles apply within that scope.
          </p>
          <pre class="cui-pre"><code>&lt;div class="cui-typography"&gt;
  &lt;h1&gt;Heading 1&lt;/h1&gt;
  &lt;p&gt;Body text styled automatically.&lt;/p&gt;
&lt;/div&gt;</code></pre>
          <p class="mt-3 text-sm text-surface-500 dark:text-surface-400">
            Override any token by setting <code class="cui-code">--cui-font-*</code>
            custom properties on <code class="cui-code">:root</code> or a container.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>

    <!-- Headings -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Headings</h2>
      <CuiCard variant="outline">
        <CuiCardBody class="cui-typography">
          <h1>Heading 1 — 2.25rem</h1>
          <h2>Heading 2 — 1.75rem</h2>
          <h3>Heading 3 — 1.5rem</h3>
          <h4>Heading 4 — 1.25rem</h4>
          <h5>Heading 5 — 1.1rem</h5>
          <h6>Heading 6 — 0.95rem</h6>
        </CuiCardBody>
      </CuiCard>
      <p class="mt-3 text-sm text-surface-500 dark:text-surface-400">
        Headings scale down on screens below 768px for comfortable mobile reading.
      </p>
    </div>

    <!-- Display Headings -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Display Headings</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <div class="cui-display-1 mb-4">Display 1 — 4rem</div>
          <div class="cui-display-2 mb-4">Display 2 — 3.25rem</div>
          <div class="cui-display-3 mb-4">Display 3 — 2.5rem</div>
        </CuiCardBody>
      </CuiCard>
      <p class="mt-3 text-sm text-surface-500 dark:text-surface-400">
        Lightweight (300) oversized text for hero sections and marketing pages.
        Responsive across 3 breakpoints.
      </p>
    </div>

    <!-- Lead Text -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Lead Text</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <p class="cui-lead">
            This is lead text. Use it for intro paragraphs, page summaries, or
            any text that should stand out slightly from normal body copy without
            being a heading.
          </p>
          <p class="cui-text-body">
            This is regular body text for comparison. Notice the lead text above
            is slightly larger and uses the secondary color.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>

    <!-- Text Colors -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Text Color Hierarchy</h2>
      <CuiCard variant="outline">
        <CuiCardBody class="cui-typography">
          <p class="cui-text-emphasis" style="font-weight: 600;">Emphasis — strongest contrast, titles and key labels</p>
          <p class="cui-text-body">Body — primary reading text, default for paragraphs</p>
          <p class="cui-text-secondary">Secondary — descriptions, captions, timestamps</p>
          <p class="cui-text-tertiary">Tertiary — placeholders, disabled labels, hints</p>
        </CuiCardBody>
      </CuiCard>
      <pre class="cui-pre mt-3"><code>&lt;p class="cui-text-emphasis"&gt;Emphasis&lt;/p&gt;
&lt;p class="cui-text-body"&gt;Body&lt;/p&gt;
&lt;p class="cui-text-secondary"&gt;Secondary&lt;/p&gt;
&lt;p class="cui-text-tertiary"&gt;Tertiary&lt;/p&gt;</code></pre>
    </div>

    <!-- Inline Code, Kbd, Pre -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Code &amp; Keyboard</h2>
      <CuiCard variant="outline">
        <CuiCardBody class="cui-typography">
          <p>Use <code>npm install @itguy614/clean-ui</code> to install the package.</p>
          <p>Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> to open the command palette.</p>
          <pre><code>const grid = new CuiGrid({
  cols: 3,
  gap: '4',
});</code></pre>
        </CuiCardBody>
      </CuiCard>
    </div>

    <!-- Lists -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Lists</h2>
      <CuiCard variant="outline">
        <CuiCardBody class="cui-typography">
          <h4>Default List</h4>
          <ul>
            <li>First item with bullet</li>
            <li>Second item</li>
            <li>Third item</li>
          </ul>

          <h4>Ordered List</h4>
          <ol>
            <li>Step one</li>
            <li>Step two</li>
            <li>Step three</li>
          </ol>

          <h4>Unstyled List</h4>
          <ul class="cui-list-unstyled">
            <li>No bullets here</li>
            <li>Clean and minimal</li>
            <li>Great for navigation menus</li>
          </ul>

          <h4>Inline List</h4>
          <ul class="cui-list-inline">
            <li>Home</li>
            <li>About</li>
            <li>Contact</li>
            <li>Blog</li>
          </ul>
        </CuiCardBody>
      </CuiCard>
    </div>

    <!-- Blockquote -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Blockquote</h2>
      <CuiCard variant="outline">
        <CuiCardBody class="cui-typography">
          <blockquote>
            <p>
              Good design is as little design as possible. Less, but better —
              because it concentrates on the essential aspects, and the products
              are not burdened with non-essentials.
            </p>
            <footer>Dieter Rams, <cite>Ten Principles of Good Design</cite></footer>
          </blockquote>
        </CuiCardBody>
      </CuiCard>
    </div>

    <!-- Horizontal Rule -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Horizontal Rule</h2>
      <CuiCard variant="outline">
        <CuiCardBody class="cui-typography">
          <p>Content above the divider.</p>
          <hr />
          <p>Content below the divider.</p>
        </CuiCardBody>
      </CuiCard>
    </div>

    <!-- Mark -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Highlighted Text</h2>
      <CuiCard variant="outline">
        <CuiCardBody class="cui-typography">
          <p>Use <mark>highlighted text</mark> to draw attention to key words or search matches.</p>
        </CuiCardBody>
      </CuiCard>
    </div>

    <!-- CSS Custom Properties Reference -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Customization</h2>
      <CuiCard>
        <CuiCardBody>
          <p class="mb-3 text-surface-600 dark:text-surface-400">
            Override any token on <code class="cui-code">:root</code> or a scoped container:
          </p>
          <pre class="cui-pre"><code>:root {
  --cui-font-sans: "Inter", sans-serif;
  --cui-font-size-h1: 2.5rem;
  --cui-heading-font-weight: 700;
  --cui-text-body: #1a1a2e;
}</code></pre>
        </CuiCardBody>
      </CuiCard>
    </div>
  </CuiStack>
</template>
