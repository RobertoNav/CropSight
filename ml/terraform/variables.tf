variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "s3_bucket_name" {
  description = "Globally unique name for the S3 bucket"
  type        = string
}

variable "ec2_ami" {
  description = "AMI ID for EC2 instances (Amazon Linux 2023)"
  type        = string
}

variable "key_pair_name" {
  description = "EC2 key pair name for SSH access"
  type        = string
}
