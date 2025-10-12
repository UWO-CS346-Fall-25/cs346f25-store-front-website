# Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- Node.js 20+ installed
- PostgreSQL installed and running
- Git installed

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and update these values:
# - DB_NAME: your database name
# - DB_USER: your database username
# - DB_PASSWORD: your database password
# - SESSION_SECRET: a random secret string
```

### 3. Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# In psql, create database:
CREATE DATABASE your_database_name;
\q
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Seed Database (Optional)

```bash
npm run seed
```

### 6. Start Server

```bash
# Development mode (auto-reload)
npm run dev

# Or production mode
npm start
```

### 7. Open Browser

Navigate to: http://localhost:3000

## What You Get

- 🏠 **Home Page**: Styled landing page
- 🔒 **Security**: Helmet, CSRF, Sessions
- 🗄️ **Database**: PostgreSQL with connection pooling
- 🎨 **Templates**: EJS templating engine
- 📁 **Structure**: Organized MVC architecture
- 🛠️ **Tools**: ESLint, Prettier, Nodemon

## Next Steps

1. Read `docs/SETUP.md` for detailed instructions
2. Explore `docs/ARCHITECTURE.md` to understand the structure
3. Start building your features!

## Common Commands

```bash
npm run dev          # Start development server
npm run lint         # Check code quality
npm run format       # Format code
npm run migrate      # Run database migrations
npm run seed         # Seed database
npm run reset        # Reset database (WARNING: deletes all data!)
```

## Need Help?

- Check `docs/` folder for detailed documentation
- Read inline comments in the code
- Review example code in controllers and models

## Project Structure

```
src/
  ├── server.js         # Entry point
  ├── app.js            # Express configuration
  ├── routes/           # URL routing
  ├── controllers/      # Request handlers
  ├── models/           # Database operations
  ├── views/            # EJS templates
  └── public/           # Static files (CSS, JS)
db/
  ├── migrations/       # Database schema
  └── seeds/            # Sample data
docs/                   # Documentation
```

Happy coding! 🚀
