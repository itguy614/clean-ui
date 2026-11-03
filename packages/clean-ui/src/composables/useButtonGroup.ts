import { computed, inject, onBeforeUnmount, onMounted, onUpdated, provide, shallowRef, toValue } from "vue";
import type { MaybeRefOrGetter, Ref } from "vue";
import { ButtonGroupContextKey } from "../components/button-group-context";
import type {
  ButtonGroupContext,
  ButtonGroupOrientation,
  ButtonGroupPosition,
} from "../components/button-group-context";

interface Member {
  el: () => HTMLElement | null | undefined;
  painted: () => boolean;
  /** A dropdown's trigger merges by its place in the group, painted or not. */
  dropdown: boolean;
}

/** The corner and seam classes for one button, styled in `styles/components-shared.css`. */
function classesFor(orientation: ButtonGroupOrientation, flatStart: boolean, flatEnd: boolean) {
  const [start, end] = orientation === "horizontal" ? ["left", "right"] : ["top", "bottom"];
  // `--grouped` hands the corners over from the stylesheet's pre-mount adjacency rules.
  const classes = ["cui-button--grouped"];
  if (flatStart) classes.push(`cui-button--flat-${start}`);
  if (flatEnd) classes.push(`cui-button--flat-${end}`);
  return classes;
}

/**
 * The provider half of the button-group pair (#444). Two kinds:
 *
 * - a **group** (`el`): buttons that are direct children of `el`, or a dropdown trigger that
 *   is, register in DOM order and each learns its own position. Corners square off only
 *   where two *painted* buttons meet: a ghost button draws no edge, so beside one a painted
 *   button keeps its corners; a pressed ghost one has an edge and counts (#396, #190).
 * - an **attachment** (`attached`): one button merged into the edge of a field, as
 *   CuiInput's `#prefix-button` and `#suffix-button` are. Its inner corners are square and
 *   its outer ones follow the field's radius, less its border.
 */
export function useButtonGroupProvider(options: {
  orientation?: MaybeRefOrGetter<ButtonGroupOrientation>;
  el?: Ref<HTMLElement | null>;
  attached?: MaybeRefOrGetter<"start" | "end">;
}): void {
  if (options.attached) {
    // The prefix button's inner (trailing) side is flat; the suffix button's is its leading one.
    const prefix = computed(() => toValue(options.attached) === "start");
    const classes = computed(() => ["cui-button--inset", prefix.value ? "cui-button--flat-right" : "cui-button--flat-left"]);
    provide<ButtonGroupContext>(ButtonGroupContextKey, {
      join: () => ({
        position: computed(() => (prefix.value ? "first" : "last")),
        flatStart: computed(() => !prefix.value),
        flatEnd: prefix,
        classes,
        attach() {},
        detach() {},
      }),
    });
    return;
  }

  const members = shallowRef<Member[]>([]);

  /** DOM order, so a group that reorders or inserts its buttons keeps each one's position. */
  const sorted = (list: Member[]) =>
    // A member whose element is gone (its button re-rendered into something else) drops out.
    list
      .filter((m) => m.el())
      .sort((a, b) => (a.el()!.compareDocumentPosition(b.el()!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

  // The group re-renders when its slot content changes, which is when buttons move.
  onUpdated(() => {
    const next = sorted(members.value);
    if (next.length !== members.value.length || next.some((m, i) => m !== members.value[i])) members.value = next;
  });

  provide<ButtonGroupContext>(ButtonGroupContextKey, {
    join(el, painted) {
      const self = shallowRef<Member | null>(null);
      const isPainted = (m: Member) => m.dropdown || m.painted();
      const index = computed(() => (self.value ? members.value.indexOf(self.value) : -1));
      const position = computed<ButtonGroupPosition>(() => {
        const n = members.value.length;
        return n <= 1 ? "only" : index.value === 0 ? "first" : index.value === n - 1 ? "last" : "middle";
      });
      const merges = (neighbour: Member | undefined) =>
        !!self.value && !!neighbour && (self.value.dropdown || (isPainted(self.value) && isPainted(neighbour)));
      const flatStart = computed(() => index.value > 0 && merges(members.value[index.value - 1]));
      const flatEnd = computed(() => index.value >= 0 && merges(members.value[index.value + 1]));
      const classes = computed(() =>
        self.value ? classesFor(toValue(options.orientation) ?? "horizontal", flatStart.value, flatEnd.value) : [],
      );

      return {
        position,
        flatStart,
        flatEnd,
        classes,
        attach() {
          const host = options.el?.value;
          const own = el();
          if (!host || !own) return;
          const dropdown = own.parentElement !== host;
          // Only a direct child, or the trigger of a dropdown that is one.
          if (dropdown && own.closest(".cui-dropdown")?.parentElement !== host) return;
          self.value = { el, painted, dropdown };
          members.value = sorted([...members.value, self.value]);
        },
        detach() {
          const member = self.value;
          if (!member) return;
          self.value = null;
          members.value = members.value.filter((m) => m !== member);
        },
      };
    },
  });
}

/** The consumer half. A button outside any group gets `undefined`; it must work either way. */
export function useButtonGroupContext(): ButtonGroupContext | undefined;
export function useButtonGroupContext(options: { required: true }): ButtonGroupContext;
export function useButtonGroupContext(options?: { required: true }): ButtonGroupContext | undefined {
  const context = inject(ButtonGroupContextKey, undefined);
  if (!context && options?.required) throw new Error("[clean-ui] useButtonGroupContext() must be used inside a CuiButtonGroup");
  return context;
}

/**
 * What a button calls in setup: joins the group above it, if any, and returns the classes to
 * wear (none outside a group). `painted` is false for a button that draws no edge.
 */
export function useButtonGroupMember(el: () => HTMLElement | null | undefined, painted: () => boolean = () => true) {
  const slot = useButtonGroupContext()?.join(el, painted);
  onMounted(() => slot?.attach());
  onBeforeUnmount(() => slot?.detach());
  return computed(() => slot?.classes.value ?? []);
}
