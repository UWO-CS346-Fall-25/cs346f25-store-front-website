

const page_data = {
  products: {
    title: 'Products Dashboard',
    subtitle: 'Create, update, and retire products shown in your shop.',
    backLink: { name: 'Back to Dashboard', href: '/admin', icon: 'back' },
    postLink: { name: 'New product', href: '/admin/products/new', icon: 'admin-add' },

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
    preBody: null,
    body: './users',
    cssFiles: ['admin/dashboard.css', 'admin.css', 'admin/logs.css'],
    scripts: []
  },
  database: {
    title: 'Database Stats',
    subtitle: 'View and manage database statistics.',
    backLink: { name: 'Back to Dashboard', href: '/admin', icon: 'back' },
    postLink: null,
    preBody: null,
    body: './stats',
    cssFiles: ['admin/dashboard.css', 'admin.css'],
    scripts: ['admin/stats.js']
  }
}

module.exports = page_data;
