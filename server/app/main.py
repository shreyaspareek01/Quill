from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine 
from .routers import posts,users,auth,vote,uploads,follows,comments,bookmarks,reports,reposts

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


@app.get("/")
async def root():
    return {"message":"Welcome to my API!!!"}




