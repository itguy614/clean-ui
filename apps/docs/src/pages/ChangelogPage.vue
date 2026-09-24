<script setup lang="ts">
import { computed } from "vue";
import { CuiStack, CuiCard, CuiCardBody, CuiBadge, type CuiColor } from "@itguy614/clean-ui";
import changelogRaw from "../../../../CHANGELOG.md?raw";

/**
 * One rendered block. Prose and list items share an ordered list rather than sitting in two
 * arrays, because a section is not "prose then a list": the Upgrading guide alternates
 * between them, and a two-bucket model silently drops whichever comes second.
 */
interface Block {
  kind: "p" | "li";
  text: string;
  /** An indented bullet — several entries break their detail into sub-points. */
  sub?: boolean;
}
interface Section {
  title: string;
  blocks: Block[];
}
interface Release {
  version: string;
  date: string;
  sections: Section[];
}

// Parse the Keep a Changelog structure:
//   ## [x.y.z] - YYYY-MM-DD   → release
//   ## [Unreleased]           → release, no date. Keep a Changelog's own convention, and
//                               what every entry sits under until a version is cut — the
//                               date was previously required, so the whole section, and
//                               therefore the entire release in progress, rendered nowhere.
//   ### Section               → section
//   - item                    → list item ("  - item" → nested under the one above)
//   indented continuation     → appended to the block above, since the file hard-wraps
//   anything else             → a paragraph
const releases = computed<Release[]>(() => {
  const out: Release[] = [];
  let release: Release | null = null;
  let section: Section | null = null;
  /** Whether the block above is still accepting wrapped continuation lines. */
  let open = false;

  for (const raw of changelogRaw.split("\n")) {
    const line = raw.trimEnd();

    const rel = line.match(/^##\s+\[([^\]]+)\](?:\s*-\s*(.+))?$/);
    if (rel) {
      release = { version: rel[1], date: (rel[2] ?? "").trim(), sections: [] };
      out.push(release);
      section = null;
      continue;
    }

    const sec = line.match(/^###\s+(.+)$/);
    if (sec && release) {
      section = { title: sec[1].trim(), blocks: [] };
      release.sections.push(section);
      open = false;
      continue;
    }

    if (!section) continue;

    const item = line.match(/^(\s*)[-*]\s+(.+)$/);
    if (item) {
      section.blocks.push({ kind: "li", text: item[2].trim(), sub: item[1].length > 0 });
      open = true;
      continue;
    }

    const last = section.blocks[section.blocks.length - 1];

    // A blank line ends whatever block was open; the next content starts a new one.
    if (!line.trim()) {
      open = false;
      continue;
    }

    // An indented line continues the block above — the file hard-wraps, and without this
    // long entries were truncated at the first line break.
    if (open && last && (/^\s/.test(line) || last.kind === "p")) {
      last.text += ` ${line.trim()}`;
      continue;
    }

    section.blocks.push({ kind: "p", text: line.trim() });
    open = true;
  }
  return out;
});

// Section label → semantic color (Keep a Changelog vocabulary).
const SECTION_COLORS: Record<string, CuiColor> = {
  Added: "success",
  Changed: "info",
  Fixed: "warning",
  Removed: "error",
  Deprecated: "secondary",
  Security: "error",
  Documentation: "secondary",
};
function sectionColor(title: string): CuiColor {
  return SECTION_COLORS[title] ?? "secondary";
}

// Minimal inline markdown for changelog items (trusted, build-time content):
// escape HTML, then render **bold** and `code`.
function inlineMd(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="cui-code">$1</code>');
}
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Changelog</h1>
      <p class="cui-lead">
        Notable changes to <code class="cui-code">@itguy614/clean-ui</code>, following
        <a href="https://keepachangelog.com/en/1.0.0/" target="_blank" rel="noopener" style="color: var(--cui-primary);">Keep a Changelog</a>.
        Sourced from <code class="cui-code">CHANGELOG.md</code>.
      </p>
    </div>

    <CuiStack spacing="6">
      <CuiCard v-for="release in releases" :key="release.version" variant="outline">
        <CuiCardBody>
          <div style="display: flex; align-items: baseline; gap: 0.625rem; flex-wrap: wrap;">
            <h2 style="margin: 0; font-size: 1.375rem;">{{ release.version }}</h2>
            <span style="font-size: 0.8125rem; color: var(--cui-text-tertiary);">{{ release.date }}</span>
          </div>

          <div v-for="section in release.sections" :key="section.title" style="margin-top: 1rem;">
            <CuiBadge :color="sectionColor(section.title)" size="sm">{{ section.title }}</CuiBadge>
            <template v-for="(block, i) in section.blocks" :key="i">
              <p v-if="block.kind === 'p'" style="margin-top: 0.75rem;" v-html="inlineMd(block.text)" />
              <ul v-else style="margin-top: 0.25rem;">
                <li
                  :style="block.sub ? 'margin-left: 1.25rem; list-style-type: circle;' : undefined"
                  v-html="inlineMd(block.text)"
                />
              </ul>
            </template>
          </div>
        </CuiCardBody>
      </CuiCard>
    </CuiStack>
  </CuiStack>
</template>
