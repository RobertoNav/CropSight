output "sns_topic_arn" {
  description = "ARN of the CloudWatch alerts SNS topic"
  value       = aws_sns_topic.alerts.arn
}
