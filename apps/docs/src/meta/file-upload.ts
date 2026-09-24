import type { ComponentMeta } from "./types";
import { colorProp, disabledProp, hiddenProp, nativeControlProps } from "./shared";

const meta: ComponentMeta = {
  name: "File Upload",
  description:
    "A drop zone with a file list, client-side validation and an optional review step. It collects files and hands them to you — it does not perform the HTTP upload.",
  interactive: true,

  props: [
    { name: "accept", type: "string", description: 'Accepted types, as the native attribute takes them — ".pdf,.docx", "image/*". Also checked in JS, since a drop bypasses the file dialog filter' },
    { name: "multiple", type: "boolean", default: "true", description: "Allow more than one file in the picker" },
    { name: "maxFileSize", type: "number", default: "0", description: "Per-file size ceiling in bytes; 0 means unlimited. An over-size file is rejected, not truncated" },
    { name: "maxFiles", type: "number", default: "0", description: "Ceiling on the list length; 0 means unlimited. Files past the limit are rejected one by one" },
    { name: "autoUpload", type: "boolean", default: "true", description: "true emits upload as soon as files land. false holds them and shows an Upload button, so the user reviews the list first" },
    colorProp("Accent for the drag-over border and fill, the Browse link and the Upload button"),
    { name: "label", type: "string", description: "Label text above the drop zone. It renders as plain text with no for association — see Known gaps" },
    { name: "dragText", type: "string", default: "Drag and drop files here, or", description: "Helper line in the drop zone, before the Browse link" },
    { name: "browseText", type: "string", default: "Browse", description: "Text of the link that opens the file dialog" },
    { name: "uploadText", type: "string", default: "Upload", description: "Text of the Upload button, shown only when autoUpload is false" },
    disabledProp,
    hiddenProp,
    ...nativeControlProps,
  ],

  events: [
    { name: "upload", payload: "File[]", description: "Files are ready. Fires on every drop/select when autoUpload is true, or once per Upload click when it is false. Carries the whole list, not just the new arrivals" },
    { name: "reject", payload: "{ file: File; reason: string }", description: "One file failed validation — too large, wrong type, or over the count. Fires once per rejected file, with a human-readable reason" },
    { name: "change", payload: "FileEntry[]", description: "The list changed — added, removed, or cleared. FileEntry is { file, id, name, size, type }" },
  ],

  methods: [
    { name: "focus", signature: "(options?: FocusOptions) => void", description: "Focus the root element. The root carries no tabindex, so this only does something if you give it one" },
    { name: "blur", signature: "() => void", description: "Blur the root element" },
    { name: "el", signature: "HTMLElement | null", description: "The root element" },
  ],
};

export default meta;
