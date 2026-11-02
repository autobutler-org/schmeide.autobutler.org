import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import HeroSection from "../HeroSection.vue";
import { hero } from "~/data/copy";

describe("HeroSection", () => {
  it("renders the headline and lede", () => {
    const wrapper = mount(HeroSection);
    expect(wrapper.get("h1").text()).toBe(hero.headline);
    expect(wrapper.get(".subhead").text()).toBe(hero.subhead);
    expect(wrapper.text()).toContain(hero.lede);
  });

  it("leads with the quickstart, then the in-page how-it-works link", () => {
    const hrefs = mount(HeroSection)
      .findAll("a")
      .map((anchor) => anchor.attributes("href"));
    expect(hrefs).toEqual(["/docs/quickstart", "#how"]);
  });

  it("lists every fact as a labelled term and value", () => {
    const wrapper = mount(HeroSection);
    const list = wrapper.get("dl");
    expect(list.attributes("aria-label")).toBe(hero.factsLabel);
    const terms = list.findAll("dt").map((term) => term.text());
    const values = list.findAll("dd").map((value) => value.text());
    expect(terms).toEqual(hero.facts.map((fact) => fact.label));
    expect(values).toEqual(hero.facts.map((fact) => fact.value));
  });

  /* These facts are defaults in the schmeide repo; keep them matching it. */
  it("states the ready label, both harnesses, a human merge, and the license", () => {
    const text = mount(HeroSection).get("dl").text();
    expect(text).toContain("schmeide:ready");
    expect(text).toContain("Claude Code");
    expect(text).toContain("Grok CLI");
    expect(text).toMatch(/merge\s*a person, by default/i);
    expect(text).toContain("MIT-0");
    expect(text).not.toMatch(/\$|price|free trial/i);
  });
});
