import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const shareImage = "media/brickhold-social.jpg";
const shareAlt =
  "Brickhold title above skeletons and a troll in front of a purple castle portal";

const escapeMarkup = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function canonicalUrl(value) {
  if (!value?.trim()) return undefined;
  const url = new URL(value.trim());
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "SITE_URL must be the public site URL without credentials, a query, or a fragment.",
    );
  }
  url.pathname = url.pathname.replace(/\/+$/, "") + "/";
  return url;
}

export async function emitSiteSeo(directory, publicUrl = process.env.SITE_URL) {
  const canonical = canonicalUrl(publicUrl);
  const absolute = (path) => canonical && new URL(path, canonical).href;
  const fragment = (id) => `${canonical?.href ?? ""}#${id}`;
  const { game, studio } = JSON.parse(
    await readFile(new URL("../content/site.json", import.meta.url), "utf8"),
  );
  const studioId = fragment("studio");
  const gameId = fragment("brickhold");
  const publisher = { "@id": studioId };
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": studioId,
        name: studio.name,
        url: canonical?.href,
        logo: absolute("media/studio-logo.webp"),
        email: studio.email,
      },
      {
        "@type": "VideoGame",
        "@id": gameId,
        name: game.title,
        description: game.description,
        genre: ["Tower defense", "Action"],
        url: game.playtestUrl,
        image: absolute(shareImage),
        publisher,
      },
      ...(canonical
        ? [
            {
              "@type": "WebSite",
              "@id": fragment("website"),
              name: studio.name,
              url: canonical.href,
              publisher,
            },
            {
              "@type": "WebPage",
              "@id": canonical.href,
              name: game.title,
              url: canonical.href,
              inLanguage: "en",
              mainEntity: { "@id": gameId },
              isPartOf: { "@id": fragment("website") },
            },
          ]
        : []),
    ],
  };
  const metadata = [];
  if (canonical) {
    const url = escapeMarkup(canonical.href);
    const image = escapeMarkup(absolute(shareImage));
    const alt = escapeMarkup(shareAlt);
    metadata.push(
      `<link rel="canonical" href="${url}" />`,
      `<meta property="og:url" content="${url}" />`,
      `<meta property="og:image" content="${image}" />`,
      '<meta property="og:image:type" content="image/jpeg" />',
      '<meta property="og:image:width" content="1200" />',
      '<meta property="og:image:height" content="630" />',
      `<meta property="og:image:alt" content="${alt}" />`,
      `<meta name="twitter:image" content="${image}" />`,
      `<meta name="twitter:image:alt" content="${alt}" />`,
    );
  }
  metadata.push(
    `<script type="application/ld+json">${JSON.stringify(graph).replaceAll("<", "\\u003c")}</script>`,
  );

  const home = join(directory, "index.html");
  const html = await readFile(home, "utf8");
  if (!html.includes("<!-- hosted-seo -->"))
    throw new Error("Missing SEO marker in built HTML.");
  const sitemapUrl = canonical && absolute("sitemap.xml");
  let robots = "User-agent: *\nAllow: /\n";
  if (sitemapUrl) robots += `\nSitemap: ${sitemapUrl}\n`;
  await Promise.all([
    writeFile(
      home,
      html.replace("<!-- hosted-seo -->", () => metadata.join("\n    ")),
    ),
    writeFile(join(directory, "robots.txt"), robots),
    ...(canonical
      ? [
          writeFile(
            join(directory, "sitemap.xml"),
            `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeMarkup(canonical.href)}</loc></url></urlset>\n`,
          ),
        ]
      : []),
  ]);
}
