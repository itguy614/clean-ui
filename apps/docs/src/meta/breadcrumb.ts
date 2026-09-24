import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Breadcrumb",
  description:
    "Navigation trail showing the current page's place in the site hierarchy — a <nav> wrapping an <ol>, with a configurable separator.",
  interactive: true,

  parts: [
    {
      name: "CuiBreadcrumb",
      props: [
        {
          name: "separator",
          type: "string",
          default: "/",
          description: "Character drawn between items. Purely decorative — it is hidden from assistive technology",
        },
        hiddenProp,
      ],
      slots: [{ name: "default", description: "CuiBreadcrumbItem children, root first" }],
    },
    {
      name: "CuiBreadcrumbItem",
      props: [
        { name: "href", type: "string", description: "Link URL — renders an <a>. Ignored on the last item" },
        {
          name: "to",
          type: "string | object",
          description: "Vue Router target — renders a <router-link>. Ignored on the last item",
        },
        hiddenProp,
      ],
      slots: [{ name: "default", description: "Item content — text, or an icon alongside text" }],
    },
  ],
};

export default meta;
