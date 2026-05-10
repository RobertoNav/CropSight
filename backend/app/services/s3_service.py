import boto3
import uuid
from datetime import datetime, timezone
from fastapi import UploadFile

from app.config import settings
from app.core.exceptions import FileTooLargeException, UnsupportedMediaTypeException

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


class S3Service:
    def __init__(self):
        self.client = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id or None,
            aws_secret_access_key=settings.aws_secret_access_key or None,
        )
        self.bucket = settings.s3_bucket_images

    async def upload_image(self, file: UploadFile, user_id: str) -> tuple[bytes, str]:
        """
        Valida y sube imagen a S3.
        Retorna (content, url) para que el caller pueda reusar los bytes.
        """
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise UnsupportedMediaTypeException()

        content = await file.read()
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise FileTooLargeException()

        url = self._upload_bytes(content, file.content_type, user_id)
        return content, url

    def _upload_bytes(self, content: bytes, content_type: str, user_id: str) -> str:
        ext = "jpg" if content_type == "image/jpeg" else "png"
        timestamp = int(datetime.now(timezone.utc).timestamp())
        key = f"{user_id}/{timestamp}_{uuid.uuid4().hex}.{ext}"

        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=content,
            ContentType=content_type,
        )

        return f"https://{self.bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"
