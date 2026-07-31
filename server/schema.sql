-- PostgreSQL Schema for SEMS Sports Management PR Gallery System

-- Drop tables if exists for clean migrations
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS pr_users CASCADE;

-- PR Users / Coordinators Table
CREATE TABLE pr_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'pr_coordinator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  cover_image TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Media Table (Photos & Videos)
CREATE TABLE media (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
  title VARCHAR(255) NOT NULL,
  media_url TEXT NOT NULL,
  uploaded_by VARCHAR(255) DEFAULT 'PR Coordinator',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Default PR Coordinator Credentials
-- Default credentials: Username: pr_admin | Password: password123
INSERT INTO pr_users (username, password_hash, role) 
VALUES ('pr_admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6', 'pr_coordinator')
ON CONFLICT (username) DO NOTHING;

-- Seed Sample Event Data
INSERT INTO events (event_name, event_date, cover_image, description) VALUES
('Football Championship 2026', '2026-07-29', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80', 'High-octane inter-college football tournament finals featuring top varsity teams.'),
('Cricket Tournament 2026', '2026-07-30', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80', 'T20 inter-college cricket championship matches held at the Central Varsity Grounds.'),
('Basketball League 2026', '2026-07-31', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80', 'Indoor stadium basketball league finals showcasing electrifying dunks and clutch plays.'),
('Athletics Meet 2026', '2026-08-01', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80', 'Track and field events including 100m sprint, long jump, shotput, and 4x100m relay.');

-- Seed Sample Media Data
INSERT INTO media (event_id, media_type, title, media_url, uploaded_by) VALUES
(1, 'image', 'Football Championship Winning Goal Action', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80', 'PR Coordinator'),
(1, 'image', 'Team Trophy Celebration', 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80', 'PR Coordinator'),
(1, 'video', 'Football Finals Highlight Reel', 'https://www.w3schools.com/html/mov_bbb.mp4', 'PR Coordinator'),
(2, 'image', 'Batter Hitting Boundary Six', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80', 'PR Coordinator'),
(2, 'video', 'Cricket Final Overs Thriller Match Video', 'https://www.w3schools.com/html/movie.mp4', 'PR Coordinator'),
(3, 'image', 'Buzzer Beater Slam Dunk', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80', 'PR Coordinator'),
(4, 'image', '100m Sprint Finish Line Photo', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80', 'PR Coordinator');
