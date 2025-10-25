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
    "--primary-1": "#3ca7baff",
    "--primary-2": "#2a8798ff",
    "--primary-3": "#1a527fff",
    "--tint-1": "#be1156ff",
    "--tint-2": "#ff247fff",
    "--tint-3": "#ffffff",

    "--carousel-interval": "5000ms",
    "--background": "#1c1c1dff",
    "--foreground": "#ffffff",
    "--overlay": "#2c2c2fff",

    "--footer-bg": "var(--primary-3)",
    "--footer-fg": "var(--primary-1)",
  },
};

// Pick theme via ?theme=, cookie "theme", or default
function pickTheme(req) {
  const q = String(req.query.theme || "").toLowerCase();
  if (q && THEMES[q]) return q;

  const fromCookie = String((req.cookies && req.cookies.theme) || "").toLowerCase();
  if (fromCookie && THEMES[fromCookie]) return fromCookie;

  return "light";
}

function makeETag(content) {
  const h = crypto.createHash("sha1").update(content).digest("hex");
  return `W/"${content.length.toString(16)}-${h}"`;
}

// GET /css/root.css  → dynamic :root { --vars }
router.get("/css/root.css", (req, res) => {
  const themeName = pickTheme(req);
  // const vars = THEMES[themeName] || THEMES.dark;
  const vars = THEMES.dark;

  const css =
    `/* generated ${new Date().toISOString()} theme:${themeName} */\n` +
    `:root{\n` +
    Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join("\n") +
    `\n}\n`;

  const etag = makeETag(css);

  res.set("Content-Type", "text/css; charset=utf-8");
  res.set("Cache-Control", "public, max-age=0, must-revalidate");
  res.set("ETag", etag);
  res.set("Vary", "Cookie"); // different users may get different themes

  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }
  res.send(css);
});

// Optional: POST /api/theme/:name to set a cookie
router.post("/api/theme/:name", express.json(), (req, res) => {
  const { name } = req.params;
  if (!THEMES[name]) return res.status(400).json({ error: "Unknown theme" });
  // not httpOnly so client-side JS can read it if needed
  res.cookie("theme", name, { sameSite: "Lax", maxAge: 1000 * 60 * 60 * 24 * 180 });
  res.json({ ok: true, theme: name });
});

module.exports = router;
