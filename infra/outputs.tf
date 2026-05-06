# ── Networking ────────────────────────────────────────────────────────────────
output "vpc_id" {
  description = "ID of the CropSight VPC"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

# ── Compute ───────────────────────────────────────────────────────────────────
output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

# ── Database ──────────────────────────────────────────────────────────────────
output "db_endpoint" {
  description = "Connection endpoint of the RDS PostgreSQL instance"
  value       = module.database.db_endpoint
}

output "db_name" {
  description = "Name of the PostgreSQL database"
  value       = module.database.db_name
}

# ── MLOps ─────────────────────────────────────────────────────────────────────
output "mlflow_url" {
  description = "Private DNS URL of the MLflow tracking server"
  value       = module.mlops.mlflow_url
}

# ── Storage ───────────────────────────────────────────────────────────────────
output "imgs_bucket_name" {
  description = "Name of the S3 bucket for crop images"
  value       = module.storage.imgs_bucket_name
}

output "mlflow_bucket_name" {
  description = "Name of the S3 bucket for MLflow artifacts"
  value       = module.storage.mlflow_bucket_name
}

output "bkp_bucket_name" {
  description = "Name of the S3 bucket for backups"
  value       = module.storage.bkp_bucket_name
}
