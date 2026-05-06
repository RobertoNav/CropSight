output "mlflow_url" {
  description = "Private DNS hostname of the MLflow EC2 instance (port 5000)"
  value       = "http://${aws_instance.mlflow.private_dns}:5000"
}

output "mlflow_private_ip" {
  description = "Private IP address of the MLflow EC2 instance"
  value       = aws_instance.mlflow.private_ip
}

output "mlflow_instance_id" {
  description = "EC2 instance ID of the MLflow server"
  value       = aws_instance.mlflow.id
}
