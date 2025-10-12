/**
 * Database Reset Script
 *
 * This script drops all tables and re-runs migrations and seeds.
 * WARNING: This will delete all data in the database!
 *
 * Usage: npm run reset
 */

require('dotenv').config();
const { execSync } = require('child_process');
const readline = require('readline');
const db = require('../src/models/db');

async function resetDatabase() {
  console.log('⚠️  WARNING: This will delete all data in the database!');

  // Ask for confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    'Are you sure you want to continue? (yes/no): ',
    async (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log('Database reset cancelled.');
        rl.close();
        await db.pool.end();
        return;
      }

      try {
        console.log('Dropping all tables...');

        // Get all table names
        const result = await db.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
      `);

        // Drop each table
        for (const row of result.rows) {
          console.log(`Dropping table: ${row.tablename}`);
          await db.query(`DROP TABLE IF EXISTS ${row.tablename} CASCADE`);
        }

        console.log('All tables dropped successfully!');
        await db.pool.end();

        // Run migrations
        console.log('\nRunning migrations...');
        execSync('npm run migrate', { stdio: 'inherit' });

        // Run seeds
        console.log('\nRunning seeds...');
        execSync('npm run seed', { stdio: 'inherit' });

        console.log('\n✓ Database reset completed successfully!');
      } catch (error) {
        console.error('Database reset failed:', error);
        process.exit(1);
      } finally {
        rl.close();
      }
    }
  );
}

// Run reset
resetDatabase();
