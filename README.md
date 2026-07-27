# ModMapper

**ModMapper** is an all-in-one academic planning platform for **NUS students**, designed to simplify semester and long-term degree planning. It combines timetable building, AI-assisted schedule generation, prerequisite checking, S/U optimisation, four-year planning, and collaborative study group features into a single application. 

## ✨ Features

* 📅 **Interactive Timetable Builder** with live clash detection
* 🤖 **AI Timetable Generator** from natural language preferences
* 🎓 **Four-Year Academic Planner** with degree requirement tracking
* ✅ **Prerequisite & Preclusion Checker**
* 📊 **S/U Optimiser**
* 🔍 **Module Search** with intelligent caching
* 💡 **AI Elective Recommender**
* 👥 **Study Groups & Free Slot Finder**
* 📈 **Module Demand Heatmap**
* 💬 **Planner-Gated Module Q&A**
* 🔐 Secure authentication using Supabase Auth 

## 🛠 Tech Stack

**Frontend**

* React 19
* Vite
* React Router

**Backend**

* Node.js
* Express 5
* TypeScript

**Database & Infrastructure**

* Supabase (PostgreSQL + Auth + pgvector)
* Google Gemini API
* Render
* Vercel

**Testing**

* Jest
* Supertest
* ESLint 

## 🚀 Getting Started

### Prerequisites

* Node.js 18+
* npm
* Supabase project
* Google Gemini API key

### Installation

```bash
git clone https://github.com/<your-username>/ModMapper.git
cd ModMapper
```

Install dependencies:

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

Create a `.env` file with the required environment variables:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

Run the application:

```bash
# Backend
npm run dev

# Frontend
npm run dev
```

## 🏗 Architecture

The application follows a layered architecture:

```
React Frontend
      │
Express API (TypeScript)
      │
────────────────────────
Domain Logic
Database Layer
External Services
────────────────────────
      │
Supabase PostgreSQL
```

AI is used **only** for interpretation, recommendation, and ranking, while all critical academic logic (timetable validation, prerequisite checks, planner validation, and S/U calculations) is handled deterministically. 

## 📌 Project Highlights

* 15+ integrated planning features
* Constraint-based timetable generation
* AI-powered recommendations with deterministic validation
* Secure per-user data model
* Comprehensive automated testing
* Full-stack TypeScript architecture 

## 👥 Team

* **Siddharth** – Backend Development
* **Shrishti** – Frontend Development 

---

Built for **NUS Orbital 2026 (Artemis)** as a collaborative academic planning platform that helps students plan smarter, graduate on time, and spend less time juggling multiple tools. 
