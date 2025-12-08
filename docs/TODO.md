# 🛍️ Storefront Website – TODO List

## 🚨 Important
### Apply Stripe buying products
- [x] Create `/checkout` and `/checkout/success` routes
- [x] Create Checkout session on server (Stripe)
- [ ] Validate cart vs DB (price, stock) before session
- [x] Implement Stripe webhook `checkout.session.completed`
- [x] Save Orders + Order Items in DB

### Add Account info into admin dashboard
- [x] Show user information (name/email/created)
- [x] Show orders + verification status
- [ ] Show ban status

### Add Stock properties to products
- [ ] DB: `stock_quantity`, `is_active`, `allow_backorder`
- [ ] Decrement stock after purchase (webhook)
- [ ] Product page shows stock status/low stock
- [ ] Prevent checkout when out-of-stock
- [ ] Cleanup Account pages styling

### Cart / Checkout
- [ ] Persistent cart (session/user)
- [x] Editable quantities & remove item
- [x] Shipping forms
- [x] Payment via Stripe
- [ ] Confirmation page + email receipt
### View / Modify order fulfillment
- [x] Admin order list + filters
- [x] Status pipeline: pending → shipped → delivered
- [ ] Add internal notes
- [ ] Optional email on status change

### ChatGPT integration for order creation
- [ ] Prompt templates (upsells, bundles, notes)
- [ ] Backend route to call OpenAI
- [ ] UI button “Generate Suggestion”
- [ ] Log prompts/responses
- [ ] Manual editing before saving

## 🛒 Customer-Facing Pages
### Home
- [x] Hero banner
- [x] Featured products
- [x] Shop Now button
- [x] Quick links
- [ ] Optional video support in hero

### Shop / Products
- [x] Product grid
- [ ] Filters: category/price/stock
- [ ] Sorting: new/popular/price
- [ ] Search bar
- [ ] Sale badge system

### Product Details
- [x] Title, images, description
- [x] Price + variant options
- [x] Add to cart + buy now
- [x] Recommended products
- [ ] Show stock status
- [ ] Product video support
- [ ] Etsy badge if cross-listed

### Cart / Checkout
- [x] Cart UI
- [x] Update quantities
- [x] Shipping + payment forms
- [ ] Coupon input/validation
- [ ] Confirmation page + email

### Contact
- [ ] Contact form + validation
- [ ] Business email + socials
- [ ] FAQ or response notice
- [ ] Email backend w/ SMTP service

### Policies
- [ ] Shipping
- [ ] Return/Refund
- [ ] Privacy
- [ ] Terms of Service

### Account
- [x] Login/Signup/Logout
- [x] Orders history
- [ ] Wishlist
- [x] Saved addresses
- [ ] Email verification system
- [ ] Ban system messages

## 🛠️ Admin / Backend
### Dashboard
- [ ] Revenue stats + graphs
- [x] Product management enhancements
- [x] View/edit orders
- [x] Customer list
- [ ] Analytics tracking
- [x] Settings page
- [ ] Staff audit log

### Category Management
- [x] DB tables for categories
- [ ] Admin UI add/edit/delete
- [ ] Assign categories to products
- [ ] Use categories for filters

### Coupons
- [ ] DB: code/type/usage limits/dates
- [ ] Admin create/edit/delete UI
- [ ] Apply coupon in checkout flow

### Sales / Promotions
- [ ] Product sale price/dates
- [ ] Sale price display on front-end
- [ ] Category-wide sale events

### Etsy Integration
- [ ] API keys & auth
- [ ] Import products
- [ ] Sync stock
- [ ] Manual sync button

### Staff Audit Log
- [ ] DB log of admin actions
- [ ] Log product/order/coupon edits
- [ ] UI table for viewing logs

### 📹 Video Integration
- [ ] Decide hosting (YT/Vimeo/upload)
- [ ] Reusable component
- [ ] Lazy loading
- [ ] Product page + hero compatibility


## 📨 Email & Marketing
### Contact Email
- [ ] SMTP/Mailgun/SendGrid config
- [ ] Email templates & auto replies

### Email Verification
- [ ] Token + verification link
- [ ] Verified badge in account

### Newsletter
- [ ] Sign-up UI
- [ ] DB or Mailchimp integration
- [ ] Double opt-in system
- [ ] Admin subscriber list
- [ ] Export CSV


## 🌐 Additional Features
### Blog / Journal
- [ ] Blog posts system
- [ ] Write “Our Story” article

### About / Story
- [ ] Write brand mission
- [ ] Add maker info + pictures

### Gallery / Portfolio
- [ ] Showcase handmade work

### Reviews / Testimonials
- [ ] Customer review system
- [ ] Featured testimonials block

### Events / Markets
- [ ] Add events schedule page
- [ ] Maps & RSVP options
