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
  - "↗ Open on Polygon" external link, "← Back" button, "Submit" button.
  - **Console Panel**: Collapsible tabbed console for managing up to 8 **Custom Test Cases**.

### 7. Custom Test Case Runner (`POST /api/problems/run`)
Users can validate their logic against their own inputs before a formal submission:
- **Interactive UI**: Add, remove, and edit up to 8 custom test case inputs directly in the editor console.
- **Real-time Feedback**: Executes code in the same sandboxed environment as the formal judge.
- **Seed Logic**: Automatically seeds custom test cases with the problem's public sample cases on first load.
- **Output capture**: Displays the raw standard output (STDOUT) from the user's program for each custom case.

### 8. Enhanced Judge Engine
The internal judge has been significantly optimized with "Battle-Ready" performance features:
- **Dynamic Constraint Application**: Every problem now carries its own `timeLimit` (ms) and `memoryLimit` (bytes) parsed during the import process. This allows for strict TLE (Time Limit Exceeded) enforcement.
- **BSON-Safe Imports**: The importer aggressively caps total test case data at 2MB per problem to ensure MongoDB performance and stability.
- **High-Speed Execution**: Test cases are evaluated in parallel batches (`CHUNK_SIZE = 10`) using Docker container concurrency, drastically reducing the turnaround time for problems with 100+ test cases.
- **Isolated Sandbox**: Uses a custom-built Docker executor with `--net=none`, `--cpus=0.5`, and `--memory=256m` for maximum security.

### 9. Navbar (`Navbar.jsx`)
- Fixed top navigation with Framer Motion transitions.
- Conditionally renders username and logout based on auth state.
- Links: Home, Chakras, Sanctum, Leaderboard, Arena, Astraverse.

### 10. Monorepo Architecture
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
        timeLimit: Number,      // ms, default: 1000
        memoryLimit: Number,    // bytes, default: 268435456 (256MB)
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

## 🔒 Admin Authorization & Security

To maintain platform integrity, KnightCode implements a strict role-based access control (RBAC) strategy focused on isolating potentially destructive actions (editing problem parameters) and sensitive data (hidden test cases) to administrative users.

### 1. Middleware Protections
Authentication middleware is defined in `apps/api/middleware/auth.middleware.js`:
- **`protect`**: Blocks completely unauthenticated requests, decoding the `Bearer` JWT to verify legitimate active users.
- **`optionalProtect`**: A soft-guard that does not throw 401 Unauthorized errors if a token is missing, but *will* attach the `req.user` payload if the user happens to provide a valid token. This is used in public routes that have privileged internal branches (e.g., getting a problem where admins see more data than guests).
- **`adminProtect`**: A hard-guard that acts identically to `protect`, but subsequently enforces that `req.user.email` rigidly matches the authorized admin address (`sanskar.20253248@mnnit.ac.in` by default). Rejecting any mismatch returns a `403 Forbidden` response.

### 2. Frontend Admin GUI
When parsing a user's logged-in identity via React Context (`useAuth`), components like `SolvePage.jsx` branch their rendering payload conditionally.
- If the `user` is flagged as an admin, the UI activates a `⚙ Edit` tab allowing complete database manipulation without writing script injections.
- Valid admins have full read/write/delete ability over problem components: Description (raw HTML injection), constraints list mapped out line-by-line, and Test Cases.

### 3. Data-Scrubbing Security
For non-admin requests fetching `GET /api/problems/question`, the backend aggressively scrubs `hidden` arrays. By deep-cloning the Mongoose response (`JSON.parse(JSON.stringify(question))`), the API actively mutates hidden test cases to return `input: 'Hidden', expectedOutput: 'Hidden'` prior to transmission. This prevents tech-savvy clients from intercepting network fetches via DevTools to cheat.

---

## ⚙️ Code Judge Execution Pipeline

KnightCode features a deeply integrated, isolated Code Judge execution engine using Node.js child processes and Docker containers rather than relying on external web APIs like Judge0. 

### 1. The Executor (`apps/api/judge/executor.js`)
The `Executor` class is instantiated per-submission and handles local file manipulation securely using the `os.tmpdir()`. 
- **Temporary Workspaces**: It isolates concurrent submissions by dynamically constructing ephemeral folders labeled `knightcode_judge_<timestamp>`. 
- **Language Compilation**: If attempting to execute typed languages like C++, it mounts this ephemeral directory volume using `docker run -v` into a temporary `knightcode-judge` container executing `g++ solution.cpp -O3 -std=c++17`. Compilation errors catch via the standard `code === 1` child_process close event.
- **Interpreted Languages**: Python and Javascript bypass compilation entirely and write directly to `solution.py/js`.

### 2. Sandbox Data Flow
When a user targets `POST /api/problems/submit`, the workflow operates as follows:
1. **Source Generation**: Raw editor `code` strings are flushed via `fs.writeFileSync()` to the ephemeral workspace.
2. **Container Ignition**: The runtime spawns using `child_process.spawn`.
3. **Sandboxed Resources**: 
   - **Isolation Flags**: `--net=none` (disables internet access), `--cpus=0.5` (hard throttles CPU cycles), and `--memory=256m` (blocks RAM overutilization memory leaks).
   - **User Permissions**: `--user judgeuser` operates without root authority.
4. **Parallel Execution Loop**: The loop maps across the problem's predefined Database Testcases in chunks.
   - **Parallelization**: `CHUNK_SIZE = 10` (runs up to 10 test cases in parallel via Docker containers for faster evaluation).
   - For every iteration, it pipes the `testCase.input` string payload into the container via standard input streams.
5. **Dynamic Time Limiter**: To prevent infinite loop locking, a Javascript `setTimeout` bounds execution. 
   - **Limit Origin**: The judge uses the problem's specific `timeLimit` defined in MongoDB (e.g., 1000ms).
   - **Default Limit**: Falls back to **1000ms** (1.0 second) if not specified. Braching this results in **Time Limit Exceeded**.
6. **Evaluation**: Expected matching occurs for all returned data frames. 
   - Strict adherence returns **Accepted**. Mismatched algorithms return **Wrong Answer**.

### 3. Polygon Import Workflow (`apps/api/judge/import_polygon.js`)
KnightCode supports importing problems directly from **Polygon (Codeforces)**.
The process follows several key stages:
- **Archive Extraction**: ZIP archives or folders are parsed for `problem.xml`.
- **Constraint Parsing**: Extracts `time-limit` and `memory-limit` from the XML, converting them into millisecond/byte values for the local DB.
- **Statement Conversion**: Extracts LaTeX descriptions from `problem.tex` and converts them (cleaning `%` symbols) for web display.
- **Test Case Generation**: If test cases are missing, it triggers local generation via `doall.bat` or `doall.sh`.
- **Database Mapping**: Maps Polygon tags (e.g., "strings", "dp") to KnightCode's Learning Roadmap topics.
- **Safety Limits**: Limits total test case size to 2MB per problem during import to prevent MongoDB BSON RangeErrors.

### 3. Cleanup Protocol
The `cleanup()` lifecycle fires unconditionally utilizing `fs.rmSync(this.tempDir, { recursive: true })` — erasing the source files, compiled Linux binaries, and cached folder frames.

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/problems?topic=&difficulty=` | Fetch sorted problem list |
| `GET` | `/api/problems/topics` | Fetch all topic names |
| `GET` | `/api/problems/question?id=&topic=&difficulty=` | Fetch single full question |
| `POST` | `/api/problems/run` | Run code against custom test cases |
| `POST` | `/api/problems/submit` | Judge and submit solution |

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
