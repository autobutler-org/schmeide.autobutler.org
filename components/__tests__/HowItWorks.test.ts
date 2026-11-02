import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import HowItWorks from "../HowItWorks.vue";
import { howItWorks } from "~/data/copy";

describe("HowItWorks", () => {
  it("numbers the steps in order", () => {
    const wrapper = mount(HowItWorks);
    const items = wrapper.findAll("ol li");
    expect(items).toHaveLength(howItWorks.steps.length);
    items.forEach((item, index) => {
      expect(item.text()).toContain(String(index + 1));
      expect(item.text()).toContain(howItWorks.steps[index]?.title);
    });
  });

  it("exposes the anchor the hero links to", () => {
    const wrapper = mount(HowItWorks);
    expect(wrapper.get("section").attributes("id")).toBe("how");
  });
});
