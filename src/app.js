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
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
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
  res.locals.isPath = (p) => p.endsWith(req.path);
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


app.use('/', require('./routes/root.routes'));
app.use('/', require('./routes/pages.routes'));
app.use('/', require('./routes/api.routes'));
app.use('/', require('./routes/shop.routes'));
app.use('/admin', require('./routes/admin/admin.routes'));
app.use('/admin', require('./routes/admin/admin.crud.routes'));
app.use('/auth', require('./routes/auth/auth.routes')(csrfProtection));
app.use('/', require('./routes/auth/pages.auth.routes')(csrfProtection));



const ebayRoutes = require("./routes/ebay.routes.js");
app.use("/ebay", ebayRoutes);


// Health check and error handling using express-pretty-errors
const { notFound, errorHandler, health } = require("express-pretty-errors");

app.get("/health", health({ package: require("../package.json") }));
app.use(notFound());
app.use(errorHandler({ showStack: "dev", }));

// Log registered pages to console
const rows = registry.all().map(p => ({
  Title: p.meta?.title || '',
  Route: p.route,
  View: p.view,
}));
console.table(rows);





module.exports = app;
