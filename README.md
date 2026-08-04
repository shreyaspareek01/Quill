# Quill ✒️

Quill is a modern, premium, full-stack social blogging platform designed to write, engage, translate, and analyze. Built with a high-performance **FastAPI** backend and a responsive **React** frontend, it leverages cutting-edge AI integrations, real-time events, and creator analytics to deliver a state-of-the-art reading and writing experience.

---

## 🚀 Advanced Features

### 1. 🌐 Multilingual Translation & Neural Narration
- **On-Demand Translation**: Instantly translate post titles and contents into 6 languages: Spanish, French, German, Japanese, Chinese, and Hindi using a Groq-hosted Llama 3.1 model.
- **Premium Neural Voices**: Stream high-fidelity, localized neural audio narrations powered by `edge-tts` (e.g. Spanish voices for Spanish, Chinese voices for Chinese).
- **Sentence Tokenizer**: A custom multilingual client parser matches punctuations like Chinese `。` or Hindi `।` to ensure no sentences are discarded during speech chunking.
- **Audio Compatibility Buffer**: Fully buffers audio bytes on the backend to serve standard HTTP responses with correct `Content-Length` headers, resolving browser play compatibility issues.

### 2. 🧠 Semantic Search & AI Recommendations
- **Vector Embeddings**: Generates 768-dimensional content embeddings using the `gemini-embedding-2` model on post creation and updates.
- **Personalized Recommendations**: Automatically computes a centroid vector based on a user's engagement history (likes, bookmarks, comments, reposts) and queries similar stories using PostgreSQL `pgvector` cosine distance.
- **Trending Feeds**: Falls back to hot trending lists sorted by votes, comment density, and post age for unauthenticated users.

### 3. 📊 Creator Analytics & AI Advisor
- **Engagement Analytics**: Tracks page views along with scroll-depth reading completion metrics.
- **Readership Funnel**: Categorizes views into *Bounce* (<20%), *Shallow* (20-50%), *Deep* (50-80%), and *Complete* (>=80%) reading retention segments.
- **Interactive SVG Charting**: Displays a custom responsive line chart of the last 30 days of views complete with interactive hover tooltips.
- **AI Writing Advisor**: Evaluates readership retention drop-offs and popular crowdsourced highlights to draft tailored, bulleted advice for the author using Groq AI.

### 4. 💬 Devil's Advocate AI Commenter
- **Discussion Starter**: Post authors can trigger the "Devil's Advocate" AI on-demand. The agent reads the post content and leaves a respectful, challenging counter-argument to spark critical discussion.
- **Automated Notifications**: Toggling the AI registers a notification back to the owner and formats the comment under a dedicated AI system profile.

### 5. 🏷️ Passage Highlights & Inline Annotations
- **Text Selection Highlights**: Readers can select and highlight text passages in a post to bookmark notable quotes.
- **Crowdsourced Highlights**: Popular highlights are aggregated and surfaced on the Creator Analytics dashboard to reveal where reader interest is strongest.

### 6. 🏆 Gamification Badges
- **Dynamic Achievements**: User profiles calculate and display custom writer badges based on database relationships:
  - 📝 **Prolific Writer**: Created 5 or more published stories.
  - 💡 **Thought Leader**: Received 5 or more total reactions.
  - 💬 **Frequent Debater**: Left 5 or more comments across the platform.
  - 🌟 **Early Adopter**: Assigned to the first 10 registered accounts.

### 7. 🔔 Real-Time SSE Notification Stream
- **Server-Sent Events**: Delivers instant notifications to the client for likes, follows, comments, and reposts without standard polling overhead.
- **Auth-Aware Query Headers**: Stream endpoint authenticates native EventSource streams using token fallback query parameters.

### 8. 🎭 Differentiated Reactions
- **LinkedIn-style Reactions**: Replaces traditional binary likes with 5 expressive reaction types — **Like** (👍), **Love** (❤️), **Celebrate** (🎉), **Funny** (😂), and **Sad** (😢).
- **Hover Tray**: Hovering the like button reveals a floating reaction tray; clicking defaults to 👍 Like.
- **Reaction Summary**: A clickable count bubble opens a modal listing every reactor with their reaction type, filterable by category.

### 9. 🔐 Secure Google OAuth2 Login
- **Identity Provider Verification**: Seamlessly registers and authenticates accounts using Google ID tokens verified against Google's TokenInfo API.
- **Audience Protection**: Validates token audience fields (`aud`) on the backend to prevent malicious client bypasses.

### 10. 🎨 AI Creative Suite & Media Storage
- **Cover Image Generation**: Crafts image generation prompts using Gemini and renders them via Hugging Face **FLUX** model to create custom post headers.
- **Content Generator**: Dynamically expands a title draft into a complete, formatted post using Groq LLM.
- **Title Polisher**: Improvises and refines draft titles.
- **Cloud Media Storage**: Saves cropped profile avatars, cover photos, and post graphics in **Cloudinary**.

---

## 📁 Project Structure

```
client/  – React + Vite frontend
server/  – FastAPI backend + PostgreSQL Alembic Migrations
```

---

## 🛠️ Backend (Server)

### Tech Stack
- **FastAPI**: High-performance Python web framework.
- **PostgreSQL (Neon)**: Relational database with vector extensions.
- **SQLAlchemy 2.x & Alembic**: Database ORM and migrations.
- **pgvector**: Postgres extension for vector similarity search.
- **Groq AI (Llama 3.1)**: Generates posts, summaries, translations, and challenging critiques.
- **Gemini API**: Generates content embeddings and creative image prompts.
- **Hugging Face (FLUX)**: Text-to-image generator.
- **edge-tts**: High-quality Microsoft Azure neural speech streams.
- **Cloudinary**: User media and generated graphics storage.

### Database Tables
- `users`: User profiles, JWT auth passwords, avatars, and bio details.
- `posts`: Story titles, markdown contents, and Gemini embedding vectors.
- `votes`: Binary likes.
- `reactions`: Custom reaction types (`like`, `love`, `celebrate`, `funny`, `sad`).
- `comments`: Standard text replies.
- `follows`: User-to-user social follow graph.
- `bookmarks`: Saved posts.
- `reposts`: User-shared stories.
- `notifications`: Real-time activities waiting to be read.
- `post_views`: Reader tracking data with completion percentages (`read_pct`).
- `passage_highlights`: Selected text highlights captured from posts.
- `reports`: Flagged content.

### Complete API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| **Auth** | | |
| POST | `/login` | Email/password login |
| POST | `/login/google` | Production-ready Google OAuth2 verification |
| **Users** | | |
| POST | `/users/` | Create a new account |
| GET/PUT | `/users/{id}` | Read / update user profiles |
| **Posts** | | |
| GET/POST | `/posts/` | Read feed / create post (creates vector embedding) |
| GET/PUT/DELETE | `/posts/{id}` | CRUD a single post |
| GET | `/posts/user/{user_id}` | Read all posts by a user |
| GET | `/posts/liked/{user_id}` | Read posts liked/reacted to by user |
| GET | `/posts/following` | Follower feed |
| GET | `/posts/recommended` | Personalized recommendations using cosine distance |
| GET | `/posts/trending` | Most popular posts |
| POST | `/posts/{id}/summarize` | AI summarize a post |
| POST | `/posts/{id}/translate` | Translate post title and content |
| GET | `/posts/tts` | Premium Neural Speech synthesizer |
| POST | `/posts/{id}/devil-comment` | Trigger Devil's Advocate commenter |
| POST | `/posts/generate-content` | AI draft post content |
| POST | `/posts/generate-cover` | Gemini + FLUX cover generation |
| POST | `/posts/polish-title` | AI title editor |
| **Comments & Reactions** | | |
| POST/GET/DELETE | `/comments/` | CRUD post comments |
| GET/POST/DELETE | `/reactions/{post_id}` | Manage like/love/celebrate/funny/sad reactions; returns counts and full reactor details |
| **Follows & Bookmarks** | | |
| POST/DELETE | `/follows/{user_id}` | Follow / unfollow a creator |
| GET | `/follows/{id}/status` | Check followers and following status |
| GET/POST/DELETE | `/bookmarks/` | List and manage bookmarked posts |
| **Notifications** | | |
| GET | `/notifications/` | List notifications history |
| PUT | `/notifications/read` | Mark all notifications as read |
| GET | `/notifications/stream` | Real-time notification SSE connection |
| **Analytics & Highlights** | | |
| GET | `/analytics/` | Read Creator Analytics and AI Writer Advisor insights |
| POST | `/analytics/posts/{post_id}/view` | Log a view and reading percentage |
| POST | `/analytics/posts/{post_id}/highlights` | Log text passage highlights |
| **Uploads** | | |
| POST | `/uploads/image` | Upload post media |
| POST | `/uploads/avatar` | Upload and crop user avatar |
| POST | `/uploads/cover` | Upload and crop user cover photo |

---

## 🎨 Frontend (Client)

### Tech Stack
- **React + Vite**: Ultra-fast developer tooling.
- **Vanilla CSS**: Premium variables, custom theme configurations, and glassmorphic designs.
- **Axios**: Standard HTTP request instance.
- **React Context**: Theme toggling, auth states, and custom alert toast notifications.
- **Lucide React**: Vector icons.

### Key Pages
- `/` – Landing Page: Authenticated feeds or guest views.
- `/feed` – Personalized Feed: Suggested for You, Following, and Trending tabs.
- `/explore` – Semantic Search: Browse and look up related articles.
- `/posts/:id` – Story View: Houses custom reactions, text highlights, translation widget, and TTS player.
- `/profile/:id` – User Profile: Displays author header, posts, reposts, and earned badges.
- `/analytics` – Creator HUD: Detailed interactive charts, funnel statistics, and AI recommendations.
- `/bookmarks` – Bookmarks List.
- `/settings/edit` – Settings panel.

---

## 🚀 Setup & Installation

### Backend Setup
1. Navigate to the server folder and activate your virtual environment:
   ```bash
   cd server
   python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   ```
2. Create `server/.env`:
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
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```
3. Run Alembic migrations and start server:
   ```bash
   alembic upgrade head
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to client folder:
   ```bash
   cd client
   npm install
   ```
2. Create `client/.env`:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```

---

## 📜 License

MIT
