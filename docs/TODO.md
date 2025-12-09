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
- [x] Status pipeline:

pending → shipped → delivered
- [ ] Add internal notes
- [ ] Optional email on status change

### ChatGPT integration for order creation
- [ ] Prompt templates (upsells, bundles, notes)
- [ ] Backend route to call OpenAI
- [ ] UI button “Generate Suggestion”
- [ ] Log prompts/responses
- [ ] Manual editing before saving

## Analytics
### Sales & Revenue Analytics
- [ ] Daily / Monthly / Yearly
- [ ] By Product
- [ ] By Category
- [ ] Profit Margin per Item
- [ ] Sales Volume (# of orders)
- [ ] Average order value (AOV)
- [ ] Conversion rate (% of visitors who purchase)
- [ ] Refund rate or chargebacks
- [ ] Repeat purchase rate

#### Visuals

✔ Line chart: Revenue over time

✔ Pie chart: Sales by category or product

✔ KPI cards: Today’s revenue | Month-to-date | Total orders

### Product & Inventory Analytics
- [ ] Best selling products
- [ ] Worst selling products
- [ ] Inventory levels & low-stock alerts
- [ ] Sell-through rate (how fast stock depletes)
- [ ] Inventory aging (how long stock sits)
- [ ] Stock forecast (days remaining before sellout)
- [ ] Product views to purchase ratio

("interest efficiency")

#### Visuals
✔ Table view: Products sorted by revenue, sales count, stock

✔ Red highlight for low or overstock situations

### Customer Behavior & Demographics
- [ ] New vs returning customers
- [ ] Customer lifetime value (CLV)
- [ ] Average time between purchases
- [ ] Geographical insights (city, state/country)
- [ ] Customer funnel

Visitors → Cart → Checkout → Purchase

#### Visuals
✔ Funnel chart

✔ World/US heatmap

✔ Customer lifetime leaderboards



### Cart & Checkout insights
- [ ] Abandoned carts count & rate
- [ ] Most abandoned product combinations
- [ ] Steps where users drop off during checkout
- [ ] Time to checkout completion
- [ ] Devices used (mobile/desktop)

#### Visuals
✔ Abandonment report with recovery suggestions

✔ % drop at each checkout stage


### Traffic & Engagement Analytics
- [ ] Page views & unique visitors
- [ ] Referral sources

(Facebook, TikTok, Google, direct)
- [ ] Session duration & activity
- [ ] Search terms used on-site
- [ ] Click-through rates

(featured products, hero banners)

#### Visuals
✔ Traffic over time

✔ Pie chart of traffic sources

### Marketing & Promotions
- [ ] Coupon usage statistics
- [ ] Email open rate & click rate
- [ ] Influencer or affiliate performance
- [ ] ROI per marketing channel

#### Visuals
✔ Conversion rate per campaign

✔ Coupon usage trends


### Shipping & Order Processing
- [ ] Orders awaiting shipment
- [ ] Average fulfillment time
- [ ] Delivery success vs delay rate
- [ ] Shipping cost per carrier
- [ ] Return reasons breakdown

#### Visuals
✔ Fulfillment dashboard with progress statuses

✔ Alerts for delayed or unfulfilled orders

### Financial & Operational Metrics
- [ ] Gross revenue vs net revenue

(after fees/refunds)
- [ ] COGS tracking

(cost of goods sold)
- [ ] Supplier cost trends
- [ ] Taxes collected
- [ ] Monthly recurring costs (optional input)

#### Visuals
✔ Profit vs cost bar chart

✔ Month-to-month financial comparison




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
