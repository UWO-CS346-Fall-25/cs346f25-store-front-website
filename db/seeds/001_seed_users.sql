-- Seed: Sample Users
-- Description: Inserts sample user data for development/testing
-- Note: In production, use proper password hashing (bcrypt)

-- Insert sample users
-- Password: 'password123' (In production, this should be hashed with bcrypt)
INSERT INTO users (username, email, password) VALUES
  ('john_doe', 'john@example.com', '$2b$10$YourHashedPasswordHere'),
  ('jane_smith', 'jane@example.com', '$2b$10$YourHashedPasswordHere'),
  ('admin', 'admin@example.com', '$2b$10$YourHashedPasswordHere')
ON CONFLICT (email) DO NOTHING;

-- Note: The passwords above are placeholders.
-- You should:
-- 1. Install bcrypt: npm install bcrypt
-- 2. Hash passwords properly before storing
-- 3. Never commit real passwords to version control
