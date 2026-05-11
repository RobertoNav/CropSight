output "inference_url" {
  description = "Private base URL for inference service"
  value       = "http://inference.cropsight-${var.env}.internal:8000"
}

output "inference_private_ip" {
  description = "Private IP of inference EC2"
  value       = aws_instance.inference.private_ip
}

output "inference_instance_id" {
  description = "Inference EC2 instance ID"
  value       = aws_instance.inference.id
}
