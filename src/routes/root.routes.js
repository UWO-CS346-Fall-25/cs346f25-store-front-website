const express = require('express');
const crypto = require('crypto');
const router = express.Router();

function createTheme(themeData) {
  return {
    light: {
      '--primary-1': themeData.light_primary_1 || '#a9a7be',
      '--primary-2': themeData.light_primary_2 || '#9b93b7',
      '--primary-3': themeData.light_primary_3 || '#857aab',
      '--tint-1': themeData.light_tint_1 || '#388A67',
      '--tint-2': themeData.light_tint_2 || '#21b977',
      '--tint-3': themeData.light_tint_3 || '#a5e2c8ff',

      '--carousel-interval': '5000ms',
      '--background': '#F0F0F3',
      '--foreground': '#000000',
      '--overlay': '#ffffff',

      '--footer-bg': 'var(--primary-1)',
      '--footer-fg': 'var(--primary-3)',
      '--primary-alt': 'var(--primary-3)',
      '--tint-alt': 'var(--tint-1)',

      '--success-bg': '#21b977',
      '--success-fg': '#ffffffff',
      '--error': '#ef4444',
      '--muted-fg': '#515152ff',
      '--muted-bg': '#ccccd3ff',
    },
    dark: {
      '--primary-1': themeData.dark_primary_1 || '#817ea4ff',
      '--primary-2': themeData.dark_primary_2 || '#7f76a1ff',
      '--primary-3': themeData.dark_primary_3 || '#655a8eff',
      '--tint-1': themeData.dark_tint_1 || '#388A67',
      '--tint-2': themeData.dark_tint_2 || '#21b977',
      '--tint-3': themeData.dark_tint_3 || '#a5e2c8ff',

      '--carousel-interval': '5000ms',
      '--background': '#1c1c1dff',
      '--foreground': '#ffffff',
      '--overlay': '#2c2c2fff',

      '--footer-bg': 'var(--primary-3)',
      '--footer-fg': 'var(--primary-1)',
      '--primary-alt': 'var(--primary-1)',
      '--tint-alt': 'var(--tint-3)',

      '--success-fg': '#22c55e',
      '--success-bg': '#10b9811f',
      '--error': '#ef4444',
      '--error-bg': '#310c0aff',
      '--muted-fg': '#000000ff',
      '--muted-bg': '#454550ff',
    },
  };
}

// allow "auto" (system) in addition to "light"/"dark"
function pickTheme(req, themeData) {
  const q = String(req.query.theme || '').toLowerCase();
  if (q && (q === 'auto' || themeData[q])) return q;

  const fromCookie = String(
    (req.cookies && req.cookies.theme) || ''
  ).toLowerCase();
  if (fromCookie && (fromCookie === 'auto' || themeData[fromCookie]))
    return fromCookie;

  return 'auto'; // default to system
}

function makeETag(content) {
  const h = crypto.createHash('sha1').update(content).digest('hex');
  return `W/"${content.length.toString(16)}-${h}"`;
}

router.get('/css/_root.css', async (req, res) => {
  const themeData = createTheme(
    await require('../models/themeDatabase.js').getCurrentTheme()
  );
  const themeName = pickTheme(req, themeData);

  let css;
  if (themeName === 'light' || themeName === 'dark') {
    // FORCE a theme
    const vars = themeData[themeName];
    css =
      `/* generated ${new Date().toISOString()} theme:${themeName} */\n` +
      `:root{\n` +
      Object.entries(vars)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n') +
      `\n}\n`;
  } else {
    // AUTO: base = light; override dark when OS prefers dark
    const light = Object.entries(themeData.light)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    const dark = Object.entries(themeData.dark)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    css =
      `/* generated ${new Date().toISOString()} theme:auto (system) */\n` +
      `:root{\n${light}\n}\n` +
      `@media (prefers-color-scheme: dark){\n` +
      `  :root{\n${dark}\n  }\n` +
      `}\n`;
  }

  const etag = makeETag(css);
  res.set('Content-Type', 'text/css; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=0, must-revalidate');
  res.set('ETag', etag);
  res.set('Vary', 'Cookie'); // different users can force a theme
  if (req.headers['if-none-match'] === etag) return res.status(304).end();
  res.send(css);
});

module.exports = router;
