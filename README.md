# 🛍️ Ravens Treasures – Handmade Storefront


## Features
### 🧭 Pages
- 🏠 **Home**	            - Hero banner, featured products carousel, quick navigation links
- 🛒 **Shop**	            - Product grid with filters, categories, and search
- 📦 **Product Details**   - Images, description, price, variants, related items
- 🧾 **Cart & Checkout**	- (Planned) Shopping cart + payment integration
- 👤 **Account**	         - Login, signup, and user profile pages
# Ravens Treasures — Storefront Web Application

Professional, production-oriented express/ejs storefront template used for educational purposes.

This repository contains a small e-commerce storefront built with Node.js and Express. It includes server-rendered pages (EJS), a lightweight product database layer, session-backed shopping cart support, basic account routes, and utilities for database migrations and seeding.

Key goals:
- Demonstrate a clear, maintainable Express app structure.
- Provide realistic patterns for sessions, CSRF protection, and security headers.
- Ship a usable local development experience (migrations, seeds).

---

**Contents**
- Features
- Technology stack
- Prerequisites
- Quick Start (PowerShell)
- Project structure
- Available scripts
- Security considerations
- Documentation and roadmap

---

## Features
- Home page with featured items
- Category listing and product detail pages
- Session-based cart and simple checkout flow hooks
- Admin-style dashboard and product management scaffolding
- Database migration and seed scripts for local development
- Basic security: Helmet, CSRF protection, secure session cookie settings

## Technology stack
- Node.js 20
- Express 4
- EJS templates (server-side rendered)
- PostgreSQL-compatible storage (example: Supabase or local Postgres)
- Vanilla CSS and client-side JavaScript
- Dev tools: ESLint, Prettier, Nodemon

---

## Prerequisites
- Node.js 20.x installed
- npm (bundled with Node.js) or pnpm/yarn
- PostgreSQL-compatible database (Supabase or local Postgres recommended)

If you plan to use Supabase, sign up at https://supabase.com and create a project. Alternatively, run Postgres locally via your OS package manager or Docker.

---

## Quick Start (Windows PowerShell)
These instructions assume you are on Windows and using PowerShell. Adjust commands for other shells as needed.

1. Clone the repository

```powershell
git clone <repository-url>
cd cs346f25-store-front-website
```

2. Install dependencies

```powershell
npm install
```

3. Configure environment

- Copy the example environment file and edit values. At minimum set database connection and a session secret.

```powershell
copy .env.example .env
notepad .env
```

Recommended `.env` variables (examples):
- `DATABASE_URL=postgres://user:password@localhost:5432/dbname`
- `SESSION_SECRET=replace-with-a-secure-random-string`
- `NODE_ENV=development`

4. Run database migrations

```powershell
npm run migrate
```

5. (Optional) Seed the database with sample data

```powershell
npm run seed
```

6. Start the development server

```powershell
npm run dev
```

By default the app listens on `http://localhost:3000`. Open that URL in your browser.

Notes:
- If you use Supabase, set `DATABASE_URL` accordingly and ensure the DB is reachable.
- For production deployment, set `NODE_ENV=production`, ensure `SESSION_SECRET` is strong, and serve over HTTPS.

---

## Project structure (high level)
```
src/
  server.js           # Entrypoint that starts the http server
  app.js              # Express app configuration and middleware
  routes/             # Route definitions
  controllers/        # Controller logic and helpers
  models/             # Database access layer
  views/              # EJS templates
  public/             # Static assets (css, js, images)
  middleware/         # Reusable Express middleware
db/
  migrations/         # SQL migrations
  seeds/              # Seed data
  migrate.js          # Migration runner
  seed.js             # Seed runner
  reset.js            # Reset + seed helper
docs/                 # Additional documentation and architecture notes
.env.example           # Template environment variables
package.json           # Scripts and dependencies
```

---

## Available scripts
- `npm start` — start production server
- `npm run dev` — start development server with auto-reload (nodemon)
- `npm run migrate` — run database migrations
- `npm run seed` — seed the database with sample data
- `npm run reset` — reset DB and re-run migrations + seeds (destructive)
- `npm run lint` — run ESLint
- `npm run lint:fix` — auto-fix lint problems
- `npm run format` — format code with Prettier

---

## Security considerations
- `Helmet` is configured to provide sensible HTTP security headers; review the Content Security Policy before adding new external resources.
- `express-session` is used for session management; set a strong `SESSION_SECRET` in production.
- CSRF protection is enabled (`csurf`) and applied to pages that render forms. Routes that accept JSON webhooks (e.g., Stripe) are mounted before the JSON body parser when raw body access is required.
- Use parameterized queries via the data access layer to reduce SQL injection risk.

---

## Documentation and roadmap
See the `docs/` folder for additional information:
- `docs/SETUP.md` — detailed setup and environment guidance
- `docs/ARCHITECTURE.md` — high-level architecture and design notes
- `docs/TODO.md` — roadmap and planned improvements

---

## Contributing
Contributions are welcome. Please follow the coding conventions and run lint/format before submitting a pull request.

---

## License
This project is provided under the ISC license.
