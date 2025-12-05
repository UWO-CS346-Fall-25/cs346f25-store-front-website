
# 🛍️ Storefront Website – TODO List
## Important
### General Next Steps
* [x] Complete Account pages
* [x] Complete Account pages
* [ ] Apply Stripe buying products
* [ ] Add Account info into admin dashboard
* [ ] Add Stock properties to products
* [ ] Cleanup Account pages styling
* [ ] Cart / Checkout
* [ ] View / Modify order fulfilment
* [ ] CHAT GPT integration into order creations

### Recent work (completed)
The following developer tasks were completed recently and are tracked in the repo:

* [x] Annotated `src/app.js` with inline comments (middleware, CSP, sessions, routing order)
* [x] Annotated `src/routes/shop.routes.js` with inline comments (redirects, CSRF, pagination, related items)
* [x] Rewrote `README.md` with a professional overview and a clear Quick Start (PowerShell)

These changes improve maintainability and onboarding for new contributors.


## Customer-Facing Pages
### Home
* [x] Create hero banner with brand name and tagline
* [x] Add featured products section
* [x] Add "Shop Now" button linking to store
* [x] Include quick links (About, Contact, etc.)

### Shop / Products
* [x] Product grid layout
* [ ] Filter by category / price / availability
* [ ] Sorting options (Newest, Popular, Price)
* [ ] Add search bar

### Product Details
* [x] Product title, images, and description
* [x] Price, variants (size, color, etc.)
* [x] "Add to Cart" & "Buy Now" buttons
* [x] Related or recommended products

### Cart / Checkout
* [ ] Shopping cart page
* [ ] Editable item quantities
* [ ] Shipping and payment forms
* [ ] Order summary and confirmation page

### Contact
* [ ] Contact form (name, email, message)
* [ ] Business email & social media links
* [ ] Optional FAQ or "response time" notice

### Policies
* [ ] Shipping Policy
* [ ] Return & Refund Policy
* [ ] Privacy Policy
* [ ] Terms of Service

### Account
* [x] Login / Signup / Logout pages
* [x] View order history
* [ ] Wishlist (optional)
* [x] Saved addresses / payment methods


## Admin / Backend Pages (Private)
### Admin
* [ ] Dashboard overview (sales, stock, analytics)
* [x] Product management (add / edit / delete)
* [ ] Orders management (status updates, fulfillment)
* [ ] Customer database
* [ ] Analytics charts
* [ ] Settings for payments, shipping, and branding

## Optional Add-Ons
### Blog / Journal
* [ ] Blog layout & post system
* [ ] Create first article (“Our Story” or “Making Of…”)

### About / Story
* [ ] Write brand story and mission
* [ ] Add photos or video of your process
* [ ] Introduce the maker (you!)

### Gallery / Portfolio
* [ ] Display handmade collections / past works
* [ ] Add category filters or carousel

### Reviews / Testimonials
* [ ] Customer review system on product pages
* [ ] Featured testimonials section

### Events / Markets
* [ ] Upcoming market schedule
* [ ] Map or RSVP option

### Newsletter / Community
* [ ] Email signup form
* [ ] Connect to mailing service (Mailchimp, etc.)

### Suggested priorities and improvements
These are recommended next steps to make the app production-ready and easier to maintain.

- [ ] Implement Cart page and Checkout flow (critical path)
- [ ] Complete Stripe integration (server/webhook tests, payment flows)
- [ ] Add order management in admin (view, update status, export)
- [ ] Add product `stock` and availability checks (prevent oversell)
- [ ] Add automated tests: unit tests for models/controllers and smoke tests for routes
- [ ] CI pipeline: run lint, tests, and migrations on PRs
- [ ] Add logging/monitoring (structured logs, request tracing)
- [ ] Harden security: review CSP, session cookie settings, rate limiting
- [ ] Prepare a Dockerfile and deployment instructions (Heroku/Vercel/Azure/GCP)
- [ ] Improve seed data to include more realistic orders and customers for testing
- [ ] Add E2E tests for core flows (browse, add-to-cart, checkout)
- [ ] Accessibility audit of templates (WCAG basics)
- [ ] Performance checks for image sizes and asset caching
