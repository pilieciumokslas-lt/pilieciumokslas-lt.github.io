// One-off import of posts from the old WordPress.com site into content/news.
// Run with: npm run import
import fs from "node:fs/promises";
import path from "node:path";

const API = "https://public-api.wordpress.com/wp/v2/sites/pilieciumokslas.lt";
const OUT = "content/news";
const IMG = "assets/uploads/news";
const CATS = { events: "events", "project news": "projects" };

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&hellip;/g, "…");

const text = (h) => decode(h.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

async function download(url, name) {
  const clean = url.split("?")[0];
  const ext = path.extname(clean).toLowerCase() || ".jpg";
  const file = `${IMG}/${name}${ext}`;
  try {
    await fs.access(file);
  } catch {
    const res = await fetch(`${clean}?w=1400`);
    if (!res.ok) return null;
    await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
  return "/" + file;
}

async function cleanBody(html, slug) {
  let h = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s(class|style|id|data-[\w-]+|srcset|sizes|loading|decoding|width|height|rel|target)="[^"]*"/g, "")
    .replace(/<\/?(div|figure|span)[^>]*>/g, "")
    .replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/g, "")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
  let i = 0;
  for (const m of [...h.matchAll(/<img[^>]*src="([^"]+)"/g)]) {
    const local = await download(m[1], `${slug}-${++i}`);
    if (local) h = h.replace(m[1], local);
  }
  return h;
}

const posts = await (await fetch(`${API}/posts?per_page=100&_embed=wp:featuredmedia,wp:term`)).json();
for (const p of posts) {
  const slug = decodeURIComponent(p.slug).slice(0, 70).replace(/-+$/, "");
  const validDate = /^(19|20)\d\d-/.test(p.date);
  const date = validDate ? p.date.slice(0, 10) : "";
  const terms = (p._embedded?.["wp:term"] || []).flat().map((t) => t.name);
  const category = terms.map((t) => CATS[t]).find(Boolean) || "news";
  const media = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const file = `${OUT}/${date || "0000-00-00"}-${slug}.json`;
  const entry = {
    date,
    category,
    image: media ? await download(media, slug) : "",
    lt: {
      title: decode(p.title.rendered),
      summary: text(p.excerpt.rendered).replace(/\s*(\[…\]|…)$/, "…"),
      body: await cleanBody(p.content.rendered, slug),
    },
    en: { title: "", summary: "", body: "" },
  };
  await fs.writeFile(file, JSON.stringify(entry, null, 2) + "\n");
  console.log("imported", file);
}
