import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import CallToAction from "../CallToAction.vue";
import { callToAction } from "~/data/copy";

describe("CallToAction", () => {
  it("renders the heading, body, and action label", () => {
    const wrapper = mount(CallToAction);
    expect(wrapper.text()).toContain(callToAction.heading);
    expect(wrapper.text()).toContain(callToAction.body);
    expect(wrapper.get("a.btn").text()).toBe(callToAction.action.label);
  });

  it("sends the reader to the quickstart", () => {
    expect(mount(CallToAction).get("a.btn").attributes("href")).toBe("/docs/quickstart");
  });
});
