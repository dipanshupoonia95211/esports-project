// ============================================================
//  E-SPORTS MANAGEMENT SYSTEM — EXPRESS BACKEND
//  Run: npm install   then   npm start
//  Base URL: http://localhost:3000
// ============================================================

const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// ── DB CONNECTION POOL ─────────────────────────────────────
const db = mysql.createPool({
    host:     'localhost',
    user:     'root',
    password: '',          // ← change to your MySQL password
    database: 'esports_db',
    waitForConnections: true,
    connectionLimit:    10,
});

// Test connection on startup
(async () => {
    try {
        const conn = await db.getConnection();
        console.log('✅  MySQL connected successfully');
        conn.release();
    } catch (err) {
        console.error('❌  MySQL connection failed:', err.message);
    }
})();

// ── HELPER ────────────────────────────────────────────────
const sendError = (res, err) => {
    console.error(err);
    res.status(500).json({ error: err.message });
};

// ============================================================
//  PLAYERS
// ============================================================
app.get('/api/players', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, t.team_name, tm.role
            FROM Player p
            LEFT JOIN Team_Members tm ON p.player_id = tm.player_id
            LEFT JOIN Team t ON tm.team_id = t.team_id
            ORDER BY p.player_id
        `);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

app.get('/api/players/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT p.*, t.team_name, tm.role
             FROM Player p
             LEFT JOIN Team_Members tm ON p.player_id = tm.player_id
             LEFT JOIN Team t ON tm.team_id = t.team_id
             WHERE p.player_id = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Player not found' });
        res.json(rows[0]);
    } catch (err) { sendError(res, err); }
});

app.post('/api/players', async (req, res) => {
    const { name, username, email, phone, age, country } = req.body;
    if (!name || !username || !email) {
        return res.status(400).json({ error: 'name, username, email are required' });
    }
    try {
        const [result] = await db.query(
            `INSERT INTO Player (name, username, email, phone, age, country)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, username, email, phone || null, age || null, country || 'India']
        );
        res.status(201).json({ message: 'Player added', player_id: result.insertId });
    } catch (err) { sendError(res, err); }
});

app.delete('/api/players/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM Player WHERE player_id = ?', [req.params.id]);
        res.json({ message: 'Player deleted' });
    } catch (err) { sendError(res, err); }
});

// ============================================================
//  TEAMS
// ============================================================
app.get('/api/teams', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, p.name AS captain_name,
                   COUNT(DISTINCT tm.player_id) AS member_count
            FROM Team t
            LEFT JOIN Player p ON t.captain_id = p.player_id
            LEFT JOIN Team_Members tm ON t.team_id = tm.team_id
            GROUP BY t.team_id
            ORDER BY t.team_id
        `);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

app.get('/api/teams/:id/members', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.player_id, p.name, p.username, p.country, tm.role, tm.joined_date
            FROM Player p
            JOIN Team_Members tm ON p.player_id = tm.player_id
            WHERE tm.team_id = ?
        `, [req.params.id]);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

app.post('/api/teams', async (req, res) => {
    const { team_name, captain_id } = req.body;
    if (!team_name) return res.status(400).json({ error: 'team_name is required' });
    try {
        const [result] = await db.query(
            'INSERT INTO Team (team_name, captain_id) VALUES (?, ?)',
            [team_name, captain_id || null]
        );
        // Auto-add captain as member
        if (captain_id) {
            await db.query(
                `INSERT IGNORE INTO Team_Members (team_id, player_id, role)
                 VALUES (?, ?, 'Captain')`,
                [result.insertId, captain_id]
            );
        }
        res.status(201).json({ message: 'Team created', team_id: result.insertId });
    } catch (err) { sendError(res, err); }
});

app.post('/api/teams/:id/members', async (req, res) => {
    const { player_id, role } = req.body;
    if (!player_id) return res.status(400).json({ error: 'player_id is required' });
    try {
        await db.query(
            `INSERT INTO Team_Members (team_id, player_id, role) VALUES (?, ?, ?)`,
            [req.params.id, player_id, role || 'Member']
        );
        res.status(201).json({ message: 'Player added to team' });
    } catch (err) { sendError(res, err); }
});

// ============================================================
//  TOURNAMENTS
// ============================================================
app.get('/api/tournaments', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT tn.*, s.sponsor_name,
                   COUNT(DISTINCT r.team_id) AS team_count,
                   COUNT(DISTINCT m.match_id) AS match_count
            FROM Tournament tn
            LEFT JOIN Sponsor s ON tn.sponsor_id = s.sponsor_id
            LEFT JOIN Registration r ON tn.tournament_id = r.tournament_id AND r.status = 'Approved'
            LEFT JOIN Matches m ON tn.tournament_id = m.tournament_id
            GROUP BY tn.tournament_id
            ORDER BY tn.start_date DESC
        `);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

app.post('/api/tournaments', async (req, res) => {
    const { tournament_name, game_name, start_date, end_date, prize_pool, sponsor_id } = req.body;
    if (!tournament_name || !game_name || !start_date || !end_date) {
        return res.status(400).json({ error: 'tournament_name, game_name, start_date, end_date required' });
    }
    try {
        const [result] = await db.query(
            `INSERT INTO Tournament (tournament_name, game_name, start_date, end_date, prize_pool, sponsor_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [tournament_name, game_name, start_date, end_date, prize_pool || 0, sponsor_id || null]
        );
        res.status(201).json({ message: 'Tournament created', tournament_id: result.insertId });
    } catch (err) { sendError(res, err); }
});

// Register a team for a tournament
app.post('/api/tournaments/:id/register', async (req, res) => {
    const { team_id } = req.body;
    if (!team_id) return res.status(400).json({ error: 'team_id required' });
    try {
        await db.query(
            `INSERT INTO Registration (team_id, tournament_id) VALUES (?, ?)`,
            [team_id, req.params.id]
        );
        res.status(201).json({ message: 'Team registered for tournament' });
    } catch (err) { sendError(res, err); }
});

// ============================================================
//  MATCHES
// ============================================================
app.get('/api/matches', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT m.*,
                   t1.team_name AS team1_name,
                   t2.team_name AS team2_name,
                   tn.tournament_name,
                   mr.score,
                   tw.team_name AS winner_name
            FROM Matches m
            JOIN Team t1 ON m.team1_id = t1.team_id
            JOIN Team t2 ON m.team2_id = t2.team_id
            JOIN Tournament tn ON m.tournament_id = tn.tournament_id
            LEFT JOIN Match_Result mr ON m.match_id = mr.match_id
            LEFT JOIN Team tw ON mr.winner_team_id = tw.team_id
            ORDER BY m.scheduled_at DESC
        `);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

app.post('/api/matches', async (req, res) => {
    const { tournament_id, team1_id, team2_id, scheduled_at, venue, round } = req.body;
    if (!tournament_id || !team1_id || !team2_id || !scheduled_at) {
        return res.status(400).json({ error: 'tournament_id, team1_id, team2_id, scheduled_at required' });
    }
    try {
        const [result] = await db.query(
            `INSERT INTO Matches (tournament_id, team1_id, team2_id, scheduled_at, venue, round)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [tournament_id, team1_id, team2_id, scheduled_at, venue || 'Online', round || 'Group Stage']
        );
        res.status(201).json({ message: 'Match scheduled', match_id: result.insertId });
    } catch (err) { sendError(res, err); }
});

// Record a match result (triggers auto-update ranking)
app.post('/api/matches/:id/result', async (req, res) => {
    const { winner_team_id, loser_team_id, score } = req.body;
    if (!winner_team_id || !loser_team_id) {
        return res.status(400).json({ error: 'winner_team_id and loser_team_id required' });
    }
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            `INSERT INTO Match_Result (match_id, winner_team_id, loser_team_id, score)
             VALUES (?, ?, ?, ?)`,
            [req.params.id, winner_team_id, loser_team_id, score || null]
        );
        // Trigger handles ranking update + match status

        await conn.commit();
        res.status(201).json({ message: 'Result recorded. Rankings updated.' });
    } catch (err) {
        await conn.rollback();
        sendError(res, err);
    } finally {
        conn.release();
    }
});

// ============================================================
//  LEADERBOARD
// ============================================================
app.get('/api/leaderboard', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM leaderboard`);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

// ============================================================
//  SPONSORS
// ============================================================
app.get('/api/sponsors', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Sponsor ORDER BY amount DESC');
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

app.post('/api/sponsors', async (req, res) => {
    const { sponsor_name, industry, contact_email, amount } = req.body;
    if (!sponsor_name) return res.status(400).json({ error: 'sponsor_name required' });
    try {
        const [result] = await db.query(
            'INSERT INTO Sponsor (sponsor_name, industry, contact_email, amount) VALUES (?, ?, ?, ?)',
            [sponsor_name, industry || null, contact_email || null, amount || 0]
        );
        res.status(201).json({ message: 'Sponsor added', sponsor_id: result.insertId });
    } catch (err) { sendError(res, err); }
});

// ============================================================
//  REWARDS
// ============================================================
app.get('/api/rewards', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT rw.*, t.team_name, tn.tournament_name
            FROM Reward rw
            JOIN Team t ON rw.team_id = t.team_id
            JOIN Tournament tn ON rw.tournament_id = tn.tournament_id
            ORDER BY rw.prize_amount DESC
        `);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

// ============================================================
//  DASHBOARD STATS
// ============================================================
app.get('/api/stats', async (req, res) => {
    try {
        const [[{ total_players }]]     = await db.query('SELECT COUNT(*) AS total_players FROM Player');
        const [[{ total_teams }]]       = await db.query('SELECT COUNT(*) AS total_teams FROM Team');
        const [[{ total_tournaments }]] = await db.query('SELECT COUNT(*) AS total_tournaments FROM Tournament');
        const [[{ total_matches }]]     = await db.query('SELECT COUNT(*) AS total_matches FROM Matches');
        const [[{ prize_pool }]]        = await db.query('SELECT SUM(prize_pool) AS prize_pool FROM Tournament');

        res.json({ total_players, total_teams, total_tournaments, total_matches, prize_pool });
    } catch (err) { sendError(res, err); }
});

// ── START ─────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🎮  E-Sports Server running → http://localhost:${PORT}`);
    console.log(`📊  API base               → http://localhost:${PORT}/api`);
});
