// admin/utilities.js

// This is your single source of truth for admin tools
const utilities = [
  {
    id: 'products',
    name: 'Products Manager',
    description: 'Manage store products',
    path: '/admin/products',
    icon: 'admin-products',
  },
  {
    id: 'archived-products',
    name: 'Archived Products',
    description: 'View and restore archived products',
    path: '/admin/products/archived',
    icon: 'admin-archive',
  },
  {
    id: 'logs',
    name: 'Log Viewer',
    description: 'View and filter application logs',
    path: '/admin/logs',
    icon: 'admin-log',
  },
  {
    id: 'health',
    name: 'Health Status',
    description: 'Basic health checks and diagnostics',
    path: '/health',
    icon: 'admin-health',
  },
  // Add more as you build them:
  // {
  //   id: 'cache',
  //   name: 'Cache Viewer',
  //   description: 'Inspect in-memory cache',
  //   path: '/admin/cache',
  //   icon: '🧠',
  // },
];

module.exports = utilities;