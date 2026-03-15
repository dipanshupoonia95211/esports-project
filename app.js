// ============================================================
//  E-SPORTS MANAGEMENT — SHARED JAVASCRIPT
// ============================================================

const API = 'http://localhost:3000/api';

// ── Sidebar Injection ──────────────────────────────────────
function renderSidebar(activePage) {
    const nav = [
        { href: 'index.html',       icon: '📊', label: 'Dashboard'   },
        { href: 'players.html',     icon: '👤', label: 'Players'     },
        { href: 'teams.html',       icon: '🛡️', label: 'Teams'       },
        { href: 'tournaments.html', icon: '🏆', label: 'Tournaments' },
        { href: 'matches.html',     icon: '⚔️', label: 'Matches'     },
        { href: 'leaderboard.html', icon: '🎖️', label: 'Leaderboard' },
    ];

    const links = nav.map(item => `
        <a href="${item.href}" class="${item.label === activePage ? 'active' : ''}">
            <span class="nav-icon">${item.icon}</span> ${item.label}
        </a>
    `).join('');

    return `
    <aside class="sidebar">
        <div class="sidebar-logo">
            <div class="logo-icon">🎮</div>
            <h1>E-Sports<br>Manager</h1>
            <p>v1.0 — DBMS PROJECT</p>
        </div>
        <nav class="sidebar-nav">
            <div class="nav-section-title">Navigation</div>
            ${links}
        </nav>
        <div class="sidebar-footer">
            ESPORTS_DB · MYSQL · NODE.JS
        </div>
    </aside>`;
}

// ── Fetch helpers ──────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
    const res = await fetch(API + endpoint, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

async function apiGet(endpoint)           { return apiFetch(endpoint); }
async function apiPost(endpoint, body)    { return apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }); }
async function apiDelete(endpoint)        { return apiFetch(endpoint, { method: 'DELETE' }); }

// ── DOM Helpers ────────────────────────────────────────────
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

// ── Badge Helpers ──────────────────────────────────────────
function statusBadge(status) {
    const map = {
        'Approved':  'badge-green',
        'Ongoing':   'badge-green',
        'Completed': 'badge-cyan',
        'Pending':   'badge-orange',
        'Upcoming':  'badge-purple',
        'Scheduled': 'badge-purple',
        'Live':      'badge-orange',
        'Rejected':  'badge-muted',
        'Gold':      'badge-cyan',
        'Silver':    'badge-muted',
        'Bronze':    'badge-orange',
    };
    return `<span class="badge ${map[status] || 'badge-muted'}">${status}</span>`;
}

function rewardBadge(type) {
    const icons = { Gold: '🥇', Silver: '🥈', Bronze: '🥉', Participation: '🎖️' };
    return `${icons[type] || ''} ${type}`;
}

// ── Format helpers ─────────────────────────────────────────
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

// ── Close modal on overlay click ──────────────────────────
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
    }
});
