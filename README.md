# Quill ✒️

A sophisticated, editorial-style full-stack social platform built with FastAPI and React. This project provides a robust social/blogging experience with a focus on clean design, secure operations, and a premium user experience.

## 📁 Project Structure

This is a monorepo containing both the frontend and backend:

- `client/`: React + Vite frontend (Editorial UI)
- `server/`: FastAPI backend (Social API)

---

## 🛠️ Backend (Server)

FastAPI backend for a social platform with PostgreSQL, SQLAlchemy, JWT authentication, and Alembic migrations.

### Tech Stack

- **FastAPI**: Modern, high-performance web framework.
- **PostgreSQL (Neon)**: Cloud-hosted relational database.
- **SQLAlchemy 2.x**: SQL Toolkit and Object Relational Mapper.
- **Alembic**: Database migrations management.
- **Pydantic Settings**: Environment-based configuration.
- **JWT Auth**: Secure token-based authentication using `python-jose`.

### Local Setup (Server)

1. `cd server`
2. **Install Dependencies**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. **Environment Variables**: Create a `.env` file in `server/`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/quill_db
   JWT_SECRET_KEY=your_secret_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```
4. **Apply Migrations**:
   ```bash
   alembic upgrade head
   ```
5. **Run the API**:
   ```bash
   uvicorn app.main:app --reload
   ```

---

## 🎨 Frontend (Client)

The frontend is designed with a premium editorial aesthetic, focusing on typography and user experience.

### Tech Stack

- **React + Vite**: Fast, modern frontend development.
- **Vanilla CSS**: Custom-built design system with a warm ivory palette.
- **Axios**: Robust API client for backend communication.
- **React Context**: State management for Auth and UI notifications.
- **Lucide React**: Elegant icon library.

### Local Setup (Client)

1. `cd client`
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**: Create a `.env` file in `client/`:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. **Run Dev Server**:
   ```bash
   npm run dev
   ```

---

## 🚀 Deployment

Quill is optimized for cloud deployment:

- **Backend**: Deployed on **Render** (via Docker or Python Web Service).
- **Frontend**: Deployed on **Vercel** with SPA routing support via `vercel.json`.
- **Database**: Managed **Neon PostgreSQL** with connection pooling enabled.

### UI Features

- **Editorial Aesthetic**: Warm tones and serif fonts for a premium feel.
- **Dynamic Voting**: Real-time feedback and state synchronization.
- **Protected Routes**: Secure navigation based on authentication state.
- **Responsive Design**: Optimized for all devices.

---

## 📜 License

MIT
