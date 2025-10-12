/**
 * Database Migration Script
 *
 * This script runs all migrations in the db/migrations folder.
 * Migrations are used to create and modify database tables.
 *
 * Usage: npm run migrate
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/models/db');

async function runMigrations() {
  console.log('Starting database migrations...');

  try {
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    // Run each migration
    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await db.query(sql);
      console.log(`✓ Migration ${file} completed successfully`);
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await db.pool.end();
  }
}

// Run migrations
runMigrations();
