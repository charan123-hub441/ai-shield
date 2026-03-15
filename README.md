# 🛡️ AI Shield – Cyberbullying Detection System

A full-stack AI-powered platform that analyzes social media messages and detects cyberbullying using NLP.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, Chart.js, Axios |
| Backend | Python, FastAPI, SQLAlchemy |
| AI/NLP | Rule-based NLP classifier (tiered toxicity scoring) |
| Database | SQLite (dev) — drop-in replaceable with PostgreSQL |
| Auth | JWT + bcrypt |

---

## 📁 Project Structure

```
ai-shield/
├── backend/
│   ├── main.py          # FastAPI app entry point
│   ├── database.py      # SQLAlchemy + SQLite
│   ├── models.py        # ORM models
│   ├── schemas.py       # Pydantic schemas
│   ├── auth.py          # JWT + bcrypt helpers
│   ├── requirements.txt
│   ├── ai/
│   │   └── classifier.py   # NLP toxicity classifier
│   └── routes/
│       ├── auth.py
│       ├── messages.py
│       ├── moderation.py
│       ├── reports.py
│       └── analytics.py
└── frontend/
    ├── src/
    │   ├── api/axios.js
    │   ├── context/AuthContext.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── Dashboard.jsx
    │       ├── Analyzer.jsx
    │       ├── Moderation.jsx
    │       └── Reports.jsx
    └── package.json
```

---

## 🚀 Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Start Backend

```bash
cd ai-shield/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at: **http://127.0.0.1:8000**  
Swagger API docs: **http://127.0.0.1:8000/docs**

### 2. Start Frontend

Open a new terminal:

```bash
cd ai-shield/frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔑 API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/register` | Create account | No |
| POST | `/login` | Get JWT token | No |
| POST | `/analyze` | Analyze message | Yes |
| GET | `/messages` | List messages | Yes |
| GET | `/analytics` | Dashboard stats | Yes |
| GET | `/moderation/flagged` | Flagged messages | Yes |
| POST | `/moderation/action` | Apply action | Yes |
| POST | `/reports` | Submit report | Yes |
| GET | `/reports` | List reports | Yes |
| PATCH | `/reports/{id}/status` | Update status | Admin |

---

## 🤖 AI Classifier Labels

| Label | Score Range | Description |
|-------|-------------|-------------|
| ✅ Safe | 0–20% | No harmful content |
| ⚠️ Offensive | 20–45% | Mild violations |
| 🚨 Cyberbullying | 45–75% | Auto-flagged |
| ☠️ Severe Harassment | 75–100% | Immediate action |

---

## 🗄️ Database Tables

- **users** – accounts, roles, auth
- **messages** – analyzed content + AI labels
- **flagged_messages** – harmful messages + moderation actions
- **reports** – user-submitted incident reports

> The SQLite database file (`shield.db`) is auto-created in the `backend/` folder on first start.

---

## 🔐 Making an Admin Account

After registering, open `backend/shield.db` in any SQLite viewer and update:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Or use the FastAPI shell to do it programmatically.
"# point-of-view" 
