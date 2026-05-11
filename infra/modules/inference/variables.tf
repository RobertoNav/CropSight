variable "env" {
  description = "Deployment environment"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for inference EC2"
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type for inference"
  type        = string
}

variable "mlflow_url" {
  description = "MLflow tracking URI"
  type        = string
}

variable "mlflow_bucket_arn" {
  description = "ARN of the MLflow artifact bucket"
  type        = string
}

variable "crops" {
  description = "Comma-separated crops to load"
  type        = string
}
