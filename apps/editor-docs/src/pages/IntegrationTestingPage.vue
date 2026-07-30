<script setup lang="ts">
import { ref } from "vue";
import { CuiCard, CuiCardHeader, CuiCardBody, CuiStack, CuiAlert } from "@itguy614/clean-ui";
import { CuiMarkdownEditor } from "@itguy614/clean-ui-editor";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const cspDoc = ref("This editor was constructed with a cspNonce prop.");
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Integration &amp; Testing</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        What an integrator needs beyond props: peer versions, a strict Content-Security-Policy,
        server rendering, choosing how markdown gets rendered back to HTML, the test contract, and
        the bundle cost that justifies keeping a renderer out of the core entry at all.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Install and peer versions</h2>
      <p class="text-sm" style="color: var(--cui-text-secondary);">
        Covered in full on the <router-link to="/installation" style="color: var(--cui-primary);">Installation
        page</router-link> — <code class="cui-code">vue@^3.5.0</code> and
        <code class="cui-code">@itguy614/clean-ui@^1.2.0</code> as peers, a runtime mismatch check
        that names both versions rather than trusting <code class="cui-code">peerDependencies</code>
        resolution alone.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Content-Security-Policy</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <p class="text-sm" style="color: var(--cui-text-secondary); margin-bottom: 0.75rem;">
            CodeMirror injects its own styles at runtime — under a strict <code class="cui-code">style-src</code>
            policy with no <code class="cui-code">'unsafe-inline'</code>, the editor renders completely
            unstyled without a nonce, and <strong>the nonce cannot be supplied after construction</strong>.
            Pass it as a prop; it falls back to a conventional <code class="cui-code">&lt;meta
            name="csp-nonce"&gt;</code> tag's content if present.
          </p>
          <pre class="cui-pre"><code class="cui-code">&lt;CuiMarkdownEditor v-model="doc" cspNonce="the-nonce-your-server-generated" /&gt;
&lt;!-- or, server-rendered once: --&gt;
&lt;meta name="csp-nonce" content="the-nonce-your-server-generated"&gt;</code></pre>
        </CuiCardBody>
      </CuiCard>
      <Example title="A cspNonce-constructed editor (this whole site serves no strict style-src, so there's nothing visually different here — this demonstrates the prop applies with no runtime error)">
        <CuiMarkdownEditor v-model="cspDoc" csp-nonce="docs-example-nonce" />
      </Example>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Server rendering</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <p class="text-sm" style="color: var(--cui-text-secondary);">
            <code class="cui-code">CuiMarkdownEditor</code> constructs its real CodeMirror view only in
            <code class="cui-code">onMounted</code>, which never runs during server rendering — the
            server-rendered shell takes its dimensions from this package's own stylesheet (CodeMirror's
            styles are injected client-side and are absent on the server), so hydration doesn't shift
            layout or produce a hydration-mismatch warning. Nothing about this needs configuration on
            your part; it's a property of the component, verified with <code class="cui-code">@vue/server-renderer</code>
            in this package's own test suite.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Rendering markdown to HTML: the <code class="cui-code">/render</code> subpath</h2>
      <p class="mb-4 text-sm" style="color: var(--cui-text-secondary);">
        The editor never needs to render markdown to HTML to let you edit it — live preview is
        decorations on the same buffer, not a parallel HTML render. Displaying <em>saved</em> content
        (a comment, a document view) is a separate concern with two paths:
      </p>
      <CuiStack spacing="4">
        <CuiCard variant="outline">
          <CuiCardHeader title="You already have a renderer" />
          <CuiCardBody>
            <p class="text-sm" style="color: var(--cui-text-secondary); margin-bottom: 0.5rem;">
              Wrap it to satisfy <code class="cui-code">MarkdownRenderAdapter</code> — a synchronous
              function returning <code class="cui-code">TrustedHtml</code>, a branded type only
              <code class="cui-code">markAsTrustedHtml()</code> can produce. A plain string does not
              type-check as the return value; the type itself is where you assert "I checked this HTML
              is safe to inject."
            </p>
            <pre class="cui-pre"><code class="cui-code">import { markAsTrustedHtml, type MarkdownRenderAdapter } from "@itguy614/clean-ui-editor"; // the contract, from the core entry
import { Marked } from "marked";
import DOMPurify from "dompurify";

const marked = new Marked();
const adapter: MarkdownRenderAdapter = (markdown) =&gt;
  markAsTrustedHtml(DOMPurify.sanitize(marked.parse(markdown, { async: false })));</code></pre>
          </CuiCardBody>
        </CuiCard>

        <CuiCard variant="outline">
          <CuiCardHeader title="You don't have one — use the supplied adapter" />
          <CuiCardBody>
            <p class="text-sm" style="color: var(--cui-text-secondary); margin-bottom: 0.5rem;">
              <code class="cui-code">@itguy614/clean-ui-editor/render</code> exports a ready-made
              adapter built on the same parser the editor itself edits against — no new dependency, no
              risk of the editor and the renderer disagreeing about what a document means. It escapes
              raw HTML by default (no sanitiser needed for that); allowing raw HTML through requires you
              to supply your own <code class="cui-code">sanitize</code> function — construction throws
              if you set <code class="cui-code">allowRawHtml</code> without one, rather than silently
              falling back to escaping.
            </p>
            <pre class="cui-pre"><code class="cui-code">import { createMarkdownRenderAdapter, CuiMarkdownViewer } from "@itguy614/clean-ui-editor/render";

const adapter = createMarkdownRenderAdapter(); // escapes raw HTML by default
// &lt;CuiMarkdownViewer :model-value="savedMarkdown" :adapter="adapter" /&gt;</code></pre>
          </CuiCardBody>
        </CuiCard>
      </CuiStack>
      <p class="mt-4 text-sm" style="color: var(--cui-text-secondary);">
        <code class="cui-code">CuiMarkdownViewer</code> applies clean-ui's typography layer itself and
        falls back to escaped source with one developer warning if your adapter throws — it never
        renders blank and never lets the exception propagate into your component tree. Neither
        <code class="cui-code">/render</code>'s serializer nor the viewer touch the DOM to construct
        the HTML string itself, so the adapter also runs during SSR.
      </p>
      <CuiAlert color="warning" title="The trust boundary is yours, not this library's" style="margin-top: 1rem;">
        <code class="cui-code">maxLength</code> and the construct policy are client-side conveniences,
        not validation — the server is the only real authority on what gets stored. And a
        <code class="cui-code">MarkdownRenderAdapter</code> is a contract this library defines but
        cannot enforce beyond its own supplied implementation: if you plug in a different renderer that
        doesn't apply the same escaping/URL-allowlisting discipline, that renderer's output is your
        application's own security surface to reason about.
      </CuiAlert>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">The test contract</h2>
      <p class="mb-4 text-sm" style="color: var(--cui-text-secondary);">
        This package's own suite is the reference for what's actually safe to assert in each
        environment — copy the shape, not just the idea.
      </p>
      <PropTable
        :props="[
          { name: 'Mounting', type: 'jsdom', description: 'CuiMarkdownEditor mounts and constructs a real CodeMirror view — dispatch transactions directly (view.dispatch({ changes: ... })) to simulate edits.' },
          { name: 'Value contract', type: 'jsdom', description: 'v-model round-trips, an equal incoming modelValue is a no-op, throttled emission doesn\'t roll back newer keystrokes.' },
          { name: 'Form parity', type: 'jsdom', description: 'id/error/aria-invalid/aria-required/disabled/readonly all behave identically to a sibling CuiTextarea inside the same CuiForm — the documented jsdom-safe assertion set.' },
          { name: 'Plugin registry logic', type: 'jsdom', description: 'buildRegistry, slashMenuCommandIds and similar pure functions — no real focus/layout needed.' },
          { name: 'Server rendering', type: 'node (no DOM)', description: 'renderToString from @vue/server-renderer — proves no onMounted-gated DOM access leaks into the server path.' },
          { name: 'Marker reveal on caret entry, touch-granularity reveal', type: 'real browser only', description: 'Depends on real focus and pointer/touch event semantics jsdom\'s contenteditable support can\'t reliably provide.' },
          { name: 'Slash-menu keyboard operation', type: 'real browser only', description: 'CodeMirror\'s autocompletion, in jsdom, never resolves hasFocus — reproduced identically in a real browser, ruling out a jsdom-only cause.' },
          { name: 'Paste conversion', type: 'jsdom AND real browser', description: 'Hand-written jsdom fixtures for logic; a real OS clipboard round-trip is what actually caught a real header-row duplication bug a looser jsdom assertion missed.' },
          { name: 'IME composition, toolbar overflow, touch reveal', type: 'real browser only', description: 'No jsdom equivalent exists for any of these.' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Bundle cost</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <p class="text-sm" style="color: var(--cui-text-secondary);">
            Measured on a real consumer build (packed tarball install, not this package's own
            <code class="cui-code">dist</code>), the whole editor — CodeMirror, the GFM markdown
            grammar, the reveal layer, every built-in plugin, the slash menu — costs roughly
            <strong>55 kB gzip</strong> against a committed <strong>65 kB budget</strong>, verified on
            every build by this repository's own CI. Avoiding <code class="cui-code">@codemirror/lang-markdown</code>'s
            static dependency on the HTML/JS/CSS embedded-language grammar (built directly on
            <code class="cui-code">@lezer/markdown</code> instead) alone saves roughly
            <strong>70 kB gzip</strong> this editor has no use for. Importing
            <code class="cui-code">/render</code> is additional and entirely separate from that
            budget — a consumer who never imports it never pays for the markdown-to-HTML serializer at
            all, which is the whole reason it lives at its own subpath instead of the core entry.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Framework-specific notes</h2>
      <CuiStack spacing="4">
        <CuiCard variant="outline">
          <CuiCardHeader title="Laravel (or any server enforcing a strict CSP)" />
          <CuiCardBody>
            <p class="text-sm" style="color: var(--cui-text-secondary);">
              Generate the nonce your CSP middleware already issues for the request, and either pass
              it as <code class="cui-code">cspNonce</code> to every editor instance, or render one
              <code class="cui-code">&lt;meta name="csp-nonce"&gt;</code> tag in your Blade layout —
              the editor reads that fallback automatically, so Inertia/Vue pages that don't thread the
              nonce through props still work. Remember it can't be supplied after the view is
              constructed, so a nonce that only becomes available after mount (an async layout slot,
              for instance) is too late.
            </p>
          </CuiCardBody>
        </CuiCard>
        <CuiCard variant="outline">
          <CuiCardHeader title="Tauri (or any desktop/offline-first app)" />
          <CuiCardBody>
            <p class="text-sm" style="color: var(--cui-text-secondary);">
              Tauri's own configured CSP is the same concern as above — set <code class="cui-code">cspNonce</code>
              or the meta-tag fallback the same way. Beyond that, this editor has no network
              dependency at runtime: everything it needs (fonts aside, which are your app's own
              concern) ships in the bundle, so it works fully offline with no special configuration —
              worth confirming explicitly if your app's own build pipeline does any request
              interception/allowlisting for offline mode, since CodeMirror's own runtime style
              injection is a <code class="cui-code">&lt;style&gt;</code> tag, not a network fetch.
            </p>
          </CuiCardBody>
        </CuiCard>
      </CuiStack>
    </div>
  </CuiStack>
</template>
