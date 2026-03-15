# 🎮 E-Sports Management System
**Full Stack: MySQL + Node.js + Express + HTML/CSS/JS**

---

## 📁 Project Structure

```
esports/
├── schema.sql          ← Complete database (run this first)
├── server.js           ← Express backend (Node.js)
├── package.json        ← Dependencies
└── public/
    ├── style.css       ← Shared styles (cyberpunk theme)
    ├── app.js          ← Shared JS utilities + sidebar
    ├── index.html      ← Dashboard
    ├── players.html    ← Players management
    ├── teams.html      ← Teams management
    ├── tournaments.html← Tournaments + registration
    ├── matches.html    ← Match scheduling + result entry
    └── leaderboard.html← Rankings, podium, rewards
```

---

## ⚙️ Setup Instructions

### Step 1 — Database Setup
```bash
# Open MySQL Workbench or terminal and run:
mysql -u root -p < schema.sql

# OR paste schema.sql content into MySQL Workbench and execute
```

### Step 2 — Update DB password in server.js
Open `server.js` and find this line (around line 22):
```js
password: '',  // ← change to your MySQL password
```

### Step 3 — Install Node.js dependencies
```bash
cd esports
npm install
```

### Step 4 — Start the backend server
```bash
npm start
# Server runs at http://localhost:3000
```

### Step 5 — Open the frontend
Open your browser and go to:
```
http://localhost:3000
```
That's it! All HTML pages are served from `public/`.

---

## 🗄️ Database Summary

| Table          | Records   | Description                      |
|----------------|-----------|----------------------------------|
| Player         | 10        | Registered players               |
| Team           | 5         | Competitive teams                |
| Team_Members   | 10        | M:N players ↔ teams              |
| Tournament     | 2         | Active tournaments               |
| Registration   | 7         | Team ↔ tournament registrations  |
| Matches        | 10        | Scheduled / completed matches    |
| Match_Result   | 8+        | Results (trigger updates ranking)|
| Ranking        | 5         | Live leaderboard data            |
| Sponsor        | 3         | Tournament sponsors              |
| Reward         | 4         | Prize awards                     |

---

## 🔌 API Endpoints

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | /api/stats                      | Dashboard summary stats  |
| GET    | /api/players                    | All players + team info  |
| POST   | /api/players                    | Add new player           |
| DELETE | /api/players/:id                | Delete player            |
| GET    | /api/teams                      | All teams + member count |
| POST   | /api/teams                      | Create team              |
| GET    | /api/teams/:id/members          | Team roster              |
| GET    | /api/tournaments                | All tournaments          |
| POST   | /api/tournaments                | Create tournament        |
| POST   | /api/tournaments/:id/register   | Register team            |
| GET    | /api/matches                    | All matches              |
| POST   | /api/matches                    | Schedule match           |
| POST   | /api/matches/:id/result         | Record result (→ trigger)|
| GET    | /api/leaderboard                | Leaderboard (from VIEW)  |
| GET    | /api/sponsors                   | All sponsors             |
| GET    | /api/rewards                    | All rewards              |

---

## 📚 DBMS Features Covered

✅ **Normalization** — UNF → 1NF → 2NF → 3NF (see schema.sql comments)  
✅ **DDL** — CREATE TABLE with PRIMARY KEY, FOREIGN KEY, CHECK, UNIQUE  
✅ **DML** — INSERT with 10 players, 5 teams, 2 tournaments, 10 matches  
✅ **Views** — `leaderboard`, `match_schedule`, `player_team_view`  
✅ **Triggers** — Auto-update Ranking + Match status after result insert  
✅ **Cursor** — Stored procedure `show_team_rankings()` with CURSOR  
✅ **Transactions** — START TRANSACTION / COMMIT / SAVEPOINT / ROLLBACK  
✅ **Locking** — `SELECT ... FOR UPDATE` example in schema.sql  
✅ **Aggregate** — COUNT, SUM, AVG  
✅ **Joins** — INNER, LEFT JOIN across 5+ tables  
✅ **Subqueries** — WHERE IN (SELECT ...) pattern  
✅ **Set Operations** — UNION query  

---

## 🎬 Demo Flow (for viva)

1. Open Dashboard — show live stats
2. Go to Players → Add a new player
3. Go to Teams → Create a team, view roster
4. Go to Tournaments → Create tournament, register team
5. Go to Matches → Schedule a match, enter result
6. Go to Leaderboard — show ranking updated by trigger

---

*Built with MySQL · Node.js · Express · HTML/CSS/JS*
