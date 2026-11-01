import { definePlugin } from "../define-plugin";
import { openUrlDialog } from "./dialogs/open-url-dialog";
import { markdownLink } from "./link-markdown";

export const imagePlugin = definePlugin({
  id: "cui-image",
  commands: {
    image: {
      run(context) {
        openUrlDialog(context, "image").then((values) => {
          // Images are inserted by URL only in v1 — no upload affordance
          // exists (out of scope for this plan). The text field is the alt text.
          if (values) context.insertAtCursor(markdownLink(values.text, values.url, true));
        });
        return true;
      },
      isActive: (context) => context.findConstructRange("Image") !== null,
      label: "Image",
      icon: "image",
    },
  },
  toolbar: [{ command: "image" }],
  constructs: ["Image"],
  decorations: [{ node: "Image" }],
  paste: [
    {
      selector: "img[src]",
      produces: "Image",
      degradeTo: "plainText",
      toMarkdown: (el) => markdownLink(el.getAttribute("alt") ?? "", el.getAttribute("src")!, true),
    },
  ],
});
