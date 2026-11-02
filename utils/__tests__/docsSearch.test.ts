import type { MinimarkNode } from "@nuxt/content";
import { describe, expect, it } from "vitest";

import {
  type DocSection,
  highlight,
  searchDocs,
  searchTerms,
  type SearchableDoc,
  sectionsFromBody,
} from "../docsSearch";

const docs: readonly SearchableDoc[] = [
  {
    path: "/docs/welcome",
    title: "Welcome",
    description: "What schmeide is and who it is for",
    navigation: { title: "Welcome", order: 1 },
  },
  {
    path: "/docs/vault",
    title: "Vault",
    description: "Keep passwords on your schmeide",
    navigation: { title: "Vault", order: 2 },
  },
  {
    path: "/docs/photos",
    title: "Photos",
    description: "Back up and browse your photo library",
    navigation: { title: "Photo library", order: 3 },
  },
];

const sections: readonly DocSection[] = [
  { id: "/docs/welcome", title: "Welcome", content: "What schmeide is and who it is for" },
  {
    id: "/docs/welcome#why",
    title: "Why self-host",
    content: "Your files stay on hardware you own.",
  },
  {
    id: "/docs/vault",
    title: "Vault",
    content: "Keep passwords on your schmeide. The vault lives on your drive, encrypted.",
  },
  {
    id: "/docs/vault#soft-launch-basics",
    title: "Soft-launch basics",
    content:
      "Choose a master password you will remember. There is no forgot-password button for the vault. If you forget\nthe master password, that vault data is gone.",
  },
  {
    id: "/docs/photos",
    title: "Photos",
    content: "Back up and browse your photo library",
  },
  {
    id: "/docs/photos#albums",
    title: "Albums",
    content: "Group photos into albums. Albums are private to your household.",
  },
];

const paths = (query: string) => searchDocs(docs, sections, query).map(({ doc }) => doc.path);

describe("searchTerms", () => {
  it("lowercases, splits on whitespace, and drops duplicates", () => {
    expect(searchTerms("  Master   PASSWORD master ")).toEqual(["master", "password"]);
  });

  it("returns nothing for a blank query", () => {
    expect(searchTerms("   ")).toEqual([]);
  });
});

describe("searchDocs", () => {
  it("returns nothing for a blank query", () => {
    expect(searchDocs(docs, sections, "  ")).toEqual([]);
  });

  it("matches on title, nav title, and description", () => {
    expect(paths("vault")).toEqual(["/docs/vault"]);
    expect(paths("photo library")).toEqual(["/docs/photos"]);
    expect(paths("who it is for")).toEqual(["/docs/welcome"]);
  });

  it("matches text that only appears in a doc's body", () => {
    expect(paths("forgot-password")).toEqual(["/docs/vault"]);
    expect(paths("household")).toEqual(["/docs/photos"]);
  });

  it("matches text that only appears in a heading", () => {
    expect(paths("self-host")).toEqual(["/docs/welcome"]);
  });

  it("is case-insensitive", () => {
    expect(paths("FORGOT-PASSWORD")).toEqual(["/docs/vault"]);
  });

  it("requires every term, but lets them come from different parts of a doc", () => {
    expect(paths("vault encrypted")).toEqual(["/docs/vault"]);
    expect(paths("vault albums")).toEqual([]);
  });

  it("returns nothing when no doc contains the query", () => {
    expect(paths("kubernetes")).toEqual([]);
  });

  it("ranks title matches above body-only matches", () => {
    const withBodyMention: readonly DocSection[] = [
      ...sections,
      { id: "/docs/welcome#tour", title: "Tour", content: "Store logins in the vault." },
    ];
    const ranked = searchDocs(docs, withBodyMention, "vault").map(({ doc }) => doc.path);
    expect(ranked).toEqual(["/docs/vault", "/docs/welcome"]);
  });

  it("keeps the incoming order for equally ranked docs", () => {
    expect(paths("schmeide")).toEqual(["/docs/welcome", "/docs/vault"]);
  });

  it("still finds docs by title when no body sections are available", () => {
    expect(searchDocs(docs, [], "vault").map(({ doc }) => doc.path)).toEqual(["/docs/vault"]);
    expect(searchDocs(docs, [], "forgot-password")).toEqual([]);
  });

  describe("excerpts", () => {
    it("omits the excerpt when the title or description explains the match", () => {
      const [match] = searchDocs(docs, sections, "passwords");
      expect(match?.excerpt).toBeUndefined();
    });

    it("links a body match to the heading it sits under and names that heading", () => {
      const [match] = searchDocs(docs, sections, "forgot-password");
      expect(match?.excerpt?.to).toBe("/docs/vault#soft-launch-basics");
      expect(match?.excerpt?.heading).toBe("Soft-launch basics");
    });

    it("highlights the matched text in the excerpt", () => {
      const [match] = searchDocs(docs, sections, "forgot-password");
      const marked = match?.excerpt?.parts.filter((part) => part.match).map((part) => part.text);
      expect(marked).toEqual(["forgot-password"]);
    });

    it("collapses line breaks in body text", () => {
      const [match] = searchDocs(docs, sections, "forgot-password");
      const text = match?.excerpt?.parts.map((part) => part.text).join("");
      expect(text).not.toMatch(/\n/);
      expect(text).toContain("If you forget the master password");
    });

    it("prefers the section that contains the most terms", () => {
      const [match] = searchDocs(docs, sections, "vault master");
      expect(match?.excerpt?.to).toBe("/docs/vault#soft-launch-basics");
    });

    it("trims long sections to a window around the match, with ellipses", () => {
      const filler = "Lorem ipsum dolor sit amet. ".repeat(20);
      const long: readonly DocSection[] = [
        { id: "/docs/photos#long", title: "Long", content: `${filler}needle ${filler}` },
      ];
      const [match] = searchDocs(docs, long, "needle");
      const text = match?.excerpt?.parts.map((part) => part.text).join("") ?? "";
      expect(text.startsWith("…")).toBe(true);
      expect(text.endsWith("…")).toBe(true);
      expect(text).toContain("needle");
      expect(text.length).toBeLessThan(long[0]?.content.length ?? 0);
    });

    it("links to the doc itself, without a heading, when the match is in the intro", () => {
      const [match] = searchDocs(docs, sections, "encrypted");
      expect(match?.excerpt?.to).toBe("/docs/vault");
      expect(match?.excerpt?.heading).toBeUndefined();
    });
  });
});

describe("sectionsFromBody", () => {
  const body: { readonly value: MinimarkNode[] } = {
    value: [
      ["h1", { id: "vault" }, "Vault"],
      ["p", {}, "schmeide's vault lives on your drive,\nencrypted."],
      ["h2", { id: "soft-launch-basics" }, "Soft-launch basics"],
      [
        "ol",
        {},
        ["li", {}, "Choose a ", ["strong", {}, "master password"], "."],
        ["li", {}, "Add entries"],
      ],
      ["h3", { id: "exporting" }, "Exporting ", ["code", {}, "backups"]],
      ["table", {}, ["tr", {}, ["td", {}, "one"], ["td", {}, "two"]]],
    ],
  };

  it("puts text before the first h2 in an intro section keyed by the doc path", () => {
    const [intro] = sectionsFromBody("/docs/vault", body);
    expect(intro).toEqual({
      id: "/docs/vault",
      title: "",
      content: "schmeide's vault lives on your drive, encrypted.",
    });
  });

  it("skips the h1, which repeats the doc title", () => {
    const text = sectionsFromBody("/docs/vault", body)
      .map((section) => section.content)
      .join(" ");
    expect(text).not.toMatch(/^Vault/);
  });

  it("starts a section at every h2 through h6, anchored by the heading id", () => {
    expect(sectionsFromBody("/docs/vault", body).map(({ id, title }) => ({ id, title }))).toEqual([
      { id: "/docs/vault", title: "" },
      { id: "/docs/vault#soft-launch-basics", title: "Soft-launch basics" },
      { id: "/docs/vault#exporting", title: "Exporting backups" },
    ]);
  });

  it("keeps inline formatting inline but separates list items and table cells", () => {
    const [, basics, exporting] = sectionsFromBody("/docs/vault", body);
    expect(basics?.content).toBe("Choose a master password. Add entries");
    expect(exporting?.content).toBe("one two");
  });

  it("returns no sections for an empty body", () => {
    expect(sectionsFromBody("/docs/empty", { value: [] })).toEqual([]);
  });

  it("feeds searchDocs so body text is findable", () => {
    const doc = { path: "/docs/vault", title: "Vault", description: "Passwords" };
    const [match] = searchDocs([doc], sectionsFromBody(doc.path, body), "add entries");
    expect(match?.excerpt?.to).toBe("/docs/vault#soft-launch-basics");
    expect(searchDocs([doc], sectionsFromBody(doc.path, body), "onetwo")).toEqual([]);
  });
});

describe("highlight", () => {
  it("marks every occurrence of every term, case-insensitively", () => {
    expect(highlight("Vault and vault", ["vault"])).toEqual([
      { text: "Vault", match: true },
      { text: " and ", match: false },
      { text: "vault", match: true },
    ]);
  });

  it("merges overlapping and adjacent matches", () => {
    expect(highlight("password", ["pass", "ssword"])).toEqual([{ text: "password", match: true }]);
  });

  it("returns the text unmarked when nothing matches", () => {
    expect(highlight("nothing here", ["vault"])).toEqual([{ text: "nothing here", match: false }]);
  });
});
