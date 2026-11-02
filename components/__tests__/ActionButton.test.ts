import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ActionButton from "../ActionButton.vue";

const link = { label: "Read the code", href: "https://example.com" };

describe("ActionButton", () => {
  it("renders the label and href", () => {
    const wrapper = mount(ActionButton, { props: { link } });
    const anchor = wrapper.get("a");
    expect(anchor.text()).toBe(link.label);
    expect(anchor.attributes("href")).toBe(link.href);
  });

  it("defaults to the primary variant", () => {
    const wrapper = mount(ActionButton, { props: { link } });
    expect(wrapper.get("a").classes()).toContain("primary");
  });

  it("honors an explicit variant", () => {
    const wrapper = mount(ActionButton, { props: { link, variant: "secondary" } });
    expect(wrapper.get("a").classes()).toContain("secondary");
  });
});
