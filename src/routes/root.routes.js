const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const THEMES = {
  light: {
    "--primary-1": "#a9a7be",
    "--primary-2": "#9b93b7",
    "--primary-3": "#857aab",
    "--tint-1": "#388A67",
    "--tint-2": "#21b977",
    "--tint-3": "#ffffff",

    "--carousel-interval": "5000ms",
    "--background": "#F0F0F3",
    "--foreground": "#000000",
    "--overlay": "#ffffff",

    "--footer-bg": "var(--primary-1)",
    "--footer-fg": "var(--primary-3)",
  },
  dark: {
    "--primary-1": "#696591ff",
    "--primary-2": "#4a3c6aff",
    "--primary-3": "#342751ff",
    "--tint-1": "#388A67",
    "--tint-2": "#21b977",
    "--tint-3": "#ffffff",

    "--carousel-interval": "5000ms",
    "--background": "#1c1c1dff",
    "--foreground": "#ffffff",
    "--overlay": "#2c2c2fff",

    "--footer-bg": "var(--primary-3)",
    "--footer-fg": "var(--primary-1)",
  },
};

// allow "auto" (system) in addition to "light"/"dark"
function pickTheme(req) {
  const q = String(req.query.theme || "").toLowerCase();
  if (q && (q === "auto" || THEMES[q])) return q;

  const fromCookie = String((req.cookies && req.cookies.theme) || "").toLowerCase();
  if (fromCookie && (fromCookie === "auto" || THEMES[fromCookie])) return fromCookie;

  return "auto"; // default to system
}

function makeETag(content) {
  const h = crypto.createHash("sha1").update(content).digest("hex");
  return `W/"${content.length.toString(16)}-${h}"`;
}

router.get("/css/root.css", (req, res) => {
  const themeName = pickTheme(req);

  let css;
  if (themeName === "light" || themeName === "dark") {
    // FORCE a theme
    const vars = THEMES[themeName];
    css =
      `/* generated ${new Date().toISOString()} theme:${themeName} */\n` +
      `:root{\n` +
      Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join("\n") +
      `\n}\n`;
  } else {
    // AUTO: base = light; override dark when OS prefers dark
    const light = Object.entries(THEMES.light).map(([k, v]) => `  ${k}: ${v};`).join("\n");
    const dark = Object.entries(THEMES.dark).map(([k, v]) => `  ${k}: ${v};`).join("\n");
    css =
      `/* generated ${new Date().toISOString()} theme:auto (system) */\n` +
      `:root{\n${light}\n}\n` +
      `@media (prefers-color-scheme: dark){\n` +
      `  :root{\n${dark}\n  }\n` +
      `}\n`;
  }

  const etag = makeETag(css);
  res.set("Content-Type", "text/css; charset=utf-8");
  res.set("Cache-Control", "public, max-age=0, must-revalidate");
  res.set("ETag", etag);
  res.set("Vary", "Cookie"); // different users can force a theme
  if (req.headers["if-none-match"] === etag) return res.status(304).end();
  res.send(css);
});

// POST /api/theme/auto|light|dark  (store preference)
router.post("/api/theme/:name", express.json(), (req, res) => {
  const { name } = req.params;
  if (!(name === "auto" || THEMES[name])) return res.status(400).json({ error: "Unknown theme" });
  res.cookie("theme", name, { sameSite: "Lax", maxAge: 1000 * 60 * 60 * 24 * 180 });
  res.json({ ok: true, theme: name });
});

module.exports = router;