-- ============================================================
--  E-SPORTS MANAGEMENT SYSTEM — COMPLETE DATABASE SCHEMA
<<<<<<< HEAD
--  Fixed for all MySQL versions (5.7, 8.0)
-- ============================================================

SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

=======
--  Includes: DDL, DML, Views, Triggers, Cursors, Transactions
-- ============================================================

>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
DROP DATABASE IF EXISTS esports_db;
CREATE DATABASE esports_db;
USE esports_db;

-- ============================================================
<<<<<<< HEAD
--  DDL — TABLE CREATION
-- ============================================================

=======
--  DDL — TABLE CREATION (3NF Normalized)
-- ============================================================

-- PLAYER TABLE
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
CREATE TABLE Player (
    player_id    INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    username     VARCHAR(50)  NOT NULL UNIQUE,
    email        VARCHAR(100) NOT NULL UNIQUE,
<<<<<<< HEAD
    phone        CHAR(10),
    age          INT,
    country      VARCHAR(50)  DEFAULT 'India',
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

=======
    phone        CHAR(10)     CHECK (phone REGEXP '^[0-9]{10}$'),
    age          INT          CHECK (age >= 13 AND age <= 60),
    country      VARCHAR(50)  DEFAULT 'Unknown',
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- TEAM TABLE
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
CREATE TABLE Team (
    team_id      INT AUTO_INCREMENT PRIMARY KEY,
    team_name    VARCHAR(100) NOT NULL UNIQUE,
    captain_id   INT,
    logo_url     VARCHAR(255),
<<<<<<< HEAD
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (captain_id) REFERENCES Player(player_id) ON DELETE SET NULL
);

CREATE TABLE Team_Members (
    team_id      INT NOT NULL,
    player_id    INT NOT NULL,
    joined_date  DATE,
    role         VARCHAR(50) DEFAULT 'Member',
    PRIMARY KEY (team_id, player_id),
    FOREIGN KEY (team_id)   REFERENCES Team(team_id)     ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES Player(player_id) ON DELETE CASCADE
);

CREATE TABLE Sponsor (
    sponsor_id    INT AUTO_INCREMENT PRIMARY KEY,
    sponsor_name  VARCHAR(100) NOT NULL,
    industry      VARCHAR(100),
    contact_email VARCHAR(100),
    amount        DECIMAL(12,2) DEFAULT 0.00
);

=======
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (captain_id) REFERENCES Player(player_id)
        ON DELETE SET NULL
);

-- TEAM MEMBERS (M:N between Player and Team)
CREATE TABLE Team_Members (
    team_id      INT NOT NULL,
    player_id    INT NOT NULL,
    joined_date  DATE DEFAULT (CURRENT_DATE),
    role         VARCHAR(50) DEFAULT 'Member',
    PRIMARY KEY (team_id, player_id),
    FOREIGN KEY (team_id)   REFERENCES Team(team_id)   ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES Player(player_id) ON DELETE CASCADE
);

-- SPONSOR TABLE
CREATE TABLE Sponsor (
    sponsor_id   INT AUTO_INCREMENT PRIMARY KEY,
    sponsor_name VARCHAR(100) NOT NULL,
    industry     VARCHAR(100),
    contact_email VARCHAR(100),
    amount       DECIMAL(12,2) CHECK (amount >= 0)
);

-- TOURNAMENT TABLE
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
CREATE TABLE Tournament (
    tournament_id   INT AUTO_INCREMENT PRIMARY KEY,
    tournament_name VARCHAR(150) NOT NULL,
    game_name       VARCHAR(100) NOT NULL,
<<<<<<< HEAD
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    prize_pool      DECIMAL(12,2) DEFAULT 0.00,
    sponsor_id      INT,
    status          ENUM('Upcoming','Ongoing','Completed') DEFAULT 'Upcoming',
    FOREIGN KEY (sponsor_id) REFERENCES Sponsor(sponsor_id) ON DELETE SET NULL
);

CREATE TABLE Registration (
    reg_id        INT AUTO_INCREMENT PRIMARY KEY,
    team_id       INT NOT NULL,
    tournament_id INT NOT NULL,
    reg_date      DATE,
    status        ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    UNIQUE KEY unique_reg (team_id, tournament_id),
    FOREIGN KEY (team_id)       REFERENCES Team(team_id)            ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id) ON DELETE CASCADE
);

CREATE TABLE Matches (
    match_id      INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    team1_id      INT NOT NULL,
    team2_id      INT NOT NULL,
    scheduled_at  DATETIME NOT NULL,
    venue         VARCHAR(100) DEFAULT 'Online',
    round         VARCHAR(50)  DEFAULT 'Group Stage',
    status        ENUM('Scheduled','Live','Completed') DEFAULT 'Scheduled',
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (team1_id)      REFERENCES Team(team_id),
    FOREIGN KEY (team2_id)      REFERENCES Team(team_id)
);

CREATE TABLE Match_Result (
    result_id      INT AUTO_INCREMENT PRIMARY KEY,
    match_id       INT NOT NULL UNIQUE,
    winner_team_id INT NOT NULL,
    loser_team_id  INT NOT NULL,
    score          VARCHAR(20),
    recorded_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id)       REFERENCES Matches(match_id) ON DELETE CASCADE,
=======
    start_date      DATE         NOT NULL,
    end_date        DATE         NOT NULL,
    prize_pool      DECIMAL(12,2) DEFAULT 0.00,
    sponsor_id      INT,
    status          ENUM('Upcoming','Ongoing','Completed') DEFAULT 'Upcoming',
    FOREIGN KEY (sponsor_id) REFERENCES Sponsor(sponsor_id) ON DELETE SET NULL,
    CHECK (end_date >= start_date)
);

-- REGISTRATION (Team registers for Tournament — M:N)
CREATE TABLE Registration (
    reg_id          INT AUTO_INCREMENT PRIMARY KEY,
    team_id         INT NOT NULL,
    tournament_id   INT NOT NULL,
    reg_date        DATE DEFAULT (CURRENT_DATE),
    status          ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    UNIQUE KEY unique_reg (team_id, tournament_id),
    FOREIGN KEY (team_id)        REFERENCES Team(team_id)       ON DELETE CASCADE,
    FOREIGN KEY (tournament_id)  REFERENCES Tournament(tournament_id) ON DELETE CASCADE
);

-- MATCH TABLE
CREATE TABLE Matches (
    match_id        INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id   INT NOT NULL,
    team1_id        INT NOT NULL,
    team2_id        INT NOT NULL,
    scheduled_at    DATETIME NOT NULL,
    venue           VARCHAR(100) DEFAULT 'Online',
    round           VARCHAR(50)  DEFAULT 'Group Stage',
    status          ENUM('Scheduled','Live','Completed') DEFAULT 'Scheduled',
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (team1_id)      REFERENCES Team(team_id),
    FOREIGN KEY (team2_id)      REFERENCES Team(team_id),
    CHECK (team1_id <> team2_id)
);

-- MATCH RESULT (1:1 with Match)
CREATE TABLE Match_Result (
    result_id       INT AUTO_INCREMENT PRIMARY KEY,
    match_id        INT NOT NULL UNIQUE,
    winner_team_id  INT NOT NULL,
    loser_team_id   INT NOT NULL,
    score           VARCHAR(20),
    recorded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id)       REFERENCES Matches(match_id)  ON DELETE CASCADE,
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
    FOREIGN KEY (winner_team_id) REFERENCES Team(team_id),
    FOREIGN KEY (loser_team_id)  REFERENCES Team(team_id)
);

<<<<<<< HEAD
CREATE TABLE Ranking (
    ranking_id    INT AUTO_INCREMENT PRIMARY KEY,
    team_id       INT NOT NULL UNIQUE,
    tournament_id INT NOT NULL,
    points        INT DEFAULT 0,
    wins          INT DEFAULT 0,
    losses        INT DEFAULT 0,
    rank_position INT DEFAULT 0,
    FOREIGN KEY (team_id)       REFERENCES Team(team_id)            ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id) ON DELETE CASCADE
);

CREATE TABLE Reward (
    reward_id     INT AUTO_INCREMENT PRIMARY KEY,
    team_id       INT NOT NULL,
    tournament_id INT NOT NULL,
    reward_type   ENUM('Gold','Silver','Bronze','Participation') DEFAULT 'Participation',
    prize_amount  DECIMAL(10,2) DEFAULT 0.00,
    awarded_on    DATE,
    FOREIGN KEY (team_id)       REFERENCES Team(team_id)            ON DELETE CASCADE,
=======
-- RANKING TABLE
CREATE TABLE Ranking (
    ranking_id      INT AUTO_INCREMENT PRIMARY KEY,
    team_id         INT NOT NULL UNIQUE,
    tournament_id   INT NOT NULL,
    points          INT     DEFAULT 0,
    wins            INT     DEFAULT 0,
    losses          INT     DEFAULT 0,
    rank_position   INT,
    FOREIGN KEY (team_id)       REFERENCES Team(team_id)       ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id) ON DELETE CASCADE
);

-- REWARD TABLE
CREATE TABLE Reward (
    reward_id       INT AUTO_INCREMENT PRIMARY KEY,
    team_id         INT NOT NULL,
    tournament_id   INT NOT NULL,
    reward_type     ENUM('Gold','Silver','Bronze','Participation') DEFAULT 'Participation',
    prize_amount    DECIMAL(10,2) DEFAULT 0.00,
    awarded_on      DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (team_id)       REFERENCES Team(team_id)       ON DELETE CASCADE,
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id) ON DELETE CASCADE
);

-- ============================================================
<<<<<<< HEAD
--  DML — SAMPLE DATA
-- ============================================================

=======
--  DML — SAMPLE DATA (10 Players, 5 Teams, 2 Tournaments…)
-- ============================================================

-- Players
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
INSERT INTO Player (name, username, email, phone, age, country) VALUES
('Rahul Sharma',   'rahulOP',    'rahul@gmail.com',   '9876543210', 22, 'India'),
('Priya Menon',    'priyaX',     'priya@gmail.com',   '9876543211', 20, 'India'),
('Arjun Patel',    'arjun99',    'arjun@gmail.com',   '9876543212', 21, 'India'),
('Sneha Rao',      'snehafire',  'sneha@gmail.com',   '9876543213', 19, 'India'),
('Vikram Singh',   'vikramGG',   'vikram@gmail.com',  '9876543214', 23, 'India'),
('Ananya Das',     'ananyaPro',  'ananya@gmail.com',  '9876543215', 20, 'India'),
('Rohan Kapoor',   'rohanK',     'rohan@gmail.com',   '9876543216', 24, 'India'),
('Meera Iyer',     'meeraIYR',   'meera@gmail.com',   '9876543217', 21, 'India'),
('Karan Malhotra', 'karanM',     'karan@gmail.com',   '9876543218', 22, 'India'),
('Divya Nair',     'divyaN',     'divya@gmail.com',   '9876543219', 20, 'India');

<<<<<<< HEAD
INSERT INTO Team (team_name, captain_id) VALUES
('Phantom Strike', 1),
('Nova Blaze',     3),
('Iron Wolves',    5),
('Shadow Clan',    7),
('Cyber Knights',  9);

INSERT INTO Team_Members (team_id, player_id, role, joined_date) VALUES
(1, 1, 'Captain', '2026-01-01'), (1, 2, 'Support',  '2026-01-01'),
(2, 3, 'Captain', '2026-01-01'), (2, 4, 'Fragger',  '2026-01-01'),
(3, 5, 'Captain', '2026-01-01'), (3, 6, 'IGL',      '2026-01-01'),
(4, 7, 'Captain', '2026-01-01'), (4, 8, 'Sniper',   '2026-01-01'),
(5, 9, 'Captain', '2026-01-01'), (5, 10, 'Support', '2026-01-01');

INSERT INTO Sponsor (sponsor_name, industry, contact_email, amount) VALUES
('TechArena', 'Technology', 'contact@techarena.com', 500000.00),
('GameFuel',  'Beverages',  'info@gamefuel.com',     250000.00),
('NeoGear',   'Hardware',   'sponsor@neogear.com',   750000.00);

INSERT INTO Tournament (tournament_name, game_name, start_date, end_date, prize_pool, sponsor_id, status) VALUES
('India Clash Championship', 'VALORANT', '2026-03-01', '2026-03-20', 1000000.00, 1, 'Ongoing'),
('South Asia Open Cup',      'BGMI',     '2026-04-10', '2026-04-30',  500000.00, 2, 'Upcoming');

=======
-- Teams (captain set after insert since IDs are auto-increment)
INSERT INTO Team (team_name, captain_id) VALUES
('Phantom Strike',   1),
('Nova Blaze',       3),
('Iron Wolves',      5),
('Shadow Clan',      7),
('Cyber Knights',    9);

-- Team Members (each team gets 2 players)
INSERT INTO Team_Members (team_id, player_id, role) VALUES
(1, 1, 'Captain'), (1, 2, 'Support'),
(2, 3, 'Captain'), (2, 4, 'Fragger'),
(3, 5, 'Captain'), (3, 6, 'IGL'),
(4, 7, 'Captain'), (4, 8, 'Sniper'),
(5, 9, 'Captain'), (5, 10, 'Support');

-- Sponsors
INSERT INTO Sponsor (sponsor_name, industry, contact_email, amount) VALUES
('TechArena',    'Technology',  'contact@techarena.com',  500000.00),
('GameFuel',     'Beverages',   'info@gamefuel.com',      250000.00),
('NeoGear',      'Hardware',    'sponsor@neogear.com',    750000.00);

-- Tournaments
INSERT INTO Tournament (tournament_name, game_name, start_date, end_date, prize_pool, sponsor_id, status) VALUES
('India Clash Championship', 'VALORANT', '2026-03-01', '2026-03-20', 1000000.00, 1, 'Ongoing'),
('South Asia Open Cup',      'BGMI',     '2026-04-10', '2026-04-30', 500000.00,  2, 'Upcoming');

-- Registrations
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
INSERT INTO Registration (team_id, tournament_id, reg_date, status) VALUES
(1, 1, '2026-02-15', 'Approved'),
(2, 1, '2026-02-16', 'Approved'),
(3, 1, '2026-02-17', 'Approved'),
(4, 1, '2026-02-18', 'Approved'),
(5, 1, '2026-02-19', 'Approved'),
(1, 2, '2026-03-25', 'Pending'),
(2, 2, '2026-03-25', 'Pending');

<<<<<<< HEAD
INSERT INTO Matches (tournament_id, team1_id, team2_id, scheduled_at, venue, round, status) VALUES
(1, 1, 2, '2026-03-03 18:00:00', 'Online Arena',      'Group Stage',  'Completed'),
(1, 3, 4, '2026-03-03 20:00:00', 'Online Arena',      'Group Stage',  'Completed'),
(1, 5, 1, '2026-03-05 18:00:00', 'Online Arena',      'Group Stage',  'Completed'),
(1, 2, 3, '2026-03-05 20:00:00', 'Online Arena',      'Group Stage',  'Completed'),
(1, 4, 5, '2026-03-07 18:00:00', 'Online Arena',      'Group Stage',  'Completed'),
(1, 1, 3, '2026-03-10 18:00:00', 'Hyderabad LAN',     'Quarter Final','Completed'),
(1, 2, 4, '2026-03-10 20:00:00', 'Hyderabad LAN',     'Quarter Final','Completed'),
(1, 5, 2, '2026-03-12 18:00:00', 'Hyderabad LAN',     'Semi Final',   'Completed'),
(1, 1, 4, '2026-03-12 20:00:00', 'Hyderabad LAN',     'Semi Final',   'Scheduled'),
(1, 1, 2, '2026-03-20 18:00:00', 'Mumbai Grand Arena','Final',        'Scheduled');

INSERT INTO Ranking (team_id, tournament_id, points, wins, losses, rank_position) VALUES
(1, 1, 9, 3, 0, 1),
(2, 1, 6, 2, 1, 2),
(3, 1, 6, 2, 1, 3),
(4, 1, 0, 0, 3, 5),
(5, 1, 3, 1, 2, 4);

INSERT INTO Reward (team_id, tournament_id, reward_type, prize_amount, awarded_on) VALUES
(1, 1, 'Gold',          500000.00, '2026-03-20'),
(2, 1, 'Silver',        300000.00, '2026-03-20'),
(3, 1, 'Bronze',        200000.00, '2026-03-20'),
(5, 1, 'Participation',  10000.00, '2026-03-20');

-- ============================================================
--  MATCH RESULTS (inserted after ranking to avoid trigger issues)
-- ============================================================

=======
-- Matches
INSERT INTO Matches (tournament_id, team1_id, team2_id, scheduled_at, venue, round, status) VALUES
(1, 1, 2, '2026-03-03 18:00:00', 'Online Arena', 'Group Stage', 'Completed'),
(1, 3, 4, '2026-03-03 20:00:00', 'Online Arena', 'Group Stage', 'Completed'),
(1, 5, 1, '2026-03-05 18:00:00', 'Online Arena', 'Group Stage', 'Completed'),
(1, 2, 3, '2026-03-05 20:00:00', 'Online Arena', 'Group Stage', 'Completed'),
(1, 4, 5, '2026-03-07 18:00:00', 'Online Arena', 'Group Stage', 'Completed'),
(1, 1, 3, '2026-03-10 18:00:00', 'Hyderabad LAN', 'Quarter Final', 'Completed'),
(1, 2, 4, '2026-03-10 20:00:00', 'Hyderabad LAN', 'Quarter Final', 'Completed'),
(1, 5, 2, '2026-03-12 18:00:00', 'Hyderabad LAN', 'Semi Final', 'Completed'),
(1, 1, 4, '2026-03-12 20:00:00', 'Hyderabad LAN', 'Semi Final', 'Scheduled'),
(1, 1, 2, '2026-03-20 18:00:00', 'Mumbai Grand Arena', 'Final', 'Scheduled');

-- Match Results (for completed matches)
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
INSERT INTO Match_Result (match_id, winner_team_id, loser_team_id, score) VALUES
(1, 1, 2, '13-8'),
(2, 3, 4, '13-10'),
(3, 1, 5, '13-5'),
(4, 3, 2, '13-11'),
(5, 5, 4, '13-9'),
(6, 1, 3, '13-7'),
(7, 2, 4, '13-6'),
(8, 2, 5, '13-4');

<<<<<<< HEAD
=======
-- Ranking (initial — trigger will keep it updated)
INSERT INTO Ranking (team_id, tournament_id, points, wins, losses) VALUES
(1, 1, 9, 3, 0),
(2, 1, 6, 2, 1),
(3, 1, 6, 2, 1),
(4, 1, 0, 0, 3),
(5, 1, 3, 1, 2);

-- Rewards
INSERT INTO Reward (team_id, tournament_id, reward_type, prize_amount) VALUES
(1, 1, 'Gold',          500000.00),
(2, 1, 'Silver',        300000.00),
(3, 1, 'Bronze',        200000.00),
(5, 1, 'Participation',  10000.00);

>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
-- ============================================================
--  VIEWS
-- ============================================================

CREATE OR REPLACE VIEW leaderboard AS
SELECT
    r.rank_position,
    t.team_name,
    r.points,
    r.wins,
    r.losses,
    tn.tournament_name
FROM Ranking r
<<<<<<< HEAD
JOIN Team t        ON r.team_id       = t.team_id
=======
JOIN Team       t  ON r.team_id       = t.team_id
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
JOIN Tournament tn ON r.tournament_id = tn.tournament_id
ORDER BY r.points DESC, r.wins DESC;

CREATE OR REPLACE VIEW match_schedule AS
SELECT
    m.match_id,
    t1.team_name AS team1,
    t2.team_name AS team2,
    tn.tournament_name,
    m.scheduled_at,
    m.venue,
    m.round,
    m.status
FROM Matches m
<<<<<<< HEAD
JOIN Team t1       ON m.team1_id      = t1.team_id
JOIN Team t2       ON m.team2_id      = t2.team_id
=======
JOIN Team       t1 ON m.team1_id      = t1.team_id
JOIN Team       t2 ON m.team2_id      = t2.team_id
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
JOIN Tournament tn ON m.tournament_id = tn.tournament_id
ORDER BY m.scheduled_at;

CREATE OR REPLACE VIEW player_team_view AS
SELECT
    p.player_id,
<<<<<<< HEAD
    p.name     AS player_name,
=======
    p.name        AS player_name,
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
    p.username,
    p.country,
    t.team_name,
    tm.role
FROM Player p
JOIN Team_Members tm ON p.player_id = tm.player_id
<<<<<<< HEAD
JOIN Team t          ON tm.team_id  = t.team_id;
=======
JOIN Team         t  ON tm.team_id  = t.team_id;
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44

-- ============================================================
--  TRIGGERS
-- ============================================================

DELIMITER $$

<<<<<<< HEAD
=======
-- Auto update Ranking after a Match Result is inserted
CREATE TRIGGER trg_update_ranking_after_result
AFTER INSERT ON Match_Result
FOR EACH ROW
BEGIN
    -- Add 3 points to winner
    UPDATE Ranking
    SET points = points + 3,
        wins   = wins   + 1
    WHERE team_id = NEW.winner_team_id;

    -- Increment losses for loser
    UPDATE Ranking
    SET losses = losses + 1
    WHERE team_id = NEW.loser_team_id;

    -- Recalculate rank positions
    SET @rank = 0;
    UPDATE Ranking r
    JOIN (
        SELECT team_id, (@rank := @rank + 1) AS new_rank
        FROM Ranking
        ORDER BY points DESC, wins DESC
    ) ranked ON r.team_id = ranked.team_id
    SET r.rank_position = ranked.new_rank;
END$$

-- Auto update Match status to Completed when result is inserted
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
CREATE TRIGGER trg_update_match_status
AFTER INSERT ON Match_Result
FOR EACH ROW
BEGIN
    UPDATE Matches
    SET status = 'Completed'
    WHERE match_id = NEW.match_id;
END$$

DELIMITER ;

-- ============================================================
--  STORED PROCEDURE WITH CURSOR
-- ============================================================

DELIMITER $$

CREATE PROCEDURE show_team_rankings()
BEGIN
<<<<<<< HEAD
    DECLARE done      INT DEFAULT FALSE;
    DECLARE v_team_id INT;
    DECLARE v_name    VARCHAR(100);
    DECLARE v_points  INT;
=======
    DECLARE done       INT DEFAULT FALSE;
    DECLARE v_team_id  INT;
    DECLARE v_name     VARCHAR(100);
    DECLARE v_points   INT;
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44

    DECLARE team_cursor CURSOR FOR
        SELECT t.team_id, t.team_name, r.points
        FROM Team t JOIN Ranking r ON t.team_id = r.team_id
        ORDER BY r.points DESC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN team_cursor;
<<<<<<< HEAD
=======

>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
    read_loop: LOOP
        FETCH team_cursor INTO v_team_id, v_name, v_points;
        IF done THEN LEAVE read_loop; END IF;
        SELECT v_team_id AS team_id, v_name AS team_name, v_points AS points;
    END LOOP;
<<<<<<< HEAD
=======

>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
    CLOSE team_cursor;
END$$

DELIMITER ;

-- ============================================================
<<<<<<< HEAD
--  TRANSACTIONS DEMO
-- ============================================================

START TRANSACTION;
    UPDATE Matches SET status = 'Scheduled' WHERE match_id = 9;
    SAVEPOINT before_final;
COMMIT;

-- ============================================================
--  ADVANCED QUERIES
=======
--  TRANSACTIONS (Demo)
-- ============================================================

-- Safe match result entry with rollback on error
START TRANSACTION;
    INSERT INTO Match_Result (match_id, winner_team_id, loser_team_id, score)
        VALUES (9, 1, 4, '13-6');
    UPDATE Matches SET status = 'Completed' WHERE match_id = 9;
    SAVEPOINT after_result_9;

    -- Hypothetical error recovery
    -- ROLLBACK TO SAVEPOINT after_result_9;
COMMIT;

-- ============================================================
--  ADVANCED QUERIES (for report / demo)
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
-- ============================================================

-- 1. All players with their team
SELECT p.name, p.username, t.team_name, tm.role
FROM Player p
JOIN Team_Members tm ON p.player_id = tm.player_id
JOIN Team t ON tm.team_id = t.team_id;

<<<<<<< HEAD
-- 2. Total players per country
SELECT country, COUNT(*) AS total_players
FROM Player GROUP BY country ORDER BY total_players DESC;
=======
-- 2. Aggregate: Total players per country
SELECT country, COUNT(*) AS total_players
FROM Player
GROUP BY country
ORDER BY total_players DESC;
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44

-- 3. Teams with more than 1 win
SELECT t.team_name, r.wins, r.points
FROM Team t JOIN Ranking r ON t.team_id = r.team_id
<<<<<<< HEAD
WHERE r.wins > 1 ORDER BY r.wins DESC;

-- 4. Subquery: Teams above average points
=======
WHERE r.wins > 1
ORDER BY r.wins DESC;

-- 4. Subquery: Teams ranked above average points
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
SELECT team_name FROM Team
WHERE team_id IN (
    SELECT team_id FROM Ranking
    WHERE points > (SELECT AVG(points) FROM Ranking)
);

<<<<<<< HEAD
-- 5. Tournament prize pools with sponsor
=======
-- 5. Tournaments and their prize pools with sponsor
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
SELECT tn.tournament_name, tn.prize_pool, s.sponsor_name
FROM Tournament tn
LEFT JOIN Sponsor s ON tn.sponsor_id = s.sponsor_id;

<<<<<<< HEAD
-- 6. UNION example
=======
-- 6. UNION — Players from India OR teams with Gold reward
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
SELECT name AS entity, 'Player' AS type FROM Player WHERE country = 'India'
UNION
SELECT t.team_name, 'Gold Team' FROM Team t
JOIN Reward r ON t.team_id = r.team_id
WHERE r.reward_type = 'Gold';

<<<<<<< HEAD
-- 7. Match results with winner and loser names
SELECT t1.team_name AS winner, t2.team_name AS loser,
       mr.score, m.round, tn.tournament_name
FROM Match_Result mr
JOIN Matches m     ON mr.match_id       = m.match_id
JOIN Team t1       ON mr.winner_team_id = t1.team_id
JOIN Team t2       ON mr.loser_team_id  = t2.team_id
JOIN Tournament tn ON m.tournament_id   = tn.tournament_id;

-- 8. Leaderboard
SELECT * FROM leaderboard;

SET FOREIGN_KEY_CHECKS = 1;
=======
-- 7. Match results with winner/loser names
SELECT
    t1.team_name AS winner,
    t2.team_name AS loser,
    mr.score,
    m.round,
    tn.tournament_name
FROM Match_Result mr
JOIN Matches     m  ON mr.match_id       = m.match_id
JOIN Team        t1 ON mr.winner_team_id = t1.team_id
JOIN Team        t2 ON mr.loser_team_id  = t2.team_id
JOIN Tournament  tn ON m.tournament_id   = tn.tournament_id;

-- 8. Leaderboard View usage
SELECT * FROM leaderboard;

-- 9. Locking for concurrency control
-- SELECT * FROM Ranking WHERE team_id = 1 FOR UPDATE;

-- ============================================================
--  NORMALIZATION NOTE
--  UNF Example:  PlayerTeamTournament(p_id, p_name, t_name,
--                tourn_name, tourn_date, points)
--  1NF: Atomic values, single primary key
--  2NF: Removed partial deps → split Player, Team, Tournament
--  3NF: Removed transitive deps → Ranking separate from Team
-- ============================================================
>>>>>>> ef711a02cd9349a5c4af998dc70ec187d9b48b44
