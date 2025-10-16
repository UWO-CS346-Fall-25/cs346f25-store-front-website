
// Old repurposed code from another project.
// Uses the error handler module
const os = require("os");
let pkg = { name: "app", version: "0.0.0" };
try { pkg = require("../package.json"); } catch (_) { }

module.exports = function health(req, res) {
  const now = new Date();
  const payload = {
    ok: true,
    service: pkg.name,
    version: pkg.version,
    uptime_s: Math.round(process.uptime()),
    now: now.toISOString(),
    pid: process.pid,
    hostname: os.hostname(),
    memory_rss: process.memoryUsage().rss,

    node_env: process.env.NODE_ENV || "development",
    db_connected: true, // TODO: actually check the database...
  };

  res.set("Cache-Control", "no-store");

  const accept = (req.headers.accept || "").toLowerCase();
  if (req.query.format === "json" || accept.includes("application/json")) {
    return res.status(200).json(payload);
  }

  try {
    const { renderHtml } = require("express-pretty-errors/template");

    const html = renderHtml({
      title: "200 • Healthy",
      statusCode: 200,
      statusText: "OK",
      message: `${pkg.name} v${pkg.version} is healthy.`,
      method: req.method,
      path: req.originalUrl,
      timestamp: now.toISOString(),

      theme: "auto",
      showThemeToggle: false,
      logoUrl: "/logo.svg",
      logoAlt: "Logo",
      logoHref: "/",
      logoHeight: 28,
      brandName: "Store Front",

      suggestionLinks: [
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
      ],

      details: payload,
    });

    return res.status(200).type("html").send(html);
  } catch {
    return res.status(200).json(payload);
  }
};
