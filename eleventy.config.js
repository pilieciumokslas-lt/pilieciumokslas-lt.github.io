import { EleventyHtmlBasePlugin } from "@11ty/eleventy";

// Isometric cube field used in the hero. Deterministic, so it looks the same on every build.
function cubes() {
  const N = 10, w = 56, h = 28, lift = 34;
  const pal = {
    b: ["#3b3bff", "#1717e6", "#0c0cba"],
    k: ["#1b1b24", "#0b0b12", "#000"],
    w: ["#ffffff", "#e3e6ff", "#c9ceff"],
    p: ["#ff6db3", "#ff2e93", "#d4167a"],
  };
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let out = "";
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const r = rnd(), c = rnd();
      const z = r < 0.42 ? 0 : r < 0.74 ? 1 : r < 0.92 ? 2 : 3;
      const [t, l, rgt] = pal[c < 0.07 ? "k" : c < 0.13 ? "w" : c < 0.2 ? "p" : "b"];
      const x = (i - j) * w, y = (i + j) * h, H = z * lift;
      out += `<path fill="${t}" d="M${x},${y - H - h}L${x + w},${y - H}L${x},${y - H + h}L${x - w},${y - H}Z"/>`;
      if (z) {
        out += `<path fill="${l}" d="M${x - w},${y - H}L${x},${y - H + h}L${x},${y + h}L${x - w},${y}Z"/>`;
        out += `<path fill="${rgt}" d="M${x + w},${y - H}L${x},${y - H + h}L${x},${y + h}L${x + w},${y}Z"/>`;
      }
    }
  }
  const W = N * w;
  return `<svg class="cubes" viewBox="${-W} ${-3 * lift - h} ${2 * W} ${2 * N * h + 3 * lift}" aria-hidden="true" stroke="#06068f" stroke-width="1" stroke-linejoin="round">${out}</svg>`;
}

// Soft abstract cover for news posts that have no picture. The pattern is derived from the post's
// slug, so every post gets its own quiet variation instead of a flat colour block.
function cover(slug) {
  let seed = 7;
  for (const ch of String(slug || "x")) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const N = 11, w = 46, h = 23, lift = 24;
  const base = ["#f6f7fc", "#e4e7f3", "#d8dcec"];
  const accents = [["#c9ccfb", "#aeb2f2", "#989ce6"], ["#ffd3e6", "#f6b9d3", "#e9a2c1"], ["#cfd3de", "#b9bdca", "#a6aab8"]];
  const ai = Math.floor(rnd() * N * N), bi = Math.floor(rnd() * N * N), acc = accents[Math.floor(rnd() * 2)];
  let out = "";
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const r = rnd(), k = i * N + j;
      const z = k === ai ? 2 : k === bi ? 1 : r < 0.62 ? 0 : r < 0.9 ? 1 : 2;
      const [t, l, rg] = k === ai ? acc : k === bi ? accents[2] : base;
      const x = (i - j) * w, y = (i + j) * h, H = z * lift;
      out += `<path fill="${t}" d="M${x},${y - H - h}L${x + w},${y - H}L${x},${y - H + h}L${x - w},${y - H}Z"/>`;
      if (z) {
        out += `<path fill="${l}" d="M${x - w},${y - H}L${x},${y - H + h}L${x},${y + h}L${x - w},${y}Z"/>`;
        out += `<path fill="${rg}" d="M${x + w},${y - H}L${x},${y - H + h}L${x},${y + h}L${x + w},${y}Z"/>`;
      }
    }
  }
  const cy = N * h;
  return `<svg class="cover" viewBox="-300 ${cy - 200} 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" stroke="#cfd4e8" stroke-width="0.8" stroke-linejoin="round"><rect x="-300" y="${cy - 200}" width="600" height="400" fill="#eef0f8" stroke="none"/>${out}</svg>`;
}

export default function (cfg) {
  cfg.addPlugin(EleventyHtmlBasePlugin);
  cfg.addPassthroughCopy({ assets: "assets" });
  // Files that must keep their old address, e.g. documents linked from outside.
  cfg.addPassthroughCopy({ static: "/" });
  cfg.addPassthroughCopy({ "src/css": "css" });
  for (const f of ["inter", "space-grotesk"]) {
    for (const s of ["latin", "latin-ext"]) {
      cfg.addPassthroughCopy({
        [`node_modules/@fontsource-variable/${f}/files/${f}-${s}-wght-normal.woff2`]: `fonts/${f}-${s}.woff2`,
      });
    }
  }
  cfg.addWatchTarget("./content/");

  cfg.addShortcode("cubes", cubes);
  cfg.addFilter("cover", cover);
  cfg.addFilter("initials", (name) =>
    (name || "").replace(/^(prof\.|dr\.|doc\.)\s*/gi, "").replace(/^(prof\.|dr\.|doc\.)\s*/gi, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
  );
  cfg.addFilter("byName", (arr, lang) =>
    [...(arr || [])].sort((a, b) => ((a[lang] && a[lang].name) || a.name).localeCompare((b[lang] && b[lang].name) || b.name, lang, { sensitivity: "base" }))
  );
  cfg.addFilter("take", (arr, n) => (arr || []).slice(0, n));
  cfg.addFilter("where", (arr, key, val) => (arr || []).filter((x) => x[key] === val));
  cfg.addFilter("inLang", (arr, lang) => (arr || []).filter((x) => x[lang] && x[lang].title));
  cfg.addFilter("niceDate", (d, lang) =>
    d ? new Intl.DateTimeFormat(lang === "lt" ? "lt-LT" : "en-GB", { dateStyle: "long" }).format(new Date(d)) : ""
  );

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix: process.env.PATH_PREFIX || "/",
    htmlTemplateEngine: "njk",
  };
}
