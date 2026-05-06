output "alb_dns_name" {
  description = "Public DNS name of the ALB"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the ALB"
  value       = aws_lb.main.arn
}

output "asg_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.backend.name
}

output "sg_alb_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "sg_ec2_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "sg_rds_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "sg_lambda_id" {
  description = "ID of the Lambda security group"
  value       = aws_security_group.lambda.id
}

output "sg_mlflow_id" {
  description = "ID of the MLflow security group"
  value       = aws_security_group.mlflow.id
}

output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2.arn
}
