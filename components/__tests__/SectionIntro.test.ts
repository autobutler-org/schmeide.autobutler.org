import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import SectionIntro from "../SectionIntro.vue";

const props = { eyebrow: "02 — Setup", heading: "Three steps." };

describe("SectionIntro", () => {
  it("renders the eyebrow and the heading as an h2", () => {
    const wrapper = mount(SectionIntro, { props });
    expect(wrapper.text()).toContain(props.eyebrow);
    expect(wrapper.get("h2").text()).toBe(props.heading);
  });

  it("renders a lede only when one is given", () => {
    expect(mount(SectionIntro, { props }).findAll("p")).toHaveLength(1);
    const withLede = mount(SectionIntro, { props: { ...props, lede: "Plug it in." } });
    expect(withLede.findAll("p")).toHaveLength(2);
    expect(withLede.text()).toContain("Plug it in.");
  });
});
