# KnightCode Documentation

## Overview
KnightCode is a modern, full-stack elite coding platform designed with an "Ancient Codex" aesthetic—featuring mystical themes, deep dark backgrounds, and bright gold accents. The platform aims to provide an immersive experience for developers entering the "Arena" to master algorithms and data structures. It is built as a monorepo containing a React frontend (Vite) and a Node.js/Express backend API.

---

## Features Implemented & How They Work

### 1. Authentication System
**How it works:**
- **Backend:** The API handles authentication via `apps/api/routes/auth.routes.js` and stores user data in MongoDB using Mongoose (`User.model.js`). Passwords are encrypted using `bcryptjs`. Upon successful login or registration, the backend issues a JSON Web Token (`jsonwebtoken`) to the client.
- **Frontend:** The React app manages authentication state via a custom hook (`useAuth.jsx`). It communicates with the API using `axios`.
- **UI:** Registration and Login pages (`AuthPage.jsx`) are styled with a mystical theme and utilize a dynamic 3D background component (`SacredGeometryCanvas.jsx`) to enhance the user experience.
- **Security:** Protected routes (`ProtectedRoute.jsx`) ensure that only authenticated users can access specific pages like the Sanctum, Arena, and Profile.

### 2. 3D Visuals & Immersive Landing Page
**How it works:**
- The homepage (`Home.jsx`) integrates sophisticated 3D elements to create an immersive "entering the arena" experience.
- **Three.js & React-Three-Fiber:** The platform uses these libraries to render 3D scenes. The `AncientModel.jsx` serves as an interactive 3D model that responds to scroll events.
- **Scroll Animations:** Using `@react-three/drei`'s `ScrollControls`, the landing page ties HTML overlay animations (powered by `framer-motion`) to the user's scroll depth, creating a cohesive cinematic journey.

### 3. Navigation & Routing
**How it works:**
- **React Router:** Client-side routing is handled by `react-router-dom`. 
- **Navbar:** A premium, fixed topbar (`Navbar.jsx`) provides navigation to various sections of the platform: Home, Chakras, Sanctum, Leaderboard, Arena, and Astraverse. It uses Framer Motion for smooth transitions and conditional rendering based on authentication state.

### 4. The Path of Mastery (Arena Flow)
**How it works:**
- **Sanctum Winding Path (`Sanctum.jsx`):** A custom SVG-based S-curve path renders nodes representing Data Structure and Algorithm topics (e.g., Array, Two Pointers). The UI is built using absolute coordinate calculation mapped against an SVG path, maintaining the Ancient Codex aesthetic with "Tome" nodes.
- **Difficulty Selection (`TopicArena.jsx`):** Once a topic is clicked, users select a difficulty (Easy, Medium, Hard). Hover animations (via `framer-motion`) and specialized glyphs drive the premium aesthetic.
- **The Forge (`ProblemsPage.jsx`):** After selection, a list of problems is fetched dynamically from the database. The UI maps problem data to rich interactive cards featuring acceptance rates and direct LeetCode links.
- **Backend MongoDB Integration (`Problem.model.js` & `problems.routes.js`):** The API natively connects to an external, pre-seeded MongoDB database (`leetcode_problems.topics`).
  - **Optimization:** To handle the massive dataset efficiently over the network (preventing multi-second delays), the backend utilizes Mongoose `.lean()` and specifically projects *only* the demanded difficulty subdocument (e.g. `{ 'difficulties.$': 1 }`). Furthermore, enormous fields like code solutions and test cases are excluded at the database level, and questions are dynamically sorted in memory by their string-based acceptance rates.

### 5. Monorepo Architecture
**How it works:**
- The code is organized into a monorepo structure with `apps/web` (frontend) and `apps/api` (backend).
- A root `package.json` coordinates the environments using `concurrently`, allowing developers to start both the Vite dev server and the Node backend with a single `npm run dev` command.

---

## Dependencies Used

### Frontend (`apps/web`)
- **Core Framework:** React (`^18.2.0`), React DOM (`^18.2.0`), Vite (`^8.0.2`)
- **Routing:** React Router DOM (`^6.18.0`)
- **HTTP Client:** Axios (`^1.6.0`)
- **Styling & UI:** Ant Design (`^6.3.3`), `@ant-design/icons` (`^6.1.0`)
- **Animations:** Framer Motion (`^12.38.0`)
- **3D Graphics:** Three.js (`^0.183.2`), `@react-three/fiber` (`^8.18.0`), `@react-three/drei` (`^9.122.0`)

### Backend (`apps/api`)
- **Core Framework:** Express.js (`^4.18.2`), Node.js
- **Database:** Mongoose (`^7.5.0`) for MongoDB object modeling.
- **Authentication & Security:**
  - JSONWebToken (`^9.0.2`) for stateless auth.
  - BcryptJS (`^2.4.3`) for password hashing.
  - Helmet (`^7.0.0`) for securing HTTP headers.
  - CORS (`^2.8.5`) for Cross-Origin Resource Sharing.
- **Real-time Engine:** Socket.io (`^4.7.2`) (Prepared for real-time features like multiplayer arena).
- **Environment Management:** Dotenv (`^16.3.1`)

### Development Tools (Root)
- **Task Runner:** Concurrently (`^8.2.0`) to run multiple commands simultaneously.
