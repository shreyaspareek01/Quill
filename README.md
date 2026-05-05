# Quill ✒️

A sophisticated, editorial-style full-stack social platform built with FastAPI and React. This project provides a robust social/blogging experience with a focus on clean design and secure operations.

## 📁 Project Structure

This is a monorepo containing both the frontend and backend:

- `client/`: React + Vite frontend (Editorial UI)
- `server/`: FastAPI backend (Social API)

---

## 🛠️ Backend (Server)

FastAPI backend for a social platform with PostgreSQL, SQLAlchemy, JWT authentication, and Alembic migrations.

### Tech Stack

- **FastAPI**: Modern, high-performance web framework.
- **PostgreSQL**: Robust relational database.
- **SQLAlchemy 2.x**: SQL Toolkit and Object Relational Mapper.
- **Alembic**: Database migrations management.
- **Pydantic Settings**: Environment-based configuration.
- **JWT Auth**: Secure token-based authentication using `python-jose`.

### Current Features

- **User Management**: Registration and user profile retrieval.
- **Authentication**: Login endpoint returning bearer JWT tokens.
- **Post CRUD**: Complete Create, Read, Update, and Delete operations with owner authorization.
- **Voting System**: Interactive `/vote` system with add/remove behavior and count aggregation.
- **Post Listing**: Pagination and search (`limit`, `skip`, `search`).
- **CORS**: Fully enabled for frontend communication.

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
   DATABASE_HOSTNAME=localhost
   DATABASE_PORT=5432
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=fastapi-project
   DATABASE_USERNAME=postgres
   JWT_SECRET_KEY=your_secret_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```
4. **Apply Migrations**:
   ```bash
   alembic upgrade head
   ```
5. **Run the API**:
   ```bash
   uvicorn app.main:app --reload
   ```
   Swagger UI: `http://127.0.0.1:8000/docs`

### API Overview

- `POST /users` - Create user
- `POST /login` - Login & get JWT token
- `GET /posts` - List posts (requires auth)
- `GET /posts/{id}` - Get single post
- `POST /posts` - Create post (requires auth)
- `PUT /posts/{id}` - Update post (owner only)
- `DELETE /posts/{id}` - Delete post (owner only)
- `POST /vote` - Add/remove vote (`dir: 1` or `0`)

---

## 🎨 Frontend (Client)

The frontend is designed with a premium editorial aesthetic, focusing on typography and user experience.

### Tech Stack

- **React + Vite**: Fast, modern frontend development.
- **Vanilla CSS**: Custom-built design system with a warm ivory palette.
- **Axios**: Robust API client for backend communication.
- **React Context**: State management for Auth and UI notifications.

### Local Setup (Client)

1. `cd client`
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Dev Server**:
   ```bash
   npm run dev
   ```

### UI Features

- **Editorial Aesthetic**: Warm tones and serif fonts for a premium feel.
- **Dynamic Feed**: Responsive list of posts with interactive voting.
- **Protected Routes**: Secure navigation based on authentication state.
- **Responsive Design**: Optimized for mobile and desktop screens.

---

## 📜 License

MIT
