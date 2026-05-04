# Social App Platform API

FastAPI backend for a social/blog platform with PostgreSQL, SQLAlchemy, JWT authentication, and Alembic migrations.

## Tech Stack

- FastAPI
- PostgreSQL
- SQLAlchemy 2.x
- Alembic (database migrations)
- Pydantic Settings (`.env` based configuration)
- JWT auth (`python-jose`) + password hashing (`passlib`/`bcrypt`)

## Current Features

- User registration and user fetch endpoints
- Login endpoint that returns a bearer JWT token
- Post CRUD with owner authorization (`owner_id`)
- Voting system (`/vote`) with add/remove behavior
- Vote count aggregation in list and single-post responses
- Pagination and search on post listing (`limit`, `skip`, `search`)
- CORS middleware enabled

## Local Setup

### Prerequisites

- Python 3.10+
- PostgreSQL running locally or remotely

### Install dependencies

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Environment variables

Create a `.env` file in the project root:

```env
DATABASE_HOSTNAME=localhost
DATABASE_PORT=5432
DATABASE_PASSWORD=your_local_password
DATABASE_NAME=fastapi-project
DATABASE_USERNAME=postgres
JWT_SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Apply database migrations

This project now uses Alembic as the source of truth for schema changes.

```bash
alembic upgrade head
```

### Run the API

```bash
uvicorn app.main:app --reload
```

Swagger UI: `http://127.0.0.1:8000/docs`

## API Overview

- `POST /users` - Create a new user
- `GET /users` - List all users
- `GET /users/{id}` - Fetch user by id
- `POST /login` - Login (OAuth2 form) and get JWT token
- `GET /posts` - List posts (requires auth; supports `limit`, `skip`, `search`)
- `GET /posts/{id}` - Get one post with vote count (requires auth)
- `POST /posts` - Create post (requires auth)
- `PUT /posts/{id}` - Update post (owner only)
- `DELETE /posts/{id}` - Delete post (owner only)
- `POST /vote` - Add or remove vote (`dir: 1` add, `dir: 0` remove)

## Authentication Notes

- Use `/login` with `username` (email) and `password` as form fields.
- Include `Authorization: Bearer <token>` for protected routes.

## Migration Notes

- Migration files are located in `alembic/versions`.
- To create a new migration after model changes:

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```