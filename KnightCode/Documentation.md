# KnightCode Documentation

## Overview
KnightCode is a full-stack elite competitive coding platform built with an **"Ancient Codex"** aesthetic — deep dark obsidian backgrounds, gold-leaf accents, and mystical animations. It provides an immersive DSA learning and problem-solving experience, structured as a monorepo with a React frontend and Node.js/Express backend.

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | `Home.jsx` | 3D animated landing page |
| `/home` | `Home.jsx` | Alias for landing page |
| `/login` | `AuthPage.jsx` | Login form |
| `/register` | `AuthPage.jsx` | Registration form |
| `/forgot-password` | `ForgotPassword.jsx` | Request password reset email |
| `/reset-password/:token` | `ResetPassword.jsx` | Secure password recovery |
| `/sanctum` | `Sanctum.jsx` | DSA path of mastery |
| `/difficulty` | `TopicArena.jsx` | Difficulty selection (Easy/Medium/Hard) |
| `/forge` | `ProblemsPage.jsx` | Problem list for a topic + difficulty |
| `/solve` | `SolvePage.jsx` | Split-panel code editor + problem statement |
| `/profile` | `Profile.jsx` | User profile with heatmap and stats |
| `/sanctum/:username` | `Profile.jsx` | Direct link to a specific user's profile |
| `/leaderboard` | `Leaderboard.jsx` | User rankings by problems solved |
| `/arena` | `Arena.jsx` | Real-time 1v1 coding battles (Socket.io) |
| `/astraverse` | `Astraverse.jsx` | Data structure visualizer |

---

## Features — Implementation Details

### 1. Authentication System
- **Backend:** `apps/api/routes/auth.routes.js` — register, login, and forgot-password endpoints. Passwords hashed with **bcryptjs**. Uses **Nodemailer** + Gmail SMTP for secure password reset links. On success, issues a **JWT** (`jsonwebtoken`).
- **Frontend:** Auth state managed in `useAuth.jsx` (React Context + `localStorage`). API calls via **Axios** (`apps/web/src/api/client.js`).
- **Guards:** `ProtectedRoute.jsx` — blocks unauthenticated access to protected pages; `onlyUnauthenticated` prop redirects logged-in users away from auth routes.

### 2. 3D Landing Page & Visuals
- **Three.js** + **@react-three/fiber** + **@react-three/drei** render an interactive 3D scene in `Home.jsx`.
- Scroll-linked parallax animations powered by **Framer Motion**.
- `SacredGeometryCanvas.jsx` — reusable Three.js canvas used as background across AuthPage, Sanctum, TopicArena, and ProblemsPage.

### 3. Sanctum — Path of Mastery (`Sanctum.jsx`)
- Custom **SVG-based winding S-curve path** connecting 15 DSA topic nodes.
- **Sorting Algorithm Upgrade**: The sorting logic utilizes a highly optimized **two-pointer technique paired with a hash table**, completely replacing the legacy Binary Search Tree (BST) approach for node traversal and filtering.
- DSA topics ordered as a proper learning roadmap: Array → String → Hash Table → Two Pointers → Sliding Window → Stack → Linked List → Binary Search → Sorting → Tree → Heap → Greedy → Backtracking → Graph → Dynamic Programming.

### 4. Difficulty Selection (`TopicArena.jsx`)
- Three animated cards: Easy (green glyph ✦), Medium (gold ✦✦), Hard (red ✦✦✦).
- Navigates to `/forge?topic=...&difficulty=...` on selection.

### 5. Problems List (`ProblemsPage.jsx`)
- Fetches from `GET /api/problems?topic=...&difficulty=...` via Axios.
- Displays an animated grid of problem cards with title and acceptance rate.
- **Admin Controls**: Administrative users see a direct question deletion feature (🗑️ icon) mapped to the secure `DELETE /api/problems/question` endpoint.

### 6. Code Editor & Problem Statement Page (`SolvePage.jsx`)
- Full-screen split-panel layout.
- **Left panel (~42%)**:
  - **Description tab**: Problem title, difficulty badge, description, constraints, and examples. Rendered using `dangerouslySetInnerHTML` to properly display rich HTML and converted MathJax formatting imported from Polygon.
  - **Solution tab**: Solution language, time/space complexity, and a read-only Monaco code view.
- **Right panel (~58%)**: Live **Monaco Editor** (`@monaco-editor/react`).
  - Custom "Ancient Codex" Monaco theme.
  - **Console Panel**: Collapsible tabbed console for managing up to 8 **Custom Test Cases**.

### 7. User Profiles & Metrics (`Profile.jsx`)
- **Avatar System**: Supports Base64 image uploads (limited to 500KB) via the API.
- **Difficulty Tracking**: A dynamic circular distribution chart tracking user progress across Easy, Medium, and Hard problems.
- **Submission Heatmap**: A GitHub/LeetCode style year-long interactive heatmap, tracking the frequency of daily submissions pulled from the user's `submissionDates` array in MongoDB.

### 8. Enhanced Judge Engine & Direct Execution
The internal judge (`apps/api/judge/executor.js`) evaluates code with strict `timeLimit` and `memoryLimit` bounds.
- **Dual Execution Modes**: 
  - **Docker Mode**: Wraps the execution in isolated containers (`--net=none`, `--cpus=0.5`, `--memory=256m`).
  - **Direct Execution Mode**: Driven by the `USE_DOCKER=false` environment variable. Directly utilizes the host's `g++`, `python3`, or `node` processes. This fallback was specifically architected to allow the judge to function on serverless platforms (like Render) that prohibit Docker-in-Docker functionality.
- **High-Speed Batching**: Evaluates test cases concurrently in chunks of 10 to drastically reduce execution time.

## 🚀 Production Readiness & Performance Optimization

To prepare the KnightCode platform for production and optimize mobile loading speeds, the following architectural upgrades were implemented:

### 1. Route-Level Code Splitting (React.lazy & Suspense)
- Eager page imports in `App.jsx` have been replaced with dynamic lazy imports (`React.lazy`).
- Route transitions are wrapped in a unified `<Suspense>` boundary displaying a brand-compliant **"Ancient Codex"** unrolling screen (`CodexLoader`).
- This minimizes the initial page bundle size, deferring non-critical bundle loading (e.g. Monaco Editor, visualizer scripts) until pages are actually visited.

### 2. High-Performance Three.js Mobile Bypass
- **Problem:** The 3D Canvas in `Home.jsx` eagerly loaded a heavy 13.3 MB model (`Ancient.glb`) and Three.js dependencies, causing slow load times and main-thread blocking on mobile.
- **Solution:** 
  - Extracted the Three.js Canvas code into `Home3DCanvas.jsx` to force Vite/Rolldown to bundle Three.js and R3F into a separate chunk.
  - Implemented dynamic mobile detection on screen mount and resize.
  - **Mobile/Tablet Viewports:** Bypasses mounting or loading `Home3DCanvas` entirely. Mobile users download 0 bytes of Three.js or the 13.3 MB model asset, and instead experience a clean, snap-scrolling HTML layout with a lightweight glowing background fallback.
  - **Desktop Viewports:** Lazily loads and fades in the 3D scene once the asset bundles are downloaded.
- **Sacred Geometry Backgrounds:** The background `SacredGeometryCanvas.jsx` automatically shuts down Three.js canvas WebGL loops on devices with a screen width under `768px`, using a 0-CPU animated CSS glow and pulsing star fallback to conserve mobile battery life.

### 3. Fully Responsive Home Page Layout
- Converted all inline pixel/absolute positions and hardcoded font sizes (like `6rem` or `5.5rem` headings) into responsive, viewport-relative styling in `Home.css` using fluid typography (`clamp()`).
- Adjusted buttons to stack vertically on small screens for optimal click targets.

### 4. Parallel Font Loading & Critical Chain Elimination
- **Fonts Preconnecting:** Removed the `@import` statement from `globals.css` and added `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` tags in `index.html`.
- **Parallel Fetching:** Replaced the css-import link with a direct `<link rel="stylesheet">` in `index.html`. This allows Google Fonts and the local stylesheet to load concurrently, eliminating the render-blocking waterfall chain and reducing FCP by up to 1,000ms.

### 5. WebGL Rendering & Device Pixel Ratio Optimization
- Restricted the maximum Device Pixel Ratio (`dpr`) of the Three.js `<Canvas>` component in `Home3DCanvas.jsx` to `1.5` instead of default high-dpi configurations (3x/4x on Retina screens).
- Enabled dedicated GPU hardware acceleration via `gl={{ powerPreference: "high-performance" }}` on the canvas to decrease JavaScript compilation and execution overhead on desktop.

### 6. CDN Aggressive Caching
- Configured static asset headers in `vercel.json` to instruct Vercel's CDN and the browser to cache JS, CSS, GLB, HDR, WOFF2, and image files aggressively using `Cache-Control: public, max-age=31536000, immutable`.

---

## Deployment Architecture

KnightCode is structured for modern, zero-cost cloud deployment:

### 1. Frontend: Vercel
- **Framework Preset**: Vite.
- **Routing Fix**: Deploys with a custom `vercel.json` rewrite rule (`"source": "/(.*)", "destination": "/index.html"`) to prevent 404 errors during Single Page Application (SPA) reloads.
- **Env**: Consumes `VITE_API_BASE_URL` pointing strictly to the HTTPS backend API.

### 2. Backend API: Render (Docker Runtime)
- **Containerization**: Deploys using a custom root-level `Dockerfile` built on `node:20-slim`.
- **Pre-installed Compilers**: The Dockerfile automatically installs `g++` and `python3` via `apt-get`, ensuring the `Direct Execution Mode` of the judge has all necessary compilers without relying on external sandbox containers.
- **CORS Handling**: `CORS_ORIGIN` securely matches the Vercel frontend domain to prevent unauthorized API requests. Body-parser limits are set to `50mb` to handle large Base64 avatar uploads.

### 3. Database: MongoDB Atlas
- Utilizes the free tier cluster with `0.0.0.0/0` network access enabled to accept connections from the dynamic IPs of the Render cloud platform.

---

## 🔒 Admin Authorization & Security

### 1. Middleware Protections
Authentication middleware is defined in `apps/api/middleware/auth.middleware.js`:
- **`protect`**: Blocks unauthenticated requests, decoding the `Bearer` JWT.
- **`adminProtect`**: A hard-guard enforcing that `req.user.email` rigidly matches the authorized admin address (`[EMAIL_ADDRESS]`). Rejecting any mismatch returns a `403 Forbidden` response.

### 2. Frontend Admin GUI(Testing Period)
When parsing a user's logged-in identity via React Context (`useAuth`), components like `SolvePage.jsx` and `ProblemsPage.jsx` branch their rendering payload conditionally.
- Admins unlock the `⚙ Edit` tab for complete database manipulation.
- Admins gain a direct 'Delete' action on problem cards to prune the database on the fly.

### 3. Data-Scrubbing Security
For non-admin requests fetching `GET /api/problems/question`, the backend aggressively scrubs `hidden` arrays. The API actively mutates hidden test cases to return `input: 'Hidden', expectedOutput: 'Hidden'` prior to transmission. This prevents tech-savvy clients from intercepting network fetches via DevTools to cheat.
