# FreshGrid - Directory Structure & Architecture Guide

This guide details the MERN (MongoDB, Express, React, Node.js) architecture of the **FreshGrid** platform, explaining the purpose, responsibility, and structure of every directory inside both the backend and frontend `src` folders.

---

## 📂 Backend Architecture (`backend/src`)

The backend follows an industry-standard MVC (Model-View-Controller) layered API design, prioritizing modularity, clean separation of concerns, and stateless scalability.

| Directory | Core Responsibility | Key Contents / Examples |
| :--- | :--- | :--- |
| 🛠️ **`config/`** | Database connections, external server configurations, and environment initialization. | `db.js` (MongoDB Atlas pool configs), `passport.js` (OAuth Strategies). |
| 🎮 **`controllers/`** | Request handlers that receive incoming HTTP requests, coordinate business logic, and send responses. | `authController.js` (user auth), `productController.js` (CRUD actions). |
| 🛡️ **`middleware/`** | Intermediate request processors for authentication guards, payload validation, and logging. | `authMiddleware.js` (JWT parsing), `verifyRecaptcha.js` (security check). |
| 🗄️ **`models/`** | Mongoose database schemas defining the blueprints of data stored in MongoDB. | `User.js`, `Product.js`, `Order.js`, `Category.js`. |
| 🗺️ **`routes/`** | Map specific URI path patterns to their corresponding middleware guards and controller actions. | `authRoutes.js`, `productRoutes.js`, `orderRoutes.js`. |
| ⚙️ **`services/`** | Encapsulated integrations with third-party APIs and specialized, heavy-duty helper modules. | `emailService.js` (SMTP notifications), `passkeyService.js` (webauthn logic). |
| 🧰 **`utils/`** | Reusable backend utilities, common standard error handling classes, and constants. | `generateToken.js` (JWT signing), `helperFunctions.js`. |

---

## 📂 Frontend Architecture (`frontend/src`)

The frontend is built as a highly responsive React Single Page Application (SPA) powered by Vite, emphasizing component modularity, clean layout transitions, and high-performance state synchronization.

| Directory | Core Responsibility | Key Contents / Examples |
| :--- | :--- | :--- |
| 🎨 **`assets/`** | Static global visual elements, custom illustrations, SVGs, logos, and web animations. | `logo.png`, `hero-farm.png`, brand assets. |
| 🧩 **`components/`** | Reusable UI modular blocks shared across multiple different pages and layout systems. | `Navbar.jsx`, `Footer.jsx`, `ProductCard.jsx`, `FloatingNav.jsx`, `ProtectedRoute.jsx`. |
| 💡 **`context/`** | React Context Providers that manage global state tracking throughout the application lifecycle. | `AuthContext.jsx` (session), `CartContext.jsx` (shopping cart tracking). |
| 🎣 **`hooks/`** | Custom React hooks that encapsulate complex state and UI logics into clean, reusable actions. | `useAiAssistant.jsx` (chat states), `useIdleTimeout.js` (auto-logout logic). |
| 📄 **`pages/`** | Full-screen dashboard components loaded by React-Router to represent individual page routes. | `Home.jsx`, `Shop.jsx`, `About.jsx`, `Profile.jsx`, `Dashboard.jsx` (Admin panel). |
| 🔌 **`services/`** | Axios client HTTP modules configured to request backend APIs. | `api.js` (base instance), `authService.js` (login/register requests). |
| 🧮 **`utils/`** | Reusable front-end helper scripts, currency formatters, date converters, and global static states. | `formatters.js` (price conversion), `validators.js`. |

---

## 🚀 Key Files in Root of `src`

### Frontend:
* **`main.jsx`:** The main entrypoint of the React application. It binds the React DOM virtual tree to the `index.html` root node.
* **`App.jsx`:** The core routing and layout orchestrator. Sets up global context providers, imports router endpoints, and renders global visual layers like `ChatWidget`.
* **`index.css`:** The global stylesheet containing Tailwind base guidelines, primary palette extensions, custom micro-interactions, animations, and typography tokens.

### Backend (Root project directory):
* **`server.js`:** The backend entry point. Spawns the Express server, connects database adapter modules, applies global middleware parameters (CORS, JSON parsing), and hosts active ports.
