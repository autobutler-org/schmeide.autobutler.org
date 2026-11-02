import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import SiteFooter from "../SiteFooter.vue";
import { footer } from "~/data/copy";

describe("SiteFooter", () => {
  it("shows the footer note with the license", () => {
    const wrapper = mount(SiteFooter);
    expect(wrapper.text()).toContain(footer.note);
    expect(footer.note).toContain("MIT-0");
  });

  it("renders every footer link", () => {
    const wrapper = mount(SiteFooter);
    const hrefs = wrapper.findAll("a").map((anchor) => anchor.attributes("href"));
    for (const link of footer.links) {
      expect(hrefs).toContain(link.href);
    }
  });
});
