# ⚔ KnightCode — CodeArena  
## Architecture & System Design Plan  
*Ancient Codex Edition — Version 1.0 — March 2026*

---

## 1. Executive Overview

**KnightCode CodeArena** is a competitive coding and interview-preparation platform rendered in the **Ancient Codex** visual language — warm sepia, antique gold, and obsidian black. It unifies DSA learning, real-time 1v1 battles, weekly contests, a code-quality judge, AI-driven recommendations, and a community discussion layer into a single, beautifully themed experience.

The product follows the full CodeArena PRD v1.0, substituting the PRD's *Midnight Ocean* design tokens with the *Ancient Codex* palette and renaming all navigation labels, DSA topics, badges, and UI copy to match the archaeological theme.

---

## 2. Ancient Codex Design System

### 2.1 Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#1A1208` | Page background — warm charcoal, aged parchment |
| `--surface` | `#0D0B09` | Sidebar, cards, modals — pure obsidian |
| `--surface-raised` | `#211A0E` | Hover/selected card surface |
| `--gold-dim` | `#B8902A` | Tarnished gold — borders, secondary accents |
| `--gold-mid` | `#D4A83C` | Mid antique gold — labels, icons |
| `--gold-bright` | `#E8C060` | Polished gold — CTAs, active states, glow |
| `--gold-glow` | `rgba(232,192,96,0.18)` | Shadow glow, aura effects |
| `--text` | `#F0E0B0` | Ink-cream — primary text on dark bg |
| `--text-muted` | `#9A8060` | Secondary text, metadata |
| `--success` | `#6DBF8A` | AC verdict — muted sage green |
| `--error` | `#C05A4A` | WA / TLE / error — warm terracotta |
| `--warn` | `#C89040` | MLE / RE — amber |

### 2.2 Typography Stack

```css
/* Loaded from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=IM+Fell+English:ital@0;1&family=JetBrains+Mono:wght@400;600&display=swap');

--font-display:   'Playfair Display', Georgia, serif;     /* Headings, hero */
--font-body:      'IM Fell English', Georgia, serif;       /* Body prose, descriptions */
--font-code:      'JetBrains Mono', 'Courier New', mono;  /* All code blocks */
--font-ui:        'Playfair Display', serif;               /* Nav labels, badges */
```

### 2.3 Texture & Grain Layer

```html
<!-- SVG grain filter — applied as a fixed overlay on <body> -->
<svg class="grain-overlay" xmlns="http://www.w3.org/2000/svg">
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feBlend in="SourceGraphic" mode="overlay" result="blend"/>
    <feComposite in="blend" in2="SourceGraphic" operator="atop"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#grain)" opacity="0.04"/>
</svg>
```

Cross-hatch SVG pattern for sidebar background:
```css
.sidebar {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M0 0 L8 8 M8 0 L0 8' stroke='%23B8902A' stroke-width='0.3' opacity='0.12'/%3E%3C/svg%3E");
  background-color: var(--surface);
}
```

### 2.4 Three.js Background — Sacred Geometry

Sacred geometry floating artifact scene — replaces plain gradient backgrounds on Sanctum (home) and Colosseum (battles) pages.

```js
// src/three/SacredGeometry.js
import * as THREE from 'three';

const SHAPES = [
  () => new THREE.OctahedronGeometry(0.4),
  () => new THREE.TetrahedronGeometry(0.5),
  () => new THREE.IcosahedronGeometry(0.35),
];

const AMBER_LIGHT = 0xD4831A;   // warm amber point light
const SIENNA_LIGHT = 0x8B4513;  // sienna fill light
const GOLD_EMISSIVE = 0x4A3010; // subtle emissive on geometry

// Material — wireframe + translucent fill
const wireMat = new THREE.MeshPhongMaterial({
  color: 0xB8902A, wireframe: true,
  transparent: true, opacity: 0.18,
  emissive: GOLD_EMISSIVE,
});
```

- **30 artifacts** placed in a 20×20×12 volume, randomly rotated
- **Two point lights**: amber (`#D4831A`, intensity 0.8) + sienna (`#8B4513`, intensity 0.3)
- **Slow drift** on each mesh: `mesh.rotation.y += 0.0008 * drift_factor`
- **Camera fov 60**, subtle auto-pan on mouse move (±5° yaw, ±3° pitch)
- Rendered into a `<canvas>` behind all page content via `position: fixed; z-index: -1`

### 2.5 Card Anatomy — Gold Leaf Inlay

Every major card gets:
```css
.codex-card {
  background: var(--surface);
  border: 1px solid var(--gold-dim);
  border-radius: 10px;
  box-shadow: 0 0 0 1px rgba(184,144,42,0.08), 0 8px 32px rgba(0,0,0,0.5);
}
/* Top-edge gold leaf accent */
.codex-card::before {
  content: '';
  display: block;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold-mid), var(--gold-bright), var(--gold-mid), transparent);
  border-radius: 10px 10px 0 0;
}
/* Ghost watermark emblem */
.codex-card::after {
  content: '⚔';
  position: absolute; bottom: 12px; right: 16px;
  font-size: 5rem; color: var(--gold-bright);
  opacity: 0.02; pointer-events: none; user-select: none;
}
```

---

## 3. Application Pages — 7 Pages

| # | Route | Ancient Codex Name | PRD Section |
|---|---|---|---|
| 1 | `/` | **Sanctum** | Homepage / Recommendations |
| 2 | `/colosseum` | **Colosseum** | 1v1 Battles + Contests |
| 3 | `/forge` | **Forge** | Code Editor / Problem Solver |
| 4 | `/scrolls` | **Scrolls** | DSA Roadmap |
| 5 | `/tomes` | **Tomes** | Problem Bank |
| 6 | `/chronicle` | **Chronicle** | System Design Articles |
| 7 | `/sanctum/:username` | **Profile** | User Dashboard & Analytics |

### 3.1 Page 1 — Sanctum (Homepage)

**Goal**: Engaging landing + personalized feed for logged-in users.

**Sections**:
- **Hero band** — Three.js sacred geometry canvas behind large italic serif headline:  
  *"Sharpen thy blade. The arena awaits."*  
  Two CTAs: `Enter the Colosseum` (gold filled) · `Study the Scrolls` (ghost)
- **For You Carousel** — 6 recommended problems (PRD §5.6.2), cards with acceptance %, topic tag badge (antique parchment pill), difficulty glyph (✦ Easy · ✦✦ Medium · ✦✦✦ Hard)
- **Stretch Challenge tile** — 1 hard problem above comfort zone; card uses `--gold-bright` border glow
- **Revisit Parchment** — 3 previously-attempted unsolved problems
- **Hall of Scribes preview** — top 5 leaderboard table, `342 scribes active` badge, links to full Chronicle
- **Weekly Dispatch banner** — This week's new question batch, countdown to next Monday refresh

**Layout**: two-column (sidebar + main) on desktop; single-column on mobile.

---

### 3.2 Page 2 — Colosseum (Battles & Contests)

**Goal**: Hub for all competitive activities.

**Tabs**: `1v1 Duels` · `Weekly Trial` · `Past Trials`

#### 1v1 Duel Panel
- Room config form (Match Type, Category, Difficulty, Time, Language)
- `Seek an Opponent` button → triggers Socket.io matchmaking
- **Active duel card** while waiting: animated parchment spinner + *"Seeking a worthy opponent…"*
- **Private room** — shows 6-char rune code, share icon

#### Weekly Trial (Contest) Panel
- Current contest: **Trial XLVII** (Roman numerals per PRD requirement)
- Countdown timer to start / end (18:00 UTC Sunday)
- Problem list grid: **I · II · III · IV** sub-headings for 4 problems
- Live leaderboard: **Hall of Scribes** — WebSocket-fed ranking table
- `Join Trial` / `Virtual Trial` (past) buttons

#### Past Trials Tab
- List of past contests with date, participant count, top 3 finishers
- `Attempt Virtual Trial` → redirects to read-only contest room (unrated)

---

### 3.3 Page 3 — Forge (Code Editor / Problem Solver)

**Goal**: Distraction-free coding environment. Most complex UI page.

**Layout** — Three-panel split:

```
┌─────────────────────────────────────────────────────────────────┐
│  PROBLEM PANE (35%)          │  CODE EDITOR (65%)               │
│  ─ Title (Playfair italic)   │  JetBrains Mono, dark obsidian  │
│  ─ Archaic description prose │  Language picker (top-right)     │
│  ─ Constraints               │  Run · Submit buttons (gold)     │
│  ─ Examples                  ├────────────────────────────────── │
│  ─ Tags & Acceptance %       │  TEST RESULTS PANEL (collapsible)│
│  ─ Discussion tab            │  Verdict badge · Execution stats │
│  ─ Report Issue              │  Quality Score ring (0–100)      │
└────────────────────────────────────────────────────────────────-┘
```

**Key UI elements**:
- **Problem description** uses archaic prose tone:  
  *"Canst thou solve this in O(n log n) time? The ancients demand it."*
- **Acceptance badge**: `⚱ 67.3% acceptance` (urn glyph)
- **Verdict banner**: sticky bottom bar — `✦ AC — Thy code hath passed all trials` in `--success` green
- **Quality Score**: Circular SVG progress ring in gold, labeled **Codex Clarity Score**
- **Code editor**: Monaco Editor (or CodeMirror 6) with a custom obsidian/gold syntax theme
- **Battle overlay** (when in Colosseum duel): split screen — opponent's progress bar at top, timer countdown

---

### 3.4 Page 4 — Scrolls (DSA Roadmap)

**Goal**: Sequenced learning path across 15 topics (12 core DSA + 3 advanced).

**Tome naming** (matches PRD §5.1 topic table):

| Tome | Topic |
|---|---|
| Tome I | Arrays & Strings |
| Tome II | Hashing |
| Tome III | Two Pointers |
| Tome IV | Sorting & Searching |
| Tome V | Linked Lists |
| Tome VI | Stacks & Queues |
| Tome VII | Trees |
| Tome VIII | Heaps / Priority Queues |
| Tome IX | Graphs |
| Tome X | Dynamic Programming |
| Tome XI | Greedy Algorithms |
| Tome XII | Tries |
| Tome XIII | Segment Trees / BIT |
| Tome XIV | Backtracking |
| Tome XV | System Design Concepts |

**Visual design**:
- Vertical scrolling path with connecting lines (SVG bezier curves in `--gold-dim`)
- Each Tome = card with: Roman numeral badge, topic name in Playfair italic, progress ring (% complete), prerequisite lock icon if incomplete
- Completed tomes: full gold ring + `✦ Mastered` label
- Click a Tome → expands to show sub-topics and problem counts per difficulty tier

---

### 3.5 Page 5 — Tomes (Problem Bank)

**Goal**: Filterable, searchable problem list for DSA, CP, and Interview questions.

**Filter bar** (horizontal, top):
- Category tabs: `All · DSA · Competitive · Interview`
- Difficulty: `✦ Easy · ✦✦ Medium · ✦✦✦ Hard`
- Topic multi-select (Tome I–XV)
- CP Rating slider (800–3500) — shown only in Competitive tab
- Sort: `Acceptance ↑ · Acceptance ↓ · Difficulty · Newest`
- `🔍 Search by title`

**Problem table**:

| # | Title | Acceptance | Difficulty | Tags | Companies |
|---|---|---|---|---|---|

- Hovering a row reveals a quick-preview tooltip card (problem summary, constraints)
- `★ Weekly` badge on new-this-week problems
- Click row → navigates to `/forge/:slug`

---

### 3.6 Page 6 — Chronicle (System Design Articles)

**Goal**: Curated system design reading library.

**Layout**:
- Left sidebar: article index (Playfair italic headings), categorized by theme (Storage, Compute, Scaling, etc.)
- Main area: article rendered in `IM Fell English` serif, with embedded architecture diagrams (SVG)
- Right aside: related interview-tagged problems (links to Tomes/Forge)

**Article card** on listing page:
- `📜` scroll icon, title in Playfair, excerpt in IM Fell English, `New` rune badge if < 2 weeks old
- Read time estimate, difficulty badge (`Scribe Level · Master Level`)

---

### 3.7 Page 7 — Profile (Sanctum of `:username`)

**Goal**: Comprehensive personal analytics dashboard.

**Sections** (vertical stack):

#### Header Band
- Avatar + username in large Playfair italic
- Ratings display: `⚔ DSA 1420 · ⚔ CP 1680 · ⚔ Interview 1310`
- Global rank & percentile gauge
- Badge shelf — earned badges (renamed per §4.1 Badges)

#### Submission Heatmap
- GitHub-style calendar grid → cells colored from `--surface` (none) to `--gold-bright` (many)
- Axis labels in JetBrains Mono, `--text-muted` weight

#### Analytics Cluster (2×2 grid)
| Chart | Library | Data |
|---|---|---|
| **Learning Rate** line chart | D3.js | 7-day rolling problem completion |
| **Tome Mastery** radar/spider | D3.js | Acceptance % per topic |
| **Difficulty Distribution** donut | D3.js | Easy / Medium / Hard solved |
| **Contest Lineage** line chart | D3.js | Contest rating over time |

All D3 charts use `--gold-bright` primary stroke, `--gold-dim` grid lines, `--text-muted` axis labels, `--bg` background.

#### Badge Collection
Renamed badges:

| Badge | Renamed | Trigger |
|---|---|---|
| Ignition | **First Flame** | First problem solved |
| 7-Day Streak | **The Weekly Vigil** | 7-day streak |
| 30-Day Streak | **Eternal Flame** | 30-day streak |
| Century | **The Century** | 100 problems solved |
| Topic Master | **Sacred Relic** | All tiers done in a topic |
| Arena Champion | **Gladiator's Crest** | 10 rated battle wins |
| Contest Top 10 | **Hall of Scribes** | Top 10 in weekly trial |
| Clean Coder | **Clean Codex** | Avg quality score ≥ 85 |
| Solution Author | **The Illuminator** | 5 solutions upvoted 10+ times |
| Bug Hunter | **The Chronicler** | 3 accepted problem reports |

---

## 4. Full-Stack Architecture

### 4.1 Monorepo Structure (Turborepo)

```
knightcode/
├── apps/
│   ├── web/                  ← React 18 + Vite SPA
│   └── api/                  ← Node.js + Express 5 API server
├── packages/
│   ├── ui/                   ← Shared Ancient Codex component library
│   ├── types/                ← TypeScript shared types (User, Problem, Submission)
│   ├── config/               ← ESLint, Tailwind, TS configs
│   └── judge-client/         ← Judge0 API wrapper
├── services/
│   ├── judge/                ← Docker sandboxed judge service
│   └── realtime/             ← Socket.io namespace manager
├── infra/
│   ├── docker-compose.yml    ← Local dev stack
│   └── k8s/                  ← Kubernetes production manifests
└── turbo.json
```

### 4.2 Frontend Architecture (`apps/web`)

```
apps/web/src/
├── main.jsx                  ← Vite entry, providers
├── App.jsx                   ← React Router v6 route definitions
├── pages/
│   ├── Sanctum/              ← Homepage
│   ├── Colosseum/            ← Battles & Contests
│   ├── Forge/                ← Code editor
│   ├── Scrolls/              ← DSA roadmap
│   ├── Tomes/                ← Problem bank
│   ├── Chronicle/            ← System design articles
│   └── Profile/              ← User analytics dashboard
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx      ← Sidebar + topbar wrapper
│   │   ├── Sidebar.jsx       ← Navigation (Sanctum · Colosseum · Forge…)
│   │   └── Topbar.jsx        ← Search, user avatar, notifications
│   ├── codex/                ← Ancient Codex design system components
│   │   ├── CodexCard.jsx     ← Gold-leaf inlay card
│   │   ├── GoldButton.jsx    ← Primary / ghost CTA
│   │   ├── VerdictBanner.jsx ← AC / WA / TLE / RE / CE / MLE result display
│   │   ├── TomeChip.jsx      ← DSA topic badge pill
│   │   ├── DifficultyGlyph.jsx ← ✦ · ✦✦ · ✦✦✦
│   │   └── QualityRing.jsx   ← SVG circular progress, 0–100
│   ├── three/
│   │   └── SacredGeometryCanvas.jsx ← Three.js scene, fixed bg
│   ├── editor/
│   │   ├── MonacoEditor.jsx  ← Monaco instance with codex theme
│   │   └── TestResultPanel.jsx
│   ├── charts/               ← D3.js chart wrappers
│   │   ├── HeatmapChart.jsx
│   │   ├── RadarChart.jsx
│   │   ├── DonutChart.jsx
│   │   └── LineChart.jsx
│   └── realtime/
│       ├── BattleRoom.jsx    ← Socket.io battle consumer
│       └── ContestBoard.jsx  ← Socket.io contest leaderboard
├── hooks/
│   ├── useSocket.js          ← Persistent Socket.io connection
│   ├── useAuth.js            ← JWT auth state
│   ├── useSubmission.js      ← Submit code, poll verdict
│   └── useRecommendations.js
├── store/
│   ├── authSlice.js          ← Redux Toolkit auth state
│   ├── battleSlice.js
│   └── contestSlice.js
├── api/                      ← Axios instance + endpoint fns
│   ├── client.js
│   ├── problems.js
│   ├── submissions.js
│   ├── battles.js
│   └── users.js
└── styles/
    ├── globals.css           ← CSS custom properties (Ancient Codex tokens)
    ├── typography.css
    └── animations.css        ← Micro-animation keyframes
```

**Routing** (React Router v6):

```jsx
<Routes>
  <Route path="/"                  element={<Sanctum />} />
  <Route path="/colosseum"         element={<Colosseum />} />
  <Route path="/forge/:slug"       element={<Forge />} />
  <Route path="/forge/battle/:id"  element={<Forge battleMode />} />
  <Route path="/scrolls"           element={<Scrolls />} />
  <Route path="/tomes"             element={<Tomes />} />
  <Route path="/chronicle"         element={<Chronicle />} />
  <Route path="/chronicle/:slug"   element={<ChronicleArticle />} />
  <Route path="/sanctum/:username" element={<Profile />} />
  <Route path="/login"             element={<AuthPage mode="login" />} />
  <Route path="/register"          element={<AuthPage mode="register" />} />
</Routes>
```

### 4.3 Backend Architecture (`apps/api`)

```
apps/api/src/
├── server.js                 ← Express app factory + Socket.io attach
├── routes/
│   ├── auth.routes.js
│   ├── problems.routes.js
│   ├── submissions.routes.js
│   ├── battles.routes.js
│   ├── contests.routes.js
│   ├── users.routes.js
│   ├── articles.routes.js
│   └── recommendations.routes.js
├── controllers/              ← Route handlers (thin)
├── services/
│   ├── AuthService.js        ← JWT issue/verify, bcrypt
│   ├── ProblemService.js     ← CRUD + acceptance rate refresh
│   ├── SubmissionService.js  ← Queue submission, fetch verdict
│   ├── JudgeService.js       ← Judge0 API client wrapper
│   ├── QualityService.js     ← Static analysis score aggregation
│   ├── BattleService.js      ← ELO calculation, room management
│   ├── ContestService.js     ← Scoring, time-penalty, rating update
│   ├── RecommendationService.js ← Weak area + ramp-up signals
│   └── BadgeService.js       ← Trigger evaluation + award
├── sockets/
│   ├── BattleNamespace.js    ← /battle namespace handlers
│   └── ContestNamespace.js   ← /contest namespace handlers
├── models/                   ← Mongoose schemas
│   ├── User.model.js
│   ├── Problem.model.js
│   ├── Submission.model.js
│   ├── Battle.model.js
│   ├── Contest.model.js
│   ├── Article.model.js
│   └── Report.model.js
├── middleware/
│   ├── auth.middleware.js    ← JWT verification guard
│   ├── rateLimit.middleware.js
│   └── errorHandler.js
├── jobs/
│   ├── weeklyRefresh.job.js  ← Monday 00:00 UTC question batch
│   └── contestScheduler.job.js ← Sunday 18:00 UTC contest start
├── config/
│   ├── db.js                 ← MongoDB Atlas connection
│   ├── redis.js              ← Upstash Redis client
│   └── env.js                ← Env var validation (zod)
└── utils/
    ├── elo.js                ← ELO ΔR formula (K-factor 32/16)
    ├── learningRate.js       ← 7-day rolling average
    └── acceptanceRate.js
```

### 4.4 Real-Time System (Socket.io)

```
Client ──WSS──► API Server (Socket.io)
                      │
                ┌─────┴─────┐
           /battle ns    /contest ns
                │               │
           Redis Pub/Sub ←───────┘  (multi-instance fan-out)
```

**Battle events**:
| Event | Direction | Payload |
|---|---|---|
| `battle:join` | C→S | `{ roomId, userId }` |
| `battle:start` | S→C | `{ problem, timeLimit, opponentUsername }` |
| `battle:progress` | C→S | `{ testsPassed, totalTests }` |
| `battle:opponent_progress` | S→C | `{ testsPassed, totalTests }` |
| `battle:verdict` | S→C | `{ winner, ratingDelta, opponentCode }` |

**Contest events**:
| Event | Direction | Payload |
|---|---|---|
| `contest:leaderboard` | S→C→broadcast | Full sorted leaderboard snapshot |
| `contest:submission_ack` | S→C | `{ userId, problemIdx, verdict, points }` |

### 4.5 Code Judge Pipeline

```
User submits code
       │
  API receives POST /api/problems/submit
       │
  Executor service handles execution
       │
  Custom Docker Sandbox executes in isolated container
  (Dynamic CPU/RAM limits, no network, parallel execution)
       │
  Verdict returned: AC | WA | TLE | RE | CE
       │
  Submission record saved to MongoDB
       │
  Response to client (JSON)
```

---

## 5. Data Models

### 5.1 User

```typescript
interface User {
  _id: ObjectId;
  username: string;        // unique handle
  email: string;           // indexed, hashed in logs
  passwordHash: string;    // bcrypt, cost 12
  ratings: {
    dsa: number;           // default 1200
    cp: number;
    interview: number;
    contest: number;
  };
  streak: {
    current: number;
    longest: number;
    lastActiveDate: Date;
  };
  badges: string[];        // BadgeId enum values
  preferences: {
    language: 'cpp' | 'python' | 'java' | 'js' | 'go' | 'rust';
    theme: 'ancient_codex';  // only theme in this release
    notifications: boolean;
  };
  battleCount: number;     // determines K-factor (32 if < 30, else 16)
  createdAt: Date;
}
```

### 5.2 Problem

```typescript
interface Problem {
  _id: ObjectId;
  slug: string;            // url-friendly
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cpRating?: number;       // 800–3500 for CP type
  type: 'dsa' | 'cp' | 'interview';
  topics: string[];        // ['arrays', 'sliding-window']
  tomeNumber?: number;     // 1–15 for DSA roadmap placement
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;  // recomputed on each submission
  weeklyBatch?: Date;      // null = evergreen
  testCases: { input: string; output: string; hidden: boolean }[];
  timeLimit: number;       // ms
  memoryLimit: number;     // bytes
  description: string;     // Markdown, archaic prose tone
  companies: string[];
  createdAt: Date;
}
```

### 5.3 Submission

```typescript
interface Submission {
  _id: ObjectId;
  userId: ObjectId;
  problemId: ObjectId;
  language: 'cpp' | 'python' | 'java' | 'js' | 'go' | 'rust';
  code: string;
  verdict: 'AC' | 'WA' | 'TLE' | 'RE' | 'CE' | 'MLE' | 'PENDING';
  runtime?: number;        // ms
  memory?: number;         // KB
  qualityScore?: number;   // 0–100 composite
  battleId?: ObjectId;     // if submitted in a battle
  contestId?: ObjectId;    // if submitted in a contest
  submittedAt: Date;
}
```

### 5.4 Battle

```typescript
interface Battle {
  _id: ObjectId;
  type: 'rated' | 'unrated';
  category: 'dsa' | 'cp' | 'interview';
  difficulty: 'easy' | 'medium' | 'hard' | 'random';
  timeLimit: 15 | 30 | 45 | 60;       // minutes
  language: string;
  players: [ObjectId, ObjectId];       // [player1, player2]
  problemId: ObjectId;
  status: 'waiting' | 'active' | 'finished';
  winnerId?: ObjectId;
  ratingDeltas?: [number, number];
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
}
```

### 5.5 Contest

```typescript
interface Contest {
  _id: ObjectId;
  title: string;           // "Trial XLVII"
  scheduledAt: Date;       // Sunday 18:00 UTC
  durationMinutes: 90;
  problems: ObjectId[];    // [easy, medium, medium, hard]
  participants: {
    userId: ObjectId;
    score: number;
    penalty: number;       // total time-penalty in minutes
    rank?: number;
  }[];
  status: 'upcoming' | 'live' | 'finished';
  ratingUpdated: boolean;
}
```

---

## 6. REST API Contract (OpenAPI 3.0 — Key Endpoints)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Issue JWT + refresh token |
| `POST` | `/api/auth/refresh` | Rotate refresh token |
| `GET` | `/api/problems` | List problems (filters, sort, paginate) |
| `GET` | `/api/problems/:slug` | Single problem detail |
| `POST` | `/api/submissions` | Submit code → enqueue judge |
| `GET` | `/api/submissions/:id` | Poll submission verdict |
| `GET` | `/api/recommendations` | Get personalized problem feed |
| `POST` | `/api/battles` | Create battle room |
| `POST` | `/api/battles/:id/join` | Join a battle room |
| `GET` | `/api/contests` | List past + upcoming contests |
| `POST` | `/api/contests/:id/join` | Register for a contest |
| `GET` | `/api/users/:username` | Public profile |
| `GET` | `/api/users/:username/analytics` | Full analytics payload |
| `GET` | `/api/articles` | List system design articles |
| `GET` | `/api/articles/:slug` | Single article |
| `POST` | `/api/reports` | Report a problem issue |

Authentication: `Authorization: Bearer <JWT>` header on all protected routes.

---

## 7. Non-Functional Targets

| Category | Target | Implementation |
|---|---|---|
| Page TTI | < 1.5 s on 4G | Vite code-splitting, lazy-loaded routes, Cloudflare CDN |
| Judge latency (P95) | < 3 s | Bull queue, Judge0 warm containers |
| WS event latency (battle) | < 100 ms | Redis Pub/Sub, sticky LB sessions |
| Concurrent users | 100,000+ | Kubernetes HPA, Redis rate limiting |
| Uptime SLA | 99.9% | Multi-AZ MongoDB Atlas, K8s self-healing |
| Auth security | OWASP Top 10 | JWT refresh rotation, bcrypt cost 12, helmet.js |
| Code sandbox | No host access | Docker: `--network none`, `--pids-limit 50`, CPU/RAM caps |
| MongoDB P99 query | < 50 ms | Atlas indexes on `slug`, `userId`, `topics`, `weeklyBatch` |

---

## 8. Phased Build Roadmap

| Phase | Weeks | Deliverables | Ancient Codex Focus |
|---|---|---|---|
| **0 — Foundation** | 1–3 | Monorepo, auth, basic problem CRUD, Judge0 setup, CI/CD | Design tokens, typography, CodexCard component |
| **1 — Core MVP** | 4–8 | Scrolls (roadmap), Tomes (problem bank), Forge (editor + judge), Profile basics | Three.js canvas, gold-leaf cards, verdict banner |
| **2 — Colosseum** | 9–12 | 1v1 battle rooms, weekly contest engine, live leaderboard, ELO system | Battle overlay UI, Roman numeral contest titles |
| **3 — Intelligence** | 13–16 | Recommendation engine, D3.js analytics, learning rate, quality judge | D3 Ancient Codex theme, quality ring component |
| **4 — Community** | 17–20 | Discussion platform, solution sharing, Chronicle articles, badges, reports | Badge renamed set, Chronicle article layout |
| **5 — Polish** | 21–24 | K8s deploy, monitoring (Grafana), perf audit, accessibility, public launch | Full grain overlay, grain animation, responsive QA |

---

## 9. Local Development Environment

```yaml
# docker-compose.yml (apps/infra)
services:
  api:
    build: ./apps/api
    ports: ["3001:3001"]
    environment:
      MONGO_URI: mongodb://mongo:27017/knightcode
      REDIS_URL: redis://redis:6379
      JUDGE0_URL: http://judge0:2358

  web:
    build: ./apps/web
    ports: ["5173:5173"]
    command: npm run dev

  mongo:
    image: mongo:7
    volumes: ["mongo_data:/data/db"]

  redis:
    image: redis:7-alpine

  judge0:
    image: judge0/judge0:latest
    ports: ["2358:2358"]
    environment:
      REDIS_URL: redis://redis:6379

volumes:
  mongo_data:
```

**Start all services:**
```bash
cd knightcode
docker compose up -d       # infra
npm run dev --workspace=apps/api   # API server on :3001
npm run dev --workspace=apps/web   # Vite dev on :5173
```

---

## 10. Key Design Decisions & Rationale

| Decision | Chosen Approach | Why |
|---|---|---|
| Frontend framework | React 18 + Vite | Fast HMR, excellent D3 integration, wide ecosystem |
| Styling | CSS Custom Properties (no Tailwind) | Fine-grained token control required for Ancient Codex palette |
| Code editor | Monaco Editor | Same engine as VS Code; best language support |
| Real-time | Socket.io + Redis Pub/Sub | Built-in namespace isolation; horizontal scale via Pub/Sub |
| Judge | Judge0 self-hosted | Open-source; supports 50+ languages; Docker-isolated |
| Database | MongoDB Atlas | Flexible schema fits evolving problem/submission structure |
| Charts | D3.js v7 | Full control over gold/sepia styling; not constrained by chart-lib defaults |
| 3D background | Three.js (not CSS) | Required for sacred geometry wireframe with point lighting |
| Monorepo | Turborepo | Shared types + UI packages; incremental builds |

---

*"Thy code is thy chronicle. Leave it worthy of the ages."*  
**— KnightCode CodeArena, Ancient Codex Edition**
