from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Base de datos
    database_url: str

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # AWS
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    s3_bucket_images: str
    s3_bucket_models: str

    # Lambda inferencia
    lambda_inference_url: str

    # MLflow
    mlflow_tracking_uri: str
    mlflow_model_name: str = "cropsight-classifier"

    # GitHub Actions
    github_token: str
    github_repo: str
    github_workflow_id: str = "retraining.yml"

    # Entorno
    environment: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
