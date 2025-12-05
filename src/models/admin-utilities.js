// admin/utilities.js

// This is your single source of truth for admin tools
const utilities = [
  {
    id: 'products',
    name: 'Products Manager',
    description: 'Manage store products',
    path: '/admin/products',
    icon: 'admin-products',
    category: 'Store',
  },
  {
    id: 'orders',
    name: 'Orders Manager',
    description: 'Manage customer orders',
    path: '/admin/orders',
    icon: 'admin-orders',
    category: 'Store',
  },
  {
    id: 'archived-products',
    name: 'Archived Products',
    description: 'View and restore archived products',
    path: '/admin/products/archived',
    icon: 'admin-archive',
    category: 'Store',
  },
  {
    id: 'users',
    name: 'Users & Profiles',
    description: 'Manage user accounts and profiles',
    path: '/admin/users',
    icon: 'admin-users',
    category: 'Store',
  },
  {
    id: 'logs',
    name: 'Log Viewer',
    description: 'View and filter application logs',
    path: '/admin/logs',
    icon: 'admin-log',
    category: 'System',
  },
  {
    id: 'todo',
    name: 'TODO List',
    description: 'View development TODOs and tasks',
    path: '/admin/todo',
    icon: 'admin-todo',
    category: 'Developer',
  },
  {
    id: 'database',
    name: 'Database Manager',
    description: 'View and manage database connections',
    path: '/admin/stats',
    icon: 'admin-database',
    category: 'System',
  },
  {
    id: 'cache',
    name: 'Cache Manager',
    description: 'View and manage in-memory cache',
    path: '/admin/cache',
    icon: 'admin-cache',
    category: 'System',
  },
  {
    id: 'messages',
    name: 'Messages',
    description: 'View and manage user messages',
    path: '/admin/message-senders',
    icon: 'admin-messages',
    category: 'Content',
  },
  {
    id: 'health',
    name: 'Health Status',
    description: 'Basic health checks and diagnostics',
    path: '/health',
    icon: 'admin-health',
    category: 'System',
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

// Helper: return utilities grouped by the `category` property.
// Returns an array of { category, items } where items is an array of utilities.
utilities.getGrouped = function () {
  const map = new Map();
  (utilities || []).forEach(u => {
    const cat = u.category || 'General';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(u);
  });
  // Convert to array preserving insertion order of categories
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
};

// Backwards compat: also expose grouped as property
utilities.grouped = utilities.getGrouped();