# Quill ✒️

A full-stack social platform built with FastAPI and React. Share posts, follow creators, like, comment, bookmark, and discover — with a clean, modern UI.

## 📁 Project Structure

```
client/  – React + Vite frontend
server/  – FastAPI backend
```

---

## 🛠️ Backend (Server)

### Tech Stack
- **FastAPI** – high-performance Python web framework
- **PostgreSQL (Neon)** – cloud-hosted relational database
- **SQLAlchemy 2.x** – ORM
- **Alembic** – migrations
- **JWT Auth** – token-based authentication via `python-jose`
- **Cloudinary** – image uploads (avatars, covers, post images)
- **Groq AI** – AI-powered content generation, post summarization, and translation (Llama 3.1)
- **Gemini + Hugging Face FLUX** – AI cover image generation (Gemini crafts prompts, FLUX renders)
- **edge-tts** – Microsoft Edge Azure Cognitive Neural Speech Synthesis

### Tables
- `users` – profiles, auth, avatar/cover URLs
- `posts` – content with image support
- `votes` – like/unlike posts
- `follows` – follow/unfollow users
- `comments` – reply to posts
- `bookmarks` – save posts
- `reports` – flag inappropriate content
- `reposts` – share others' posts to your profile

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/` | Register |
| POST | `/login` | Login (returns token + user) |
| GET/PUT | `/users/{id}` | Read / update profile |
| GET/POST/PUT/DELETE | `/posts/` | CRUD posts |
| GET | `/posts/following` | Feed from followed users |
| GET | `/posts/user/{user_id}` | User's own posts |
| GET | `/posts/liked/{user_id}` | Posts a user has liked |
| GET | `/posts/{id}` | Single post with votes |
| POST | `/vote/` | Cast or remove vote |
| POST/DELETE | `/follows/{user_id}` | Follow/unfollow |
| GET | `/follows/{id}/followers` | Follower list |
| GET | `/follows/{id}/following` | Following list |
| GET | `/follows/{id}/status` | Follow status + counts |
| POST/GET/DELETE | `/comments/` | Create/list comments |
| POST/DELETE | `/bookmarks/{post_id}` | Bookmark/unbookmark |
| GET | `/bookmarks/` | List bookmarks |
| POST | `/reports/` | Report a post |
| POST | `/uploads/image` | Upload post image to Cloudinary |
| POST | `/uploads/avatar` | Upload avatar (400×400 crop) |
| POST | `/uploads/cover` | Upload cover (1200×400 crop) |
| POST/DELETE | `/reposts/{post_id}` | Repost / undo repost |
| GET | `/reposts/{user_id}` | User's reposted posts |
| POST | `/posts/{id}/summarize` | AI summarize a post (Groq) |
| POST | `/posts/generate-content` | AI generate post content from title (Groq) |
| POST | `/posts/generate-cover` | AI generate cover image from title (Gemini prompt → FLUX → Cloudinary) |
| POST | `/posts/polish-title` | AI polish/improve a draft title (Groq) |
| POST | `/posts/{id}/translate` | Translate post title and content into 6 languages (Groq Llama 3.1) |
| GET | `/posts/tts` | Premium Microsoft Edge Neural voice Text-To-Speech (static response) |

### Local Setup

```bash
cd server
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

Create `server/.env`:
```env
DATABASE_URL=postgresql://user:pass@host:5432/quill
JWT_SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
GROQ_API_KEY=gsk_your_key
GEMINI_API_KEY=your_gemini_key
HF_API_KEY=hf_your_huggingface_token
```

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

---

## 🎨 Frontend (Client)

### Tech Stack
- **React + Vite**
- **Vanilla CSS** – design system with light/dark themes, custom properties
- **Axios** – API client
- **React Context** – auth, toast notifications, theme
- **Lucide React** – icons
- **React Router v6** – SPA routing

### Pages
- `/` – Landing (auth-aware)
- `/feed` – For You / Following tabs, search
- `/explore` – Browse trending posts
- `/posts/:id` – Post detail with comments, share, vote, bookmark
- `/posts/new` – Create post (with Cloudinary image upload)
- `/posts/:id/edit` – Edit post
- `/profile/:id` – Profile with cover, avatar, posts/reposts tabs, follow
- `/profile/:id/followers` / `/profile/:id/following` – User lists
- `/bookmarks` – Saved posts
- `/settings/edit` – Edit profile (avatar, cover, bio, links)
- `/login` / `/register` – Auth forms

### Local Setup

```bash
cd client
npm install
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

---

## 🌐 Multilingual Translation & Neural Narration

Quill supports on-demand post translation and high-fidelity narration in **6 languages** (Spanish, French, German, Japanese, Chinese, and Hindi).

### Key Mechanics
- **AI Translation**: Translates title and content using a Groq-hosted Llama 3.1 8B model. Built with custom tag-based split parsing and a fallback mechanism to preserve markdown formatting and structures (such as paragraphs and URLs) perfectly.
- **Neural Speech Proxy Backend**: Leverages `edge-tts` to request high-fidelity, expressive Microsoft Azure neural voices matching the current translation language (e.g., `es-ES-ElviraNeural` for Spanish, `zh-CN-XiaoxiaoNeural` for Chinese).
- **Cross-Browser Compatibility**: TTS responses are buffered on the backend to deliver a static response with a valid `Content-Length` header, preventing browser playback exceptions common with chunked streams.
- **Multilingual Sentence Parser**: A customized, regex-based client tokenizer splits the text by sentence delimiters native to different languages (such as Chinese `。` and Hindi `।`), preventing content from being dropped.
- ** Narration Auto-Reset**: State synchronizers listen to translation changes and immediately halt active speech context, clearing references and starting playback cleanly from the first chunk.

---

## 🚀 Deployment

- **Backend** – Render / Railway / any Python host
- **Frontend** – Vercel (vercel.json handles SPA fallback)
- **Database** – Neon PostgreSQL with connection pooling

## 📜 License

MIT
