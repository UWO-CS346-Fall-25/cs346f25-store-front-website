

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
  }
}

module.exports = page_data;
