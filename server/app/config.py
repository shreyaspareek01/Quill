from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    cloudinary_cloud_name: Optional[str] = None
    cloudinary_api_key: Optional[str] = None
    cloudinary_api_secret: Optional[str] = None
    groq_api_key: Optional[str] = None

    class Config:
        env_file = ".env"

settings = Settings()