/**
 * Express Application Configuration
 *
 * This file configures:
 * - Express middleware (Helmet, sessions, CSRF protection)
 * - View engine (EJS)
 * - Static file serving
 * - Routes
 * - Error handling
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
        formAction: ["'self'", "https://checkout.stripe.com"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
  })
);

// View engine setup - EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
  // Skip logging for health checks and static files
  skip: (req) =>
    req.path === '/health' ||
    req.path === '/favicon.ico' ||
    req.path.startsWith('/static/') ||
    req.path.startsWith('/images/') ||
    req.path.startsWith('/css/') ||
    req.path.startsWith('/js/')
}));

// Body parsing middleware
app.use('/webhooks', require('./routes/shop/stripe.webhooks.routes.js'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
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
  res.locals.currentPath = req.path;
  res.locals.currentUrl = req.originalUrl;
  // Return true when the current request path equals the given path
  // or is a sub-path of it. Example: isPath('/admin') => true for
  // '/admin' and '/admin/products'. Normalizes leading/trailing slashes.
  res.locals.isPath = (p) => {
    if (!p || typeof p !== 'string') return false;
    // Ensure a leading slash so callers can pass 'admin' or '/admin'
    let normalized = p.startsWith('/') ? p : `/${p}`;
    // Remove trailing slash except when the path is exactly '/'
    if (normalized !== '/' && normalized.endsWith('/')) normalized = normalized.slice(0, -1);

    // Compute the full request path including any mount/baseUrl so that
    // router-mounted roots (e.g. app.use('/admin', adminRouter) where
    // a route inside the router has path '/') will correctly be matched.
    const fullReqPath = (req.baseUrl || '') + (req.path || '');

    // Root should only match the root path
    if (normalized === '/') return fullReqPath === '/';

    return fullReqPath === normalized || fullReqPath.startsWith(normalized + '/');
  };
  next();
});

const { configure, registry } = require('express-page-registry'); // page-registry is my own package for managing page routes

// These are default parameters that will be passed to every page unless overridden
configure({
  meta: {
    author: 'Michael Hulbert, CloseRange',
    title: 'Raven\'s Treasures',
    description: "Your one-stop shop for all things Ravens!",
    siteName: "Raven's Treasures",
    tagline: 'Handmade goods crafted with care.',
    util: require('./controllers/util.js'),
  }
});

const csrfProtection = csrf({ cookie: false });

app.use((req, res, next) => {
  res.locals.cartCount = require('./models/cart').getCart(req).reduce((sum, item) => sum + item.quantity, 0);
  next();
});

app.use('/', require('./routes/root.routes'));
app.use('/', require('./routes/pages.routes'));
app.use('/', require('./routes/api.routes'));
app.use('/', require('./routes/shop.routes'));

app.use('/', require('./routes/shop/cart.routes'));
app.use('/', require('./routes/shop/stripe.routes.js'));

app.use('/account', require('./routes/account/account.routes'));
app.use('/account', require('./routes/account/address.routes.js'));
app.use('/account', require('./routes/account/address.crud.routes.js'));
app.use('/account', require('./routes/account/profile.routes.js'));
app.use('/account', require('./routes/account/security.routes.js'));

app.use('/admin', require('./routes/admin/dashboard.routes'));
app.use('/auth', require('./routes/auth/auth.crud.routes')(csrfProtection));
app.use('/', require('./routes/auth/auth.routes')(csrfProtection));



// const ebayRoutes = require("./routes/ebay.routes.js");
// app.use("/ebay", ebayRoutes);


// Health check and error handling using express-pretty-errors
const { notFound, errorHandler, health } = require("express-pretty-errors");

app.get("/health", health({ package: require("../package.json") }));
app.use(notFound());
app.use(errorHandler({ showStack: "dev", }));

// Log registered pages to console

const log = require("./controllers/debug")("App");

const rows = registry.all().map(p => `${p.meta?.title || ''} -> ${p.route} (${p.view})`);

log.system("Registered Pages", `Total: ${rows.length}`);
log.system("Pages List", rows);
log.error("Test Error");

module.exports = app;
