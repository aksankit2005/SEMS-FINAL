-- PostgreSQL Schema for SEMS Sports Management PR Gallery System

-- Drop tables if exists for clean migrations
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS pr_users CASCADE;
DROP TABLE IF EXISTS college_head_users CASCADE;

-- PR Users / Coordinators Table
CREATE TABLE pr_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'pr_coordinator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- College Head Sports Faculty Users Table
CREATE TABLE college_head_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  college VARCHAR(100) NOT NULL,
  faculty_name VARCHAR(150) NOT NULL,
  role VARCHAR(50) DEFAULT 'college_head',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  cover_image TEXT NOT NULL,
  public_id VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Media Table (Photos & Videos)
CREATE TABLE media (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  media_url TEXT NOT NULL,
  public_id VARCHAR(255),
  uploaded_by VARCHAR(255) DEFAULT 'PR Coordinator',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Default PR Coordinator Credentials
-- Default credentials: Username: pr_admin | Password: password123
INSERT INTO pr_users (username, password_hash, role) 
VALUES ('pr_admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'pr_coordinator')
ON CONFLICT (username) DO NOTHING;



-- Sport Coordinators Table
CREATE TABLE IF NOT EXISTS sport_coordinators (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  assigned_sport VARCHAR(50) NOT NULL,
  sport_name VARCHAR(100) NOT NULL,
  coordinator_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  role VARCHAR(50) DEFAULT 'sport_coordinator',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Default Sport Coordinators
INSERT INTO sport_coordinators (username, password_hash, assigned_sport, sport_name, coordinator_name, email) VALUES
('coord_cricket', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'cricket', 'Cricket', 'Vikramaditya Sharma', 'cricket.coord@sems.edu'),
('coord_table_tennis', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'table-tennis', 'Table Tennis', 'Rohan Mehta', 'tt.coord@sems.edu'),
('coord_badminton', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'badminton', 'Badminton', 'Pooja Deshmukh', 'badminton.coord@sems.edu'),
('coord_chess', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'chess', 'Chess', 'Grandmaster Anand Verma', 'chess.coord@sems.edu'),
('coord_football', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'football', 'Football', 'Carlos Rodriguez', 'football.coord@sems.edu'),
('coord_basketball', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'basketball', 'Basketball', 'Michael Jordan Singh', 'basketball.coord@sems.edu'),
('coord_volleyball', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'volleyball', 'Volleyball', 'Siddharth Rao', 'volleyball.coord@sems.edu'),
('coord_kabaddi', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'kabaddi', 'Kabaddi', 'Pradeep Narwal Kumar', 'kabaddi.coord@sems.edu'),
('coord_kho_kho', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'kho-kho', 'Kho-Kho', 'Sunita Jadhav', 'khokho.coord@sems.edu'),
('coord_athletics', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'athletics', 'Athletics', 'PT Usha Pillai', 'athletics.coord@sems.edu'),
('coord_tug_of_war', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'tug-of-war', 'Tug of War', 'Bheem Singh Power', 'tugofwar.coord@sems.edu'),
('coord_gully_cricket', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'gully-cricket', 'Gully Cricket', 'Chiku Bhai', 'gullycricket.coord@sems.edu')
ON CONFLICT (username) DO NOTHING;

-- Seed Initial Default College Head Users
INSERT INTO college_head_users (username, password_hash, college, faculty_name) VALUES
('head_mpec', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'MPEC', 'Dr. Rajesh Sharma'),
('head_mips', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'MIPS', 'Prof. Anita Verma'),
('head_mpcps', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'MPCPS (KN142)', 'Dr. Vikram Singh'),
('head_mpcp', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'MPCP', 'Prof. Sunita Gupta'),
('head_mpdc', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'MPDC', 'Dr. Rakesh Trivedi'),
('head_mpcnps', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'MPCN&PS', 'Prof. Meenakshi Joshi'),
('head_mpamc', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'MPAMC', 'Dr. Alok Pandey'),
('head_mpcams', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'MPCAMS', 'Prof. Sanjay Saxena')
ON CONFLICT (username) DO NOTHING;


