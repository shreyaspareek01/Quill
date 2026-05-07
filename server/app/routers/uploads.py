from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from cloudinary import uploader
import cloudinary
from .. import oauth2
from ..config import settings

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    user = Depends(oauth2.get_current_user),
):
    if not (settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary is not configured on the server.",
        )

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed.",
        )

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )

    try:
        upload_result = uploader.upload(
            file.file,
            folder=f"quill/posts/{user.id}",
            resource_type="image",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to upload image to Cloudinary.",
        )
    finally:
        file.file.close()

    return {"image_url": upload_result.get("secure_url")}
