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
    id: 'orders',
    name: 'Orders Manager',
    description: 'Manage customer orders',
    path: '/admin/orders',
    icon: 'admin-orders',
  },
  {
    id: 'archived-products',
    name: 'Archived Products',
    description: 'View and restore archived products',
    path: '/admin/products/archived',
    icon: 'admin-archive',
  },
  {
    id: 'users',
    name: 'Users & Profiles',
    description: 'Manage user accounts and profiles',
    path: '/admin/users',
    icon: 'admin-users',
  },
  {
    id: 'logs',
    name: 'Log Viewer',
    description: 'View and filter application logs',
    path: '/admin/logs',
    icon: 'admin-log',
  },
  {
    id: 'todo',
    name: 'TODO List',
    description: 'View development TODOs and tasks',
    path: '/admin/todo',
    icon: 'admin-todo',
  },
  {
    id: 'database',
    name: 'Database Manager',
    description: 'View and manage database connections',
    path: '/admin/stats',
    icon: 'admin-database',
  },
  {
    id: 'cache',
    name: 'Cache Manager',
    description: 'View and manage in-memory cache',
    path: '/admin/cache',
    icon: 'admin-cache',
  },
  {
    id: 'messages',
    name: 'Messages',
    description: 'View and manage user messages',
    path: '/admin/message-senders',
    icon: 'admin-messages',
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
