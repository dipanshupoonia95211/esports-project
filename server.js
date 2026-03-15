// ============================================================
//  E-SPORTS MANAGEMENT SYSTEM — EXPRESS BACKEND (FINAL)
// ============================================================

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = 3000;

// ── MIDDLEWARE ──────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(session({
    secret: 'esports_secret_key',
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

// ── DATABASE CONNECTION ─────────────────────────────────────
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',     // ← put your MySQL password
    database: 'esports_db'
});

// ── HELPER ─────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
    if (req.session.adminId) return next();
    res.status(401).json({ error: "Admin login required" });
};

// ============================================================
//  ADMIN AUTH
// ============================================================

app.post('/admin/register', async (req, res) => {
    const { name, username, email, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    await db.query(
        `INSERT INTO Admin(name,username,email,password)
         VALUES (?,?,?,?)`,
        [name, username, email, hash]
    );

    res.json({ message: "Admin registered" });
});

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;

    const [rows] = await db.query(
        `SELECT * FROM Admin WHERE username=?`,
        [username]
    );

    if (!rows.length) return res.status(401).json({ error: "Invalid login" });

    const match = await bcrypt.compare(password, rows[0].password);

    if (!match) return res.status(401).json({ error: "Invalid login" });

    req.session.adminId = rows[0].admin_id;

    res.json({ message: "Login success" });
});

app.post('/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out" });
});

// ============================================================
//  PLAYER POSITION SEARCH
// ============================================================

app.get('/api/position', async (req, res) => {

    const search = req.query.team;

    const [rows] = await db.query(`
        SELECT t.team_name, r.points, r.wins, r.losses,
               r.rank_position, tn.tournament_name
        FROM Ranking r
        JOIN Team t ON r.team_id=t.team_id
        JOIN Tournament tn ON r.tournament_id=tn.tournament_id
        WHERE t.team_name LIKE ?
    `, [`%${search}%`]);

    res.json(rows);
});

// ============================================================
//  PLAYERS
// ============================================================

app.get('/api/players', async (req, res) => {
    const [rows] = await db.query("SELECT * FROM Player");
    res.json(rows);
});

app.post('/api/players', requireAdmin, async (req, res) => {

    const { name, username, email } = req.body;

    const [result] = await db.query(
        `INSERT INTO Player(name,username,email)
         VALUES (?,?,?)`,
        [name, username, email]
    );

    res.json({ player_id: result.insertId });
});

// ============================================================
//  TEAMS
// ============================================================

app.get('/api/teams', async (req, res) => {
    const [rows] = await db.query("SELECT * FROM Team");
    res.json(rows);
});

app.post('/api/teams', requireAdmin, async (req, res) => {

    const { team_name, captain_id } = req.body;

    const [result] = await db.query(
        `INSERT INTO Team(team_name,captain_id)
         VALUES (?,?)`,
        [team_name, captain_id]
    );

    res.json({ team_id: result.insertId });
});

// ============================================================
//  TOURNAMENTS
// ============================================================

app.get('/api/tournaments', async (req, res) => {
    const [rows] = await db.query("SELECT * FROM Tournament");
    res.json(rows);
});

app.post('/api/tournaments', requireAdmin, async (req, res) => {

    const { tournament_name, game_name, start_date, end_date } = req.body;

    const [result] = await db.query(
        `INSERT INTO Tournament(tournament_name,game_name,start_date,end_date)
         VALUES (?,?,?,?)`,
        [tournament_name, game_name, start_date, end_date]
    );

    res.json({ tournament_id: result.insertId });
});

// ============================================================
//  MATCHES
// ============================================================

app.get('/api/matches', async (req, res) => {

    const [rows] = await db.query(`
        SELECT m.match_id,
               t1.team_name AS team1,
               t2.team_name AS team2,
               tn.tournament_name,
               m.scheduled_at,
               m.status
        FROM Matches m
        JOIN Team t1 ON m.team1_id=t1.team_id
        JOIN Team t2 ON m.team2_id=t2.team_id
        JOIN Tournament tn ON m.tournament_id=tn.tournament_id
    `);

    res.json(rows);
});

// ============================================================
//  LEADERBOARD
// ============================================================

app.get('/api/leaderboard', async (req, res) => {
    const [rows] = await db.query("SELECT * FROM leaderboard");
    res.json(rows);
});

// ============================================================
//  SERVER START
// ============================================================

app.listen(PORT, () => {
    console.log(`🎮 Server running → http://localhost:${PORT}`);
});