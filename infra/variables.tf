# ── General ──────────────────────────────────────────────────────────────────
variable "env" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "env must be one of: dev, staging, prod"
  }
}

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

# ── Networking ────────────────────────────────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the two public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the two private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "availability_zones" {
  description = "List of AZs to distribute subnets across"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

# ── Compute ───────────────────────────────────────────────────────────────────
variable "instance_type" {
  description = "EC2 instance type for the FastAPI backend"
  type        = string
  default     = "t2.micro"
}

variable "asg_max_size" {
  description = "Maximum number of EC2 instances in the ASG"
  type        = number
  default     = 2
}

variable "asg_min_size" {
  description = "Minimum number of EC2 instances in the ASG"
  type        = number
  default     = 1
}

variable "asg_desired_capacity" {
  description = "Desired number of EC2 instances in the ASG"
  type        = number
  default     = 1
}

# ── Database ──────────────────────────────────────────────────────────────────
variable "db_username" {
  description = "Master username for the RDS PostgreSQL instance"
  type        = string
  default     = "cropsight_admin"
}

variable "db_password" {
  description = "Master password for the RDS PostgreSQL instance"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for RDS (prod only)"
  type        = bool
  default     = false
}

variable "db_skip_final_snapshot" {
  description = "Skip final snapshot on destroy"
  type        = bool
  default     = true
}

# ── Storage ───────────────────────────────────────────────────────────────────
variable "lifecycle_expiration_days" {
  description = "Number of days before objects expire (dev=90, prod=365)"
  type        = number
  default     = 90
}

variable "github_token" {
  description = "GitHub Personal Access Token"
  type        = string
  sensitive   = true
}

variable "inference_instance_type" {
  description = "EC2 instance type for the ML inference service"
  type        = string
  default     = "t3.medium"
}

variable "mlflow_instance_type" {
  description = "EC2 instance type for the MLflow tracking server. t2.micro can't hold MLflow 3.x workers."
  type        = string
  default     = "t3.small"
}

variable "inference_crops" {
  description = "Comma-separated crops loadeds by inference service"
  type        = string
  default     = "tomato,potato,corn,pepper"
}

variable "repository_url" {
  description = "GitHub repository URL used by Amplify"
  type        = string
  default     = "https://github.com/RobertoNav/CropSight"
}

variable "amplify_github_token" {
  description = "GitHub token used by AWS Amplify to access the repository"
  type        = string
  sensitive   = true
}
