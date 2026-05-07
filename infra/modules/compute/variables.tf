variable "env" {
  description = "Deployment environment"
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

variable "mlflow_url" {
  description = "MLflow tracking server URL"
  type        = string
}

variable "github_token" {
  description = "GitHub Personal Access Token"
  type        = string
  sensitive   = true
}
