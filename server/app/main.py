from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine 
from .routers import posts,users,auth,vote,uploads,follows,comments,bookmarks,reports,reposts,notifications,analytics,reactions


# models.Base.metadata.create_all(bind=engine)
# print("Database connected!")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(posts.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(vote.router)
app.include_router(uploads.router)
app.include_router(follows.router)
app.include_router(comments.router)
app.include_router(bookmarks.router)
app.include_router(reports.router)
app.include_router(reposts.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(reactions.router)


@app.get("/")
async def root():
    return {"message":"Welcome to my API!!!"}

@app.on_event("startup")
async def backfill_embeddings():
    from .database import SessionLocal
    from .models import Post
    from .routers.posts import generate_post_embedding
    
    db = SessionLocal()
    try:
        unembedded_posts = db.query(Post).filter(Post.embedding == None).all()
        if unembedded_posts:
            print(f"Backfilling embeddings for {len(unembedded_posts)} posts...")
            for post in unembedded_posts:
                emb = await generate_post_embedding(post.title, post.content)
                if emb is not None:
                    post.embedding = emb
            db.commit()
            print("Backfilling embeddings complete!")
    except Exception as e:
        print("Failed to backfill embeddings:", e)
    finally:
        db.close()





