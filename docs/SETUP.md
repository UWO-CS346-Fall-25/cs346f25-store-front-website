# Setup Guide

This guide will help you set up the CS346 project template on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js 20 or later**: [Download Node.js](https://nodejs.org/)
- **PostgreSQL**: [Download PostgreSQL](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)
- **Git**: [Download Git](https://git-scm.com/)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd cs346-semester-project-template
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`:
- Express 4
- EJS
- Helmet
- express-session
- csurf
- pg (PostgreSQL client)
- dotenv
- ESLint
- Prettier
- Nodemon

### 3. Set Up PostgreSQL Database

#### Create a Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create a new database
CREATE DATABASE your_database_name;

# Create a user (optional but recommended)
CREATE USER your_database_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_database_user;

# Exit psql
\q
```

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and update the values:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# Session Configuration
SESSION_SECRET=your-secret-key-change-this-in-production
```

**Important**: 
- Never commit the `.env` file to version control
- Use a strong, random string for `SESSION_SECRET` in production
- Keep your database credentials secure

### 5. Run Database Migrations

Create the database tables:

```bash
npm run migrate
```

This will execute all SQL files in `db/migrations/` in order.

### 6. Seed the Database (Optional)

Populate the database with sample data:

```bash
npm run seed
```

This will execute all SQL files in `db/seeds/` in order.

### 7. Start the Application

#### Development Mode (with auto-reload)

```bash
npm run dev
```

This uses nodemon to automatically restart the server when you make changes.

#### Production Mode

```bash
npm start
```

### 8. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

You should see the home page of the application.

## Troubleshooting

### Database Connection Issues

If you can't connect to the database:

1. Check that PostgreSQL is running:
   ```bash
   # On Linux/Mac
   sudo service postgresql status
   
   # On Mac with Homebrew
   brew services list
   ```

2. Verify your `.env` credentials match your PostgreSQL configuration

3. Make sure the database exists:
   ```bash
   psql -U postgres -c "\l"
   ```

### Port Already in Use

If port 3000 is already in use:

1. Change the `PORT` in your `.env` file
2. Or stop the process using port 3000:
   ```bash
   # On Linux/Mac
   lsof -ti:3000 | xargs kill -9
   
   # On Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

### Migration Errors

If migrations fail:

1. Check the SQL syntax in your migration files
2. Verify database connection settings
3. Make sure the database user has proper permissions
4. Try resetting the database: `npm run reset` (WARNING: This deletes all data!)

### CSRF Token Errors

If you get CSRF token errors:

1. Make sure you're including the CSRF token in your forms:
   ```html
   <input type="hidden" name="_csrf" value="<%= csrfToken %>">
   ```

2. Verify that session middleware is configured before CSRF middleware in `app.js`

## Development Workflow

1. Make changes to your code
2. The server will automatically reload (in dev mode)
3. Run linter: `npm run lint`
4. Format code: `npm run format`
5. Test your changes
6. Commit your changes

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the project structure
- Explore the code in `src/` directory
- Create your own routes, controllers, and models
- Build your application features!

## Additional Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [EJS Documentation](https://ejs.co/#docs)
