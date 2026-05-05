output "imgs_bucket_name" {
  description = "Name of the crop images S3 bucket"
  value       = aws_s3_bucket.main["imgs"].bucket
}

output "imgs_bucket_arn" {
  description = "ARN of the crop images S3 bucket"
  value       = aws_s3_bucket.main["imgs"].arn
}

output "mlflow_bucket_name" {
  description = "Name of the MLflow artifacts S3 bucket"
  value       = aws_s3_bucket.main["mlflow"].bucket
}

output "mlflow_bucket_arn" {
  description = "ARN of the MLflow artifacts S3 bucket"
  value       = aws_s3_bucket.main["mlflow"].arn
}

output "bkp_bucket_name" {
  description = "Name of the backups S3 bucket"
  value       = aws_s3_bucket.main["bkp"].bucket
}

output "bkp_bucket_arn" {
  description = "ARN of the backups S3 bucket"
  value       = aws_s3_bucket.main["bkp"].arn
}
