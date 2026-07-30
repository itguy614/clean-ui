/**
 * FR38: nothing in the core entry (`src/index.ts`) imports this file or
 * anything it re-exports below except the plain contract type + marking
 * helper (`contract.ts` — no renderer, no sanitiser) — importing the barrel
 * therefore never pulls in the markdown-to-HTML serializer or the viewer.
 * This subpath needs its own build entry (`vite.config.ts`) to be emitted
 * at all, mechanically enforcing FR36's "core entry contains no renderer."
 */
export { markAsTrustedHtml, type TrustedHtml, type MarkdownRenderAdapter } from "./render/contract";
export { createMarkdownRenderAdapter, type CreateMarkdownRenderAdapterOptions } from "./render/supplied-adapter";
export { serializeMarkdownToHtml, type SerializeOptions } from "./render/serialize";
export { default as CuiMarkdownViewer, type CuiMarkdownViewerProps } from "./render/CuiMarkdownViewer.vue";
