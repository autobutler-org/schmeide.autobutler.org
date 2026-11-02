import type { MinimarkNode } from "@nuxt/content";

export interface SearchableDoc {
  readonly path: string;
  readonly title: string;
  readonly description?: string;
  readonly navigation?: { readonly title?: string; readonly order?: number };
}

/** A doc's body text under one heading, or before the first one. */
export interface DocSection {
  /** The doc path, with `#anchor` for sections under a heading. */
  readonly id: string;
  readonly title: string;
  readonly content: string;
}

export interface ExcerptPart {
  readonly text: string;
  readonly match: boolean;
}

export interface DocExcerpt {
  /** Where the result links: the doc path, or its `#anchor` when the match sits under a heading. */
  readonly to: string;
  /** Omitted when the match is in the doc's intro, where the doc title already says where you are. */
  readonly heading?: string;
  readonly parts: readonly ExcerptPart[];
}

export interface DocMatch<T extends SearchableDoc> {
  readonly doc: T;
  /** Present only when the title and description alone don't explain why the doc matched. */
  readonly excerpt?: DocExcerpt;
}

const CONTEXT_BEFORE = 60;
const CONTEXT_AFTER = 120;

export const searchTerms = (query: string): readonly string[] => [
  ...new Set(query.toLowerCase().split(/\s+/).filter(Boolean)),
];

const normalize = (text: string): string => text.replace(/\s+/g, " ").trim();

const ANY_HEADING = /^h[1-6]$/;
const SECTION_HEADING = /^h[2-6]$/;

/** Tags whose text runs straight into its neighbours' when concatenated without a separator. */
const BLOCK_TAGS = new Set([
  "p",
  "li",
  "ul",
  "ol",
  "blockquote",
  "pre",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "br",
  "hr",
  "div",
]);

const textOf = (node: MinimarkNode): string => {
  if (typeof node === "string") return node;
  const [tag, , ...children] = node;
  const text = children.map(textOf).join("");
  return BLOCK_TAGS.has(tag) || ANY_HEADING.test(tag) ? ` ${text} ` : text;
};

/**
 * Flattens a doc's Markdown body into plain-text sections: the intro before
 * the first `h2`, then one per heading. The `h1` is skipped because it
 * repeats the doc title.
 *
 * `@nuxt/content`'s `queryCollectionSearchSections` does much the same, but
 * joins list items and table cells with no separator ("plainlyGoogle"), which
 * garbles excerpts and lets a term match across two items.
 */
export const sectionsFromBody = (
  path: string,
  body: { readonly value: readonly MinimarkNode[] }
): readonly DocSection[] => {
  const sections: { id: string; title: string; content: string }[] = [
    { id: path, title: "", content: "" },
  ];
  for (const node of body.value) {
    if (typeof node !== "string" && node[0] === "h1") continue;
    const current = sections[sections.length - 1];
    if (typeof node !== "string" && SECTION_HEADING.test(node[0])) {
      const anchor = node[1].id;
      sections.push({
        id: typeof anchor === "string" ? `${path}#${anchor}` : path,
        title: normalize(textOf(node)),
        content: "",
      });
    } else if (current) {
      current.content = normalize(`${current.content} ${textOf(node)}`);
    }
  }
  return sections.filter((section) => section.title || section.content);
};

const docPathOf = (section: DocSection): string => section.id.split("#")[0] ?? section.id;

const includesAll = (haystack: string, terms: readonly string[]): boolean =>
  terms.every((term) => haystack.includes(term));

const countIncluded = (haystack: string, terms: readonly string[]): number =>
  terms.filter((term) => haystack.includes(term)).length;

/** Splits `text` into alternating plain and matched runs, merging overlapping matches. */
export const highlight = (text: string, terms: readonly string[]): readonly ExcerptPart[] => {
  const lower = text.toLowerCase();
  const ranges: [number, number][] = [];
  for (const term of terms) {
    for (let at = lower.indexOf(term); at !== -1; at = lower.indexOf(term, at + term.length)) {
      ranges.push([at, at + term.length]);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);

  const parts: ExcerptPart[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (end <= cursor) continue;
    const from = Math.max(start, cursor);
    if (from > cursor) parts.push({ text: text.slice(cursor, from), match: false });
    const last = parts.at(-1);
    if (last?.match && from === cursor) {
      parts[parts.length - 1] = { text: last.text + text.slice(from, end), match: true };
    } else {
      parts.push({ text: text.slice(from, end), match: true });
    }
    cursor = end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
  return parts;
};

/** Cuts a window around the first match, snapped to word boundaries, with ellipses where trimmed. */
const excerptAround = (content: string, terms: readonly string[]): string => {
  const lower = content.toLowerCase();
  const hits = terms.map((term) => lower.indexOf(term)).filter((at) => at !== -1);
  const first = hits.length > 0 ? Math.min(...hits) : 0;

  let start = Math.max(0, first - CONTEXT_BEFORE);
  let end = Math.min(content.length, first + CONTEXT_AFTER);
  if (start > 0) {
    const space = content.indexOf(" ", start);
    start = space !== -1 && space < first ? space + 1 : start;
  }
  if (end < content.length) {
    const space = content.lastIndexOf(" ", end);
    end = space > first ? space : end;
  }
  return `${start > 0 ? "…" : ""}${content.slice(start, end)}${end < content.length ? "…" : ""}`;
};

/**
 * Filters `docs` to those containing every search term somewhere — nav title,
 * title, description, a heading, or body text — and ranks them.
 *
 * Title matches outrank description matches, which outrank body-only
 * matches; ties keep the order `docs` arrived in.
 */
export const searchDocs = <T extends SearchableDoc>(
  docs: readonly T[],
  sections: readonly DocSection[],
  query: string
): readonly DocMatch<T>[] => {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];

  const sectionsByPath = new Map<string, DocSection[]>();
  for (const section of sections) {
    const path = docPathOf(section);
    sectionsByPath.set(path, [...(sectionsByPath.get(path) ?? []), section]);
  }

  const scored = docs.flatMap((doc) => {
    const titles = `${doc.navigation?.title ?? ""} ${doc.title}`.toLowerCase();
    const description = (doc.description ?? "").toLowerCase();
    const docSections = (sectionsByPath.get(doc.path) ?? []).map((section) => ({
      section,
      heading: section.title.toLowerCase(),
      content: normalize(section.content),
    }));
    const body = docSections
      .map(({ heading, content }) => `${heading} ${content.toLowerCase()}`)
      .join(" ");

    if (!includesAll(`${titles} ${description} ${body}`, terms)) return [];

    const score = terms.reduce(
      (total, term) => total + (titles.includes(term) ? 3 : description.includes(term) ? 2 : 1),
      0
    );

    if (includesAll(`${titles} ${description}`, terms)) return [{ match: { doc }, score }];

    const best = docSections.reduce<(typeof docSections)[number] | undefined>(
      (winner, candidate) => {
        const rank = (entry: (typeof docSections)[number]) =>
          countIncluded(entry.content.toLowerCase(), terms) * 2 +
          countIncluded(entry.heading, terms);
        return !winner || rank(candidate) > rank(winner) ? candidate : winner;
      },
      undefined
    );
    if (!best) return [{ match: { doc }, score }];

    const isIntro = best.section.id === doc.path;
    const excerpt: DocExcerpt = {
      to: best.section.id,
      ...(isIntro ? {} : { heading: best.section.title }),
      parts: highlight(excerptAround(best.content, terms), terms),
    };
    return [{ match: { doc, excerpt }, score }];
  });

  return scored.sort((a, b) => b.score - a.score).map(({ match }) => match);
};
