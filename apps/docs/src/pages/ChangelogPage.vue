<script setup lang="ts">
import { computed } from "vue";
import { CuiStack, CuiCard, CuiCardBody, CuiBadge, type CuiColor } from "@itguy614/clean-ui";
import changelogRaw from "../../../../CHANGELOG.md?raw";

interface Section {
  title: string;
  items: string[];
}
interface Release {
  version: string;
  date: string;
  sections: Section[];
}

// Parse the Keep a Changelog structure:
//   ## [x.y.z] - YYYY-MM-DD   → release
//   ### Section               → section
//   - item                    → list item
const releases = computed<Release[]>(() => {
  const out: Release[] = [];
  let release: Release | null = null;
  let section: Section | null = null;

  for (const raw of changelogRaw.split("\n")) {
    const line = raw.trimEnd();

    const rel = line.match(/^##\s+\[([^\]]+)\]\s*-\s*(.+)$/);
    if (rel) {
      release = { version: rel[1], date: rel[2].trim(), sections: [] };
      out.push(release);
      section = null;
      continue;
    }

    const sec = line.match(/^###\s+(.+)$/);
    if (sec && release) {
      section = { title: sec[1].trim(), items: [] };
      release.sections.push(section);
      continue;
    }

    const item = line.match(/^[-*]\s+(.+)$/);
    if (item && section) {
      section.items.push(item[1].trim());
    }
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
            <ul style="margin-top: 0.5rem;">
              <li v-for="(item, i) in section.items" :key="i" v-html="inlineMd(item)" />
            </ul>
          </div>
        </CuiCardBody>
      </CuiCard>
    </CuiStack>
  </CuiStack>
</template>
