# Nexus — BDA Pipeline & Performance Engine

> A full-stack CRM and pipeline tracking module built for Business Development Associate (BDA) teams in the manufacturing sector. Centralizes lead management, client interactions, and performance metrics into a single, high-performance workspace.

**Live Demo → [https://salespipeline.onrender.com](https://salespipeline.onrender.com)**

---

## Screenshots

| Dashboard | Kanban Pipeline |
|-----------|----------------|
| Real-time metric cards, recent leads table, and pipeline breakdown by stage | Drag-and-drop board across all 6 sales stages |

---

## The Problem

Manufacturing sales run on long, high-value cycles — from initial inquiry to technical proposal to final negotiation. Teams managing these on spreadsheets face:

- **Data silos** — no single view of the whole pipeline
- **Dropped follow-ups** — no stage-based workflow to enforce process
- **Zero visibility** — managers can't see BDA performance at a glance

---

## The Solution

Nexus replaces static spreadsheets with a dynamic, role-based workspace. Every lead moves through a visual pipeline, every metric is computed live from real data, and every team member has exactly the access their role requires.

---

## Features

### Role-Based Access Control (RBAC)
- **Admin** — full pipeline visibility, team performance overview, manage all leads
- **BDA** — personal lead management, own pipeline view, add notes and update stages

### Visual Kanban Pipeline
Interactive drag-and-drop board across 6 manufacturing sales stages:

```
New → Contacted → Proposal Sent → Negotiation → Won / Lost
```

### Live Dashboard Metrics
All four KPIs computed in real time from the database — no hardcoded values:
- **Total Pipeline Value** — sum of all active deal values
- **Active Leads** — leads not yet Won or Lost, with a weekly new-lead counter
- **Won Revenue** — total closed deal value
- **Conversion Rate** — lead-to-close ratio as a percentage

### Secure Architecture
- JWT authentication with configurable expiry
- bcrypt password hashing (12 salt rounds)
- Protected API routes — all lead endpoints require a valid token
- Password field excluded from all query results by default (`select: false`)
- Global 401 handler redirects to login automatically

### Additional Details
- Embedded notes per lead for conversation history
- `daysInCurrentStage` virtual field for stale-lead detection
- Compound MongoDB indexes for fast Kanban queries
- Health-check endpoint at `/api/health` for deployment monitoring

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6 |
| **Backend** | Node.js, Express 4 |
| **Database** | MongoDB Atlas, Mongoose 8 |
| **Auth** | JWT, bcryptjs |
| **Drag & Drop** | @hello-pangea/dnd |
| **Icons** | Lucide React |
| **Deployment** | Render (full-stack monorepo) |

---

## Project Structure

```
SalesPipeline/
├── package.json              # Root — Render build & start scripts
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── api/axios.js      # Axios instance with JWT interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── KanbanBoard.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       └── Pipeline.jsx
└── server/                   # Node + Express backend
    ├── server.js
    ├── models/
    │   ├── User.js           # name, email, password (hashed), role
    │   └── Lead.js           # companyName, value, status, assignedTo, notes[]
    ├── controllers/
    │   ├── authController.js
    │   └── leadController.js
    ├── routes/
    │   ├── authRoutes.js
    │   └── leadRoutes.js
    └── middleware/
        └── authMiddleware.js
```

---

## API Reference

### Auth

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login, returns JWT |
| `GET` | `/api/auth/me` | Protected | Get current user |

### Leads

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/leads` | Protected | Get all leads (Admin) or own leads (BDA) |
| `POST` | `/api/leads` | Protected | Create a new lead |
| `GET` | `/api/leads/:id` | Protected | Get a single lead |
| `PUT` | `/api/leads/:id` | Protected | Update lead details |
| `PATCH` | `/api/leads/:id/status` | Protected | Move lead to a new stage |
| `POST` | `/api/leads/:id/notes` | Protected | Add a note to a lead |
| `DELETE` | `/api/leads/:id` | Admin only | Delete a lead |

---

## Local Development Setup

**Prerequisites:** Node.js ≥ 18, a MongoDB Atlas account

### 1. Clone the repo
```bash
git clone https://github.com/Player1205/SalesPipeline.git
cd SalesPipeline
```

### 2. Configure the backend
```bash
cd server
cp .env.example .env
```
Fill in your `.env`:
```
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/nexus
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
PORT=5000
```

### 3. Configure the frontend
```bash
cd ../client
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

### 4. Run both servers

In one terminal:
```bash
cd server && npm install && npm run dev
```

In another:
```bash
cd client && npm install && npm run dev
```

Frontend → `http://localhost:5173`  
Backend → `http://localhost:5000`

---

## Deployment

The app deploys as a **single Render web service** — Express serves the React build directly, no separate frontend hosting needed.

**Render environment variables required:**

| Key | Value |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random secret |
| `JWT_EXPIRES_IN` | `7d` |
| `PORT` | `10000` |
| `CLIENT_URL` | `https://salespipeline.onrender.com` |

**Build command:** `npm run build`  
**Start command:** `npm start`

---

## Data Models

### User
```
name         String   required
email        String   required, unique
password     String   hashed, never returned in queries
role         Enum     'Admin' | 'BDA'
isActive     Boolean  default true
lastLoginAt  Date
```

### Lead
```
companyName        String   required
contactPerson      String   required
email              String   required
phone              String
value              Number   required (deal value in USD)
status             Enum     New | Contacted | Proposal Sent | Negotiation | Won | Lost
industry           Enum     Automotive | Aerospace | Electronics | ...
assignedTo         Ref      User
statusChangedAt    Date     auto-updated on stage change
notes              Array    embedded { text, createdBy, createdAt }
expectedCloseDate  Date
source             Enum     Referral | Cold Outreach | Inbound | ...
daysInCurrentStage Virtual  computed from statusChangedAt
```

---

## License

MIT
