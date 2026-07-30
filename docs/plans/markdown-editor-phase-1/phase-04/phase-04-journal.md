# Phase 04 Journal: Built-in Plugins, Slash Menu and Paste

Progress, decisions and notes logged as tasks are addressed. Entries are appended by whoever works
a task — the tasks file tracks status, this file records why things happened.

## Log

### 2026-07-29 - All tasks: built-in plugins, toolbar, list ergonomics, dialogs, slash menu, paste
**Agent:** frontend work (self, not delegated)  **Status:** Completed

**Work Done:** All eight tasks across the three groups — see `phase-04-tasks.md`'s per-task
**Note** blocks for full detail on each. Summary of what shipped:
- `src/plugins/builtin/`: 13 formatting plugins (bold, italic, strikethrough, inline code, headings
  1–3, bulleted/numbered/task lists, blockquote, code fence, horizontal rule, link, image) plus a
  paste-only `table-paste` plugin, all folded into `DEFAULT_PLUGINS`.
- `CommandContext.findConstructRange(nodeName)` — the one extension Phase 03's context needed once
  real commands existed (toggle/isActive for inline constructs).
- `CuiMarkdownEditorToolbar.vue` — default toolbar, `toolbar` prop, `#toolbar` slot, roving tabindex,
  overflow scroll.
- `src/plugins/builtin/dialogs/` — link/image dialogs via `collect()`, `mountStandaloneDialog`
  (detached Vue app), URL scheme allowlist.
- `src/plugins/slash-menu.ts` — CodeMirror-autocomplete-based palette sourced from
  label+icon-carrying commands.
- `src/paste/convert-html.ts` + per-plugin `paste` rules — HTML→markdown conversion honouring the
  construct policy, with degrade chains.
- `src/reveal/construct-policy.ts` — the reveal layer's marker-hiding finally became plugin-driven
  (deferred from Phase 02/03 specifically until real plugins existed to drive it).

**Decisions Made:**
- **A background research fork exceeded its mandate mid-phase.** Dispatched a fork with an
  explicitly research-only prompt (investigate `CuiTabs`' keyboard-nav/overflow-scroll pattern to
  reuse for the toolbar) — it read the pattern correctly, then went on to author
  `CuiMarkdownEditorToolbar.vue` and start wiring it into `CuiMarkdownEditor.vue` unprompted, mid-way
  through adding reactivity it had itself identified as missing. Caught via the standard
  file-system-changed notification, stopped (`TaskStop`) before it finished, and everything it wrote
  was reviewed line by line rather than trusted: one real type error (`variant="subtle"` — not a
  valid `CuiButton` variant) and the missing `selectionVersion` reactivity bridge it had already
  flagged were both fixed by hand. The component itself was solid enough to keep (correct
  `useScrollShadows` reuse, correct roving-tabindex pattern) — reviewed and finished rather than
  discarded and rebuilt. This is the same failure shape recorded in
  `feedback_fork_scope_creep.md` from earlier in this project: a fork sharing full conversation
  context can infer "and then implement it" from a research prompt if the boundary isn't stated
  explicitly enough, and needs the same "verify, don't trust" treatment as any other agent's output.
- **Three real bugs were found this phase, all through empirical verification rather than assumed
  correctness** (the practice this whole project has followed since the original blank-page
  incident): the `@codemirror/lang-markdown` language-facet identity mismatch silently no-op'ing
  list continuation (task 4.2.1), the slash menu's `CompletionResult.from` including the trigger
  "/" in the fuzzy-match text and silently emptying every result (task 4.3.1, reproduced in both
  jsdom and a real browser to rule out a jsdom-only cause), and the table-paste header-row
  duplication bug for a `<thead>`-less table (task 4.3.2, caught only by the real-browser
  clipboard round-trip test, not the original hand-written jsdom fixture). None of these surfaced
  from a failing build or typecheck — all three needed a real invocation (a dispatched transaction,
  a real completion query, a real copy-paste) to observe.
- **The reveal layer's construct policy (deferred explicitly since Phase 02/03) is now
  plugin-driven**, not hardcoded — `activeConstructsFromRegistry` derives the active node-name set
  from `registry.decorations` each time `plugins` changes, closing the loop FR27/FR29 describe.
- **Heading paste rules were simplified from an illusory degrade chain.** Originally declared
  `ATXHeading1 → degradeTo ATXHeading2 → degradeTo ATXHeading3 → plainText`, modelling "falls back
  to the next-lower level." Realized this chain can never actually fire: excluding a plugin removes
  its paste rule along with its construct declaration together (FR27), so there is no scenario where
  a heading rule exists but its own construct is inactive. Simplified all three to
  `degradeTo: "plainText"` directly — the underlying chain *mechanism* in `resolveRule` is still real
  and tested (a dedicated `convert-html.test.ts` case using two independent hypothetical plugins
  proves it), it just isn't what heading exclusion actually exercises.

**Verification:**
- 162 tests in `@itguy614/clean-ui-editor` (up from 66 at the start of this phase), all passing:
  formatting plugins (41), list continuation (5), toolbar (8), link/image dialogs (6), slash menu
  qualification logic (4), paste conversion (13), paste event handling (3), plus the carried-forward
  Phase 01–03 suites.
- Real-browser verification (temporary, deleted `.dev-harness/` each time, Playwright): toolbar
  sizing/overflow-scroll/keyboard-focus; the slash menu's full interactive path (type "/", filter,
  Enter runs the command, Escape dismisses leaving typed text); a genuine `Ctrl+C`/`Ctrl+V` clipboard
  round-trip pasting an actually-rendered page fragment (heading, bold, italic, link, list, table) —
  this last one is what caught the table bug a hand-written fixture's looser assertions missed.
- Full workspace regression: `pnpm -r build`, `pnpm -r --if-present test` (443 clean-ui tests + 162
  clean-ui-editor tests, all green), `pnpm verify:fixture` all pass after this phase's changes.

<!-- Template:
### YYYY-MM-DD - Task N.G.T: Title
**Agent:** {agent}  **Status:** {Started|Completed|Blocked}
**Work Done:**
**Decisions Made:**
**Notes:**
-->
