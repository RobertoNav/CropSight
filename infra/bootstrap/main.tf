terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # Intencional: NO tiene backend remoto.
  # Este módulo gestiona los recursos que hacen posible el backend remoto.
}

provider "aws" {
  region = "us-east-1"
}

# ── S3 Bucket para el tfstate ─────────────────────────────────────────────────
resource "aws_s3_bucket" "tfstate" {
  bucket        = "cropsight-tfstate"
  force_destroy = false # NUNCA destruir accidentalmente el estado

  tags = {
    Name      = "cropsight-tfstate"
    Project   = "CropSight"
    ManagedBy = "Terraform-Bootstrap"
  }
}

# Versionado — obligatorio para poder hacer rollback del estado
resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Bloquear todo acceso público al bucket de estado
resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Cifrado del bucket con AES-256
resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Evitar que el bucket pueda borrarse mientras tenga objetos
resource "aws_s3_bucket_lifecycle_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    filter {} # Aplica a todos los objetos del bucket

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# ── DynamoDB Table para State Locking ─────────────────────────────────────────
resource "aws_dynamodb_table" "tflock" {
  name         = "cropsight-lock"
  billing_mode = "PAY_PER_REQUEST" # Sin costo fijo — capa gratuita friendly
  hash_key     = "LockID"          # Nombre EXACTO que Terraform espera

  attribute {
    name = "LockID"
    type = "S" # String
  }

  # Protección contra borrado accidental
  deletion_protection_enabled = true

  # Point-in-time recovery — permite restaurar la tabla si algo sale mal
  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name      = "cropsight-lock"
    Project   = "CropSight"
    ManagedBy = "Terraform-Bootstrap"
  }
}

# ── Outputs útiles ─────────────────────────────────────────────────────────────
output "tfstate_bucket_name" {
  description = "Nombre del bucket S3 para el tfstate"
  value       = aws_s3_bucket.tfstate.bucket
}

output "tfstate_bucket_arn" {
  description = "ARN del bucket S3 para el tfstate"
  value       = aws_s3_bucket.tfstate.arn
}

output "dynamodb_table_name" {
  description = "Nombre de la tabla DynamoDB para el state lock"
  value       = aws_dynamodb_table.tflock.name
}

output "dynamodb_table_arn" {
  description = "ARN de la tabla DynamoDB"
  value       = aws_dynamodb_table.tflock.arn
}
