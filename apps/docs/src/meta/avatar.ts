import type { ComponentMeta } from "./types";
import { colorProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Avatar",
  description:
    "A person or entity, shown as an image, initials or an icon, with an optional status dot. CuiAvatarGroup stacks several into an overlapping row.",

  parts: [
    {
      name: "CuiAvatar",
      props: [
        { name: "src", type: "string", description: "Image URL. Falls back to initials, then the icon, if it fails to load" },
        { name: "alt", type: "string", description: "Alt text for the image. Defaults to name, then to \"Avatar\"" },
        { name: "name", type: "string", description: "Full name — the first letter of the first two words becomes the initials" },
        { name: "initials", type: "string", description: "Explicit initials, overriding whatever name would produce" },
        { name: "icon", type: "string", default: "user", description: "Icon shown when there is no image and no initials" },
        { name: "size", type: "xs | sm | md | lg | xl", default: "md", description: "Box size, from 1.5rem at xs to 5rem at xl" },
        { name: "shape", type: "circle | rounded", default: "circle", description: "Circle, or a squircle with a 20% radius" },
        colorProp("Colour role for the initials/icon fallback — tinted background, coloured glyph. Ignored once an image loads"),
        { name: "status", type: "online | offline | away | busy", description: "Status dot in the lower-right corner" },
        { name: "statusAnimation", type: "pulse | ping | none", default: "none", description: "Animate the status dot" },
        hiddenProp,
      ],
    },
    {
      name: "CuiAvatarGroup",
      props: [
        {
          name: "spacing",
          type: "string",
          default: "-0.5rem",
          description: "Overlap between avatars, as a negative margin. A CSS length",
        },
        hiddenProp,
      ],
      slots: [{ name: "default", description: "The avatars. They are laid out reversed, so the first one sits on top" }],
    },
  ],
};

export default meta;
