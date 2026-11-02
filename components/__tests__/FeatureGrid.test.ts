import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import FeatureGrid from "../FeatureGrid.vue";
import { features } from "~/data/copy";

const bodyOf = (name: string): string =>
  features.items.find((feature) => feature.name === name)?.body ?? "";

describe("FeatureGrid", () => {
  it("renders one entry per feature, in order", () => {
    const wrapper = mount(FeatureGrid);
    const names = wrapper.findAll("li h3").map((heading) => heading.text());
    expect(names).toEqual(features.items.map((feature) => feature.name));
  });

  it("puts every feature in a collapsible details element named by its summary", () => {
    const wrapper = mount(FeatureGrid);
    const summaries = wrapper
      .findAll("li details > summary")
      .map((summary) => summary.find("h3").text());
    expect(summaries).toEqual(features.items.map((feature) => feature.name));
  });

  it("renders the body copy for every feature", () => {
    const text = mount(FeatureGrid).text();
    for (const feature of features.items) {
      expect(text).toContain(feature.body);
    }
  });

  /* Factory merge is opt-in per repository; the card must never read as a default. */
  it("badges factory merge as off by default", () => {
    const badged = mount(FeatureGrid)
      .findAll("li")
      .filter((item) => item.find(".badge").exists())
      .map((item) => `${item.find("h3").text()}: ${item.find(".badge").text()}`);
    expect(badged).toEqual(["Factory merge: Off by default"]);
    expect(bodyOf("Factory merge")).toContain("automate.merge");
  });

  /* Only an unbuilt feature may be drawn as upcoming, and it must say so in words too. */
  it("marks only container isolation as upcoming", () => {
    const upcoming = features.items.filter((feature) => feature.upcoming);
    expect(upcoming.map((feature) => feature.name)).toEqual(["Container isolation"]);
    expect(upcoming[0]?.body).toMatch(/not built yet/i);
  });

  it("does not claim schmeide handles agent keys or sandboxes a session", () => {
    const text = mount(FeatureGrid).text();
    expect(text).not.toMatch(/sandboxed|isolated container/i);
    expect(text).not.toMatch(/api key/i);
  });
});
