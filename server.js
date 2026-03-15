// ============================================================
//  E-SPORTS MANAGEMENT SYSTEM — EXPRESS BACKEND v2.0
//  New: Admin Auth (bcrypt + session), Position API
//  Run: npm install → npm start | http://localhost:3000
// ============================================================

const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');
const path    = require('path');
const bcrypt  = require('bcryptjs');
const session = require('express-session');

const app  = express();
const PORT = 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(session({
    secret:            'esports_secret_key_2026',
    resave:            false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 4 }
}));

app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createPool({
    host: 'localhost', user: 'root',
    password: 'root',          // ← your MySQL password here
    database: 'esports_db',
    waitForConnections: true, connectionLimit: 10,
});

(async () => {
    try { const c = await db.getConnection(); console.log('✅  MySQL connected'); c.release(); }
    catch (e) { console.error('❌  MySQL failed:', e.message); }
})();

const sendError = (res, err, code = 500) => { console.error(err); res.status(code).json({ error: err.message || err }); };

const requireAdmin = (req, res, next) => {
    if (req.session && req.session.adminId) return next();
    res.status(401).json({ error: 'Unauthorized. Please login.' });
};

// ── ADMIN AUTH ──────────────────────────────────────────────

app.post('/admin/register', async (req, res) => {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password)
        return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6)
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    try {
        const hash = await bcrypt.hash(password, 10);
        const [r] = await db.query(
            `INSERT INTO Admin (name, username, email, password) VALUES (?, ?, ?, ?)`,
            [name.trim(), username.trim(), email.trim(), hash]
        );
        res.status(201).json({ message: 'Admin registered successfully', admin_id: r.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: 'Username or email already exists' });
        sendError(res, err);
    }
});

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    try {
        const [rows] = await db.query(
            `SELECT * FROM Admin WHERE username = ? AND is_active = TRUE`, [username.trim()]
        );
        if (!rows.length) return res.status(401).json({ error: 'Invalid username or password' });
        const admin   = rows[0];
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });
        req.session.adminId   = admin.admin_id;
        req.session.adminName = admin.name;
        req.session.adminRole = admin.role;
        res.json({ message: 'Login successful', admin_id: admin.admin_id, name: admin.name, username: admin.username, role: admin.role });
    } catch (err) { sendError(res, err); }
});

app.post('/admin/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return sendError(res, err);
        res.json({ message: 'Logged out' });
    });
});

app.get('/admin/me', (req, res) => {
    if (req.session && req.session.adminId)
        return res.json({ logged_in: true, admin_id: req.session.adminId, name: req.session.adminName, role: req.session.adminRole });
    res.status(401).json({ logged_in: false });
});

app.get('/admin/list', requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT admin_id, name, username, email, role, is_active, created_at FROM Admin ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

// ── POSITION API (PUBLIC) ───────────────────────────────────

app.get('/api/position', async (req, res) => {
    const q = (req.query.query || '').trim();
    if (!q) return res.status(400).json({ error: 'Query parameter required' });
    try {
        const [teams] = await db.query(`
            SELECT DISTINCT t.team_id, t.team_name FROM Team t
            LEFT JOIN Team_Members tm ON t.team_id = tm.team_id
            LEFT JOIN Player p ON tm.player_id = p.player_id
            WHERE t.team_name LIKE ? OR p.name LIKE ? OR p.username LIKE ?
        `, [`%${q}%`, `%${q}%`, `%${q}%`]);

        if (!teams.length) return res.json({ found: false, message: 'No team or player found matching your search' });

        const results = [];
        for (const team of teams) {
            const [ranking] = await db.query(`
                SELECT r.rank_position, r.points, r.wins, r.losses,
                       tn.tournament_name, tn.game_name, tn.status AS tourn_status
                FROM Ranking r JOIN Tournament tn ON r.tournament_id = tn.tournament_id
                WHERE r.team_id = ? ORDER BY r.points DESC
            `, [team.team_id]);

            const [recentMatches] = await db.query(`
                SELECT m.round, m.scheduled_at, m.status,
                       t1.team_name AS team1, t2.team_name AS team2,
                       mr.score, tw.team_name AS winner, tn.tournament_name
                FROM Matches m
                JOIN Team t1 ON m.team1_id = t1.team_id
                JOIN Team t2 ON m.team2_id = t2.team_id
                JOIN Tournament tn ON m.tournament_id = tn.tournament_id
                LEFT JOIN Match_Result mr ON m.match_id = mr.match_id
                LEFT JOIN Team tw ON mr.winner_team_id = tw.team_id
                WHERE (m.team1_id = ? OR m.team2_id = ?) AND m.status = 'Completed'
                ORDER BY m.scheduled_at DESC LIMIT 3
            `, [team.team_id, team.team_id]);

            const [nextMatch] = await db.query(`
                SELECT m.round, m.scheduled_at, m.venue, tn.tournament_name,
                       CASE WHEN m.team1_id = ? THEN t2.team_name ELSE t1.team_name END AS opponent
                FROM Matches m
                JOIN Team t1 ON m.team1_id = t1.team_id
                JOIN Team t2 ON m.team2_id = t2.team_id
                JOIN Tournament tn ON m.tournament_id = tn.tournament_id
                WHERE (m.team1_id = ? OR m.team2_id = ?) AND m.status IN ('Scheduled','Live')
                ORDER BY m.scheduled_at ASC LIMIT 1
            `, [team.team_id, team.team_id, team.team_id]);

            const [members] = await db.query(`
                SELECT p.name, p.username, p.country, tm.role
                FROM Player p JOIN Team_Members tm ON p.player_id = tm.player_id
                WHERE tm.team_id = ?
            `, [team.team_id]);

            const [rewards] = await db.query(`
                SELECT rw.reward_type, rw.prize_amount, tn.tournament_name
                FROM Reward rw JOIN Tournament tn ON rw.tournament_id = tn.tournament_id
                WHERE rw.team_id = ?
            `, [team.team_id]);

            results.push({
                found: true, team_id: team.team_id, team_name: team.team_name,
                ranking, members, recent_matches: recentMatches,
                next_match: nextMatch[0] || null, rewards
            });
        }
        res.json({ found: true, results });
    } catch (err) { sendError(res, err); }
});

// ── PLAYERS ─────────────────────────────────────────────────

app.get('/api/players', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, t.team_name, tm.role FROM Player p
            LEFT JOIN Team_Members tm ON p.player_id = tm.player_id
            LEFT JOIN Team t ON tm.team_id = t.team_id ORDER BY p.player_id`);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

app.get('/api/players/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT p.*, t.team_name, tm.role FROM Player p
             LEFT JOIN Team_Members tm ON p.player_id = tm.player_id
             LEFT JOIN Team t ON tm.team_id = t.team_id WHERE p.player_id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Player not found' });
        res.json(rows[0]);
    } catch (err) { sendError(res, err); }
});

app.post('/api/players', requireAdmin, async (req, res) => {
    const { name, username, email, phone, age, country } = req.body;
    if (!name || !username || !email) return res.status(400).json({ error: 'name, username, email required' });
    try {
        const [r] = await db.query(
            `INSERT INTO Player (name, username, email, phone, age, country) VALUES (?, ?, ?, ?, ?, ?)`,
            [name, username, email, phone || null, age || null, country || 'India']);
        res.status(201).json({ message: 'Player added', player_id: r.insertId });
    } catch (err) { sendError(res, err); }
});

app.delete('/api/players/:id', requireAdmin, async (req, res) => {
    try { await db.query('DELETE FROM Player WHERE player_id = ?', [req.params.id]); res.json({ message: 'Player deleted' }); }
    catch (err) { sendError(res, err); }
});

// ── TEAMS ────────────────────────────────────────────────────

app.get('/api/teams', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, p.name AS captain_name, COUNT(DISTINCT tm.player_id) AS member_count
            FROM Team t LEFT JOIN Player p ON t.captain_id = p.player_id
            LEFT JOIN Team_Members tm ON t.team_id = tm.team_id
            GROUP BY t.team_id ORDER BY t.team_id`);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

app.get('/api/teams/:id/members', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.player_id, p.name, p.username, p.country, tm.role, tm.joined_date
            FROM Player p JOIN Team_Members tm ON p.player_id = tm.player_id WHERE tm.team_id = ?`, [req.params.id]);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

app.post('/api/teams', requireAdmin, async (req, res) => {
    const { team_name, captain_id } = req.body;
    if (!team_name) return res.status(400).json({ error: 'team_name required' });
    try {
        const [r] = await db.query('INSERT INTO Team (team_name, captain_id) VALUES (?, ?)', [team_name, captain_id || null]);
        if (captain_id) await db.query(`INSERT IGNORE INTO Team_Members (team_id, player_id, role) VALUES (?, ?, 'Captain')`, [r.insertId, captain_id]);
        res.status(201).json({ message: 'Team created', team_id: r.insertId });
    } catch (err) { sendError(res, err); }
});

app.post('/api/teams/:id/members', requireAdmin, async (req, res) => {
    const { player_id, role } = req.body;
    if (!player_id) return res.status(400).json({ error: 'player_id required' });
    try {
        await db.query(`INSERT INTO Team_Members (team_id, player_id, role) VALUES (?, ?, ?)`, [req.params.id, player_id, role || 'Member']);
        res.status(201).json({ message: 'Player added to team' });
    } catch (err) { sendError(res, err); }
});

// ── TOURNAMENTS ──────────────────────────────────────────────

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
            GROUP BY tn.tournament_id ORDER BY tn.start_date DESC`);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

app.post('/api/tournaments', requireAdmin, async (req, res) => {
    const { tournament_name, game_name, start_date, end_date, prize_pool, sponsor_id } = req.body;
    if (!tournament_name || !game_name || !start_date || !end_date)
        return res.status(400).json({ error: 'Required fields missing' });
    try {
        const [r] = await db.query(
            `INSERT INTO Tournament (tournament_name, game_name, start_date, end_date, prize_pool, sponsor_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [tournament_name, game_name, start_date, end_date, prize_pool || 0, sponsor_id || null]);
        res.status(201).json({ message: 'Tournament created', tournament_id: r.insertId });
    } catch (err) { sendError(res, err); }
});

app.post('/api/tournaments/:id/register', requireAdmin, async (req, res) => {
    const { team_id } = req.body;
    if (!team_id) return res.status(400).json({ error: 'team_id required' });
    try {
        await db.query(`INSERT INTO Registration (team_id, tournament_id) VALUES (?, ?)`, [team_id, req.params.id]);
        res.status(201).json({ message: 'Team registered' });
    } catch (err) { sendError(res, err); }
});

// ── MATCHES ──────────────────────────────────────────────────

app.get('/api/matches', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT m.*, t1.team_name AS team1_name, t2.team_name AS team2_name,
                   tn.tournament_name, mr.score, tw.team_name AS winner_name
            FROM Matches m
            JOIN Team t1 ON m.team1_id = t1.team_id JOIN Team t2 ON m.team2_id = t2.team_id
            JOIN Tournament tn ON m.tournament_id = tn.tournament_id
            LEFT JOIN Match_Result mr ON m.match_id = mr.match_id
            LEFT JOIN Team tw ON mr.winner_team_id = tw.team_id
            ORDER BY m.scheduled_at DESC`);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

app.post('/api/matches', requireAdmin, async (req, res) => {
    const { tournament_id, team1_id, team2_id, scheduled_at, venue, round } = req.body;
    if (!tournament_id || !team1_id || !team2_id || !scheduled_at)
        return res.status(400).json({ error: 'Required fields missing' });
    try {
        const [r] = await db.query(
            `INSERT INTO Matches (tournament_id, team1_id, team2_id, scheduled_at, venue, round) VALUES (?, ?, ?, ?, ?, ?)`,
            [tournament_id, team1_id, team2_id, scheduled_at, venue || 'Online', round || 'Group Stage']);
        res.status(201).json({ message: 'Match scheduled', match_id: r.insertId });
    } catch (err) { sendError(res, err); }
});

app.post('/api/matches/:id/result', requireAdmin, async (req, res) => {
    const { winner_team_id, loser_team_id, score } = req.body;
    if (!winner_team_id || !loser_team_id) return res.status(400).json({ error: 'winner and loser required' });
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(
            `INSERT INTO Match_Result (match_id, winner_team_id, loser_team_id, score) VALUES (?, ?, ?, ?)`,
            [req.params.id, winner_team_id, loser_team_id, score || null]);
        await conn.commit();
        res.status(201).json({ message: 'Result recorded. Rankings updated.' });
    } catch (err) { await conn.rollback(); sendError(res, err); }
    finally { conn.release(); }
});

// ── LEADERBOARD, SPONSORS, REWARDS, STATS ────────────────────

app.get('/api/leaderboard', async (req, res) => {
    try { const [r] = await db.query('SELECT * FROM leaderboard'); res.json(r); }
    catch (err) { sendError(res, err); }
});

app.get('/api/sponsors', async (req, res) => {
    try { const [r] = await db.query('SELECT * FROM Sponsor ORDER BY amount DESC'); res.json(r); }
    catch (err) { sendError(res, err); }
});

app.post('/api/sponsors', requireAdmin, async (req, res) => {
    const { sponsor_name, industry, contact_email, amount } = req.body;
    if (!sponsor_name) return res.status(400).json({ error: 'sponsor_name required' });
    try {
        const [r] = await db.query('INSERT INTO Sponsor (sponsor_name, industry, contact_email, amount) VALUES (?, ?, ?, ?)',
            [sponsor_name, industry || null, contact_email || null, amount || 0]);
        res.status(201).json({ message: 'Sponsor added', sponsor_id: r.insertId });
    } catch (err) { sendError(res, err); }
});

app.get('/api/rewards', async (req, res) => {
    try {
        const [r] = await db.query(`
            SELECT rw.*, t.team_name, tn.tournament_name FROM Reward rw
            JOIN Team t ON rw.team_id = t.team_id JOIN Tournament tn ON rw.tournament_id = tn.tournament_id
            ORDER BY rw.prize_amount DESC`);
        res.json(r);
    } catch (err) { sendError(res, err); }
});

app.get('/api/stats', async (req, res) => {
    try {
        const [[{ total_players }]]     = await db.query('SELECT COUNT(*) AS total_players FROM Player');
        const [[{ total_teams }]]       = await db.query('SELECT COUNT(*) AS total_teams FROM Team');
        const [[{ total_tournaments }]] = await db.query('SELECT COUNT(*) AS total_tournaments FROM Tournament');
        const [[{ total_matches }]]     = await db.query('SELECT COUNT(*) AS total_matches FROM Matches');
        const [[{ prize_pool }]]        = await db.query('SELECT SUM(prize_pool) AS prize_pool FROM Tournament');
        const [[{ total_admins }]]      = await db.query('SELECT COUNT(*) AS total_admins FROM Admin');
        res.json({ total_players, total_teams, total_tournaments, total_matches, prize_pool, total_admins });
    } catch (err) { sendError(res, err); }
});

app.listen(PORT, () => {
    console.log(`\n🎮  E-Sports Server v2.0 → http://localhost:${PORT}`);
    console.log(`🔐  Admin Login         → http://localhost:${PORT}/admin-login.html`);
    console.log(`📊  API Base            → http://localhost:${PORT}/api`);
    console.log(`🔍  Position Search     → http://localhost:${PORT}/position.html`);
});