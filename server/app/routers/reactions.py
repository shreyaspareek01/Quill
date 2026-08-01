from fastapi import APIRouter, Depends, HTTPException, status
from .. import schemas, database, models, oauth2
from sqlalchemy.orm import Session
from typing import Optional
from sqlalchemy import func

router = APIRouter(
    prefix="/reactions",
    tags=['Reactions']
)

@router.post("/", status_code=status.HTTP_201_CREATED)
def react(reaction: schemas.ReactionCreate, db: Session = Depends(database.get_db), user: models.User = Depends(oauth2.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == reaction.post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Post with id:{reaction.post_id} not found!")
    
    if reaction.reaction_type not in ['insightful', 'agreed', 'debatable']:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reaction type!")

    reaction_query = db.query(models.Reaction).filter(
        models.Reaction.post_id == reaction.post_id,
        models.Reaction.user_id == user.id
    )
    found_reaction = reaction_query.first()
    
    if found_reaction:
        found_reaction.reaction_type = reaction.reaction_type
        db.commit()
        return {"message": "Successfully updated reaction!"}
    else:
        new_reaction = models.Reaction(
            post_id=reaction.post_id,
            user_id=user.id,
            reaction_type=reaction.reaction_type
        )
        db.add(new_reaction)
        db.commit()
        
        # Create notification for post owner
        from .notifications import create_notification
        create_notification(
            db,
            user_id=post.owner_id,
            actor_id=user.id,
            type="like",
            post_id=reaction.post_id
        )
        return {"message": "Successfully added reaction!"}

@router.delete("/{post_id}", status_code=status.HTTP_200_OK)
def delete_reaction(post_id: int, db: Session = Depends(database.get_db), user: models.User = Depends(oauth2.get_current_user)):
    reaction_query = db.query(models.Reaction).filter(
        models.Reaction.post_id == post_id,
        models.Reaction.user_id == user.id
    )
    found_reaction = reaction_query.first()
    if not found_reaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reaction does not exist!")
    
    reaction_query.delete(synchronize_session=False)
    db.commit()
    return {"message": "Successfully deleted reaction!"}

@router.get("/{post_id}", response_model=schemas.ReactionCountsResponse)
def get_reactions(post_id: int, db: Session = Depends(database.get_db), user: Optional[models.User] = Depends(oauth2.get_optional_user)):
    counts = db.query(
        models.Reaction.reaction_type,
        func.count(models.Reaction.reaction_type)
    ).filter(models.Reaction.post_id == post_id).group_by(models.Reaction.reaction_type).all()
    
    res = {
        "insightful": 0,
        "agreed": 0,
        "debatable": 0,
        "user_reaction": None
    }
    
    for r_type, count in counts:
        if r_type in res:
            res[r_type] = count
            
    if user:
        user_reaction = db.query(models.Reaction.reaction_type).filter(
            models.Reaction.post_id == post_id,
            models.Reaction.user_id == user.id
        ).scalar()
        res["user_reaction"] = user_reaction
        
    return res
