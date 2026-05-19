import base64
import httpx
from cloudinary import uploader
import cloudinary
from sqlalchemy import func
from ..schemas import PostCreate, PostResponse, PostResponseWithVotes, PostSummaryResponse, GenerateContentRequest, GenerateContentResponse, GenerateCoverResponse, PolishTitleResponse
from sqlalchemy.orm import Session
from ..database import get_db 
from .. import models,oauth2
from ..config import settings
from fastapi import status,Response,APIRouter,Depends,Query
from fastapi.exceptions import HTTPException
from typing import Optional

router = APIRouter(prefix="/posts",tags=["Posts"])

def _post_query_base(db, user_id):
    voted_subquery = db.query(models.Vote.post_id).filter(models.Vote.user_id == user_id).subquery()
    reposted_subquery = db.query(models.Repost.post_id).filter(models.Repost.user_id == user_id).subquery()
    comment_subquery = db.query(func.count(models.Comment.id)).filter(models.Comment.post_id == models.Post.id).correlate(models.Post).scalar_subquery()
    repost_subquery = db.query(func.count(models.Repost.post_id)).filter(models.Repost.post_id == models.Post.id).correlate(models.Post).scalar_subquery()
    base = db.query(
        models.Post, 
        func.count(models.Vote.post_id).label("votes"),
        models.Post.id.in_(voted_subquery).label("has_voted"),
        models.Post.id.in_(reposted_subquery).label("has_reposted"),
        func.coalesce(comment_subquery, 0).label("comment_count"),
        func.coalesce(repost_subquery, 0).label("repost_count")
    ).join(
        models.Vote, models.Vote.post_id == models.Post.id, isouter=True
    )
    return base

def _format_results(results):
    return [{"Post": p, "votes": v, "has_voted": h, "has_reposted": hr, "comment_count": c, "repost_count": r} for p, v, h, hr, c, r in results]

@router.get("/",response_model=list[PostResponseWithVotes])
async def get_posts(db: Session = Depends(get_db), user: Optional[models.User] = Depends(oauth2.get_optional_user), limit: int = Query(10, ge=1, le=100), skip: int = Query(0, ge=0), search: Optional[str] = ""):
    user_id = user.id if user else -1
    results = _post_query_base(db, user_id).filter(
        models.Post.title.contains(search), models.Post.owner_id != user_id
    ).group_by(models.Post.id).order_by(models.Post.created_at.desc()).limit(limit).offset(skip).all()
    return _format_results(results)

@router.get("/user/{user_id}", response_model=list[PostResponseWithVotes])
async def get_user_posts(user_id: int, db: Session = Depends(get_db), user: Optional[models.User] = Depends(oauth2.get_optional_user), limit: int = Query(50, ge=1, le=100), skip: int = Query(0, ge=0)):
    current_user_id = user.id if user else -1
    results = _post_query_base(db, current_user_id).filter(
        models.Post.owner_id == user_id
    ).group_by(models.Post.id).order_by(models.Post.created_at.desc()).limit(limit).offset(skip).all()
    return _format_results(results)

@router.get("/liked/{user_id}", response_model=list[PostResponseWithVotes])
async def get_liked_posts(user_id: int, db: Session = Depends(get_db), user: Optional[models.User] = Depends(oauth2.get_optional_user)):
    current_user_id = user.id if user else -1
    liked_post_ids = db.query(models.Vote.post_id).filter(models.Vote.user_id == user_id).subquery()
    results = _post_query_base(db, current_user_id).filter(
        models.Post.id.in_(liked_post_ids)
    ).group_by(models.Post.id).order_by(models.Post.created_at.desc()).all()
    return _format_results(results)

@router.get("/following", response_model=list[PostResponseWithVotes])
async def get_following_posts(db: Session = Depends(get_db), user: models.User = Depends(oauth2.get_current_user), limit: int = Query(10, ge=1, le=100), skip: int = Query(0, ge=0)):
    followed_ids = db.query(models.Follow.following_id).filter(models.Follow.follower_id == user.id).subquery()
    results = _post_query_base(db, user.id).filter(
        models.Post.owner_id.in_(followed_ids)
    ).group_by(models.Post.id).order_by(models.Post.created_at.desc()).limit(limit).offset(skip).all()
    return _format_results(results)

@router.get("/{id}", response_model=PostResponseWithVotes)
async def get_post(id: int, db: Session = Depends(get_db), user: Optional[models.User] = Depends(oauth2.get_optional_user)):
    user_id = user.id if user else -1
    result = _post_query_base(db, user_id).filter(models.Post.id == id).group_by(models.Post.id).first()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Post with id:{id} not found!")
    p, v, h, hr, c, r = result
    return {"Post": p, "votes": v, "has_voted": h, "has_reposted": hr, "comment_count": c, "repost_count": r}

@router.post("/",status_code=status.HTTP_201_CREATED,response_model=PostResponse)
async def create_post(post:PostCreate,db:Session = Depends(get_db),user: int = Depends(oauth2.get_current_user)):
    new_post = models.Post(owner_id=user.id, **post.model_dump());
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@router.delete("/{id}",status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(id:int,db:Session=Depends(get_db),user: int = Depends(oauth2.get_current_user)):
    post_query = db.query(models.Post).filter(models.Post.id==id)
    post = post_query.first()
    if post == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Post with id: {id} not found!")
    if post.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail=f"Not authorized to perform the requested action")
    post_query.delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
   
@router.put("/{id}",response_model=PostResponse)
async def update_post(id:int, post:PostCreate,db:Session=Depends(get_db),user:int = Depends(oauth2.get_current_user)):
    post_query = db.query(models.Post).filter(models.Post.id==id)
    db_post = post_query.first()
    if db_post == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Post with id: {id} not found!")
    if db_post.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail=f"Not authorized to perform the requested action")
    post_query.update(post.model_dump(),synchronize_session=False)
    db.commit()
    return post_query.first()

@router.post("/{id}/summarize", response_model=PostSummaryResponse)
async def summarize_post(id: int, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Post with id:{id} not found!")
    
    groq_key = settings.groq_api_key
    if not groq_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GROQ_API_KEY not configured")

    title = (post.title or "").strip()
    content = (post.content or "").strip()

    if len(title) + len(content) < 30:
        return {"summary": "This post has nothing substantial to summarize."}

    prompt = f"""Summarize this:

Title: {title}
Content: {content}

Give a concise 2-3 sentence summary. If the content is vague or meaningless, just say "Nothing meaningful to summarize." — never ask the user to provide more content."""

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 200
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI summarization failed")
        
        result = response.json()
        summary = result["choices"][0]["message"]["content"].strip()
    
    return {"summary": summary}

@router.post("/generate-content", response_model=GenerateContentResponse)
async def generate_content(req: GenerateContentRequest):
    groq_key = settings.groq_api_key
    if not groq_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GROQ_API_KEY not configured")

    title = req.title.strip()
    if not title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")

    prompt = f"""Write 3-4 paragraphs of blog content for a post titled "{title}".

Use a natural, engaging tone — start with an intro, develop the idea, end with a concluding thought. Output only the body paragraphs, no title, no preamble, no markdown."""

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 600
            }
        )

        if response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Content generation failed")

        result = response.json()
        content = result["choices"][0]["message"]["content"].strip()

    return {"content": content}

@router.post("/generate-cover", response_model=GenerateCoverResponse)
async def generate_cover(req: GenerateContentRequest):
    title = req.title.strip()
    if not title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")

    gemini_key = settings.gemini_api_key
    if not gemini_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GEMINI_API_KEY not configured")

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )

    prompt = f"Blog cover image for: {title}, professional, high quality, beautiful, vibrant colors"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={gemini_key}",
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseModalities": ["Text", "Image"]}
            }
        )

        if resp.status_code != 200:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Image generation failed")

        result = resp.json()
        for part in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
            if "inlineData" in part:
                img_data = part["inlineData"]["data"]
                img_bytes = base64.b64decode(img_data)
                upload_result = uploader.upload(img_bytes, folder="quill/covers/ai", resource_type="image")
                return {"image_url": upload_result.get("secure_url")}

    raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="No image generated")

@router.post("/polish-title", response_model=PolishTitleResponse)
async def polish_title(req: GenerateContentRequest):
    title = req.title.strip()
    if not title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")

    groq_key = settings.groq_api_key
    if not groq_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GROQ_API_KEY not configured")

    prompt = f"""Make this blog post title more engaging and clickable while keeping the original intent:

"{title}"

Output only the polished title, nothing else."""

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 100
            }
        )

        if response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Title polish failed")

        result = response.json()
        polished = result["choices"][0]["message"]["content"].strip().strip('"')

    return {"title": polished}
