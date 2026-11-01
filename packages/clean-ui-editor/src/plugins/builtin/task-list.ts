import { definePlugin } from "../define-plugin";
import { toggleLinePrefixCommand } from "./toggle-line-prefix";

export const taskListPlugin = definePlugin({
  id: "cui-task-list",
  commands: {
    taskList: {
      ...toggleLinePrefixCommand({
        match: /^- \[[ xX]\]\s/,
        // New task items are always inserted unchecked — task 4.2.1's
        // list-continuation ergonomics own what happens on further Enter.
        insert: "- [ ] ",
      }),
      label: "Task list",
      icon: "list-task",
    },
  },
  toolbar: [{ command: "taskList" }],
  constructs: ["Task"],
  decorations: [{ node: "Task" }],
  paste: [
    {
      selector: "li:has(> input[type='checkbox'])",
      produces: "Task",
      degradeTo: "plainText",
      toMarkdown: (el, c) => {
        const checked = el.querySelector<HTMLInputElement>("input[type='checkbox']")?.checked;
        return `- [${checked ? "x" : " "}] ${c.trim()}`;
      },
    },
  ],
});
