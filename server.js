// ============================================================
//  E-SPORTS MANAGEMENT SYSTEM — EXPRESS BACKEND v3.0
//  Added: Nodemailer OTP Email Verification
// ============================================================

const express    = require('express');
const mysql      = require('mysql2/promise');
const cors       = require('cors');
const path       = require('path');
const bcrypt     = require('bcryptjs');
const session    = require('express-session');
const nodemailer = require('nodemailer');

const app  = express();
const PORT = 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(session({
    secret: 'esports_secret_key_2026',
    resave: false, saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 4 }
}));
app.use(express.static(path.join(__dirname, 'public')));

// ── DB ─────────────────────────────────────────────────────
const db = mysql.createPool({
    host: 'localhost', user: 'root',
    password: 'root',
    database: 'esports_db',
    waitForConnections: true, connectionLimit: 10,
});
(async () => {
    try { const c = await db.getConnection(); console.log('✅  MySQL connected'); c.release(); }
    catch (e) { console.error('❌  MySQL failed:', e.message); }
})();

// ── NODEMAILER SETUP ────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dipanshupoonia95211@gmail.com',
        pass: 'yiofoudedpqlfote'   // App password (spaces removed)
    }
});

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(toEmail, name, otp) {
    const mailOptions = {
        from: '"E-Sports Manager 🎮" <dipanshupoonia95211@gmail.com>',
        to: toEmail,
        subject: '🔐 Your OTP for E-Sports Manager Registration',
        html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#070b14;color:#e8f4ff;padding:32px;border-radius:12px;border:1px solid rgba(0,245,255,0.2)">
            <h1 style="font-size:24px;color:#00f5ff;letter-spacing:2px;margin-bottom:8px">🎮 E-SPORTS MANAGER</h1>
            <p style="color:#7a9cc4;font-size:13px;margin-bottom:24px">Admin Registration Verification</p>
            <p style="font-size:15px">Hi <strong>${name}</strong>,</p>
            <p style="font-size:14px;color:#7a9cc4">Use the OTP below to verify your email and complete registration:</p>
            <div style="background:#0d1526;border:2px solid #00f5ff;border-radius:10px;padding:24px;text-align:center;margin:24px 0">
                <div style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#00f5ff">${otp}</div>
                <div style="font-size:12px;color:#7a9cc4;margin-top:8px">Valid for 10 minutes only</div>
            </div>
            <p style="font-size:13px;color:#3d5a7a">If you did not request this, please ignore this email.</p>
            <hr style="border-color:rgba(0,245,255,0.1);margin:24px 0">
            <p style="font-size:12px;color:#3d5a7a;text-align:center">E-Sports Management System · DBMS Project</p>
        </div>`
    };
    await transporter.sendMail(mailOptions);
}

// ── HELPERS ─────────────────────────────────────────────────
const sendError = (res, err, code = 500) => { console.error(err); res.status(code).json({ error: err.message || err }); };
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.adminId) return next();
    res.status(401).json({ error: 'Unauthorized. Please login.' });
};

// ============================================================
//  ADMIN AUTH ROUTES
// ============================================================

// STEP 1 — Register: save unverified admin + send OTP
app.post('/admin/register', async (req, res) => {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password)
        return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6)
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    try {
        // Check if username/email already exists
        const [existing] = await db.query(
            'SELECT admin_id FROM Admin WHERE username = ? OR email = ?',
            [username.trim(), email.trim()]
        );
        if (existing.length) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        const hash    = await bcrypt.hash(password, 10);
        const otp     = generateOTP();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Insert unverified admin
        const [r] = await db.query(
            `INSERT INTO Admin (name, username, email, password, otp, otp_expires, is_verified)
             VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
            [name.trim(), username.trim(), email.trim(), hash, otp, expires]
        );

        // Send OTP email
        await sendOTPEmail(email.trim(), name.trim(), otp);

        res.status(201).json({
            message: 'OTP sent to your email. Please verify to complete registration.',
            admin_id: r.insertId,
            email: email.trim()
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: 'Username or email already exists' });
        sendError(res, err);
    }
});

// STEP 2 — Verify OTP
app.post('/admin/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });
    try {
        const [rows] = await db.query(
            'SELECT * FROM Admin WHERE email = ? AND is_verified = FALSE',
            [email.trim()]
        );
        if (!rows.length) return res.status(404).json({ error: 'Account not found or already verified' });

        const admin = rows[0];

        // Check expiry
        if (new Date() > new Date(admin.otp_expires)) {
            return res.status(400).json({ error: 'OTP has expired. Please register again.' });
        }

        // Check OTP
        if (admin.otp !== otp.trim()) {
            return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
        }

        // Mark as verified
        await db.query(
            'UPDATE Admin SET is_verified = TRUE, otp = NULL, otp_expires = NULL WHERE email = ?',
            [email.trim()]
        );

        res.json({ message: 'Email verified successfully! You can now login.' });
    } catch (err) { sendError(res, err); }
});

// STEP 3 — Resend OTP
app.post('/admin/resend-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    try {
        const [rows] = await db.query(
            'SELECT * FROM Admin WHERE email = ? AND is_verified = FALSE', [email.trim()]
        );
        if (!rows.length) return res.status(404).json({ error: 'Account not found or already verified' });

        const otp     = generateOTP();
        const expires = new Date(Date.now() + 10 * 60 * 1000);

        await db.query(
            'UPDATE Admin SET otp = ?, otp_expires = ? WHERE email = ?',
            [otp, expires, email.trim()]
        );
        await sendOTPEmail(email.trim(), rows[0].name, otp);
        res.json({ message: 'New OTP sent to your email.' });
    } catch (err) { sendError(res, err); }
});

// LOGIN — only verified admins
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    try {
        const [rows] = await db.query(
            'SELECT * FROM Admin WHERE username = ? AND is_active = TRUE', [username.trim()]
        );
        if (!rows.length) return res.status(401).json({ error: 'Invalid username or password' });
        const admin = rows[0];

        // Check if verified
        if (!admin.is_verified) {
            return res.status(403).json({
                error: 'Email not verified. Please check your email for OTP.',
                needs_verification: true,
                email: admin.email
            });
        }

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
            'SELECT admin_id, name, username, email, role, is_active, is_verified, created_at FROM Admin ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (err) { sendError(res, err); }
});

// ── POSITION API ────────────────────────────────────────────
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
        if (!teams.length) return res.json({ found: false, message: 'No team or player found' });
        const results = [];
        for (const team of teams) {
            const [ranking]       = await db.query(`SELECT r.rank_position, r.points, r.wins, r.losses, tn.tournament_name, tn.game_name, tn.status AS tourn_status FROM Ranking r JOIN Tournament tn ON r.tournament_id = tn.tournament_id WHERE r.team_id = ? ORDER BY r.points DESC`, [team.team_id]);
            const [recentMatches] = await db.query(`SELECT m.round, m.scheduled_at, m.status, t1.team_name AS team1, t2.team_name AS team2, mr.score, tw.team_name AS winner, tn.tournament_name FROM Matches m JOIN Team t1 ON m.team1_id = t1.team_id JOIN Team t2 ON m.team2_id = t2.team_id JOIN Tournament tn ON m.tournament_id = tn.tournament_id LEFT JOIN Match_Result mr ON m.match_id = mr.match_id LEFT JOIN Team tw ON mr.winner_team_id = tw.team_id WHERE (m.team1_id = ? OR m.team2_id = ?) AND m.status = 'Completed' ORDER BY m.scheduled_at DESC LIMIT 3`, [team.team_id, team.team_id]);
            const [nextMatch]     = await db.query(`SELECT m.round, m.scheduled_at, m.venue, tn.tournament_name, CASE WHEN m.team1_id = ? THEN t2.team_name ELSE t1.team_name END AS opponent FROM Matches m JOIN Team t1 ON m.team1_id = t1.team_id JOIN Team t2 ON m.team2_id = t2.team_id JOIN Tournament tn ON m.tournament_id = tn.tournament_id WHERE (m.team1_id = ? OR m.team2_id = ?) AND m.status IN ('Scheduled','Live') ORDER BY m.scheduled_at ASC LIMIT 1`, [team.team_id, team.team_id, team.team_id]);
            const [members]       = await db.query(`SELECT p.name, p.username, p.country, tm.role FROM Player p JOIN Team_Members tm ON p.player_id = tm.player_id WHERE tm.team_id = ?`, [team.team_id]);
            const [rewards]       = await db.query(`SELECT rw.reward_type, rw.prize_amount, tn.tournament_name FROM Reward rw JOIN Tournament tn ON rw.tournament_id = tn.tournament_id WHERE rw.team_id = ?`, [team.team_id]);
            results.push({ found: true, team_id: team.team_id, team_name: team.team_name, ranking, members, recent_matches: recentMatches, next_match: nextMatch[0] || null, rewards });
        }
        res.json({ found: true, results });
    } catch (err) { sendError(res, err); }
});

// ── PLAYERS ─────────────────────────────────────────────────
app.get('/api/players', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT p.*, t.team_name, tm.role FROM Player p LEFT JOIN Team_Members tm ON p.player_id = tm.player_id LEFT JOIN Team t ON tm.team_id = t.team_id ORDER BY p.player_id`);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});
app.get('/api/players/:id', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT p.*, t.team_name, tm.role FROM Player p LEFT JOIN Team_Members tm ON p.player_id = tm.player_id LEFT JOIN Team t ON tm.team_id = t.team_id WHERE p.player_id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Player not found' });
        res.json(rows[0]);
    } catch (err) { sendError(res, err); }
});
app.post('/api/players', requireAdmin, async (req, res) => {
    const { name, username, email, phone, age, country } = req.body;
    if (!name || !username || !email) return res.status(400).json({ error: 'name, username, email required' });
    try {
        const [r] = await db.query(`INSERT INTO Player (name, username, email, phone, age, country) VALUES (?, ?, ?, ?, ?, ?)`, [name, username, email, phone || null, age || null, country || 'India']);
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
        const [rows] = await db.query(`SELECT t.*, p.name AS captain_name, COUNT(DISTINCT tm.player_id) AS member_count FROM Team t LEFT JOIN Player p ON t.captain_id = p.player_id LEFT JOIN Team_Members tm ON t.team_id = tm.team_id GROUP BY t.team_id ORDER BY t.team_id`);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});
app.get('/api/teams/:id/members', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT p.player_id, p.name, p.username, p.country, tm.role, tm.joined_date FROM Player p JOIN Team_Members tm ON p.player_id = tm.player_id WHERE tm.team_id = ?`, [req.params.id]);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});
app.post('/api/teams', requireAdmin, async (req, res) => {
    const { team_name, captain_id, logo_url } = req.body;
    if (!team_name) return res.status(400).json({ error: 'team_name required' });
    try {
        const [r] = await db.query('INSERT INTO Team (team_name, captain_id, logo_url) VALUES (?, ?, ?)', [team_name, captain_id || null, logo_url || null]);
        if (captain_id) await db.query("INSERT IGNORE INTO Team_Members (team_id, player_id, role) VALUES (?, ?, 'Captain')", [r.insertId, captain_id]);
        res.status(201).json({ message: 'Team created', team_id: r.insertId });
    } catch (err) { sendError(res, err); }
});
app.put('/api/teams/:id', requireAdmin, async (req, res) => {
    const { team_name, logo_url, captain_id } = req.body;
    if (!team_name) return res.status(400).json({ error: 'team_name required' });
    try {
        await db.query('UPDATE Team SET team_name = ?, logo_url = ?, captain_id = ? WHERE team_id = ?', [team_name, logo_url || null, captain_id || null, req.params.id]);
        res.json({ message: 'Team updated' });
    } catch (err) { sendError(res, err); }
});
app.put('/api/teams/:id/logo', requireAdmin, async (req, res) => {
    const { logo_url } = req.body;
    try {
        await db.query('UPDATE Team SET logo_url = ? WHERE team_id = ?', [logo_url || null, req.params.id]);
        res.json({ message: 'Logo updated' });
    } catch (err) { sendError(res, err); }
});
app.delete('/api/teams/:id', requireAdmin, async (req, res) => {
    try { await db.query('DELETE FROM Team WHERE team_id = ?', [req.params.id]); res.json({ message: 'Team deleted' }); }
    catch (err) { sendError(res, err); }
});
app.post('/api/teams/:id/members', requireAdmin, async (req, res) => {
    const { player_id, role } = req.body;
    if (!player_id) return res.status(400).json({ error: 'player_id required' });
    try {
        await db.query('INSERT INTO Team_Members (team_id, player_id, role) VALUES (?, ?, ?)', [req.params.id, player_id, role || 'Member']);
        res.status(201).json({ message: 'Player added to team' });
    } catch (err) { sendError(res, err); }
});
app.delete('/api/teams/:id/members/:playerId', requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM Team_Members WHERE team_id = ? AND player_id = ?', [req.params.id, req.params.playerId]);
        res.json({ message: 'Member removed' });
    } catch (err) { sendError(res, err); }
});

// ── TOURNAMENTS ──────────────────────────────────────────────
app.get('/api/tournaments', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT tn.*, s.sponsor_name, COUNT(DISTINCT r.team_id) AS team_count, COUNT(DISTINCT m.match_id) AS match_count FROM Tournament tn LEFT JOIN Sponsor s ON tn.sponsor_id = s.sponsor_id LEFT JOIN Registration r ON tn.tournament_id = r.tournament_id AND r.status = 'Approved' LEFT JOIN Matches m ON tn.tournament_id = m.tournament_id GROUP BY tn.tournament_id ORDER BY tn.start_date DESC`);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});
app.post('/api/tournaments', requireAdmin, async (req, res) => {
    const { tournament_name, game_name, start_date, end_date, prize_pool, sponsor_id } = req.body;
    if (!tournament_name || !game_name || !start_date || !end_date) return res.status(400).json({ error: 'Required fields missing' });
    try {
        const [r] = await db.query(`INSERT INTO Tournament (tournament_name, game_name, start_date, end_date, prize_pool, sponsor_id) VALUES (?, ?, ?, ?, ?, ?)`, [tournament_name, game_name, start_date, end_date, prize_pool || 0, sponsor_id || null]);
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
        const [rows] = await db.query(`SELECT m.*, t1.team_name AS team1_name, t2.team_name AS team2_name, tn.tournament_name, mr.score, tw.team_name AS winner_name FROM Matches m JOIN Team t1 ON m.team1_id = t1.team_id JOIN Team t2 ON m.team2_id = t2.team_id JOIN Tournament tn ON m.tournament_id = tn.tournament_id LEFT JOIN Match_Result mr ON m.match_id = mr.match_id LEFT JOIN Team tw ON mr.winner_team_id = tw.team_id ORDER BY m.scheduled_at DESC`);
        res.json(rows);
    } catch (err) { sendError(res, err); }
});
app.post('/api/matches', requireAdmin, async (req, res) => {
    const { tournament_id, team1_id, team2_id, scheduled_at, venue, round } = req.body;
    if (!tournament_id || !team1_id || !team2_id || !scheduled_at) return res.status(400).json({ error: 'Required fields missing' });
    try {
        const [r] = await db.query(`INSERT INTO Matches (tournament_id, team1_id, team2_id, scheduled_at, venue, round) VALUES (?, ?, ?, ?, ?, ?)`, [tournament_id, team1_id, team2_id, scheduled_at, venue || 'Online', round || 'Group Stage']);
        res.status(201).json({ message: 'Match scheduled', match_id: r.insertId });
    } catch (err) { sendError(res, err); }
});
app.post('/api/matches/:id/result', requireAdmin, async (req, res) => {
    const { winner_team_id, loser_team_id, score } = req.body;
    if (!winner_team_id || !loser_team_id) return res.status(400).json({ error: 'winner and loser required' });
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(`INSERT INTO Match_Result (match_id, winner_team_id, loser_team_id, score) VALUES (?, ?, ?, ?)`, [req.params.id, winner_team_id, loser_team_id, score || null]);
        await conn.commit();
        res.status(201).json({ message: 'Result recorded.' });
    } catch (err) { await conn.rollback(); sendError(res, err); }
    finally { conn.release(); }
});

// ── LEADERBOARD, SPONSORS, REWARDS, STATS ───────────────────
app.get('/api/leaderboard', async (req, res) => {
    try { const [r] = await db.query('SELECT * FROM leaderboard'); res.json(r); } catch (err) { sendError(res, err); }
});
app.get('/api/sponsors', async (req, res) => {
    try { const [r] = await db.query('SELECT * FROM Sponsor ORDER BY amount DESC'); res.json(r); } catch (err) { sendError(res, err); }
});
app.post('/api/sponsors', requireAdmin, async (req, res) => {
    const { sponsor_name, industry, contact_email, amount } = req.body;
    if (!sponsor_name) return res.status(400).json({ error: 'sponsor_name required' });
    try {
        const [r] = await db.query('INSERT INTO Sponsor (sponsor_name, industry, contact_email, amount) VALUES (?, ?, ?, ?)', [sponsor_name, industry || null, contact_email || null, amount || 0]);
        res.status(201).json({ message: 'Sponsor added', sponsor_id: r.insertId });
    } catch (err) { sendError(res, err); }
});
app.get('/api/rewards', async (req, res) => {
    try {
        const [r] = await db.query(`SELECT rw.*, t.team_name, tn.tournament_name FROM Reward rw JOIN Team t ON rw.team_id = t.team_id JOIN Tournament tn ON rw.tournament_id = tn.tournament_id ORDER BY rw.prize_amount DESC`);
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


// ── RAZORPAY PAYMENT ────────────────────────────────────────
const Razorpay = require('razorpay');
const crypto   = require('crypto');

const razorpay = new Razorpay({
    key_id:     'rzp_test_SRmL5nItHHoEOl',
    key_secret: 'aNhZRkgwAn0Ej1hf4l3BYRVw'
});

// Create Razorpay order
app.post('/api/payment/create-order', requireAdmin, async (req, res) => {
    const { amount, team_name } = req.body;
    if (!amount || !team_name) return res.status(400).json({ error: 'amount and team_name required' });
    try {
        const options = {
            amount:   amount * 100,   // paise
            currency: 'INR',
            receipt:  `team_${Date.now()}`,
            notes:    { team_name }
        };
        const order = await razorpay.orders.create(options);

        // Save pending payment
        await db.query(
            `INSERT INTO Payment (razorpay_order_id, team_name, amount, status, paid_by)
             VALUES (?, ?, ?, 'Pending', ?)`,
            [order.id, team_name, amount, req.session.adminName || 'Admin']
        );

        res.json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: 'rzp_test_SRmL5nItHHoEOl' });
    } catch (err) { sendError(res, err); }
});

// Verify payment signature
app.post('/api/payment/verify', requireAdmin, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    try {
        const body      = razorpay_order_id + '|' + razorpay_payment_id;
        const expected  = crypto.createHmac('sha256', 'aNhZRkgwAn0Ej1hf4l3BYRVw')
                                .update(body).digest('hex');
        const isValid   = expected === razorpay_signature;

        await db.query(
            `UPDATE Payment SET status = ?, razorpay_payment_id = ? WHERE razorpay_order_id = ?`,
            [isValid ? 'Success' : 'Failed', razorpay_payment_id, razorpay_order_id]
        );

        if (isValid) {
            res.json({ verified: true, message: 'Payment successful!' });
        } else {
            res.status(400).json({ verified: false, message: 'Payment verification failed.' });
        }
    } catch (err) { sendError(res, err); }
});

// Get all payments
app.get('/api/payments', requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Payment ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { sendError(res, err); }
});


// ── START ────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🎮  E-Sports Server v3.0 → http://localhost:${PORT}`);
    console.log(`🔐  Admin Login         → http://localhost:${PORT}/admin-login.html`);
    console.log(`📧  Email Verification  → ENABLED via Nodemailer`);
    console.log(`✅  MySQL + Gmail ready`);
});