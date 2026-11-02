import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ManifestoSection from "../ManifestoSection.vue";
import { manifesto, repoUrl } from "~/data/copy";

describe("ManifestoSection", () => {
  it("renders every paragraph and the pull quote", () => {
    const text = mount(ManifestoSection).text();
    for (const paragraph of manifesto.paragraphs) {
      expect(text).toContain(paragraph);
    }
    expect(text).toContain(manifesto.pull);
  });

  it("links to the source repository", () => {
    const hrefs = mount(ManifestoSection)
      .findAll("a")
      .map((anchor) => anchor.attributes("href"));
    expect(hrefs).toEqual([repoUrl]);
  });

  it("uses the glossary's word for the job owner", () => {
    const text = mount(ManifestoSection).text();
    expect(text).toContain("steward");
    expect(text).not.toMatch(/submitter/i);
  });
});
