# Social App Platform

FastAPI backend with PostgreSQL and SQLAlchemy. The API is the source of truth; use the interactive OpenAPI UI at `/docs` while a dedicated blog-style frontend is planned.

## Architecture

- **Backend:** FastAPI
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Configuration:** Pydantic Settings (`.env`)
- **Auth:** JWT (python-jose), password hashing (passlib/bcrypt)

## Features

- Users: register and fetch users; passwords hashed.
- Posts: CRUD with ownership (`owner_id`). Create, update, and delete require authentication; only the owner may update or delete.
- Votes: authenticated users can add or remove a vote on a post (`/vote`). List and single-post responses include vote counts.
- Post listing: authenticated list endpoint supports `limit`, `skip`, and optional `search` (title substring).
- CORS configured for browser clients.
- Routers: `posts`, `users`, `auth`, `vote`.

## Local setup

### Requirements

- Python 3.10+
- PostgreSQL

### Backend

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` in the project root:

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

Run the app:

```bash
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for Swagger UI.

### Database schema

The app uses `create_all` on startup. If you already have an older database without `owner_id` or `votes`, add the new tables/columns (or recreate the DB) before running.

## Roadmap

- [ ] Dedicated blog-style frontend (replace or drop any legacy UI experiments in-repo).
- [ ] Alembic migrations for production schema changes.