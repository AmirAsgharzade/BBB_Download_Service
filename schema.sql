
CREATE SCHEMA bbb_schema AUTHORIZATION bbb_user;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_links CASCADE;
-- USERS TABLE
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE,           -- optional, if user signs up with phone
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- e.g. active, inactive, etc.
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  verification_code VARCHAR(20) NOT NULL
);

-- USER LINKS TABLE (history of links sent)
CREATE TABLE user_links (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id)
     ON DELETE CASCADE 
     ON UPDATE CASCADE,
  link TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'in queue',
  video_id UUID DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  video_status VARCHAR(50) NOT NULL DEFAULT 'in queue'
);

-- Optional: Add an index for faster queries on created_at if needed
CREATE INDEX idx_user_links_created_at ON user_links(created_at);

GRANT USAGE ON SCHEMA bbb_schema TO bbb_user;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO bbb_user;
GRANT USAGE, SELECT ON SEQUENCE user_links_id_seq TO bbb_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO bbb_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_links TO bbb_user;

