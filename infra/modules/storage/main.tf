locals {
  buckets = {
    imgs   = "cropsight-${var.env}-imgs"
    mlflow = "cropsight-${var.env}-mlflow"
    bkp    = "cropsight-${var.env}-bkp"
  }
}

# ── S3 Buckets ────────────────────────────────────────────────────────────────
resource "aws_s3_bucket" "main" {
  for_each = local.buckets

  bucket        = each.value
  force_destroy = true

  tags = {
    Name = each.value
    Role = each.key
  }
}

# ── Versioning ────────────────────────────────────────────────────────────────
resource "aws_s3_bucket_versioning" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ── Block all public access ───────────────────────────────────────────────────
resource "aws_s3_bucket_public_access_block" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── Server-side encryption ────────────────────────────────────────────────────
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ── Lifecycle Rules ───────────────────────────────────────────────────────────
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  rule {
    id     = "tiering-and-expiry"
    status = "Enabled"

    filter {} # Aplica a todos los objetos del bucket

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = var.lifecycle_expiration_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}
