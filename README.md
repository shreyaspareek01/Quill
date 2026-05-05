# Quill ✒️

A sophisticated, editorial-style full-stack social platform built with FastAPI and React.

## Project Structure

This is a monorepo containing both the frontend and backend:

- `client/`: React + Vite frontend
- `server/`: FastAPI backend

---

## 🚀 Getting Started

### Backend (Server)

Located in the `server/` directory.

**Tech Stack:**
- FastAPI
- PostgreSQL & SQLAlchemy
- Alembic (Migrations)
- JWT Authentication

**Setup:**
1. `cd server`
2. Create and activate a virtual environment: `python -m venv venv && source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Configure `.env` (refer to `.env.example` if available)
5. Run migrations: `alembic upgrade head`
6. Start the server: `uvicorn app.main:app --reload`

---

### Frontend (Client)

Located in the `client/` directory.

**Tech Stack:**
- React + Vite
- Vanilla CSS (Custom Design System)
- Axios for API communication

**Setup:**
1. `cd client`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

---

## ✨ Features

- **Elegant Design**: Editorial aesthetic with serif typography and warm ivory tones.
- **Authentication**: Secure JWT-based login and registration.
- **Post Management**: Create, edit, and delete posts with a sophisticated UI.
- **Interactions**: Voting system and profile management.
- **Responsive**: Fully optimized for mobile and desktop viewing.

## 🛠️ API Overview

- `POST /login` - Authentication
- `GET /posts` - Fetch feed
- `POST /posts` - Create content
- `POST /vote` - Like/Unlike posts

## License

MIT
