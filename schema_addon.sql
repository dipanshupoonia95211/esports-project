-- ============================================================
--  E-SPORTS — SCHEMA ADDON (run after schema.sql)
--  Adds: Admin table + default admin account
-- ============================================================

USE esports_db;

-- ── ADMIN TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Admin (
    admin_id    INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,   -- bcrypt hash stored here
    role        ENUM('SuperAdmin','Organizer') DEFAULT 'Organizer',
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── DEFAULT ADMIN ACCOUNT ──────────────────────────────────
-- Username : admin
-- Password : admin123
-- (bcrypt hash of "admin123" with salt rounds = 10)
INSERT INTO Admin (name, username, email, password, role) VALUES
(
  'Super Admin',
  'admin',
  'admin@esports.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- "password" default hash
  'SuperAdmin'
);

-- NOTE: The hash above is a placeholder bcrypt hash.
-- When you first run the server and register via /admin/register,
-- the real bcrypt hash will be stored. 
-- To set a working default admin, run: POST /admin/register with
-- { name:"Super Admin", username:"admin", email:"admin@esports.com",
--   password:"admin123" }
-- OR use the Admin Registration page at http://localhost:3000/admin-register.html

-- ── USEFUL POSITION QUERY (used by /api/position route) ───
-- Find a team's ranking by team name (case-insensitive search)
-- SELECT r.rank_position, t.team_name, r.points, r.wins, r.losses,
--        tn.tournament_name
-- FROM Ranking r
-- JOIN Team t ON r.team_id = t.team_id
-- JOIN Tournament tn ON r.tournament_id = tn.tournament_id
-- WHERE t.team_name LIKE '%search_term%';

-- ── FIND NEXT MATCH FOR A TEAM ─────────────────────────────
-- SELECT m.scheduled_at, m.venue, m.round,
--        t1.team_name AS opponent
-- FROM Matches m
-- JOIN Team t1 ON (
--     CASE WHEN m.team1_id = :team_id THEN m.team2_id ELSE m.team1_id END = t1.team_id
-- )
-- WHERE (m.team1_id = :team_id OR m.team2_id = :team_id)
--   AND m.status = 'Scheduled'
-- ORDER BY m.scheduled_at ASC
-- LIMIT 1;