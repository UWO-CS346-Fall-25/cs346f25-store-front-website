# Contributing Guide

This guide will help you extend and customize this template for your project.

## Before You Start

1. Read through the existing code
2. Review `docs/ARCHITECTURE.md` to understand the structure
3. Check `docs/SETUP.md` for setup instructions

## Adding New Features

### 1. Adding a New Page

#### Step 1: Create a Route

Create or update a file in `src/routes/`:

```javascript
// src/routes/products.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const csrf = require('csurf');

const csrfProtection = csrf({ cookie: false });

router.get('/', csrfProtection, productController.getProducts);
router.get('/:id', csrfProtection, productController.getProduct);
router.post('/', csrfProtection, productController.createProduct);

module.exports = router;
```

#### Step 2: Create a Controller

Create a file in `src/controllers/`:

```javascript
// src/controllers/productController.js
const Product = require('../models/Product');

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll();
    res.render('products/index', {
      title: 'Products',
      products: products,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    next(error);
  }
};
```

#### Step 3: Create a Model

Create a file in `src/models/`:

```javascript
// src/models/Product.js
const db = require('./db');

class Product {
  static async findAll() {
    const query = 'SELECT * FROM products ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM products WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async create(data) {
    const { name, description, price } = data;
    const query = `
      INSERT INTO products (name, description, price)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [name, description, price]);
    return result.rows[0];
  }
}

module.exports = Product;
```

#### Step 4: Create a View

Create a file in `src/views/`:

```html
<!-- src/views/products/index.ejs -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %></title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <h1>Products</h1>
  <ul>
    <% products.forEach(product => { %>
      <li>
        <a href="/products/<%= product.id %>"><%= product.name %></a>
      </li>
    <% }); %>
  </ul>
</body>
</html>
```

#### Step 5: Register the Route

Update `src/app.js`:

```javascript
// Import the new route
const productRouter = require('./routes/products');

// Register the route
app.use('/products', productRouter);
```

#### Step 6: Create Database Migration

Create a migration file in `db/migrations/`:

```sql
-- db/migrations/002_create_products_table.sql
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
```

Run the migration:

```bash
npm run migrate
```

### 2. Adding Authentication

This template includes session management. To add authentication:

1. **Hash Passwords**: Install bcrypt
   ```bash
   npm install bcrypt
   ```

2. **Update User Model**:
   ```javascript
   const bcrypt = require('bcrypt');
   
   static async create(userData) {
     const { username, email, password } = userData;
     const hashedPassword = await bcrypt.hash(password, 10);
     // ... rest of create logic
   }
   ```

3. **Verify Passwords**:
   ```javascript
   static async verifyPassword(plainPassword, hashedPassword) {
     return await bcrypt.compare(plainPassword, hashedPassword);
   }
   ```

4. **Protect Routes**: Create middleware
   ```javascript
   // src/middleware/auth.js
   function requireAuth(req, res, next) {
     if (!req.session.user) {
       return res.redirect('/users/login');
     }
     next();
   }
   
   module.exports = { requireAuth };
   ```

### 3. Adding API Endpoints

For JSON APIs instead of HTML pages:

```javascript
// src/routes/api.js
router.get('/products', async (req, res, next) => {
  try {
    const products = await Product.findAll();
    res.json({ products });
  } catch (error) {
    next(error);
  }
});
```

## Database Best Practices

### Always Use Parameterized Queries

```javascript
// ❌ BAD - SQL Injection Vulnerable
const result = await db.query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ GOOD - Safe
const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
```

### Use Transactions for Multiple Queries

```javascript
const client = await db.getClient();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO orders ...');
  await client.query('UPDATE inventory ...');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## Security Checklist

When adding new features:

- [ ] Validate all user input
- [ ] Use parameterized queries ($1, $2, etc.)
- [ ] Include CSRF tokens in forms
- [ ] Check authentication/authorization
- [ ] Sanitize output in views
- [ ] Use HTTPS in production
- [ ] Never commit secrets to Git

## Code Style

### Follow Existing Patterns

- Use async/await for asynchronous code
- Handle errors with try/catch
- Pass errors to next() in Express routes
- Use meaningful variable names
- Comment complex logic

### Run Linter and Formatter

Before committing:

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format code
```

## Testing Your Changes

1. **Start the server**: `npm run dev`
2. **Test in browser**: Navigate to your new pages
3. **Check console**: Look for errors
4. **Test edge cases**: Invalid input, missing data, etc.

## Common Issues

### Database Connection Errors

- Check `.env` file has correct credentials
- Verify PostgreSQL is running
- Confirm database exists

### CSRF Token Errors

- Include CSRF token in all POST forms
- Make sure session middleware is before CSRF middleware

### Route Not Found

- Check route is registered in `app.js`
- Verify route path is correct
- Check HTTP method (GET, POST, etc.)

## Getting Help

- Review existing code for examples
- Check `docs/` folder for documentation
- Read inline comments in the code
- Search for error messages online

## Best Practices

1. **One Feature at a Time**: Small, focused changes
2. **Test Frequently**: Test after each change
3. **Commit Often**: Save your progress
4. **Document Your Code**: Add helpful comments
5. **Follow MVC Pattern**: Keep models, views, and controllers separate
6. **Security First**: Always validate and sanitize input

Happy coding! 🚀
