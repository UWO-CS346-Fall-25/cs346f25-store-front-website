

const page_data = {
  products: {
    title: 'Products Dashboard',
    subtitle: 'Create, update, and retire products shown in your shop.',
    backLink: { name: 'Back to Dashboard', href: '/admin', icon: 'back' },
    postLink: { name: 'New product', href: '/admin/products/new', icon: 'admin-add' },
    resetLink: null,
    preBody: './products-pre',
    body: './products',
    cssFiles: ['admin/dashboard.css', 'admin.css'],
    scripts: []
  },
  logs: {
    title: 'Admin Logs',
    subtitle: 'System logs and debug information',
    backLink: { name: 'Back to Dashboard', href: '/admin', icon: 'back' },
    postLink: null,
    resetLink: null,
    preBody: null,
    body: './logs',
    cssFiles: ['admin/dashboard.css', 'admin.css', 'admin/logs.css'],
    scripts: ['admin/logs.js']
  },
  orders: {
    title: 'Orders Dashboard',
    subtitle: 'Manage customer orders and track their status.',
    backLink: { name: 'Back to Dashboard', href: '/admin', icon: 'back' },
    postLink: null,
    resetLink: null,
    preBody: null,
    body: './orders',
    cssFiles: ['admin/dashboard.css', 'admin.css', 'admin/logs.css'],
    scripts: []
  },
  archived: {
    title: 'Archived Products',
    subtitle: 'Manage archived products in your store.',
    backLink: { name: 'Back to Dashboard', href: '/admin', icon: 'back' },
    postLink: null,
    resetLink: null,
    preBody: null,
    body: './products-archived',
    cssFiles: ['admin/dashboard.css', 'admin.css'],
    scripts: []
  },
  users: {
    title: 'Users Dashboard',
    subtitle: 'Manage users in your store.',
    backLink: { name: 'Back to Dashboard', href: '/admin', icon: 'back' },
    postLink: null,
    resetLink: null,
    preBody: null,
    body: './users',
    cssFiles: ['admin/dashboard.css', 'admin.css', 'admin/logs.css'],
    scripts: []
  },
  messages: {
    title: 'Messages',
    subtitle: 'View and manage user messages.',
    backLink: { name: 'Back to Dashboard', href: '/admin', icon: 'back' },
    postLink: null,
    resetLink: null,
    preBody: null,
    body: './message-senders',
    cssFiles: ['admin/dashboard.css', 'admin.css', 'admin/logs.css'],
    scripts: []
  },
  database: {
    title: 'Database Stats',
    subtitle: 'View and manage database statistics.',
    backLink: { name: 'Back to Dashboard', href: '/admin', icon: 'back' },
    postLink: null,
    resetLink: {
      name: 'Reset Database Stats',
      name_small: "Reset",
      href: '/admin/stats/reset',
      icon: 'admin-reset',
      confirm: "Reset",
      body: "Reset database statistics? This cannot be undone."
    },
    preBody: null,
    body: './stats',
    cssFiles: ['admin/dashboard.css', 'admin.css'],
    scripts: ['admin/stats.js']
  },
  cache: {
    title: 'Cache',
    subtitle: 'View and manage cache entries.',
    backLink: { name: 'Back to Dashboard', href: '/admin', icon: 'back' },
    postLink: null,
    resetLink: {
      name: 'Clear Cache',
      name_small: "Clear",
      href: '/admin/cache/delete',
      icon: 'admin-reset-cache',
      confirm: "Clear",
      body: "Clear cache? This cannot be undone."
    },
    preBody: null,
    body: './cache',
    cssFiles: ['admin/dashboard.css', 'admin.css', 'admin/logs.css'],
    scripts: ['admin/logs.js']
  },
  product_new: {
    title: 'Product Details',
    subtitle: 'Setup a new product for your store.',
    backLink: { name: 'Back to Products', href: '/admin/products', icon: 'back' },
    postLink: null,
    resetLink: null,
    preBody: null,
    body: './products-new',
    cssFiles: ['admin/dashboard.css', 'admin.css'],
    scripts: ['photo-view.js']
  },
  order_details: function (order) {
    return {
      title: `Order #${order.number}`,
      subtitle: `Order was placed on ${order.placed_at_display}`,
      backLink: { name: 'Back to Orders', href: '/admin/orders', icon: 'back' },
      postLink: null,
      resetLink: null,
      preBody: null,
      body: './order-details',
      cssFiles: ['account.css', 'admin/dashboard.css', 'admin.css'],
      scripts: []
    }
  },
  stock: {
    title: "Stock Dashboard",
    subtitle: "Manage product stock levels and inventory.",
    backLink: { name: 'Back to Dashboard', href: '/admin', icon: 'back' },
    postLink: null,
    resetLink: null,
    preBody: null,
    body: './stock-manager',
    cssFiles: ['account.css', 'admin/dashboard.css', 'admin.css'],
    scripts: []
  },
  test: {
    title: "Test",
    subtitle: "This is a test page.",
    backLink: { name: 'Back to Orders', href: '/admin/orders', icon: 'back' },
    postLink: null,
    resetLink: null,
    preBody: null,
    body: './test-page',
    cssFiles: ['account.css', 'admin/dashboard.css', 'admin.css'],
    scripts: []
  },
}

module.exports = page_data;
