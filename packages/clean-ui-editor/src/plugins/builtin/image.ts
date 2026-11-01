import { definePlugin } from "../define-plugin";
import { openUrlDialog } from "./dialogs/open-url-dialog";

export const imagePlugin = definePlugin({
  id: "cui-image",
  commands: {
    image: {
      run(context) {
        openUrlDialog(context, "image").then((values) => {
          // Images are inserted by URL only in v1 — no upload affordance
          // exists (out of scope for this plan). The text field is the alt text.
          if (values) context.insertAtCursor(`![${values.text}](${values.url})`);
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
      toMarkdown: (el) => `![${el.getAttribute("alt") ?? ""}](${el.getAttribute("src")})`,
    },
  ],
});
