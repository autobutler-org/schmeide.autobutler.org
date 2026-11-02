import { queryCollection } from "@nuxt/content/server";

const SITE = "https://schmeide.autobutler.org";
// Keep in sync with the non-docs pages under pages/.
const PAGES = ["/", "/docs"] as const;

export default defineEventHandler(async (event) => {
  const docs = await queryCollection(event, "docs").select("path").all();
  const urls = [...PAGES, ...docs.map((doc) => doc.path)]
    .map((path) => `  <url><loc>${SITE}${path}</loc></url>`)
    .join("\n");
  setHeader(event, "content-type", "application/xml");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
});
