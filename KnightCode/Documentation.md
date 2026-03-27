# KnightCode Documentation

## Overview
KnightCode is a full-stack elite competitive coding platform built with an **"Ancient Codex"** aesthetic — deep dark obsidian backgrounds, gold-leaf accents, and mystical animations. It provides an immersive DSA learning and problem-solving experience, structured as a monorepo with a React frontend and Node.js/Express backend.

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | `Home.jsx` | 3D animated landing page |
| `/login` | `AuthPage.jsx` | Login form |
| `/register` | `AuthPage.jsx` | Registration form |
| `/sanctum` | `Sanctum.jsx` | DSA path of mastery |
| `/difficulty` | `TopicArena.jsx` | Difficulty selection (Easy/Medium/Hard) |
| `/forge` | `ProblemsPage.jsx` | Problem list for a topic + difficulty |
| `/solve` | `SolvePage.jsx` | Split-panel code editor + problem statement |
| `/sanctum/:username` | `Profile.jsx` | User profile page |
| `/chakras` | `Chakras.jsx` | (Placeholder) |
| `/leaderboard` | `Leaderboard.jsx` | (Placeholder) |
| `/arena` | `Arena.jsx` | (Placeholder) |
| `/astraverse` | `Astraverse.jsx` | (Placeholder) |

---

## Features — Implementation Details

### 1. Authentication System
- **Backend:** `apps/api/routes/auth.routes.js` — register/login endpoints. Passwords hashed with **bcryptjs**. On success, issues a **JWT** (`jsonwebtoken`).
- **Frontend:** Auth state managed in `useAuth.jsx` (React Context + `localStorage`). API calls via **Axios** (`apps/web/src/api/client.js`).
- **UI:** `AuthPage.jsx` with `SacredGeometryCanvas.jsx` as a live 3D background.
- **Guards:** `ProtectedRoute.jsx` — blocks unauthenticated access to protected pages; `onlyUnauthenticated` prop redirects logged-in users away from login/register.

### 2. 3D Landing Page & Visuals
- **Three.js** + **@react-three/fiber** + **@react-three/drei** render an interactive 3D scene in `Home.jsx`.
- `AncientModel.jsx` — a 3D model that responds to scroll events via **ScrollControls** (`@react-three/drei`).
- Scroll-linked parallax animations powered by **Framer Motion**.
- `SacredGeometryCanvas.jsx` — reusable Three.js canvas used as background across AuthPage, Sanctum, TopicArena, and ProblemsPage.

### 3. Sanctum — Path of Mastery (`Sanctum.jsx`)
- Custom **SVG-based winding S-curve path** connecting 15 DSA topic nodes.
- Nodes ("Tomes") are circular SVG buttons positioned at the path's turning points using a custom `buildSmoothPath()` function with computed coordinates.
- DSA topics ordered as a proper learning roadmap: Array → String → Hash Table → Two Pointers → Sliding Window → Stack → Linked List → Binary Search → Sorting → Tree → Heap → Greedy → Backtracking → Graph → Dynamic Programming.
- Clicking a Tome navigates to `/difficulty?topic=<name>`.
- **Framer Motion** `whileInView` spring animations for scroll-in reveal of each node.

### 4. Difficulty Selection (`TopicArena.jsx`)
- Three animated cards: Easy (green glyph ✦), Medium (gold ✦✦), Hard (red ✦✦✦).
- Framer Motion hover + entrance animations.
- Navigates to `/forge?topic=...&difficulty=...` on selection.

### 5. Problems List (`ProblemsPage.jsx`)
- Fetches from `GET /api/problems?topic=...&difficulty=...` via Axios.
- Displays an animated grid of problem cards with title and acceptance rate.
- Cards navigate to `/solve?id=...&topic=...&difficulty=...` (internal routing — no external LeetCode redirect).
- Loading state with a pulsing "Unearthing scrolls" message.

### 6. Code Editor & Problem Statement Page (`SolvePage.jsx`)
- Full-screen split-panel layout (no scroll), fills the viewport.
- **Left panel (~42%)** — tabbed interface:
  - **Description tab:** Problem title, difficulty badge, description, constraints, and one visible example test case.
  - **Solution tab:** solution language, time/space complexity, approach explanation, and a read-only Monaco code view of the DB solution.
  - **Discussion tab:** A pinned "KnightCode Sage" message warning that only the optimal time complexity solution is stored — all others will cause TLE. Placeholder for future community discussion.
- **Right panel (~58%)** — Live **Monaco Editor** (`@monaco-editor/react`, same engine as VS Code):
  - Custom "Ancient Codex" Monaco theme (gold keywords, dark obsidian background, gold cursor).
  - Language selector dropdown (C++, Python, JavaScript) with boilerplate templates.
  - On load, pre-selects the language matching the DB solution's language.
  - "↗ Open on LeetCode" external link, "← Back" button, "Submit" button (placeholder).
- Data fetched from `GET /api/problems/question?id=...&topic=...&difficulty=...`.

### 7. Navbar (`Navbar.jsx`)
- Fixed top navigation with Framer Motion transitions.
- Conditionally renders username and logout based on auth state.
- Links: Home, Chakras, Sanctum, Leaderboard, Arena, Astraverse.

### 8. Monorepo Architecture
- `apps/web` — Vite + React frontend.
- `apps/api` — Express backend.
- Root `package.json` uses **concurrently** to run both simultaneously with `npm run dev`.

---

## Database Architecture

### Primary DB (`mongodb+srv://...`) — `database`
- **Collection:** `users` — stores user profiles via `User.model.js`.
- **Schema:** `{ username, email, password (bcrypted), createdAt }`.

### Secondary DB — `leetcode_problems`
- **Collection:** `topics` — pre-seeded LeetCode problem data, queried via `mongoose.connection.useDb('leetcode_problems')`.
- **Schema:**
  ```
  Topic {
    name: String,               // e.g. "Array", "Hash Table"
    difficulties: [{
      level: "Easy"|"Medium"|"Hard",
      questions: [{
        serialNo: Number,
        title: String,
        acceptance: String,     // e.g. "55.8%"
        link: String,           // LeetCode URL
        description: String,
        constraints: [String],
        testCases: [{ input, expectedOutput, hidden: Boolean }],
        solution: {
          language: String,     // "cpp" | "python" | "javascript"
          code: String,
          timeComplexity: String,
          spaceComplexity: String,
          explanation: String
        }
      }]
    }]
  }
  ```

### Performance Optimization
Fetching a full topic doc over the network was initially taking **~4.5 seconds** because each document contains embedded CPP solution strings, test cases, etc. Optimized to **~0.7 seconds** by:
1. Using Mongoose `.lean()` — returns plain JS objects instead of full Mongoose documents.
2. Projecting only the required difficulty subdocument with `{ 'difficulties.$': 1 }`.
3. Mapping questions to only include `serialNo`, `title`, `acceptance`, `link` for the list view.

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/problems?topic=&difficulty=` | Fetch sorted problem list |
| `GET` | `/api/problems/topics` | Fetch all topic names |
| `GET` | `/api/problems/question?id=&topic=&difficulty=` | Fetch single full question |

---

## Dependencies

### Frontend (`apps/web`)
| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.2.0 | Core UI framework |
| `react-dom` | ^18.2.0 | DOM rendering |
| `vite` | ^8.0.2 | Build tool & dev server |
| `react-router-dom` | ^6.18.0 | Client-side routing |
| `axios` | ^1.6.0 | HTTP client for API calls |
| `framer-motion` | ^12.38.0 | Animations & transitions |
| `@monaco-editor/react` | latest | VS Code Monaco editor component |
| `three` | ^0.183.2 | 3D rendering engine |
| `@react-three/fiber` | ^8.18.0 | React renderer for Three.js |
| `@react-three/drei` | ^9.122.0 | Three.js helpers (ScrollControls, etc.) |
| `antd` | ^6.3.3 | Ant Design component library |
| `@ant-design/icons` | ^6.1.0 | Icon set |

### Backend (`apps/api`)
| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.18.2 | Web server framework |
| `mongoose` | ^7.5.0 | MongoDB ODM |
| `jsonwebtoken` | ^9.0.2 | JWT auth tokens |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `helmet` | ^7.0.0 | HTTP security headers |
| `cors` | ^2.8.5 | Cross-origin resource sharing |
| `socket.io` | ^4.7.2 | Real-time engine (prepared, not active) |
| `dotenv` | ^16.3.1 | Environment variable management |

### Root / DevTools
| Package | Purpose |
|---|---|
| `concurrently` | Run frontend + backend simultaneously |
