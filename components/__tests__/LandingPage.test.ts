import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import LandingPage from "../LandingPage.vue";
import { hero, repoUrl } from "~/data/copy";

describe("LandingPage", () => {
  it("leads with the hero headline", () => {
    const wrapper = mount(LandingPage);
    expect(wrapper.get("h1").text()).toBe(hero.headline);
  });

  it("renders each section exactly once", () => {
    const wrapper = mount(LandingPage);
    expect(wrapper.findAll("h1")).toHaveLength(1);
    expect(wrapper.findAll("section")).toHaveLength(5);
  });

  it("links out to the source repository", () => {
    const wrapper = mount(LandingPage);
    const hrefs = wrapper.findAll("a").map((anchor) => anchor.attributes("href"));
    expect(hrefs).toContain(repoUrl);
  });

  it("sends every outbound link to an https destination", () => {
    const wrapper = mount(LandingPage);
    // In-page anchors (#how) and site-relative paths (/docs) are not outbound.
    const external = wrapper
      .findAll("a")
      .map((anchor) => anchor.attributes("href") ?? "")
      .filter((href) => !href.startsWith("#") && !href.startsWith("/"));
    expect(external.length).toBeGreaterThan(0);
    for (const href of external) {
      expect(href).toMatch(/^https:\/\//);
    }
  });

  it("keeps internal links site-relative rather than absolute", () => {
    const wrapper = mount(LandingPage);
    const internal = wrapper
      .findAll("a")
      .map((anchor) => anchor.attributes("href") ?? "")
      .filter((href) => href.startsWith("/"));
    expect(internal.length).toBeGreaterThan(0);
    for (const href of internal) {
      expect(href).not.toMatch(/^\/\//);
      expect(href.startsWith("/docs")).toBe(true);
    }
  });
});
