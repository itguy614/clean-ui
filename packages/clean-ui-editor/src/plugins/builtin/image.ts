import { definePlugin } from "../define-plugin";
import { mountStandaloneDialog } from "./dialogs/mount-standalone";
import ImageDialog from "./dialogs/ImageDialog.vue";

export const imagePlugin = definePlugin({
  id: "cui-image",
  commands: {
    image: {
      run(context) {
        context
          .collect<{ url: string; alt: string }>((settle) => {
            const unmount = mountStandaloneDialog(ImageDialog, {
              initialUrl: "",
              initialAlt: "",
              onSubmit: (values: { url: string; alt: string }) => {
                settle.resolve(values);
                unmount();
              },
              onCancel: () => {
                settle.cancel();
                unmount();
              },
            });
          })
          .then((values) => {
            // Images are inserted by URL only in v1 — no upload affordance
            // exists (out of scope for this plan).
            if (values) context.insertAtCursor(`![${values.alt}](${values.url})`);
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
