import { definePlugin } from "../define-plugin";
import { linesInRange } from "./line-utils";

const TASK_PREFIX_PATTERN = /^- \[[ xX]\]\s/;
const NEW_TASK_PREFIX = "- [ ] ";

export const taskListPlugin = definePlugin({
  id: "cui-task-list",
  commands: {
    taskList: {
      run(context) {
        const { from, to } = context.selection;
        const lines = linesInRange(context.doc, from, to);
        const allTasks = lines.every((line) => TASK_PREFIX_PATTERN.test(line.text));

        context.replaceRanges(
          lines.flatMap((line) => {
            const match = line.text.match(TASK_PREFIX_PATTERN);
            if (allTasks && match) return [{ from: line.start, to: line.start + match[0].length, text: "" }];
            // New task items are always inserted unchecked — task 4.2.1's
            // list-continuation ergonomics own what happens on further Enter.
            if (!allTasks && !match) return [{ from: line.start, to: line.start, text: NEW_TASK_PREFIX }];
            return [];
          }),
        );
        return true;
      },
      isActive: (context) => {
        const { from, to } = context.selection;
        return linesInRange(context.doc, from, to).every((line) => TASK_PREFIX_PATTERN.test(line.text));
      },
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
