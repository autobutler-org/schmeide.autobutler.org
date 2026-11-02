/**
 * Every string that appears on the landing page lives here, so copy changes
 * happen in one file rather than across component templates. Docs prose lives
 * in `content/docs/*.md` instead.
 */

export interface Link {
  readonly label: string;
  readonly href: string;
}

export interface Feature {
  readonly name: string;
  readonly body: string;
  /** Shown next to the name, e.g. a default that a reader should not miss. */
  readonly badge?: string;
  /** Not built yet: drawn as a dashed, recessed card so it never reads as shipped. */
  readonly upcoming?: boolean;
}

export interface Step {
  readonly title: string;
  readonly body: string;
}

/** One row of a label/value list, e.g. the hero's fact sheet. */
export interface Fact {
  readonly label: string;
  readonly value: string;
}

/** A paragraph that ends in a link, e.g. "... read it yourself." */
export interface LinkedNote {
  readonly link: Link;
  readonly trailing: string;
}

export const repoUrl = "https://github.com/autobutler-org/schmeide";
export const orgSiteUrl = "https://autobutler.org";

export const masthead = {
  wordmark: "schmeide",
  links: [
    { label: "Docs", href: "/docs" },
    { label: "Configuration", href: "/docs/repo-config" },
    { label: "Source", href: repoUrl },
    { label: "AutoButler", href: orgSiteUrl },
  ] as readonly Link[],
  /** Rendered apart from the other links, as the one solid button in the bar. */
  cta: { label: "Quickstart", href: "/docs/quickstart" } as Link,
  menuLabel: "Menu",
} as const;

export const hero = {
  /**
   * Decorative: the "schmeide" wordmark in the masthead already names the
   * project, so an alt here would only repeat it. Hence the empty alt.
   */
  logo: { src: "/schmeide.svg", alt: "" },
  headline: "Issues in, pull requests out",
  subhead: "A software factory that runs on your own machines.",
  lede:
    "Assign a GitHub issue and add one label. schmeide hands it to your runner, which has Claude " +
    "Code or the Grok CLI write the change, runs your repo's own checks, opens a pull request, " +
    "and has a second agent review it.",
  primary: { label: "Read the quickstart", href: "/docs/quickstart" } as Link,
  secondary: { label: "See how it works", href: "#how" } as Link,
  /**
   * Plain facts about the project, set like a spec sheet beside the headline.
   * Each one is backed by the docs.
   */
  factsLabel: "schmeide at a glance",
  facts: [
    { label: "Trigger", value: "Assignee + schmeide:ready" },
    { label: "Agents", value: "Claude Code, Grok CLI" },
    { label: "Runs on", value: "Your machine, your login" },
    { label: "Merge", value: "A person, by default" },
    { label: "Source code", value: "Public, MIT-0" },
  ] as readonly Fact[],
} as const;

export const manifesto = {
  eyebrow: "01 — Why schmeide",
  heading: "Your agents, your gate, your merge button.",
  paragraphs: [
    "Coding agents are good at well-scoped tickets. What they need around them is the boring " +
      "part: a queue, a clean checkout, the repo's real checks, a pull request, and someone to " +
      "look at the result. schmeide is that part.",
    "Each person who owns a job, the steward, runs their own runner on their own machine, with " +
      "the agent CLI they already have installed and logged in. schmeide never handles an agent " +
      "API key. The control node queues jobs and mints a short-lived GitHub App token per job, " +
      "scoped to that one repository.",
    "Nothing merges unless a repository asks for it. A repo opts in to each step it wants " +
      "automated in its own config file, which the runner reads before an agent starts, so a " +
      "session cannot switch automation on for itself.",
  ] as readonly string[],
  pull: "One Go binary. A control node, a runner, and the GitHub you already use.",
  openSource: {
    link: { label: "Completely open source.", href: repoUrl },
    trailing: " Read the code, the design notes, and every user journey it is tested against.",
  } as LinkedNote,
} as const;

export const howItWorks = {
  eyebrow: "02 — The flow",
  heading: "From a ready issue to a reviewed pull request.",
  steps: [
    {
      title: "Label an issue",
      body:
        "Assign an open issue to a steward and add the schmeide:ready label. The GitHub App's " +
        "webhook turns it into one job on that steward's queue.",
    },
    {
      title: "A runner writes it",
      body:
        "The steward's runner checks out a fresh worktree on a branch named after the issue and " +
        "runs a Claude Code or Grok session from the issue text.",
    },
    {
      title: "The gate decides",
      body:
        "The repo's own gate command, such as make check test, must pass. Only then does the " +
        "runner push the branch and open a pull request as the App.",
    },
    {
      title: "A second agent reviews",
      body:
        "A fresh reviewer session checks the change. Grok reviews Claude Code's work when both " +
        "are ready. A person merges, unless the repo turned factory merge on.",
    },
  ] as readonly Step[],
} as const;

export const features = {
  eyebrow: "03 — What it does",
  heading: "What you get",
  lede: "Everything here ships today, except the one card drawn as not built.",
  items: [
    {
      name: "A queue that survives restarts",
      body:
        "The control node embeds NATS with JetStream. Jobs, status, and stage records are on " +
        "disk, a runner heartbeats the job it holds, and a job a runner drops is offered again.",
    },
    {
      name: "Per-job GitHub tokens",
      body:
        "Runners hold no long-lived GitHub credential. Each job gets an installation token for " +
        "its one repository, refreshed before it expires and revoked when the job ends.",
    },
    {
      name: "Your repo's gate",
      body:
        "A pull request opens only after the command in .schmeide/config.toml passes, in a " +
        "fresh worktree with a trimmed environment and a scratch home directory.",
    },
    {
      name: "AI review rounds",
      body:
        "Up to three reviewer sessions per pull request by default. With review_fix on, a " +
        "request for changes sends a fresh worker session back in, and the gate runs again.",
    },
    {
      name: "Factory merge",
      badge: "Off by default",
      body:
        "With automate.merge on, the runner waits for green checks and merges, or adds the pull " +
        "request to the merge queue. The first red check gets one fix round.",
    },
    {
      name: "Stacked pull requests",
      body:
        "Mark an issue as blocked by another with GitHub's issue dependencies, and its pull " +
        "request is based on the blocker's branch, then restacked as the one below merges.",
    },
    {
      name: "Pool runners",
      body:
        "A runner started with --pool also takes jobs whose steward has no live runner, so work " +
        "does not wait for someone's laptop to wake up.",
    },
    {
      name: "doctor, status, and a dashboard",
      body:
        "doctor checks a machine before it runs jobs. status lists your runners and jobs. The " +
        "dashboard shows them on a local page with a read-only ask panel.",
    },
    {
      name: "A permission floor",
      body:
        "Sessions start able to edit files in their worktree and nothing more. Flags that skip " +
        "permission checks are refused unless the operator opts in by name.",
    },
    {
      name: "Secret scan before push",
      body:
        "The lines a job adds are scanned for keys and tokens before git push. A hit refuses " +
        "the push and names the file and line, never the secret.",
    },
    {
      name: "Container isolation",
      upcoming: true,
      body:
        "Not built yet. A job runs as the user that started the runner, so run it as a user " +
        "that holds nothing else worth taking.",
    },
  ] as readonly Feature[],
} as const;

export const callToAction = {
  eyebrow: "04 — Start",
  heading: "One control node, one runner, one pull request.",
  body:
    "The quickstart takes you from a new GitHub App to the first pull request schmeide opens, " +
    "with the control node and the runner on a single machine.",
  action: { label: "Open the quickstart", href: "/docs/quickstart" } as Link,
} as const;

export const docsIndex = {
  heading: "Documentation",
  lede: "How to run schmeide, configure a repository for it, and read what it tells you.",
  searchLabel: "Search the docs",
  searchPlaceholder: "Search titles and page text",
  clearLabel: "Clear search",
  previewHeading: "Start here",
  allHeading: "All docs",
  resultsHeading: "Results",
  noResults: "No docs match that search.",
  /**
   * A function rather than a string so the plural stays in this file with the
   * rest of the copy instead of being assembled in the template.
   */
  resultCount: (count: number): string => (count === 1 ? "1 doc matches" : `${count} docs match`),
} as const;

/** How many docs the "Start here" preview shows above the full listing. */
export const docsPreviewCount = 4;

/** Shown by the root `error.vue` for any thrown error, including a missing doc. */
export const errorPage = {
  notFoundHeading: "Page not found",
  notFoundBody: "There's nothing at this address. It may have moved, or the link may be wrong.",
  errorHeading: "Something went wrong",
  errorBody: "This page failed to load. Try again, or head somewhere else.",
  links: [
    { label: "Home", href: "/" },
    { label: "Documentation", href: "/docs" },
  ] as readonly Link[],
} as const;

export const footer = {
  note: "schmeide is built by the AutoButler project. MIT-0 licensed.",
  links: [
    { label: "GitHub", href: repoUrl },
    { label: "Issues", href: `${repoUrl}/issues` },
    { label: "Design notes", href: `${repoUrl}/blob/main/docs/design.md` },
    { label: "autobutler.org", href: orgSiteUrl },
  ] as readonly Link[],
} as const;
