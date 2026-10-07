import fs from "node:fs";

const read = (f) => JSON.parse(fs.readFileSync(`content/${f}.json`, "utf8"));

export default function () {
  const news = fs
    .readdirSync("content/news")
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ slug: f.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.json$/, ""), ...read(`news/${f.slice(0, -5)}`) }))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  // One page per news item per language. English pages exist only where an English title is filled in.
  const newsPages = news.flatMap((item) =>
    ["lt", "en"].filter((lang) => item[lang] && item[lang].title).map((lang) => ({ lang, item }))
  );

  // News list pages: 9 per page, for each language and each category that has posts.
  const PER_PAGE = 9;
  const catSlugs = {
    lt: { news: "naujienos", events: "renginiai", projects: "projektai", funding: "finansavimas" },
    en: { news: "news", events: "events", projects: "projects", funding: "funding" },
  };
  const base = { lt: "/naujienos/", en: "/en/news/" };
  const catBase = (lang, cat) => (cat === "all" ? base[lang] : `${base[lang]}${lang === "lt" ? "tema" : "topic"}/${catSlugs[lang][cat]}/`);
  const newsIndex = [];
  for (const lang of ["lt", "en"]) {
    const inLang = news.filter((n) => n[lang] && n[lang].title);
    const cats = ["all", "news", "events", "projects", "funding"].filter((c) => c === "all" || inLang.some((n) => n.category === c));
    for (const cat of cats) {
      const list = cat === "all" ? inLang : inLang.filter((n) => n.category === cat);
      const total = Math.max(1, Math.ceil(list.length / PER_PAGE));
      for (let i = 0; i < total; i++) {
        const url = (n) => catBase(lang, cat) + (n > 1 ? `${n}/` : "");
        newsIndex.push({
          lang, cat, page: i + 1, total, url: url(i + 1),
          prev: i > 0 ? url(i) : "", next: i + 1 < total ? url(i + 2) : "",
          pages: Array.from({ length: total }, (_, k) => ({ n: k + 1, url: url(k + 1) })),
          cats: cats.map((c) => ({ key: c, url: catBase(lang, c) })),
          items: list.slice(i * PER_PAGE, (i + 1) * PER_PAGE),
        });
      }
    }
  }
  // The language switch goes to the same category in the other language when it exists there.
  for (const p of newsIndex) {
    const o = p.lang === "lt" ? "en" : "lt";
    p.alt = newsIndex.some((x) => x.lang === o && x.cat === p.cat) ? catBase(o, p.cat) : base[o];
  }

  const projects = read("projects");
  const initiatives = read("initiatives");
  // The Initiatives page lists the association's own projects first, then everything else.
  const allInitiatives = [...projects.items.map((p) => ({ ...p, ours: true })), ...initiatives.items];

  return {
    news,
    newsPages,
    newsIndex,
    redirects: read("redirects"),
    home: read("home"),
    about: read("about"),
    services: read("services"),
    projects,
    initiatives,
    allInitiatives,
    resources: read("resources"),
  };
}
