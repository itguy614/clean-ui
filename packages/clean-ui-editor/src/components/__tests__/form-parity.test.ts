// Task 5.1.3: parity with a sibling CuiTextarea, not the editor's own markup.
// Both controls sit inside the same CuiForm/CuiFormField wiring a real
// consumer would use — this is the documented jsdom-safe test set (AC).
import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick, defineComponent, ref } from "vue";
import { CuiForm, CuiFormField, CuiTextarea, type FormErrors } from "@itguy614/clean-ui";
import CuiMarkdownEditor from "../CuiMarkdownEditor.vue";

const Harness = defineComponent({
  components: { CuiForm, CuiFormField, CuiTextarea, CuiMarkdownEditor },
  setup() {
    const formRef = ref<InstanceType<typeof CuiForm> | null>(null);
    return { formRef };
  },
  template: `
    <CuiForm ref="formRef" :model-value="{ bio: '', notes: '' }">
      <CuiFormField name="bio" label="Bio" required help-text="Tell us about yourself" v-slot="f">
        <CuiTextarea v-bind="f" />
      </CuiFormField>
      <CuiFormField name="notes" label="Notes" required help-text="Tell us about yourself" v-slot="f">
        <CuiMarkdownEditor v-bind="f" />
      </CuiFormField>
    </CuiForm>
  `,
});

describe("form parity: CuiMarkdownEditor vs. a sibling CuiTextarea", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  function fields(w: VueWrapper) {
    const formFields = w.findAllComponents(CuiFormField);
    return { bioField: formFields[0], notesField: formFields[1] };
  }

  it("associates the editor's editable surface with the field's label, unlike its sibling", async () => {
    wrapper = mount(Harness);
    await nextTick();

    const { bioField, notesField } = fields(wrapper);
    const notesLabel = notesField.find("label");
    expect(notesLabel.attributes("for")).toBe(
      notesField.find('[data-testid="cui-markdown-editor-content"]').attributes("id"),
    );

    // Documented pre-existing gap, not something this plan's scope covers:
    // CuiTextarea has no `id` prop, so CuiFormField's generated id falls
    // through to `.cui-textarea-wrapper` (attrs fallthrough default), never
    // reaching the native `<textarea>` the label's `for` is meant to target.
    // Filed as https://github.com/itguy614/clean-ui/issues/78 — CuiMarkdownEditor
    // deliberately does NOT copy this bug (see `buildContentAttributes` in
    // CuiMarkdownEditor.vue, which places `id` on the editable surface itself).
    const bioLabel = bioField.find("label");
    expect(bioField.find(".cui-textarea__native").attributes("id")).toBeUndefined();
    expect(bioField.find(".cui-textarea-wrapper").attributes("id")).toBe(bioLabel.attributes("for"));
  });

  it("renders the same required indicator next to both labels", async () => {
    wrapper = mount(Harness);
    await nextTick();

    const { bioField, notesField } = fields(wrapper);
    expect(bioField.find(".cui-form-field__required").exists()).toBe(true);
    expect(notesField.find(".cui-form-field__required").exists()).toBe(true);
  });

  it("presents a resolver error on both fields identically: same message, same aria-invalid", async () => {
    wrapper = mount(Harness);
    await nextTick();

    const errors: FormErrors = { bio: "Bio is required", notes: "Notes are required" };
    (wrapper.vm as unknown as { formRef: { setErrors: (e: FormErrors) => void } }).formRef.setErrors(errors);
    await nextTick();

    const { bioField, notesField } = fields(wrapper);

    expect(bioField.find(".cui-form-field__error").text()).toBe("Bio is required");
    expect(notesField.find(".cui-form-field__error").text()).toBe("Notes are required");

    expect(bioField.find(".cui-textarea__native").attributes("aria-invalid")).toBe("true");
    expect(notesField.find('[data-testid="cui-markdown-editor-content"]').attributes("aria-invalid")).toBe("true");

    expect(bioField.find(".cui-textarea--error").exists()).toBe(true);
    expect(notesField.find(".cui-markdown-editor--error").exists()).toBe(true);

    // Neither control duplicates the message in its own footer — CuiFormField
    // is the single source of truth for error text in form-bound mode (the
    // `v-bind="f"` contract never forwards `errorMessage`, only the `error`
    // boolean used for the border/aria-invalid).
    expect(bioField.find(".cui-textarea__error").exists()).toBe(false);
    expect(notesField.find('[data-testid="cui-markdown-editor-error"]').exists()).toBe(false);
  });

  it("clears both fields' error identically when the field is fixed and revalidated", async () => {
    wrapper = mount(Harness);
    await nextTick();
    const formVm = (wrapper.vm as unknown as { formRef: { setErrors: (e: FormErrors) => void } }).formRef;

    formVm.setErrors({ bio: "Bio is required", notes: "Notes are required" });
    await nextTick();
    formVm.setErrors({});
    await nextTick();

    const { bioField, notesField } = fields(wrapper);
    expect(bioField.find(".cui-form-field__error").exists()).toBe(false);
    expect(notesField.find(".cui-form-field__error").exists()).toBe(false);
    expect(bioField.find(".cui-textarea--error").exists()).toBe(false);
    expect(notesField.find(".cui-markdown-editor--error").exists()).toBe(false);
  });
});
