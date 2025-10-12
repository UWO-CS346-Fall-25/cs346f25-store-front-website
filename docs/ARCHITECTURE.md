# Architecture Overview

This document provides an overview of the application architecture and design patterns used in this template.

## Technology Stack

### Backend
- **Node.js 20**: JavaScript runtime environment
- **Express 4**: Minimalist web application framework
- **PostgreSQL**: Relational database management system
- **pg**: Non-blocking PostgreSQL client for Node.js

### Templating
- **EJS**: Embedded JavaScript templating

### Frontend
- **Vanilla HTML/CSS/JavaScript**: No frontend frameworks

### Security
- **Helmet**: Security headers middleware
- **express-session**: Session management
- **csurf**: CSRF protection
- **Parameterized queries**: SQL injection prevention

### Development Tools
- **ESLint**: JavaScript linter
- **Prettier**: Code formatter
- **Nodemon**: Auto-restart development server
- **dotenv**: Environment variable management

## Architecture Pattern: MVC

This application follows the **Model-View-Controller (MVC)** pattern:

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│            Express App              │
│  ┌───────────────────────────────┐  │
│  │         Middleware            │  │
│  │  - Helmet (Security)          │  │
│  │  - Sessions                   │  │
│  │  - CSRF Protection            │  │
│  │  - Body Parser                │  │
│  │  - Static Files               │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │          Routes               │  │
│  │  - Define URL patterns        │  │
│  │  - Map to controllers         │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │        Controllers            │  │
│  │  - Handle requests            │  │
│  │  - Business logic             │  │
│  │  - Call models                │  │
│  │  - Render views               │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │          Models               │  │
│  │  - Database operations        │  │
│  │  - Data validation            │  │
│  │  - Business rules             │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │          Views (EJS)          │  │
│  │  - HTML templates             │  │
│  │  - Dynamic content            │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
              │
              ▼
       ┌────────────┐
       │ PostgreSQL │
       └────────────┘
```

### Components

#### 1. Models (src/models/)

Models handle data and business logic:
- Interact with the database
- Perform CRUD operations
- Validate data
- Implement business rules

Example:
```javascript
// src/models/User.js
static async findById(id) {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await db.query(query, [id]);
  return result.rows[0];
}
```

#### 2. Views (src/views/)

Views are EJS templates that generate HTML:
- Present data to users
- Include dynamic content
- Can be composed (layouts, partials)

Example:
```html
<!-- src/views/index.ejs -->
<h1><%= title %></h1>
<p>Welcome, <%= user.name %>!</p>
```

#### 3. Controllers (src/controllers/)

Controllers handle request/response logic:
- Process incoming requests
- Call appropriate models
- Prepare data for views
- Send responses

Example:
```javascript
// src/controllers/userController.js
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render('profile', { user });
  } catch (error) {
    next(error);
  }
};
```

#### 4. Routes (src/routes/)

Routes map URLs to controller functions:
- Define URL patterns
- Specify HTTP methods
- Apply middleware

Example:
```javascript
// src/routes/users.js
router.get('/profile', userController.getProfile);
router.post('/update', csrfProtection, userController.updateProfile);
```

## Request Flow

1. **Client Request**: Browser sends HTTP request
2. **Express Middleware**: Request passes through middleware chain
   - Helmet sets security headers
   - Sessions are loaded
   - Body is parsed
   - CSRF token is validated
3. **Routing**: Express matches URL to route
4. **Controller**: Route calls controller function
5. **Model**: Controller calls model methods
6. **Database**: Model queries PostgreSQL
7. **View**: Controller renders EJS template with data
8. **Response**: HTML is sent back to client

## Security Architecture

### 1. Helmet
Sets HTTP headers to protect against common vulnerabilities:
- XSS protection
- Content Security Policy
- MIME type sniffing prevention

### 2. Sessions
- Secure session cookies
- HttpOnly flag (prevents JavaScript access)
- Secure flag in production (HTTPS only)
- Session secret from environment variable

### 3. CSRF Protection
- Tokens generated per session
- Validated on form submissions
- Prevents cross-site request forgery attacks

### 4. SQL Injection Prevention
- Parameterized queries ($1, $2, etc.)
- Never concatenate user input into SQL
- Database escaping handled by pg library

Example:
```javascript
// ❌ Vulnerable to SQL injection
const result = await db.query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ Protected with parameterized query
const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
```

## Database Architecture

### Connection Pool
- Uses pg Pool for connection management
- Configurable pool size
- Automatic connection recycling
- Error handling and recovery

### Migrations
- SQL-based migrations
- Version controlled
- Run in order (001_, 002_, etc.)
- Idempotent (can be run multiple times safely)

### Models
- One model per database table
- Static methods for queries
- Parameterized queries for security
- Returns JavaScript objects

## Error Handling

### Error Flow
1. Error occurs in controller/model
2. Error passed to `next(error)`
3. Express error middleware catches it
4. Error logged (in development)
5. Error page rendered

### Error Middleware
```javascript
app.use((err, req, res, next) => {
  // Log error
  console.error(err.stack);
  
  // Render error page
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});
```

## Static Files

Static files (CSS, JavaScript, images) are served from `src/public/`:
- Accessible at root URL (e.g., `/css/style.css`)
- No server-side processing
- Cached by browsers

## Environment Configuration

Environment variables (`.env`) configure:
- Server port
- Database connection
- Session secret
- Node environment (development/production)

Never commit `.env` to version control!

## Development vs Production

### Development
- Detailed error messages
- Auto-reload with nodemon
- Less strict security (for debugging)

### Production
- Generic error messages
- No auto-reload
- Strict security (HTTPS, secure cookies)
- Environment-specific optimizations

## Best Practices

1. **Separation of Concerns**: Keep models, views, and controllers separate
2. **DRY (Don't Repeat Yourself)**: Reuse code, create utility functions
3. **Security First**: Always validate input, use parameterized queries
4. **Error Handling**: Always handle errors gracefully
5. **Environment Variables**: Never hardcode secrets
6. **Code Style**: Follow ESLint and Prettier rules
7. **Comments**: Document complex logic and public APIs

## Extending the Application

To add new features:

1. **Create Model** (if needed): `src/models/YourModel.js`
2. **Create Routes**: `src/routes/yourRoutes.js`
3. **Create Controller**: `src/controllers/yourController.js`
4. **Create Views**: `src/views/your-view.ejs`
5. **Create Migration**: `db/migrations/00X_your_migration.sql`
6. **Register Routes**: Import and use in `src/app.js`

## Resources

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
