SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS esports_db;
CREATE DATABASE esports_db;
USE esports_db;

CREATE TABLE Player (
    player_id  INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    email      VARCHAR(100) NOT NULL UNIQUE,
    phone      CHAR(10),
    age        INT,
    country    VARCHAR(50) DEFAULT 'India',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Team (
    team_id    INT AUTO_INCREMENT PRIMARY KEY,
    team_name  VARCHAR(100) NOT NULL UNIQUE,
    captain_id INT,
    logo_url   VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (captain_id) REFERENCES Player(player_id) ON DELETE SET NULL
);

CREATE TABLE Team_Members (
    team_id     INT NOT NULL,
    player_id   INT NOT NULL,
    joined_date DATE,
    role        VARCHAR(50) DEFAULT 'Member',
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

CREATE TABLE Tournament (
    tournament_id   INT AUTO_INCREMENT PRIMARY KEY,
    tournament_name VARCHAR(150) NOT NULL,
    game_name       VARCHAR(100) NOT NULL,
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
    FOREIGN KEY (team_id)       REFERENCES Team(team_id)             ON DELETE CASCADE,
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
    FOREIGN KEY (winner_team_id) REFERENCES Team(team_id),
    FOREIGN KEY (loser_team_id)  REFERENCES Team(team_id)
);

CREATE TABLE Ranking (
    ranking_id    INT AUTO_INCREMENT PRIMARY KEY,
    team_id       INT NOT NULL UNIQUE,
    tournament_id INT NOT NULL,
    points        INT DEFAULT 0,
    wins          INT DEFAULT 0,
    losses        INT DEFAULT 0,
    rank_position INT DEFAULT 0,
    FOREIGN KEY (team_id)       REFERENCES Team(team_id)             ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id) ON DELETE CASCADE
);

CREATE TABLE Reward (
    reward_id     INT AUTO_INCREMENT PRIMARY KEY,
    team_id       INT NOT NULL,
    tournament_id INT NOT NULL,
    reward_type   ENUM('Gold','Silver','Bronze','Participation') DEFAULT 'Participation',
    prize_amount  DECIMAL(10,2) DEFAULT 0.00,
    awarded_on    DATE,
    FOREIGN KEY (team_id)       REFERENCES Team(team_id)             ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id) ON DELETE CASCADE
);

INSERT INTO Player (name, username, email, phone, age, country) VALUES
('Rahul Sharma',   'rahulOP',   'rahul@gmail.com',  '9876543210', 22, 'India'),
('Priya Menon',    'priyaX',    'priya@gmail.com',  '9876543211', 20, 'India'),
('Arjun Patel',    'arjun99',   'arjun@gmail.com',  '9876543212', 21, 'India'),
('Sneha Rao',      'snehafire', 'sneha@gmail.com',  '9876543213', 19, 'India'),
('Vikram Singh',   'vikramGG',  'vikram@gmail.com', '9876543214', 23, 'India'),
('Ananya Das',     'ananyaPro', 'ananya@gmail.com', '9876543215', 20, 'India'),
('Rohan Kapoor',   'rohanK',    'rohan@gmail.com',  '9876543216', 24, 'India'),
('Meera Iyer',     'meeraIYR',  'meera@gmail.com',  '9876543217', 21, 'India'),
('Karan Malhotra', 'karanM',    'karan@gmail.com',  '9876543218', 22, 'India'),
('Divya Nair',     'divyaN',    'divya@gmail.com',  '9876543219', 20, 'India');

INSERT INTO Team (team_name, captain_id) VALUES
('Phantom Strike', 1),
('Nova Blaze',     3),
('Iron Wolves',    5),
('Shadow Clan',    7),
('Cyber Knights',  9);

INSERT INTO Team_Members (team_id, player_id, role, joined_date) VALUES
(1, 1,  'Captain', '2026-01-01'), (1, 2,  'Support', '2026-01-01'),
(2, 3,  'Captain', '2026-01-01'), (2, 4,  'Fragger', '2026-01-01'),
(3, 5,  'Captain', '2026-01-01'), (3, 6,  'IGL',     '2026-01-01'),
(4, 7,  'Captain', '2026-01-01'), (4, 8,  'Sniper',  '2026-01-01'),
(5, 9,  'Captain', '2026-01-01'), (5, 10, 'Support', '2026-01-01');

INSERT INTO Sponsor (sponsor_name, industry, contact_email, amount) VALUES
('TechArena', 'Technology', 'contact@techarena.com', 500000.00),
('GameFuel',  'Beverages',  'info@gamefuel.com',     250000.00),
('NeoGear',   'Hardware',   'sponsor@neogear.com',   750000.00);

INSERT INTO Tournament (tournament_name, game_name, start_date, end_date, prize_pool, sponsor_id, status) VALUES
('India Clash Championship', 'VALORANT', '2026-03-01', '2026-03-20', 1000000.00, 1, 'Ongoing'),
('South Asia Open Cup',      'BGMI',     '2026-04-10', '2026-04-30',  500000.00, 2, 'Upcoming');

INSERT INTO Registration (team_id, tournament_id, reg_date, status) VALUES
(1, 1, '2026-02-15', 'Approved'),
(2, 1, '2026-02-16', 'Approved'),
(3, 1, '2026-02-17', 'Approved'),
(4, 1, '2026-02-18', 'Approved'),
(5, 1, '2026-02-19', 'Approved'),
(1, 2, '2026-03-25', 'Pending'),
(2, 2, '2026-03-25', 'Pending');

INSERT INTO Matches (tournament_id, team1_id, team2_id, scheduled_at, venue, round, status) VALUES
(1, 1, 2, '2026-03-03 18:00:00', 'Online Arena',       'Group Stage',  'Completed'),
(1, 3, 4, '2026-03-03 20:00:00', 'Online Arena',       'Group Stage',  'Completed'),
(1, 5, 1, '2026-03-05 18:00:00', 'Online Arena',       'Group Stage',  'Completed'),
(1, 2, 3, '2026-03-05 20:00:00', 'Online Arena',       'Group Stage',  'Completed'),
(1, 4, 5, '2026-03-07 18:00:00', 'Online Arena',       'Group Stage',  'Completed'),
(1, 1, 3, '2026-03-10 18:00:00', 'Hyderabad LAN',      'Quarter Final','Completed'),
(1, 2, 4, '2026-03-10 20:00:00', 'Hyderabad LAN',      'Quarter Final','Completed'),
(1, 5, 2, '2026-03-12 18:00:00', 'Hyderabad LAN',      'Semi Final',   'Completed'),
(1, 1, 4, '2026-03-12 20:00:00', 'Hyderabad LAN',      'Semi Final',   'Scheduled'),
(1, 1, 2, '2026-03-20 18:00:00', 'Mumbai Grand Arena', 'Final',        'Scheduled');

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

INSERT INTO Match_Result (match_id, winner_team_id, loser_team_id, score) VALUES
(1, 1, 2, '13-8'),
(2, 3, 4, '13-10'),
(3, 1, 5, '13-5'),
(4, 3, 2, '13-11'),
(5, 5, 4, '13-9'),
(6, 1, 3, '13-7'),
(7, 2, 4, '13-6'),
(8, 2, 5, '13-4');

CREATE OR REPLACE VIEW leaderboard AS
SELECT r.rank_position, t.team_name, r.points, r.wins, r.losses, tn.tournament_name
FROM Ranking r
JOIN Team t        ON r.team_id       = t.team_id
JOIN Tournament tn ON r.tournament_id = tn.tournament_id
ORDER BY r.points DESC, r.wins DESC;

CREATE OR REPLACE VIEW match_schedule AS
SELECT m.match_id, t1.team_name AS team1, t2.team_name AS team2,
       tn.tournament_name, m.scheduled_at, m.venue, m.round, m.status
FROM Matches m
JOIN Team t1       ON m.team1_id      = t1.team_id
JOIN Team t2       ON m.team2_id      = t2.team_id
JOIN Tournament tn ON m.tournament_id = tn.tournament_id
ORDER BY m.scheduled_at;

CREATE OR REPLACE VIEW player_team_view AS
SELECT p.player_id, p.name AS player_name, p.username, p.country, t.team_name, tm.role
FROM Player p
JOIN Team_Members tm ON p.player_id = tm.player_id
JOIN Team t          ON tm.team_id  = t.team_id;

DELIMITER $$

CREATE TRIGGER trg_update_match_status
AFTER INSERT ON Match_Result
FOR EACH ROW
BEGIN
    UPDATE Matches SET status = 'Completed' WHERE match_id = NEW.match_id;
END$$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE show_team_rankings()
BEGIN
    DECLARE done      INT DEFAULT FALSE;
    DECLARE v_team_id INT;
    DECLARE v_name    VARCHAR(100);
    DECLARE v_points  INT;
    DECLARE team_cursor CURSOR FOR
        SELECT t.team_id, t.team_name, r.points
        FROM Team t JOIN Ranking r ON t.team_id = r.team_id
        ORDER BY r.points DESC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    OPEN team_cursor;
    read_loop: LOOP
        FETCH team_cursor INTO v_team_id, v_name, v_points;
        IF done THEN LEAVE read_loop; END IF;
        SELECT v_team_id AS team_id, v_name AS team_name, v_points AS points;
    END LOOP;
    CLOSE team_cursor;
END$$

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;