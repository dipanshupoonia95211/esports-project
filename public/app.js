// ============================================================
//  E-SPORTS MANAGEMENT — SHARED JAVASCRIPT v2.0
// ============================================================

const API = 'http://localhost:3000/api';

// ── AUTH HELPERS ───────────────────────────────────────────
function requireAuth() {
    const admin = getAdminSession();
    if (!admin) { window.location.href = 'admin-login.html'; return false; }
    return true;
}
function getAdminSession() {
    try { return JSON.parse(localStorage.getItem('esports_admin')); } catch { return null; }
}
function setAdminSession(data) {
    localStorage.setItem('esports_admin', JSON.stringify(data));
}
function clearAdminSession() {
    localStorage.removeItem('esports_admin');
}
async function logout() {
    try { await fetch('http://localhost:3000/admin/logout', { method: 'POST', credentials: 'include' }); } catch(e) {}
    clearAdminSession();
    window.location.href = 'admin-login.html';
}

// ── SIDEBAR ────────────────────────────────────────────────
function renderSidebar(activePage) {
    const admin = getAdminSession();
    const nav = [
        { href: 'index.html',       icon: '📊', label: 'Dashboard'   },
        { href: 'players.html',     icon: '👤', label: 'Players'     },
        { href: 'teams.html',       icon: '🛡️', label: 'Teams'       },
        { href: 'tournaments.html', icon: '🏆', label: 'Tournaments' },
        { href: 'matches.html',     icon: '⚔️', label: 'Matches'     },
        { href: 'leaderboard.html', icon: '🎖️', label: 'Leaderboard' },
        { href: 'position.html',    icon: '🔍', label: 'Position'    },
    ];

    const links = nav.map(item => `
        <a href="${item.href}" class="${item.label === activePage ? 'active' : ''}">
            <span class="nav-icon">${item.icon}</span> ${item.label}
        </a>`).join('');

    const adminBar = admin ? `
        <div style="padding:12px 20px 8px;border-top:1px solid var(--border)">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);letter-spacing:1px;margin-bottom:8px">LOGGED IN AS</div>
            <div style="font-size:13px;font-weight:600;color:var(--neon-green);margin-bottom:10px">⚡ ${admin.name}</div>
            <button onclick="logout()" class="btn btn-danger btn-sm" style="width:100%;justify-content:center">Logout</button>
        </div>` : '';

    return `
    <aside class="sidebar">
        <div class="sidebar-logo">
            <div class="logo-icon">🎮</div>
            <h1>E-Sports<br>Manager</h1>
            <p>v2.0 — DBMS PROJECT</p>
        </div>
        <nav class="sidebar-nav">
            <div class="nav-section-title">Navigation</div>
            ${links}
        </nav>
        ${adminBar}
        <div class="sidebar-footer">ESPORTS_DB · MYSQL · NODE.JS</div>
    </aside>`;
}

// ── FETCH HELPERS ──────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
    const res = await fetch(API + endpoint, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}
async function apiGet(ep)       { return apiFetch(ep); }
async function apiPost(ep, b)   { return apiFetch(ep, { method: 'POST', body: JSON.stringify(b) }); }
async function apiDelete(ep)    { return apiFetch(ep, { method: 'DELETE' }); }

// ── DOM HELPERS ────────────────────────────────────────────
function showAlert(id, message, type = 'success') {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.className = `alert alert-${type} show`;
    setTimeout(() => el.classList.remove('show'), 4000);
}
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function loadingRow(cols) {
    return `<tr><td colspan="${cols}"><div class="loading"><div class="spinner"></div> Loading data...</div></td></tr>`;
}
function emptyRow(cols, msg = 'No records found') {
    return `<tr><td colspan="${cols}"><div class="empty-state"><div class="empty-icon">📭</div><p>${msg}</p></div></td></tr>`;
}

// ── BADGE HELPERS ──────────────────────────────────────────
function statusBadge(status) {
    const map = {
        'Approved':'badge-green','Ongoing':'badge-green','Completed':'badge-cyan',
        'Pending':'badge-orange','Upcoming':'badge-purple','Scheduled':'badge-purple',
        'Live':'badge-orange','Rejected':'badge-muted',
        'Gold':'badge-cyan','Silver':'badge-muted','Bronze':'badge-orange',
        'Participation':'badge-purple',
    };
    return `<span class="badge ${map[status] || 'badge-muted'}">${status}</span>`;
}

// ── FORMAT HELPERS ─────────────────────────────────────────
function fmtDate(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}
function fmtDateTime(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function fmtMoney(n) {
    if (n == null) return '—';
    return '₹' + Number(n).toLocaleString('en-IN');
}

// Close modal on overlay click
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});