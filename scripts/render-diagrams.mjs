/*
 * Renders every diagrams/*.mmd to public/assets/diagrams/<name>-light.svg and
 * <name>-dark.svg, so the site ships plain SVG and no Mermaid runtime.
 *
 * Mermaid is not a dependency of this site (see AGENTS.md). Point MERMAID_JS
 * at a local mermaid.min.js and CHROMIUM at a Chromium binary; `make diagrams`
 * passes both through.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const sourceDir = join(root, "diagrams");
const outDir = join(root, "public", "assets", "diagrams");
const mermaidJs = process.env.MERMAID_JS;
const chromium = process.env.CHROMIUM || "chromium";

if (!mermaidJs) {
  console.error(
    "Set MERMAID_JS to the path of a mermaid.min.js, e.g. make diagrams MERMAID_JS=..."
  );
  process.exit(2);
}

const font = '"Helvetica Neue", Helvetica, Arial, sans-serif';

/* Colors mirror the tokens in assets/main.css, light and dark. */
const themes = {
  light: {
    darkMode: false,
    background: "transparent",
    fontFamily: font,
    primaryColor: "#ffffff",
    primaryBorderColor: "#d3d0c8",
    primaryTextColor: "#111111",
    secondaryColor: "#efeee9",
    tertiaryColor: "#f7f6f3",
    lineColor: "#6a6964",
    textColor: "#2f3437",
    clusterBkg: "#f7f6f3",
    clusterBorder: "#d3d0c8",
    noteBkgColor: "#fbf3db",
    noteTextColor: "#111111",
    noteBorderColor: "#e6c475",
    actorBkg: "#ffffff",
    actorBorder: "#d3d0c8",
    signalColor: "#2f3437",
    signalTextColor: "#2f3437",
    labelBoxBkgColor: "#efeee9",
    edgeLabelBackground: "#f7f6f3",
  },
  dark: {
    darkMode: true,
    background: "transparent",
    fontFamily: font,
    primaryColor: "#1d1d1b",
    primaryBorderColor: "#3e3d39",
    primaryTextColor: "#f2f1ee",
    secondaryColor: "#252523",
    tertiaryColor: "#161615",
    lineColor: "#9c9a94",
    textColor: "#d6d5d0",
    clusterBkg: "#161615",
    clusterBorder: "#3e3d39",
    noteBkgColor: "#352d18",
    noteTextColor: "#f2f1ee",
    noteBorderColor: "#956400",
    actorBkg: "#1d1d1b",
    actorBorder: "#3e3d39",
    signalColor: "#d6d5d0",
    signalTextColor: "#d6d5d0",
    labelBoxBkgColor: "#252523",
    edgeLabelBackground: "#161615",
  },
};

const sources = readdirSync(sourceDir)
  .filter((file) => file.endsWith(".mmd"))
  .sort()
  .map((file) => ({
    name: basename(file, ".mmd"),
    text: readFileSync(join(sourceDir, file), "utf8"),
  }));

const page = `<!doctype html><html><body>
<script src="${pathToFileURL(resolve(mermaidJs)).href}"></script>
<script>
(async () => {
  const sources = ${JSON.stringify(sources)};
  const themes = ${JSON.stringify(themes)};
  const out = {};
  for (const [theme, themeVariables] of Object.entries(themes)) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables,
      securityLevel: "strict",
      htmlLabels: false,
      flowchart: { htmlLabels: false },
    });
    for (const { name, text } of sources) {
      const { svg } = await mermaid.render(name + "-" + theme, text);
      out[name + "-" + theme] = svg;
    }
  }
  const pre = document.createElement("pre");
  pre.id = "out";
  pre.textContent = JSON.stringify(out);
  document.body.append(pre);
})().catch((err) => {
  const pre = document.createElement("pre");
  pre.id = "err";
  pre.textContent = String(err && err.stack || err);
  document.body.append(pre);
});
</script></body></html>`;

const work = mkdtempSync(join(tmpdir(), "schmeide-diagrams-"));
try {
  const html = join(work, "render.html");
  writeFileSync(html, page);
  const dom = execFileSync(
    chromium,
    [
      "--headless=new",
      "--disable-gpu",
      "--allow-file-access-from-files",
      `--user-data-dir=${join(work, "profile")}`,
      "--virtual-time-budget=20000",
      "--dump-dom",
      pathToFileURL(html).href,
    ],
    {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      timeout: 120_000,
      stdio: ["ignore", "pipe", "ignore"],
    }
  );
  const decode = (s) =>
    s
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&amp;", "&");
  const err = dom.match(/<pre id="err">([\s\S]*?)<\/pre>/);
  if (err) throw new Error(`mermaid failed: ${decode(err[1] ?? "")}`);
  const found = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
  if (!found) throw new Error("mermaid produced no output; check MERMAID_JS and CHROMIUM");
  const rendered = JSON.parse(decode(found[1] ?? "{}"));

  mkdirSync(outDir, { recursive: true });
  for (const [name, raw] of Object.entries(rendered)) {
    // Give the SVG its intrinsic size so <img width height> reserves the space.
    const [, , width = "0", height = "0"] = (raw.match(/viewBox="([^"]+)"/)?.[1] ?? "").split(
      /\s+/
    );
    const svg = raw
      .replace(
        / width="100%"/,
        ` width="${Math.ceil(Number(width))}" height="${Math.ceil(Number(height))}"`
      )
      .replace(/ style="max-width:[^"]*"/, "");
    writeFileSync(join(outDir, `${name}.svg`), `${svg}\n`);
    console.log(`${name}.svg ${Math.ceil(Number(width))}x${Math.ceil(Number(height))}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
