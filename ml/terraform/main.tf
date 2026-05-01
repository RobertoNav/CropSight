terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ── S3 bucket ────────────────────────────────────────────────────────────────
resource "aws_s3_bucket" "cropsight" {
  bucket        = var.s3_bucket_name
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "cropsight" {
  bucket = aws_s3_bucket.cropsight.id
  versioning_configuration {
    status = "Enabled"
  }
}

# ── EC2 for MLflow tracking server ───────────────────────────────────────────
resource "aws_instance" "mlflow" {
  ami           = var.ec2_ami
  instance_type = "t3.small"
  key_name      = var.key_pair_name

  tags = {
    Name    = "cropsight-mlflow"
    Project = "cropsight"
  }
}

# ── EC2 for inference service ─────────────────────────────────────────────────
resource "aws_instance" "inference" {
  ami           = var.ec2_ami
  instance_type = "t3.medium"
  key_name      = var.key_pair_name

  tags = {
    Name    = "cropsight-inference"
    Project = "cropsight"
  }
}
