/**
 * Express Application Configuration
 *
 * This file configures the main Express application for the website.
 * It wires up security middleware (Helmet/CSP), logging, body parsing,
 * static file serving, sessions, authentication middleware, page routing,
 * and error/health endpoints.
 *
 * Keep comments concise and placed near important implementation
 * decisions (for maintainers and reviewers).
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const session = require('express-session');
const morgan = require('morgan');
const csrf = require('csurf');

// Initialize Express app
const app = express();

// Security middleware - Helmet
// Helmet helps set secure HTTP headers. We customize the Content
// Security Policy (CSP) here so templates and third-party resources
// used by the site function correctly while limiting unwanted sources.
// If you change any CDN usage, update the corresponding CSP directives.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        // Allow Chart.js from jsdelivr CDN in addition to self
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:'],
        formAction: ["'self'", 'https://checkout.stripe.com'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
  })
);

// View engine setup - EJS
// EJS is used throughout the app for server-side rendered pages.
// Views directory is `src/views` relative to this file.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// HTTP request logging
// Use 'combined' format in production, 'dev' otherwise. We skip
// trivial/static requests to keep logs focused on meaningful traffic.
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    skip: (req) =>
      req.path === '/health' ||
      req.path === '/favicon.ico' ||
      req.path.startsWith('/static/') ||
      req.path.startsWith('/images/') ||
      req.path.startsWith('/css/') ||
      req.path.startsWith('/js/'),
  })
);

// Body parsing middleware
// IMPORTANT: Stripe webhooks often require the raw request body for
// signature verification. The webhook route is mounted before the
// JSON body parser so it can handle the raw body itself. All other
// routes will use express.json()/urlencoded for parsed bodies.
app.use('/webhooks', require('./routes/shop/stripe.webhooks.routes.js'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
// Serves assets from `src/public` (CSS, JS, images, etc.). Keep this
// mounted early so static requests are handled efficiently.
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
// Sessions are used for login state, flash messages, and the shopping
// cart. Ensure `SESSION_SECRET` is set in production to a strong value.
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      // `secure` ensures cookies are only sent over HTTPS in production
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// ==============================
// =========== Routes ===========
// ==============================

app.use(require('connect-flash')());
app.use(require('cookie-parser')());
app.use(require('./middleware/auth'));

app.use((req, res, next) => {
  // Make the current path/URL available to all templates
  res.locals.currentPath = req.path;
  res.locals.currentUrl = req.originalUrl;

  // `isPath` helper used in views to highlight nav items and similar.
  // It treats a path as matching if it equals the request path or is a
  // parent path (e.g., '/admin' matches '/admin' and '/admin/products').
  res.locals.isPath = (p) => {
    if (!p || typeof p !== 'string') return false;
    let normalized = p.startsWith('/') ? p : `/${p}`;
    if (normalized !== '/' && normalized.endsWith('/'))
      normalized = normalized.slice(0, -1);

    // Include router mount point (req.baseUrl) so view helpers work
    // correctly for routes mounted with `app.use('/prefix', router)`.
    const fullReqPath = (req.baseUrl || '') + (req.path || '');

    if (normalized === '/') return fullReqPath === '/';
    return (
      fullReqPath === normalized || fullReqPath.startsWith(normalized + '/')
    );
  };
  next();
});

const { configure, registry } = require('express-page-registry'); // page-registry is my own package for managing page routes

// Configure default page metadata passed to templates via the
// `express-page-registry` utility. Pages can override these defaults.
configure({
  meta: {
    author: 'Michael Hulbert, CloseRange',
    title: "Raven's Treasures",
    description: 'Your one-stop shop for all things Ravens!',
    siteName: "Raven's Treasures",
    tagline: 'Handmade goods crafted with care.',
    util: require('./controllers/util.js'),
  },
});

// CSRF protection instance (using session storage for the token)
// We pass `csrfProtection` into route modules that need it.
const csrfProtection = csrf({ cookie: false });

// Make the current cart item count available to templates. This is a
// small helper for the navbar/cart UI; it reads from the session-backed
// cart model and sums quantities.
app.use((req, res, next) => {
  res.locals.cartCount = require('./models/cart')
    .getCart(req)
    .reduce((sum, item) => sum + item.quantity, 0);
  next();
});

// Route mounts
// Order matters: webhooks were mounted earlier; here we mount page
// routes, API routes, and shop features. Routes that require CSRF
// protection receive `csrfProtection` when they are initialized.
app.use('/', require('./routes/root.routes'));
app.use('/', require('./routes/pages.routes'));
app.use('/', require('./routes/api.routes'));
app.use('/', require('./routes/shop.routes'));

app.use('/', require('./routes/shop/cart.routes'));
app.use('/', require('./routes/shop/stripe.routes.js'));

app.use('/account', require('./routes/account/account.routes'));
app.use('/account', require('./routes/account/profile.routes.js'));
app.use('/account', require('./routes/account/security.routes.js'));

app.use('/admin', require('./routes/admin/dashboard.routes'));
app.use('/auth', require('./routes/auth/auth.crud.routes')(csrfProtection));
app.use('/', require('./routes/auth/auth.routes')(csrfProtection));

// const ebayRoutes = require("./routes/ebay.routes.js");
// app.use("/ebay", ebayRoutes);

// Health check and error handling using `express-pretty-errors`.
// The health endpoint returns basic service information for monitoring.
const { notFound, errorHandler, health } = require('express-pretty-errors');

app.get('/health', health({ package: require('../package.json') }));
app.use(notFound());
app.use(errorHandler({ showStack: 'dev' }));

// Log registered pages to console for debugging and verification.
// This helps ensure the page registry contains the expected routes.
const log = require('./controllers/debug')('App');

const rows = registry
  .all()
  .map((p) => `${p.meta?.title || ''} -> ${p.route} (${p.view})`);

log.system('Registered Pages', `Total: ${rows.length}`);
log.system('Pages List', rows);
// Keep a test error log call commented or removed in production;
// it's useful locally to verify logger integration.
log.error('Test Error');

module.exports = app;
