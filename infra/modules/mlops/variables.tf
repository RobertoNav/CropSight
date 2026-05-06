variable "env" {
  description = "Deployment environment"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of private subnets for the MLflow EC2 instance"
  type        = list(string)
}

variable "sg_mlflow_id" {
  description = "ID of the MLflow security group"
  type        = string
}

variable "mlflow_bucket_name" {
  description = "Name of the S3 bucket used for MLflow artifact storage"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for MLflow server"
  type        = string
  default     = "t2.micro"
}
