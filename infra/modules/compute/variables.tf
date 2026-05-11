variable "env" {
  description = "Deployment environment"
  type        = string
}

variable "aws_region" {
  description = "AWS region used to authenticate against ECR"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "IDs of public subnets for the ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "IDs of private subnets for the ASG"
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "asg_min_size" {
  description = "Minimum ASG capacity"
  type        = number
  default     = 1
}

variable "asg_max_size" {
  description = "Maximum ASG capacity"
  type        = number
  default     = 2
}

variable "asg_desired_capacity" {
  description = "Desired ASG capacity"
  type        = number
  default     = 1
}

variable "imgs_bucket_arn" {
  description = "ARN of the images S3 bucket"
  type        = string
}

variable "mlflow_bucket_arn" {
  description = "ARN of the MLflow S3 bucket"
  type        = string
}

variable "bkp_bucket_arn" {
  description = "ARN of the backup S3 bucket"
  type        = string
}

variable "db_parameter_name" {
  description = "Name of the SSM parameter that stores the database URL"
  type        = string
}

variable "mlflow_parameter_name" {
  description = "Name of the SSM parameter that stores the MLflow tracking server URL"
  type        = string
}

variable "ecr_repository_url" {
  description = "Full URL of the backend ECR repository"
  type        = string
}

variable "github_token" {
  description = "GitHub Personal Access Token"
  type        = string
  sensitive   = true
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "inference_service_url" {
  description = "Base URL for the inference service, without /predict"
  type        = string
}
