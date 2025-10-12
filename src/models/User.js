/**
 * User Model
 *
 * This model handles all database operations related to users.
 * Use parameterized queries ($1, $2, etc.) to prevent SQL injection.
 *
 * Example methods:
 * - findAll(): Get all users
 * - findById(id): Get user by ID
 * - findByEmail(email): Get user by email
 * - create(userData): Create a new user
 * - update(id, userData): Update a user
 * - delete(id): Delete a user
 */

const db = require('./db');

class User {
  /**
   * Find all users
   * @returns {Promise<Array>} Array of users
   */
  static async findAll() {
    const query =
      'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<object|null>} User object or null
   */
  static async findById(id) {
    const query =
      'SELECT id, username, email, created_at FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find user by email (including password for authentication)
   * @param {string} email - User email
   * @returns {Promise<object|null>} User object or null
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Create a new user
   * @param {object} userData - User data { username, email, password }
   * @returns {Promise<object>} Created user object
   */
  static async create(userData) {
    const { username, email, password } = userData;
    const query = `
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, created_at
    `;
    const result = await db.query(query, [username, email, password]);
    return result.rows[0];
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {object} userData - User data to update
   * @returns {Promise<object>} Updated user object
   */
  static async update(id, userData) {
    const { username, email } = userData;
    const query = `
      UPDATE users
      SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, username, email, created_at, updated_at
    `;
    const result = await db.query(query, [username, email, id]);
    return result.rows[0];
  }

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
}

module.exports = User;
