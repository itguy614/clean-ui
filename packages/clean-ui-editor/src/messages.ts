import type { DeepPartialMessages } from "@itguy614/clean-ui";

/**
 * Task 5.2.2: every user-visible string this package renders lives here, so
 * a host can translate the editor the same way it translates the rest of
 * clean-ui — through `CuiConfigProvider`'s `messages` prop — instead of
 * overriding props on every instance.
 *
 * Declared via clean-ui's own extension point (see the doc comment on
 * `CuiMessageNamespaces` in `@itguy614/clean-ui`'s `messages.ts`): augmenting
 * it here means `CuiMessages["markdownEditor"]` — and therefore
 * `CuiConfigProvider`'s `messages` prop — is typed to this exact shape
 * anywhere both packages are imported, with no `any`.
 *
 * Deliberately FLAT (`toolbarBold`, not `toolbar: { bold }`) rather than
 * grouped: clean-ui's `DeepPartialMessages` only makes a `CuiMessages`
 * namespace's own *fields* independently optional — one level of nesting
 * below `CuiMessages` itself, matching how `combobox`/`pagination`/etc. are
 * already flat groups of leaf strings. A `toolbar: {...}` group one level
 * further down would force overriding *all* of its fields at once (a real
 * `DeepPartialMessages` type error otherwise) to change even one — flattening
 * avoids that entirely and keeps every string here independently overridable,
 * per FR31/task 5.2.2's "a consumer overrides any string... with type
 * checking." Verified in `messages.test-d.ts`.
 */
declare module "@itguy614/clean-ui" {
  interface CuiMessageNamespaces {
    markdownEditor: CuiMarkdownEditorMessages;
  }
}

export interface CuiMarkdownEditorMessages {
  /** Accessible name/tooltip for the single floating mode-toggle button,
   * one per destination — e.g. while viewing the formatted document, the
   * button's label describes switching *to* source (not the current
   * state), since there's no second, always-visible button to show the
   * other state alongside it. */
  modeToggleSwitchToSource: string;
  modeToggleSwitchToFormatted: string;
  /** `EditorView.announce` text for assistive tech on a mode switch. */
  modeToggleFormattedAnnounce: string;
  modeToggleSourceAnnounce: string;

  /** Toolbar/slash-menu label per built-in command, named `toolbar` +
   * the command id with its first letter capitalized (`bold` ->
   * `toolbarBold`, `heading1` -> `toolbarHeading1`) — `resolveCommandLabel`
   * derives the key this way, so a future built-in command needs no
   * separate lookup table entry, just a field here following the pattern.
   * A third-party plugin's own command id has no matching field and falls
   * back to that plugin's own `label` (FR20), since this namespace only
   * covers strings this package itself renders. */
  toolbarAriaLabel: string;
  toolbarBold: string;
  toolbarItalic: string;
  toolbarStrikethrough: string;
  toolbarInlineCode: string;
  toolbarHeading1: string;
  toolbarHeading2: string;
  toolbarHeading3: string;
  toolbarBlockquote: string;
  toolbarBulletedList: string;
  toolbarNumberedList: string;
  toolbarTaskList: string;
  toolbarCodeFence: string;
  toolbarHorizontalRule: string;
  toolbarLink: string;
  toolbarImage: string;

  linkDialogTitle: string;
  linkDialogUrlLabel: string;
  linkDialogUrlPlaceholder: string;
  linkDialogTextLabel: string;
  linkDialogTextPlaceholder: string;
  linkDialogCancel: string;
  linkDialogInsert: string;
  linkDialogUrlRequired: string;
  linkDialogUrlSchemeNotAllowed: string;

  imageDialogTitle: string;
  imageDialogUrlLabel: string;
  imageDialogUrlPlaceholder: string;
  imageDialogAltLabel: string;
  imageDialogAltPlaceholder: string;
  imageDialogCancel: string;
  imageDialogInsert: string;
  imageDialogUrlRequired: string;
  imageDialogUrlSchemeNotAllowed: string;

  /** FR28: a pasted image file was refused outright (no upload affordance). */
  pasteRejectedImage: string;
  /** FR32: an edit/paste refused for exceeding `maxLength`. */
  maxLengthExceeded: (overage: number, limit: number) => string;
  /** The `length/limit` counter shown under the editor when `maxLength` is set. */
  counter: (length: number, limit: number) => string;
}

/** Built-in English defaults. */
export const defaultMarkdownEditorMessages: CuiMarkdownEditorMessages = {
  modeToggleSwitchToSource: "Switch to source view",
  modeToggleSwitchToFormatted: "Switch to formatted view",
  modeToggleFormattedAnnounce: "Formatted mode",
  modeToggleSourceAnnounce: "Source mode",

  toolbarAriaLabel: "Formatting",
  toolbarBold: "Bold",
  toolbarItalic: "Italic",
  toolbarStrikethrough: "Strikethrough",
  toolbarInlineCode: "Inline code",
  toolbarHeading1: "Heading 1",
  toolbarHeading2: "Heading 2",
  toolbarHeading3: "Heading 3",
  toolbarBlockquote: "Blockquote",
  toolbarBulletedList: "Bulleted list",
  toolbarNumberedList: "Numbered list",
  toolbarTaskList: "Task list",
  toolbarCodeFence: "Code block",
  toolbarHorizontalRule: "Horizontal rule",
  toolbarLink: "Link",
  toolbarImage: "Image",

  linkDialogTitle: "Insert link",
  linkDialogUrlLabel: "URL",
  linkDialogUrlPlaceholder: "https://example.com",
  linkDialogTextLabel: "Text",
  linkDialogTextPlaceholder: "Link text",
  linkDialogCancel: "Cancel",
  linkDialogInsert: "Insert",
  linkDialogUrlRequired: "A URL is required.",
  linkDialogUrlSchemeNotAllowed: "This URL scheme isn't allowed.",

  imageDialogTitle: "Insert image",
  imageDialogUrlLabel: "Image URL",
  imageDialogUrlPlaceholder: "https://example.com/image.png",
  imageDialogAltLabel: "Alt text",
  imageDialogAltPlaceholder: "Describes the image",
  imageDialogCancel: "Cancel",
  imageDialogInsert: "Insert",
  imageDialogUrlRequired: "A URL is required.",
  imageDialogUrlSchemeNotAllowed: "This URL scheme isn't allowed.",

  pasteRejectedImage: "Pasted images aren't supported yet — insert an image by URL instead.",
  maxLengthExceeded: (overage, limit) =>
    `Pasting would exceed the ${limit}-character limit by ${overage} character${overage === 1 ? "" : "s"}.`,
  counter: (length, limit) => `${length}/${limit}`,
};

/** Overlays a host's `markdownEditor` override (if any) onto the English
 * defaults. Every field is a flat leaf (string or function), so this is a
 * plain shallow spread — no nested-object merge needed, unlike clean-ui's
 * own `mergeMessages` (which exists for namespaces with grouped fields). */
export function mergeMarkdownEditorMessages(override?: DeepPartialMessages["markdownEditor"]): CuiMarkdownEditorMessages {
  return override ? { ...defaultMarkdownEditorMessages, ...override } : defaultMarkdownEditorMessages;
}

/** FR20's toolbar/slash-menu label resolution: this package's own catalog
 * for a built-in command id, else the command's own declared `label`. */
export function resolveCommandLabel(messages: CuiMarkdownEditorMessages, commandId: string, fallback: string): string {
  const key = `toolbar${commandId.charAt(0).toUpperCase()}${commandId.slice(1)}` as keyof CuiMarkdownEditorMessages;
  const value = messages[key];
  return typeof value === "string" ? value : fallback;
}

/** Which URL dialog (#222): a link, whose second field is its text, or an image, whose
 * second field is its alt text. */
export type UrlDialogKind = "link" | "image";

/** The strings `UrlDialog` renders, picked for one kind from the flat catalog. */
export interface UrlDialogMessages {
  title: string;
  urlLabel: string;
  urlPlaceholder: string;
  textLabel: string;
  textPlaceholder: string;
  cancel: string;
  insert: string;
  urlRequired: string;
  urlSchemeNotAllowed: string;
}

/** The second field's keys: the one place the two kinds' catalog names differ. */
const URL_DIALOG_TEXT_KEYS = {
  link: { label: "linkDialogTextLabel", placeholder: "linkDialogTextPlaceholder" },
  image: { label: "imageDialogAltLabel", placeholder: "imageDialogAltPlaceholder" },
} as const satisfies Record<UrlDialogKind, Record<"label" | "placeholder", keyof CuiMarkdownEditorMessages>>;

/**
 * One dialog's strings, from that kind's `linkDialog*` or `imageDialog*` keys. The catalog
 * keeps a full set per kind, so a host can word the two differently.
 */
export function pickUrlDialogMessages(messages: CuiMarkdownEditorMessages, kind: UrlDialogKind): UrlDialogMessages {
  const text = URL_DIALOG_TEXT_KEYS[kind];
  return {
    title: messages[`${kind}DialogTitle`],
    urlLabel: messages[`${kind}DialogUrlLabel`],
    urlPlaceholder: messages[`${kind}DialogUrlPlaceholder`],
    textLabel: messages[text.label],
    textPlaceholder: messages[text.placeholder],
    cancel: messages[`${kind}DialogCancel`],
    insert: messages[`${kind}DialogInsert`],
    urlRequired: messages[`${kind}DialogUrlRequired`],
    urlSchemeNotAllowed: messages[`${kind}DialogUrlSchemeNotAllowed`],
  };
}
