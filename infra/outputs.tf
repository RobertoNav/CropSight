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

output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "asg_name" {
  description = "Name of the Auto Scaling Group for the backend"
  value       = module.compute.asg_name
}

output "db_endpoint" {
  description = "Connection endpoint of the RDS PostgreSQL instance"
  value       = module.database.db_endpoint
}

output "db_name" {
  description = "Name of the PostgreSQL database"
  value       = module.database.db_name
}

output "mlflow_url" {
  description = "Private DNS URL of the MLflow tracking server"
  value       = module.mlops.mlflow_url
}

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

output "backend_ecr_repository_name" {
  description = "Name of the backend ECR repository"
  value       = aws_ecr_repository.backend.name
}

output "backend_ecr_repository_url" {
  description = "URL of the backend ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "inference_url" {
  description = "Private base URL of the ML inference service"
  value       = module.inference.inference_url
}

output "amplify_app_id" {
  description = "Amplify app ID"
  value       = module.frontend.amplify_app_id
}

output "amplify_branch_name" {
  description = "Amplify branch name"
  value       = module.frontend.amplify_branch_name
}

output "amplify_default_domain" {
  description = "Amplify default domain"
  value       = module.frontend.amplify_default_domain
}
